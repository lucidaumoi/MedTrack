import { useState } from "react";
import { useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { PACKAGE_ID, MODULE_NAME } from "../constants";
import EthCrypto from 'eth-crypto'; // Đừng quên cài thư viện này: npm install eth-crypto

export default function CarrierPage() {
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  
  // --- STATE 1: Dữ liệu để update lên Blockchain (Cũ) ---
  const [formData, setFormData] = useState({
    batchId: "", 
    carrierName: "", 
    carrierPhone: ""
  });

  // --- STATE 2: Dữ liệu để giải mã bảo mật (Mới) ---
  const [privateKey, setPrivateKey] = useState('');     // Key bí mật của Carrier
  const [encryptedData, setEncryptedData] = useState(''); // Chuỗi mã hóa lấy từ Producer
  const [decryptedResult, setDecryptedResult] = useState<{address: string, phone: string} | null>(null);

  // --- FUNCTION 1: Xử lý Giải mã (Decrypt) ---
  const handleDecrypt = async () => {
    try {
      if (!encryptedData || !privateKey) {
        alert("Vui lòng nhập đủ Chuỗi mã hóa và Private Key!");
        return;
      }

      // 1. Chuyển chuỗi string thành object mã hóa
      const encryptedObject = EthCrypto.cipher.parse(encryptedData);

      // 2. Dùng Private Key để giải mã
      const decryptedString = await EthCrypto.decryptWithPrivateKey(
        privateKey,
        encryptedObject
      );

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
    if (!formData.batchId) {
      alert("Vui lòng nhập ID lô thuốc!");
      return;
    }

    const tx = new Transaction();

    tx.moveCall({
      target: `${PACKAGE_ID}::${MODULE_NAME}::update_shipping`,
      arguments: [
        tx.object(formData.batchId),         // Batch Object ID (Shared Object)
        tx.pure.string(formData.carrierName),  // Tên đơn vị vận chuyển
        tx.pure.string(formData.carrierPhone), // SĐT vận chuyển
        tx.object("0x6"),                    // Clock
      ],
    });

    signAndExecute(
      { transaction: tx },
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
      
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
            
            <input 
              type="password"
              placeholder="Nhập Private Key của bạn..." 
              className="border p-2 rounded w-full"
              value={privateKey}
              onChange={(e) => setPrivateKey(e.target.value)}
            />

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
        <h2 className="text-2xl font-bold mb-6 text-yellow-700">🚚 Cập Nhật Vận Chuyển</h2>
        
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
              placeholder="Tên đơn vị vận chuyển (VD: Grab/GHN)" 
              className="border p-3 rounded-lg w-full"
              onChange={(e) => setFormData({...formData, carrierName: e.target.value})}
            />
            <input 
              placeholder="SĐT Tài xế" 
              className="border p-3 rounded-lg w-full"
              onChange={(e) => setFormData({...formData, carrierPhone: e.target.value})}
            />
          </div>

          <button 
            onClick={updateShipping}
            className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 rounded-lg w-full transition-all mt-2 shadow-lg"
          >
            📦 Xác Nhận Đang Giao Hàng
          </button>
        </div>
      </div>

    </div>
  );
}