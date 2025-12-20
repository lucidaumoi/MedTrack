import { useState } from 'react';
import { useSignAndExecuteTransaction, useCurrentAccount } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { uploadMetadata } from '../services/storage'; // Service giả lập upload
import { ConnectButton } from '@mysten/dapp-kit';

// TODO: Thay thế bằng Package ID thật của bạn sau khi deploy contract
// Ví dụ: const PACKAGE_ID = "0x123abc...789";
// Sửa dòng này
const PACKAGE_ID = "0x732b6101f0693cbcae3487684a91636361bb63db7c32b9a072c8200284c3079b";
const MODULE_NAME = "medicine_market";

export default function CreateOrder() {
  const account = useCurrentAccount();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  // Form data state
  const [formData, setFormData] = useState({
    drugName: '',
    manufacturerName: '',
    price: '', // Tính bằng SUI
    location: '',
    imageUrl: '', // Tạm thời nhập URL ảnh, sau này nâng cấp thành File Upload
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!account) return;
    setLoading(true);
    setStatus('Đang upload dữ liệu lên Walrus/IPFS...');

    try {
      // BƯỚC 1: Chuẩn bị JSON dữ liệu (Metadata)
      const metadata = {
        ...formData,
        manufactureDate: new Date().toISOString(), // Quan trọng: Thời điểm sản xuất
        type: 'MANUFACTURER_DATA'
      };

      // BƯỚC 2: Upload lên Walrus/IPFS và lấy Hash
      const hash = await uploadMetadata(metadata);
      console.log("Metadata Hash:", hash);
      setStatus(`Upload xong! Hash: ${hash}. Đang gọi Smart Contract...`);

      // BƯỚC 3: Gọi Smart Contract
      const tx = new Transaction();
      
      // Chuyển đổi giá từ SUI sang MIST (1 SUI = 10^9 MIST)
      const priceInMist = parseFloat(formData.price) * 1_000_000_000;

      // Gọi hàm create_order
      tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::create_order`,
        arguments: [
          tx.pure.u64(priceInMist), // Giá
          tx.pure.string(hash),     // Hash từ Walrus (đã convert sang string)
        ],
      });

      // Thực thi Transaction
      signAndExecuteTransaction(
        { transaction: tx },
        {
          onSuccess: (result) => {
            console.log("Transaction Success:", result);
            setStatus(`Thành công! Đã tạo lô thuốc trên Blockchain. Digest: ${result.digest}`);
            setLoading(false);
            // Reset form
            setFormData({ drugName: '', manufacturerName: '', price: '', location: '', imageUrl: '' });
          },
          onError: (error) => {
            console.error("Transaction Error:", error);
            setStatus('Lỗi khi gọi Smart Contract: ' + error.message);
            setLoading(false);
          },
        }
      );

    } catch (error) {
      console.error(error);
      setStatus('Lỗi: ' + error);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-lg mt-10">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">🏭 Nhà Sản Xuất: Tạo Lô Thuốc Mới</h2>
      
      {!account ? (
        <div className="text-center py-10">
          <p className="mb-4 text-gray-600">Vui lòng kết nối ví để bắt đầu sản xuất.</p>
          <ConnectButton />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Input: Tên thuốc */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Tên thuốc</label>
            <input
              name="drugName"
              value={formData.drugName}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
              placeholder="Ví dụ: Panadol Extra"
            />
          </div>

          {/* Input: Nhà sản xuất */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Tên đơn vị sản xuất</label>
            <input
              name="manufacturerName"
              value={formData.manufacturerName}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
              placeholder="Ví dụ: Công ty Dược Hậu Giang"
            />
          </div>

          {/* Input: Giá & Địa điểm (xếp cùng hàng) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Giá bán (SUI)</label>
              <input
                name="price"
                type="number"
                value={formData.price}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                placeholder="0.1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Địa chỉ kho hàng</label>
              <input
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                placeholder="TP. Hồ Chí Minh"
              />
            </div>
          </div>

           {/* Input: Image URL */}
           <div>
            <label className="block text-sm font-medium text-gray-700">Link Ảnh sản phẩm</label>
            <input
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
              placeholder="https://..."
            />
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`w-full py-3 px-4 rounded-md text-white font-bold transition-colors ${
              loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? 'Đang xử lý...' : 'Tạo Đơn Hàng & Mint NFT'}
          </button>

          {/* Status Message */}
          {status && (
            <div className={`mt-4 p-3 rounded text-sm ${status.includes('Lỗi') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
              {status}
            </div>
          )}
        </div>
      )}
    </div>
  );
}