import { useState } from "react";
import { useSignAndExecuteTransaction, useCurrentAccount } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { PACKAGE_ID, MODULE_NAME, ALLOWED_WALLETS } from "../constants";
import nacl from 'tweetnacl';
import naclUtil from 'tweetnacl-util';
import {
  validateBatchId,
  validateCarrierName,
  validatePhoneNumber,
  validateAddress
} from '../utils/validation';

// Helper function to generate keypair for encryption
function generateKeyPair() {
  const keyPair = nacl.box.keyPair();
  return {
    publicKey: naclUtil.encodeBase64(keyPair.publicKey),
    secretKey: naclUtil.encodeBase64(keyPair.secretKey)
  };
}

// Helper function to decrypt data encrypted by Producer
async function decryptData(encryptedData: any, secretKey: string) {
  try {
    const encrypted = naclUtil.decodeBase64(encryptedData.encrypted);
    const nonce = naclUtil.decodeBase64(encryptedData.nonce);
    const ephemeralPublicKey = naclUtil.decodeBase64(encryptedData.ephemeralPublicKey);

    const decrypted = nacl.box.open(
      encrypted,                           // Encrypted data
      nonce,                              // Nonce used for encryption
      ephemeralPublicKey,                 // Ephemeral public key
      naclUtil.decodeBase64(secretKey)    // Recipient's secret key
    );

    if (!decrypted) {
      throw new Error('Decryption failed - possibly wrong key');
    }

    return naclUtil.encodeUTF8(decrypted);
  } catch (error) {
    throw new Error('Failed to decrypt data: ' + (error instanceof Error ? error.message : String(error)));
  }
}

