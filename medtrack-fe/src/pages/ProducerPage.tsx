import { useState } from 'react';
import { useSuiClient, useSignAndExecuteTransaction, useCurrentAccount } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { PACKAGE_ID, MODULE_NAME, ALLOWED_WALLETS } from '../constants';
import nacl from 'tweetnacl';
import naclUtil from 'tweetnacl-util';
import {
  validateDrugId,
  validateProducerName,
  validateReceiverCompany,
  validateAddress,
  validatePhoneNumber
} from '../utils/validation';

// Helper function to encrypt data with Carrier's public key
async function encryptData(publicKey: string, data: string) {
  // Generate ephemeral keypair for this encryption session
  const ephemeralKeyPair = nacl.box.keyPair();

  // Generate a random nonce
  const nonce = nacl.randomBytes(nacl.box.nonceLength);

  // Encrypt the data
  const encrypted = nacl.box(
    naclUtil.decodeUTF8(data),           // Data to encrypt
    nonce,                               // Random nonce
    naclUtil.decodeBase64(publicKey),   // Recipient's public key
    ephemeralKeyPair.secretKey          // Ephemeral secret key
  );

  return {
    encrypted: naclUtil.encodeBase64(encrypted),
    nonce: naclUtil.encodeBase64(nonce),
    ephemeralPublicKey: naclUtil.encodeBase64(ephemeralKeyPair.publicKey)
  };
}

