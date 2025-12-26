import { useState, useEffect } from 'react';
import { useSuiClient, useSignAndExecuteTransaction, useCurrentAccount, ConnectButton } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { MIST_PER_SUI } from '@mysten/sui/utils';
import { PACKAGE_ID } from '../constants';
import nacl from 'tweetnacl';
import naclUtil from 'tweetnacl-util';
import { ShieldCheck, QrCode, Copy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import logoPng from '../assets/logo.png'; // ✅ Import Logo

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
    const navigate = useNavigate();
    const suiClient = useSuiClient();
    const { mutate: signAndExecute } = useSignAndExecuteTransaction();
    const currentAccount = useCurrentAccount();

    // Balance state
    const [balance, setBalance] = useState("0");

    // Function to fetch SUI balance
    const fetchBalance = async () => {
        if (currentAccount) {
            try {
                const result = await suiClient.getBalance({ owner: currentAccount.address });
                const val = Number(result.totalBalance) / Number(MIST_PER_SUI);
                setBalance(val.toFixed(2));
            } catch (error) {
                console.error("Failed to fetch balance:", error);
                setBalance("0");
            }
        } else {
            setBalance("0");
        }
    };

    // Auto-fetch balance when account changes
    useEffect(() => {
        fetchBalance();
        // Tự động fetch lại mỗi 5 giây
        const interval = setInterval(fetchBalance, 5000);
        return () => clearInterval(interval);
    }, [suiClient, currentAccount]);

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

    // --- State cho Modal ---
    const [showModal, setShowModal] = useState(false);
    const [createdBatchId, setCreatedBatchId] = useState('');
    const [encryptedResult, setEncryptedResult] = useState('');

    const handleCreateOrder = async () => {
        try {
            // Kiểm tra địa chỉ ví được phép
            if (!currentAccount) {
                alert("❌ Vui lòng kết nối ví Sui trước!");
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
            const encryptedObject = await encryptData(
                carrierPublicKey,
                JSON.stringify(secretData)
            );

            // 3. Chuyển object mã hóa thành chuỗi String để lưu lên Blockchain
            const encryptedString = JSON.stringify(encryptedObject);

            console.log("Chuỗi mã hóa sẽ lưu lên Chain:", encryptedString);

            // --- GỌI SMART CONTRACT (MOVE) ---
            const txb = new Transaction();
            txb.setGasBudget(200000000); 

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

            // Thực hiện transaction và lấy Batch ID từ kết quả
            signAndExecute(
              {
                transaction: txb,
              },
              {
                onSuccess: async (result) => {
                  console.log("Transaction Success:", result);

                  // Tìm Batch ID từ transaction events - sử dụng waitForTransactionBlock
                  let batchId = null;
                  try {
                    // Chờ transaction được confirm và lấy details
                    await suiClient.waitForTransaction({
                      digest: result.digest,
                    });

                    // Sau khi confirm, lấy transaction details
                    const txn = await suiClient.getTransactionBlock({
                      digest: result.digest,
                      options: {
                        showEvents: true,
                      }
                    });

                    console.log("Transaction confirmed, events:", txn.events);

                    // Tìm BatchCreatedEvent
                    if (txn.events) {
                      const batchCreatedEvent = txn.events.find((event: any) =>
                        event.type && event.type.includes('BatchCreatedEvent')
                      );

                      if (batchCreatedEvent && batchCreatedEvent.parsedJson) {
                        batchId = (batchCreatedEvent.parsedJson as any).batch_id;
                        console.log("Found batch ID from event:", batchId);
                      }
                    }
                  } catch (error) {
                    console.error("Error waiting for transaction:", error);
                  }

                  // Fallback nếu không tìm thấy sau tất cả retries
                  if (!batchId) {
                     batchId = `0x${Date.now().toString(16)}...Fallback`;
                  }

                  // Refresh balance after transaction (gas fee deduction)
                  await fetchBalance();

                  // Hiển thị Modal thành công
                  setCreatedBatchId(batchId);
                  setEncryptedResult(encryptedString);
                  setShowModal(true);
                },
                onError: (error) => {
                  console.error("Transaction error:", error);
                  alert("❌ Lỗi khi thực hiện transaction: " + error.message);
                }
              }
            );

        } catch (error) {
            console.error("Transaction error:", error);
            alert("❌ Lỗi khi tạo đơn hàng: " + (error as Error).message);
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        // Reset form
        setDrugId('');
        setProducerName('');
        setProducerPhone('');
        setReceiverCompany('');
        setReceiverAddress('');
        setReceiverPhone('');
        setCarrierPublicKey('');
        setCreatedBatchId('');
        setEncryptedResult('');
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6 pb-20 relative">
            
            {/* Header Layout - 3 khu vực */}
            <div className="max-w-7xl mx-auto mb-8 flex justify-between items-start">
                {/* Khu vực Trái - Back Button */}
                <div>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="flex items-center gap-4 transition-transform duration-300 hover:scale-105 group"
                    >
                        {/* Phần Logo */}
                        <div className="rounded-full">
                            <img
                                src={logoPng}
                                alt="MedTrack Logo"
                                className="h-15 w-auto drop-shadow-sm"
                            />
                        </div>
                        {/* Phần Chữ MedTrack */}
                        <span className="text-4xl font-bold text-gray-900 tracking-tight group-hover:text-blue-600 transition-colors">
                            MedTrack
                        </span>
                    </button>
                </div>

                {/* Khu vực Giữa - Title */}
                <div className="absolute left-1/2 -translate-x-1/2">
                    <h1 className="text-3xl font-bold text-gray-800">Manufacturer Portal</h1>
                </div>

                {/* Khu vực Phải - Connect Button & Balance */}
                <div className="flex flex-col items-end gap-2">
                    <ConnectButton />
                    {currentAccount && (
                        <div className="text-right text-sm font-medium text-gray-600">
                            💰 {balance} SUI
                        </div>
                    )}
                </div>
            </div>

            {/* Main Form */}
            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* --- CỘT TRÁI: THÔNG TIN THUỐC --- */}
                <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
                    <div className="bg-blue-500 p-4">
                        <h2 className="text-white font-bold text-lg flex items-center gap-2">
                           📦 Medicine Information
                        </h2>
                    </div>
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1">Medicine Code</label>
                            <input 
                                type="text"
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                placeholder="e.g. PTS_2025_12"
                                value={drugId}
                                onChange={e => setDrugId(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1">Manufacturer Name</label>
                            <input 
                                type="text"
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                placeholder="e.g. ABC Pharma Corp"
                                value={producerName}
                                onChange={e => setProducerName(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1">Contact Phone</label>
                            <input 
                                type="tel"
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                placeholder="e.g. 0987654321"
                                value={producerPhone}
                                onChange={e => setProducerPhone(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* --- CỘT PHẢI: THÔNG TIN NHẬN --- */}
                <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
                    <div className="bg-blue-500 p-4">
                        <h2 className="text-white font-bold text-lg flex items-center gap-2">
                           📍 Receiver Information
                        </h2>
                    </div>
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1">Receiver Company</label>
                            <input 
                                type="text"
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                placeholder="e.g. XYZ Pharmacy Chain"
                                value={receiverCompany}
                                onChange={e => setReceiverCompany(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1">
                                Delivery Address <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded ml-2">Encrypted</span>
                            </label>
                            <input 
                                type="text"
                                className="w-full bg-yellow-50 border border-yellow-200 rounded-lg p-3 focus:ring-2 focus:ring-yellow-500 outline-none transition-all"
                                placeholder="House No, Street, City..."
                                value={receiverAddress}
                                onChange={e => setReceiverAddress(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1">
                                Receiver Phone <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded ml-2">Encrypted</span>
                            </label>
                            <input 
                                type="tel"
                                className="w-full bg-yellow-50 border border-yellow-200 rounded-lg p-3 focus:ring-2 focus:ring-yellow-500 outline-none transition-all"
                                placeholder="Receiver's mobile number..."
                                value={receiverPhone}
                                onChange={e => setReceiverPhone(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* --- HÀNG DƯỚI: KHÓA BẢO MẬT --- */}
                <div className="md:col-span-2 bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
                     <div className="bg-blue-500 p-4">
                        <h2 className="text-white font-bold text-lg flex items-center gap-2">
                           🔐 Security Key
                        </h2>
                    </div>
                    <div className="p-6">
                        <label className="block text-sm font-medium text-gray-500 mb-1">Carrier's Public Key</label>
                        <input 
                            type="text"
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            placeholder="Paste Carrier's Public Key here..."
                            value={carrierPublicKey}
                            onChange={e => setCarrierPublicKey(e.target.value)}
                        />
                         <p className="text-xs text-gray-400 mt-2">
                            * Address and Phone will be encrypted using this key. Only the Carrier can decrypt it.
                        </p>
                    </div>
                </div>

            </div>

            {/* CREATE BUTTON */}
            <div className="max-w-md mx-auto mt-8">
                <button 
                    onClick={handleCreateOrder}
                    disabled={!drugId || !carrierPublicKey}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-full shadow-lg transform transition hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Create & Encrypt Order
                </button>
            </div>

            {/* --- MODAL SUCCESS --- */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden transform transition-all scale-100">
                        
                        {/* Icon Area */}
                        <div className="p-8 flex justify-center bg-gray-50">
                            <ShieldCheck className="w-24 h-24 text-blue-500 drop-shadow-md" />
                        </div>

                        {/* Blue Header */}
                        <div className="bg-blue-500 py-4 text-center">
                            <h3 className="text-white font-bold text-xl uppercase tracking-wide">Order Created Successfully</h3>
                        </div>

                        {/* Body */}
                        <div className="p-8 space-y-6">
                            {/* Batch ID Input Group */}
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Batch ID (Save this!)</label>
                                <div className="flex gap-2 items-center border-2 border-blue-100 rounded-lg p-3 bg-blue-50">
                                    <span className="text-sm font-mono text-blue-900 flex-1 font-bold break-all">{createdBatchId}</span>
                                    <QrCode className="w-6 h-6 text-blue-400" />
                                </div>
                                <button 
                                    onClick={() => {
                                        navigator.clipboard.writeText(createdBatchId);
                                        alert("Copied Batch ID!");
                                    }}
                                    className="mt-2 text-sm text-blue-600 font-bold hover:underline flex items-center gap-1"
                                >
                                    <Copy className="w-3 h-3" /> Copy Batch ID
                                </button>
                            </div>

                            {/* Encrypted Data Group */}
                             <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Encrypted Data (Send to Carrier)</label>
                                <div className="border border-gray-200 rounded-lg p-3 bg-gray-50 max-h-24 overflow-y-auto">
                                    <p className="text-xs font-mono text-gray-600 break-all">{encryptedResult}</p>
                                </div>
                                 <button 
                                    onClick={() => {
                                        navigator.clipboard.writeText(encryptedResult);
                                        alert("Copied Encrypted Data!");
                                    }}
                                    className="mt-2 text-sm text-gray-600 font-bold hover:underline flex items-center gap-1"
                                >
                                    <Copy className="w-3 h-3" /> Copy Encrypted Data
                                </button>
                            </div>
                            
                            {/* Footer Actions */}
                            <div className="pt-2">
                                <button 
                                    onClick={handleCloseModal} 
                                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 rounded-xl transition-colors"
                                >
                                    Close & Create New
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}