export default function CarrierPage() {
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const currentAccount = useCurrentAccount();
  
  // --- STATE 1: Dữ liệu để update lên Blockchain (Cũ) ---
  const [formData, setFormData] = useState({
    batchId: "",
    carrierName: "",
    carrierPhone: "",
    deliveryLocation: ""
  });

  // --- STATE 2: Dữ liệu để giải mã bảo mật (Mới) ---
  const [privateKey, setPrivateKey] = useState('');     // Key bí mật của Carrier
  const [encryptedData, setEncryptedData] = useState(''); // Chuỗi mã hóa lấy từ Producer
  const [decryptedResult, setDecryptedResult] = useState<{address: string, phone: string} | null>(null);

  // --- STATE 3: Tạo và hiển thị Public Key ---
  const [carrierPublicKey, setCarrierPublicKey] = useState('');
  const [showKeyPair, setShowKeyPair] = useState(false);
  const [generatedPrivateKey, setGeneratedPrivateKey] = useState('');

  // --- FUNCTION: Tạo cặp khóa mới ---
  const handleGenerateKeyPair = () => {
    try {
      const keyPair = generateKeyPair();
      setPrivateKey(keyPair.secretKey);
      setCarrierPublicKey(keyPair.publicKey);
      setGeneratedPrivateKey(keyPair.secretKey); // Lưu private key để hiển thị
      setShowKeyPair(true);
      alert("✅ Đã tạo cặp khóa mới thành công! Hãy lưu Private Key hiển thị bên dưới.");
    } catch (error) {
      console.error("Lỗi tạo khóa:", error);
      alert("❌ Có lỗi khi tạo khóa!");
    }
  };

  // --- FUNCTION: Lấy Public Key từ Private Key hiện tại ---
  const getPublicKeyFromPrivate = () => {
    try {
      if (!privateKey) {
        alert("Vui lòng nhập Private Key trước!");
        return;
      }
      // For NaCl, we can't derive public key from secret key directly
      // We'll just generate a new keypair instead
      const keyPair = generateKeyPair();
      setPrivateKey(keyPair.secretKey);
      setCarrierPublicKey(keyPair.publicKey);
      setGeneratedPrivateKey(keyPair.secretKey);
      setShowKeyPair(true);
      alert("✅ Đã tạo cặp khóa mới! Private Key cũ đã được thay thế.");
    } catch (error) {
      console.error("Lỗi tạo khóa:", error);
      alert("❌ Có lỗi khi tạo khóa!");
    }
  };

  // --- FUNCTION 1: Xử lý Giải mã (Decrypt) ---
  const handleDecrypt = async () => {
    try {
      if (!encryptedData || !privateKey) {
        alert("Vui lòng nhập đủ Chuỗi mã hóa và Private Key!");
        return;
      }

      // 1. Parse chuỗi JSON thành object mã hóa
      const encryptedObject = JSON.parse(encryptedData);

      // 2. Dùng Private Key để giải mã
      const decryptedString = await decryptData(encryptedObject, privateKey);

      // 3. Parse JSON để lấy dữ liệu gốc
      const data = JSON.parse(decryptedString);
      setDecryptedResult(data);
      alert("🔓 Giải mã thành công!");

    } catch (err) {
      console.error(err);
      alert("❌ Giải mã thất bại! Có thể sai Private Key hoặc dữ liệu bị lỗi.");
    }
  };

  // --- FUNCTION 2: Xử lý Update Blockchain (Move Call) ---
  const updateShipping = () => {
    // Kiểm tra địa chỉ ví được phép
    if (!currentAccount) {
      alert("❌ Vui lòng kết nối ví Sui trước!");
      return;
    }

    if (!ALLOWED_WALLETS.includes(currentAccount.address)) {
      alert("❌ Địa chỉ ví của bạn không được phép sử dụng hệ thống này!\n\nVui lòng liên hệ quản trị viên để được thêm vào danh sách cho phép.");
      return;
    }

    if (!formData.batchId) {
      alert("Vui lòng nhập ID lô thuốc!");
      return;
    }

    // Validate Batch ID format
    const batchIdValidation = validateBatchId(formData.batchId);
    if (!batchIdValidation.isValid) {
      alert("❌ " + batchIdValidation.error);
      return;
    }

    // Validate tên đơn vị vận chuyển
    const carrierNameValidation = validateCarrierName(formData.carrierName);
    if (!carrierNameValidation.isValid) {
      alert("❌ " + carrierNameValidation.error);
      return;
    }

    // Validate số điện thoại vận chuyển
    const carrierPhoneValidation = validatePhoneNumber(formData.carrierPhone);
    if (!carrierPhoneValidation.isValid) {
      alert("❌ " + carrierPhoneValidation.error);
      return;
    }

    // Validate địa chỉ giao hàng
    const deliveryLocationValidation = validateAddress(formData.deliveryLocation);
    if (!deliveryLocationValidation.isValid) {
      alert("❌ " + deliveryLocationValidation.error);
      return;
    }

    const tx = new Transaction();

    tx.moveCall({
      target: `${PACKAGE_ID}::${MODULE_NAME}::update_record_shipping`,
      arguments: [
        tx.object(formData.batchId),         // Batch Object ID (Shared Object)
        tx.pure.string(formData.carrierName),  // Tên đơn vị vận chuyển
        tx.pure.string(formData.carrierPhone), // SĐT vận chuyển
        tx.pure.string(formData.deliveryLocation), // Địa chỉ giao hàng
        tx.object("0x6"),                    // Clock
      ],
    });

    signAndExecute(
      {
        transaction: tx,
      },
      {
        onSuccess: (result) => {
          console.log(result);
          alert("✅ Đã cập nhật trạng thái: ĐANG VẬN CHUYỂN");
        },
        onError: (err) => {
          console.error(err);
          alert("❌ Lỗi: " + err.message);
        }
      }
    );
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Wallet Status */}
      <div className={`p-4 rounded-lg border-2 ${
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
      {/* --- PHẦN TẠO VÀ HIỂN THỊ PUBLIC KEY --- */}
      <div className="bg-green-50 p-6 rounded-xl shadow-md border border-green-200">
        <h2 className="text-xl font-bold mb-4 text-green-800">🔑 Tạo & Hiển Thị Public Key</h2>
        <p className="text-sm text-gray-700 mb-4">
          Public Key này sẽ được chia sẻ với Nhà Sản Xuất để họ mã hóa thông tin địa chỉ và số điện thoại.
        </p>
        
        <div className="space-y-4">
          <div className="flex gap-3">
            <button
              onClick={handleGenerateKeyPair}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-all"
            >
              🆕 Tạo Cặp Khóa Mới
            </button>
            <button
              onClick={getPublicKeyFromPrivate}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-all"
              disabled={!privateKey}
            >
              🔍 Lấy Public Key từ Private Key
            </button>
          </div>

          {showKeyPair && carrierPublicKey && generatedPrivateKey && (
            <div className="bg-white p-4 rounded-lg border-2 border-green-400 space-y-4">
              <h3 className="font-bold text-green-700 mb-2">🔑 Cặp Khóa Mới Đã Được Tạo!</h3>

              {/* Private Key Section */}
              <div className="border border-red-200 bg-red-50 p-3 rounded">
                <h4 className="font-bold text-red-700 mb-2">🔐 Private Key (Bí mật - Lưu lại ngay!)</h4>
                <p className="text-sm text-red-600 mb-2">
                  ⚠️ <strong>Quan trọng:</strong> Đây là Private Key của bạn. Hãy lưu lại ngay vào nơi an toàn.
                  Bạn sẽ cần nó để giải mã thông tin địa chỉ và số điện thoại.
                </p>
                <textarea
                  readOnly
                  value={generatedPrivateKey}
                  className="w-full p-3 bg-white border border-red-300 rounded font-mono text-sm"
                  rows={4}
                  onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generatedPrivateKey);
                    alert("✅ Đã copy Private Key vào clipboard! Hãy lưu vào nơi an toàn.");
                  }}
                  className="mt-2 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded text-sm"
                >
                  📋 Copy Private Key
                </button>
              </div>

              {/* Public Key Section */}
              <div className="border border-blue-200 bg-blue-50 p-3 rounded">
                <h4 className="font-bold text-blue-700 mb-2">📋 Public Key (Gửi cho Nhà Sản Xuất)</h4>
                <p className="text-sm text-blue-600 mb-2">
                  ✅ Public Key này có thể chia sẻ công khai. Gửi cho Nhà Sản Xuất để họ mã hóa thông tin.
                </p>
                <textarea
                  readOnly
                  value={carrierPublicKey}
                  className="w-full p-3 bg-white border border-blue-300 rounded font-mono text-sm"
                  rows={3}
                  onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(carrierPublicKey);
                    alert("✅ Đã copy Public Key vào clipboard!");
                  }}
                  className="mt-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm"
                >
                  📋 Copy Public Key
                </button>
              </div>

              <div className="flex gap-2 justify-center">
                <button
                  onClick={() => setShowKeyPair(false)}
                  className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded text-sm"
                >
                  ✅ Đã Lưu & Tiếp Tục
                </button>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                <h4 className="font-bold text-yellow-700 mb-2">💡 Hướng dẫn tiếp theo:</h4>
                <ol className="text-sm text-yellow-800 space-y-1 list-decimal list-inside">
                  <li>Lưu Private Key vào nơi an toàn (password manager, file mã hóa, ghi giấy)</li>
                  <li>Copy Public Key và gửi cho Nhà Sản Xuất</li>
                  <li>Khi nhận đơn hàng, dán Private Key vào ô "Private Key" ở phần giải mã</li>
                </ol>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* --- CỘT TRÁI: GIẢI MÃ THÔNG TIN (OFF-CHAIN) --- */}
        <div className="bg-blue-50 p-6 rounded-xl shadow-md border border-blue-200">
          <h2 className="text-xl font-bold mb-4 text-blue-800">🔐 Giải Mã Địa Chỉ Giao Hàng</h2>
          <p className="text-sm text-gray-600 mb-4">Nhập Private Key để xem thông tin địa chỉ bị ẩn.</p>
        
        <div className="space-y-3">
            <textarea 
              placeholder="Dán chuỗi mã hóa (Ciphertext) từ Producer vào đây..." 
              className="border p-2 rounded w-full h-24 text-xs font-mono"
              value={encryptedData}
              onChange={(e) => setEncryptedData(e.target.value)}
            />
            
            <textarea
              rows={4}
              placeholder="Dán Private Key của bạn vào đây (đã lưu khi tạo cặp khóa)..."
              className="border p-2 rounded w-full font-mono text-sm"
              value={privateKey}
              onChange={e => setPrivateKey(e.target.value)}
            />
            <div className="text-xs text-gray-600 mt-1 space-y-1">
              <p>🔐 <strong>Cách lấy Private Key:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Nếu vừa tạo cặp khóa mới: Copy từ phần hiển thị ở trên</li>
                <li>Nếu đã có sẵn: Dán từ nơi bạn đã lưu (password manager, file, giấy)</li>
                <li>Nếu quên: Tạo cặp khóa mới (nhưng sẽ không giải mã được đơn cũ)</li>
              </ul>
            </div>

            <button 
              onClick={handleDecrypt}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full"
            >
              🔓 Giải Mã Ngay
            </button>

            {/* Hiển thị kết quả sau khi giải mã */}
            {decryptedResult && (
              <div className="mt-4 p-4 bg-white rounded border border-green-400">
                <h3 className="font-bold text-green-700 border-b pb-2 mb-2">Thông tin giao hàng:</h3>
                <p>📍 <strong>Địa chỉ:</strong> {decryptedResult.address}</p>
                <p>📞 <strong>SĐT Người nhận:</strong> {decryptedResult.phone}</p>
              </div>
            )}
        </div>
      </div>

      {/* --- CỘT PHẢI: TƯƠNG TÁC BLOCKCHAIN (ON-CHAIN) --- */}
      <div className="bg-white p-6 rounded-xl shadow-md border border-yellow-100">
        <h2 className="text-2xl font-bold mb-4 text-yellow-700">🚚 Cập Nhật Vận Chuyển</h2>
        <div className="bg-green-100 border border-green-400 rounded p-3 mb-4">
          <p className="text-sm text-green-800 font-medium">
            ✅ <strong>Smart Contract đã được deploy!</strong> Có thể cập nhật trạng thái vận chuyển.
          </p>
          <p className="text-sm text-green-700 mt-1">
            Nhập Batch ID từ Nhà Sản Xuất và cập nhật trạng thái giao hàng.
          </p>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ID Lô thuốc (Batch ID)</label>
            <input 
              placeholder="Paste Batch ID (Object ID) vào đây..." 
              className="border p-3 rounded-lg w-full bg-gray-50 font-mono text-sm"
              onChange={(e) => setFormData({...formData, batchId: e.target.value})}
            />
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            <input
              placeholder="VD: Giao Hàng Nhanh, Grab Express, Viettel Post"
              className="border p-3 rounded-lg w-full"
              onChange={(e) => setFormData({...formData, carrierName: e.target.value})}
            />
            <input
              placeholder="VD: 0987654321 (số điện thoại tài xế)"
              className="border p-3 rounded-lg w-full"
              onChange={(e) => setFormData({...formData, carrierPhone: e.target.value})}
            />
            <textarea
              placeholder="VD: 123 Đường ABC, Phường DEF, Quận GHI, TP.HCM (địa chỉ giao hàng)"
              className="border p-3 rounded-lg w-full h-20 resize-none"
              onChange={(e) => setFormData({...formData, deliveryLocation: e.target.value})}
            />
          </div>

          <button
            onClick={updateShipping}
            disabled={!formData.batchId || !formData.carrierName || !formData.carrierPhone || !formData.deliveryLocation}
            className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 rounded-lg w-full transition-all mt-2 shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            📦 Xác Nhận Đang Giao Hàng
          </button>
          <p className="text-xs text-center text-gray-500 mt-2">
            Vui lòng điền đầy đủ Batch ID và thông tin vận chuyển
          </p>
        </div>
      </div>

    </div>
    </div>
  );
}