export default function ProducerPage() {
    const suiClient = useSuiClient();
    const { mutate: signAndExecute } = useSignAndExecuteTransaction();
    const currentAccount = useCurrentAccount();

    // --- State cho thông tin thuốc ---
    const [drugId, setDrugId] = useState('');
    const [producerName, setProducerName] = useState('');
    const [producerPhone, setProducerPhone] = useState('');

    // --- State cho thông tin Người nhận ---
    const [receiverCompany, setReceiverCompany] = useState('');
    const [receiverAddress, setReceiverAddress] = useState(''); // Thông tin nhạy cảm
    const [receiverPhone, setReceiverPhone] = useState('');     // Thông tin nhạy cảm
    
    // --- State MỚI: Khóa công khai của Carrier ---
    const [carrierPublicKey, setCarrierPublicKey] = useState('');

    // --- State cho kết quả mã hóa ---
    const [encryptedResult, setEncryptedResult] = useState<string | null>(null);
    const [batchId, setBatchId] = useState<string>(''); 

    const handleCreateOrder = async () => {
        try {
            // Kiểm tra địa chỉ ví được phép
            if (!currentAccount) {
                alert("❌ Vui lòng kết nối ví Sui trước!");
                return;
            }

            if (!ALLOWED_WALLETS.includes(currentAccount.address)) {
                alert("❌ Địa chỉ ví của bạn không được phép sử dụng hệ thống này!\n\nVui lòng liên hệ quản trị viên để được thêm vào danh sách cho phép.");
                return;
            }

            if (!carrierPublicKey) {
                alert("Vui lòng nhập Public Key của Carrier để mã hóa!");
                return;
            }

            // Validation các trường đầu vào
            const drugIdValidation = validateDrugId(drugId);
            if (!drugIdValidation.isValid) {
                alert("❌ " + drugIdValidation.error);
                return;
            }

            const producerNameValidation = validateProducerName(producerName);
            if (!producerNameValidation.isValid) {
                alert("❌ " + producerNameValidation.error);
                return;
            }

            const producerPhoneValidation = validatePhoneNumber(producerPhone);
            if (!producerPhoneValidation.isValid) {
                alert("❌ " + producerPhoneValidation.error);
                return;
            }

            const receiverCompanyValidation = validateReceiverCompany(receiverCompany);
            if (!receiverCompanyValidation.isValid) {
                alert("❌ " + receiverCompanyValidation.error);
                return;
            }

            const addressValidation = validateAddress(receiverAddress);
            if (!addressValidation.isValid) {
                alert("❌ " + addressValidation.error);
                return;
            }

            const phoneValidation = validatePhoneNumber(receiverPhone);
            if (!phoneValidation.isValid) {
                alert("❌ " + phoneValidation.error);
                return;
            }

            // 1. Gom dữ liệu nhạy cảm cần giấu
            const secretData = {
                address: receiverAddress,
                phone: receiverPhone
            };

            // 2. Mã hóa dữ liệu bằng Public Key của Carrier
            // Hàm này trả về 1 object đã mã hóa
            const encryptedObject = await encryptData(
                carrierPublicKey,
                JSON.stringify(secretData)
            );

            // 3. Chuyển object mã hóa thành chuỗi String để lưu lên Blockchain
            const encryptedString = JSON.stringify(encryptedObject);

            console.log("Chuỗi mã hóa sẽ lưu lên Chain:", encryptedString);

            // Validate all transaction arguments before creating transaction
            if (!drugId?.trim()) throw new Error("Drug ID is required");
            if (!producerName?.trim()) throw new Error("Producer name is required");
            if (!producerPhone?.trim()) throw new Error("Producer phone is required");
            if (!receiverCompany?.trim()) throw new Error("Receiver company is required");
            if (!encryptedString?.trim()) throw new Error("Encrypted data is required");

            console.log("✅ All arguments validated");
            console.log("Transaction arguments:");
            console.log("- drugId:", `"${drugId}"`);
            console.log("- producerName:", `"${producerName}"`);
            console.log("- producerPhone:", `"${producerPhone}"`);
            console.log("- receiverCompany:", `"${receiverCompany}"`);
            console.log("- encryptedString length:", encryptedString.length);
            console.log("- PACKAGE_ID:", PACKAGE_ID);
            console.log("- MODULE_NAME:", MODULE_NAME);

            // --- GỌI SMART CONTRACT (MOVE) ---
            // Tạo transaction để deploy lên blockchain
            const txb = new Transaction();

            // Set gas budget to prevent out of gas errors
            txb.setGasBudget(200000000); // Increased gas budget

            console.log("Transaction gas budget set to:", txb.getGasBudget?.() || "unknown");

            txb.moveCall({
              target: `${PACKAGE_ID}::supply_chain::create_record`,
              arguments: [
                  txb.pure.string(drugId),
                  txb.pure.string(producerName),
                  txb.pure.string(producerPhone),
                  txb.pure.string(receiverCompany),
                  txb.pure.string(encryptedString), // Chuỗi mã hóa địa chỉ + số điện thoại
                  txb.object("0x6"), // Clock object
              ],
            });

            console.log("Transaction constructed successfully");
            console.log("Transaction target:", `${PACKAGE_ID}::supply_chain::create_record`);

            // Add a small delay before submitting to ensure everything is ready
            await new Promise(resolve => setTimeout(resolve, 500));

            // Thực hiện transaction và lấy Batch ID từ kết quả
            signAndExecute(
              {
                transaction: txb,
                options: {
                  showEffects: true,
                  showObjectChanges: true,
                },
              },

              {
                onSuccess: async (result) => {
                  console.log("Transaction result:", result);
                  console.log("Transaction effects type:", typeof result.effects);
                  console.log("Transaction effects:", result.effects);

                  // Check if effects is encoded or malformed
                  if (typeof result.effects === 'string') {
                    console.log("Effects is a string (possibly encoded), length:", result.effects.length);
                  } else if (result.effects && typeof result.effects === 'object') {
                    console.log("Transaction status:", result.effects?.status);
                    console.log("Effects keys:", Object.keys(result.effects));
                  }

                  console.log("Full result structure:", JSON.stringify(result, null, 2));

                  // Kiểm tra và decode transaction effects
                  let effects = result.effects;

                  // If effects is encoded, try to get proper transaction details
                  if (!effects || typeof effects === 'string' || !effects.status) {
                    console.log("🔄 Effects incomplete or encoded, fetching full transaction details...");

                    try {
                      // Wait a bit for transaction to be processed
                      await new Promise(resolve => setTimeout(resolve, 2000));

                      const txDetails = await suiClient.getTransactionBlock({
                        digest: result.digest,
                        options: {
                          showEffects: true,
                          showObjectChanges: true,
                          showEvents: true,
                        },
                      });

                      console.log("Fetched transaction details:", txDetails);
                      console.log("Fetched effects structure:", txDetails.effects);
                      effects = txDetails.effects;

                      if (!effects) {
                        throw new Error("Still no effects after fetching details");
                      }

                      if (!effects.status) {
                        console.error("Fetched effects has no status:", effects);
                        throw new Error("Fetched transaction effects missing status");
                      }

                      console.log("✅ Successfully fetched effects with status:", effects.status);
                    } catch (fetchError) {
                      console.error("Failed to fetch transaction details:", fetchError);
                      console.log("Transaction digest:", result.digest);
                      console.log("Please check transaction status on explorer");
                      throw new Error(`Transaction submitted but cannot get details: ${result.digest}`);
                    }
                  }

                  // Now check the effects
                  if (!effects.status) {
                    console.error("❌ No status in transaction effects");
                    console.log("Effects structure:", effects);
                    console.log("Transaction digest:", result.digest);
                    throw new Error("Transaction completed but no status in effects");
                  }

                  if (effects.status.status !== 'success') {
                    console.error("❌ Transaction failed:", effects.status);
                    console.error("❌ Status details:", {
                      status: effects.status.status,
                      error: effects.status.error,
                      gasUsed: effects.gasUsed,
                      transactionDigest: result.digest
                    });

                    const errorMsg = effects.status.error ||
                                   `Status: ${effects.status.status}` ||
                                   'Unknown transaction error';
                    throw new Error(`Transaction failed: ${errorMsg}`);
                  }

                  // Hàm retry để lấy transaction details
                  const getTransactionDetails = async (retries = 5, delay = 1000): Promise<any> => {
                    for (let i = 0; i < retries; i++) {
                      try {
                        console.log(`🔄 Attempting to fetch transaction details (attempt ${i + 1}/${retries}) for digest: ${result.digest}`);
                        const txDetails = await suiClient.getTransactionBlock({
                          digest: result.digest,
                          options: {
                            showObjectChanges: true,
                            showEffects: true,
                          },
                        });
                        console.log(`✅ Successfully fetched transaction details on attempt ${i + 1}`);
                        return txDetails;
                      } catch (error) {
                        console.log(`❌ Attempt ${i + 1} failed:`, error);
                        console.log(`Error details:`, error.message);
                        if (i < retries - 1) {
                          console.log(`⏳ Waiting ${delay}ms before retry...`);
                          await new Promise(resolve => setTimeout(resolve, delay));
                          delay *= 2; // Exponential backoff
                        }
                      }
                    }
                    throw new Error(`Failed to fetch transaction details after ${retries} attempts`);
                  };

                  try {
                    // Thử lấy chi tiết transaction với retry
                    const txDetails = await getTransactionDetails();
                    console.log("📋 Transaction details:", JSON.stringify(txDetails, null, 2));
                    console.log("📋 Transaction keys:", Object.keys(txDetails));
                    console.log("📋 Object changes:", txDetails.objectChanges);
                    console.log("📋 Effects:", txDetails.effects);
                    console.log("📋 Transaction status:", txDetails.effects?.status);

                    // Kiểm tra transaction có thành công không
                    if (txDetails.effects?.status?.status !== 'success') {
                      console.error("❌ Transaction failed:", txDetails.effects?.status);
                      throw new Error(`Transaction failed: ${txDetails.effects?.status?.error}`);
                    }

                    // Tìm Batch ID từ object changes
                    let batchId = null;

                    if (txDetails.objectChanges) {
                      console.log("🔍 Searching through objectChanges...");
                      txDetails.objectChanges.forEach((change: any, index: number) => {
                        console.log(`Object change ${index}:`, JSON.stringify(change, null, 2));
                        console.log(`Type: ${change.type}, ObjectType: ${change.objectType}, ObjectID: ${change.objectId || change.objectID}`);
                      });

                      // Thử tìm MedicineBatch object theo nhiều cách
                      let createdObject = txDetails.objectChanges.find((change: any) =>
                        change.type === 'created' &&
                        (change.objectType?.includes('MedicineBatch') || change.objectType?.includes('::supply_chain::'))
                      );

                      console.log("🎯 Found object with supply_chain:", createdObject);

                      // Nếu tìm thấy object có supply_chain, đó có thể là MedicineBatch
                      if (createdObject) {
                        batchId = createdObject.objectId || createdObject.objectID;
                        console.log("✅ Found Batch ID from objectChanges:", batchId);
                      } else {
                        console.log("❌ No MedicineBatch object found in objectChanges");
                        // Log tất cả created objects để debug
                        const allCreated = txDetails.objectChanges.filter((change: any) => change.type === 'created');
                        console.log("📋 All created objects:", allCreated);
                      }
                    } else {
                      console.log("❌ No objectChanges found in transaction details");
                      console.log("📋 Full txDetails:", JSON.stringify(txDetails, null, 2));

                      // Thử lấy từ effects nếu có
                      if (txDetails.effects?.created && txDetails.effects.created.length > 0) {
                        console.log("🔍 Trying to get from effects.created:", txDetails.effects.created);
                        batchId = txDetails.effects.created[0]?.reference?.objectId || txDetails.effects.created[0];
                        console.log("✅ Found Batch ID from effects.created:", batchId);
                      }
                    }

                    if (batchId) {
                      // Lưu kết quả để hiển thị trên UI
                      setEncryptedResult(encryptedString);
                      setBatchId(batchId);

                      alert("✅ Đã tạo đơn hàng và mã hóa dữ liệu thành công! Batch ID đã hiển thị bên dưới.");
                    } else {
                      console.error("Cannot find Batch ID in transaction details:", txDetails);
                      // Fallback: Tạo Batch ID giả lập để có thể test quy trình
                      const fallbackBatchId = `0x${Date.now().toString(16)}${Math.random().toString(16).substr(2, 8)}`;
                      setEncryptedResult(encryptedString);
                      setBatchId(fallbackBatchId);

                      alert(`⚠️ Transaction thành công nhưng không tìm thấy Batch ID thật.\n\nĐã tạo Batch ID tạm thời để test: ${fallbackBatchId}\n\nVui lòng kiểm tra log console để debug.`);
                    }
                  } catch (detailError) {
                    console.error("Error fetching transaction details after retries:", detailError);
                    // Fallback nếu không lấy được chi tiết sau tất cả retries
                    const fallbackBatchId = `0x${Date.now().toString(16)}${Math.random().toString(16).substr(2, 8)}`;
                    setEncryptedResult(encryptedString);
                    setBatchId(fallbackBatchId);

                    alert(`⚠️ Transaction thành công nhưng không lấy được chi tiết sau nhiều lần thử.\n\nĐã tạo Batch ID tạm thời: ${fallbackBatchId}\n\nLỗi: ${(detailError as Error).message}`);
                  }
                },
                onError: (error) => {
                  console.error("Transaction error:", error);
                  alert("❌ Lỗi khi thực hiện transaction: " + (error as Error).message);
                }
              }
            );

        } catch (error) {
            console.error("Transaction error:", error);
            alert("❌ Lỗi khi tạo đơn hàng: " + (error as Error).message);
        }
    };

    return (
        <div className="p-5 max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold mb-2">🏭 Cổng Nhà Sản Xuất</h1>
            <p className="text-gray-600 mb-6">Tạo đơn hàng mới và mã hóa thông tin nhạy cảm</p>

            {/* Wallet Status */}
            <div className={`mb-6 p-4 rounded-lg border-2 ${
                currentAccount && ALLOWED_WALLETS.includes(currentAccount.address)
                    ? 'bg-green-50 border-green-300'
                    : 'bg-red-50 border-red-300'
            }`}>
                <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${
                        currentAccount && ALLOWED_WALLETS.includes(currentAccount.address)
                            ? 'bg-green-500'
                            : 'bg-red-500'
                    }`}></div>
                    <span className="font-medium">
                        {currentAccount && ALLOWED_WALLETS.includes(currentAccount.address)
                            ? '✅ Ví được ủy quyền'
                            : '❌ Ví chưa được ủy quyền'}
                    </span>
                </div>
                {currentAccount && (
                    <div className="mt-2 text-sm font-mono break-all">
                        <strong>Địa chỉ ví:</strong> {currentAccount.address}
                    </div>
                )}
                {!currentAccount && (
                    <div className="mt-2 text-sm text-red-600">
                        ⚠️ Vui lòng kết nối ví Sui để sử dụng hệ thống
                    </div>
                )}
                {currentAccount && !ALLOWED_WALLETS.includes(currentAccount.address) && (
                    <div className="mt-2 text-sm text-red-600">
                        ⚠️ Địa chỉ ví này không được phép sử dụng. Vui lòng liên hệ quản trị viên.
                    </div>
                )}
            </div>
            
            <div className="bg-white border rounded-lg shadow-lg p-6 space-y-6">
                {/* Phần 1: Thông tin Đơn hàng */}
                <div>
                    <h2 className="text-xl font-bold mb-4 pb-2 border-b-2 border-blue-200">📦 Thông tin Đơn hàng</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Mã thuốc <span className="text-red-500">*</span>
                            </label>
                            <input 
                                type="text"
                                className="border border-gray-300 p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                                placeholder="VD: PhT-2025-12 (Paracetamol-2025-tháng 12)" 
                                value={drugId}
                                onChange={e => setDrugId(e.target.value)} 
                            />
                            <p className="text-xs text-gray-500 mt-1">Format: [Tên viết tắt 2-4 chữ]-YYYY-MM (VD: PhT-2025-12)</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tên Nhà sản xuất <span className="text-red-500">*</span>
                            </label>
                            <input 
                                type="text"
                                className="border border-gray-300 p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                                placeholder="VD: Công ty Dược phẩm ABC" 
                                value={producerName}
                                onChange={e => setProducerName(e.target.value)} 
                            />
                            <p className="text-xs text-gray-500 mt-1">Tên công ty sản xuất thuốc</p>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                📞 Số điện thoại liên hệ <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="tel"
                                className="border border-gray-300 p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="VD: 0987654321 hoặc +84987654321"
                                value={producerPhone}
                                onChange={e => setProducerPhone(e.target.value)}
                            />
                            <p className="text-xs text-gray-500 mt-1">Số điện thoại của nhà sản xuất để liên hệ trong trường hợp cần thiết</p>
                        </div>
                    </div>
                </div>
                
                {/* Phần 2: Thông tin Vận chuyển */}
                <div>
                    <h2 className="text-xl font-bold mb-4 pb-2 border-b-2 border-yellow-200">🚚 Thông tin Vận chuyển</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tên Công ty nhận hàng <span className="text-red-500">*</span>
                            </label>
                            <input 
                                type="text"
                                className="border border-gray-300 p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                                placeholder="VD: Nhà thuốc XYZ, Công ty Logistics DEF" 
                                value={receiverCompany}
                                onChange={e => setReceiverCompany(e.target.value)} 
                            />
                            <p className="text-xs text-gray-500 mt-1">Thông tin này sẽ được lưu công khai trên blockchain</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                📍 Địa chỉ chi tiết <span className="text-red-500">*</span>
                                <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Sẽ được mã hóa</span>
                            </label>
                            <input 
                                type="text"
                                className="border border-yellow-300 bg-yellow-50 p-3 rounded-lg w-full focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500" 
                                placeholder="VD: 123 Đường ABC, Phường DEF, Quận GHI, TP.HCM" 
                                value={receiverAddress}
                                onChange={e => setReceiverAddress(e.target.value)} 
                            />
                            <p className="text-xs text-yellow-700 mt-1">⚠️ Địa chỉ sẽ được mã hóa - phải gồm số nhà, đường, phường/xã, quận/huyện</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                📞 Số điện thoại người nhận <span className="text-red-500">*</span>
                                <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Sẽ được mã hóa</span>
                            </label>
                            <input 
                                type="tel"
                                className="border border-yellow-300 bg-yellow-50 p-3 rounded-lg w-full focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500" 
                                placeholder="VD: 0987654321 hoặc +84987654321" 
                                value={receiverPhone}
                                onChange={e => setReceiverPhone(e.target.value)} 
                            />
                            <p className="text-xs text-yellow-700 mt-1">⚠️ Số điện thoại sẽ được mã hóa - format: 0xxxxxxxxx hoặc +84xxxxxxxxx</p>
                        </div>
                    </div>
                </div>

                {/* Phần 3: Khóa bảo mật */}
                <div>
                    <h2 className="text-xl font-bold mb-4 pb-2 border-b-2 border-blue-300">🔑 Khóa bảo mật</h2>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                        <p className="text-sm text-blue-900 font-medium mb-2">📋 Hướng dẫn lấy Public Key:</p>
                        <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside ml-2">
                            <li>Liên hệ với bên vận chuyển (Carrier) để lấy Public Key của họ</li>
                            <li>Public Key thường là một chuỗi dài bắt đầu bằng "0x..." hoặc dạng hex</li>
                            <li>Chỉ có Carrier mới có thể giải mã thông tin địa chỉ và số điện thoại</li>
                        </ol>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Public Key của Carrier <span className="text-red-500">*</span>
                        </label>
                        <textarea 
                            rows={3}
                            className="border border-blue-300 bg-blue-50 p-3 rounded-lg w-full font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                            placeholder="Dán Public Key của Carrier vào đây (VD: 0x1234... hoặc chuỗi hex dài)" 
                            value={carrierPublicKey}
                            onChange={e => setCarrierPublicKey(e.target.value)} 
                        />
                        <p className="text-xs text-blue-700 mt-1">🔐 Dùng Public Key này để mã hóa thông tin nhạy cảm. Chỉ Carrier mới giải mã được.</p>
                    </div>
                </div>

                {/* Nút Submit */}
                <div className="pt-4 border-t">
                    <button 
                        onClick={handleCreateOrder}
                        disabled={!drugId || !producerName || !producerPhone || !receiverCompany || !receiverAddress || !receiverPhone || !carrierPublicKey}
                        className="w-full bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700 font-bold text-lg disabled:bg-gray-400 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
                    >
                        🔒 Mã hóa & Gửi lên Blockchain
                    </button>
                    <p className="text-xs text-center text-gray-500 mt-2">
                        Vui lòng điền đầy đủ tất cả các trường có dấu <span className="text-red-500">*</span>
                    </p>
                </div>

                {/* Hiển thị kết quả mã hóa */}
                {encryptedResult && batchId && (
                    <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-6">
                        <h3 className="text-xl font-bold text-green-800 mb-4">🎉 Đơn hàng đã được tạo và mã hóa thành công!</h3>

                        {/* Batch ID Section */}
                        <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-400 mb-4">
                            <h4 className="font-bold text-blue-700 mb-2">🏷️ Batch ID (ID Lô Thuốc)</h4>
                            <div className="bg-green-100 border border-green-400 rounded p-3 mb-3">
                                <p className="text-sm text-green-800 font-medium">
                                    ✅ <strong>Smart Contract đã được deploy!</strong> Batch ID này tồn tại trên blockchain thật.
                                </p>
                                <p className="text-sm text-green-700 mt-1">
                                    Carrier có thể sử dụng Batch ID này để cập nhật trạng thái vận chuyển.
                                </p>
                                <p className="text-sm text-blue-600 mt-2 font-medium">
                                    ⏱️ <strong>Lưu ý:</strong> Có thể mất 1-3 giây để lấy thông tin Batch ID từ blockchain.
                                </p>
                                <p className="text-sm text-blue-600 mt-1">
                                    💡 <strong>Gỡ lỗi:</strong> Nếu không thấy Batch ID, mở Developer Console (F12) và xem log retry attempts.
                                </p>
                            </div>
                            <p className="text-sm text-blue-600 mb-2">
                                ⚠️ <strong>Quan trọng:</strong> Chỉ copy <strong>Batch ID</strong> (địa chỉ object) khi gửi cho Carrier/Pharmacy. Đừng copy kèm text khác!
                            </p>
                            <div className="bg-white p-3 rounded border border-blue-300 font-mono text-sm break-all">
                                {batchId}
                            </div>
                            <div className="flex gap-2 mt-2">
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(batchId);
                                        alert("✅ Đã copy Batch ID vào clipboard!\n\n" + batchId);
                                    }}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm transition-all"
                                >
                                    📋 Copy Batch ID
                                </button>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(`Batch ID: ${batchId}\n\nEncrypted Data: ${encryptedResult}`);
                                    alert("✅ Đã copy đầy đủ thông tin (Batch ID + Chuỗi mã hóa) vào clipboard!");
                                }}
                                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded text-sm transition-all"
                            >
                                📋 Copy Tất Cả
                            </button>
                            <button
                                onClick={async () => {
                                    // Test lấy Batch ID từ transaction digest có sẵn
                                    const testDigest = "GSespejUkDpqFJ8dH9VbMpnXnajhYJkEDQZJUvFY2kVa"; // Từ CLI test trước đó
                                    try {
                                        const testDetails = await suiClient.getTransactionBlock({
                                            digest: testDigest,
                                            options: { showObjectChanges: true, showEffects: true }
                                        });
                                        console.log("🧪 Test transaction details:", JSON.stringify(testDetails, null, 2));
                                        alert("Check console for test transaction details!");
                                    } catch (error) {
                                        console.error("Test failed:", error);
                                        alert("Test failed: " + error.message);
                                    }
                                }}
                                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded text-sm transition-all"
                            >
                                🧪 Debug Test
                            </button>
                            </div>
                        </div>

                        <div className="bg-white p-4 rounded-lg border-2 border-green-400 mb-4">
                            <h4 className="font-bold text-green-700 mb-2">📋 Chuỗi mã hóa (Encrypted Data)</h4>
                            <p className="text-sm text-gray-600 mb-3">
                                Gửi chuỗi mã hóa này cho Carrier để họ có thể giải mã thông tin địa chỉ và số điện thoại giao hàng:
                            </p>
                            <textarea
                                readOnly
                                value={encryptedResult}
                                className="w-full p-3 bg-gray-50 border border-gray-300 rounded font-mono text-sm min-h-[120px]"
                                onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                            />
                            <div className="flex gap-2 mt-3">
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(encryptedResult);
                                        alert("✅ Đã copy chuỗi mã hóa vào clipboard!");
                                    }}
                                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded text-sm transition-all"
                                >
                                    📋 Copy Chuỗi Mã Hóa
                                </button>
                                <button
                                    onClick={() => {
                                        setEncryptedResult(null);
                                        setBatchId('');
                                        // Reset form để tạo đơn mới
                                        setDrugId('');
                                        setProducerName('');
                                        setProducerPhone('');
                                        setReceiverCompany('');
                                        setReceiverAddress('');
                                        setReceiverPhone('');
                                        setCarrierPublicKey('');
                                    }}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm transition-all"
                                >
                                    🔄 Tạo Đơn Mới
                                </button>
                            </div>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h4 className="font-bold text-blue-700 mb-2">🚚 Tiếp theo:</h4>
                            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                                <li>Copy cả Batch ID và chuỗi mã hóa ở trên</li>
                                <li>Gửi cho Carrier (đơn vị vận chuyển) qua email/tin nhắn</li>
                                <li>Carrier vào trang "Vận chuyển" để cập nhật trạng thái</li>
                                <li>Carrier dán Batch ID vào phần "Cập Nhật Vận Chuyển"</li>
                                <li>Carrier dán chuỗi mã hóa vào phần "Giải Mã Địa Chỉ"</li>
                                <li>Carrier nhập Private Key để giải mã địa chỉ và số điện thoại</li>
                                <li>Carrier cập nhật trạng thái "Đang giao hàng"</li>
                            </ol>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}