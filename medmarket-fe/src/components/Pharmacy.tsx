import { useState } from 'react';
import { useSignAndExecuteTransaction, useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { uploadMetadata } from '../services/storage';

// COPY PACKAGE_ID CỦA BẠN VÀO ĐÂY (Đảm bảo đúng ID bạn đã deploy)
const PACKAGE_ID = "0x732b6101f0693cbcae3487684a91636361bb63db7c32b9a072c8200284c3079b";
const MODULE_NAME = "medicine_market";

export default function Pharmacy() {
  const account = useCurrentAccount();
  const suiClient = useSuiClient(); // Dùng để đọc giá tiền từ blockchain
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();

  const [orderId, setOrderId] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const handleReceiveAndPay = async () => {
    if (!account || !orderId) return;
    setLoading(true);
    setStatus('Đang lấy thông tin giá tiền...');

    try {
      // 1. Lấy thông tin lô thuốc để biết giá (Price)
      const objectData: any = await suiClient.getObject({
        id: orderId,
        options: { showContent: true },
      });

      if (objectData.error || !objectData.data) {
        throw new Error("Không tìm thấy đơn hàng!");
      }

      const fields = objectData.data.content.fields;
      const price = fields.price; // Giá tiền lưu trên blockchain (MIST)
      
      setStatus(`Giá đơn hàng: ${price / 1_000_000_000} SUI. Đang xử lý...`);

      // 2. Upload bằng chứng nhận hàng (Metadata)
      const receiptData = {
        pharmacyName: "Nhà Thuốc Long Châu (Demo)",
        receivedTime: new Date().toISOString(),
        pharmacyAddress: "123 Hai Bà Trưng, Hà Nội",
        notes: "Đã nhận đủ số lượng, bao bì nguyên vẹn."
      };
      const hash = await uploadMetadata(receiptData);

      // 3. Tạo Transaction Thanh toán & Nhận hàng
      const tx = new Transaction();

      // KỸ THUẬT QUAN TRỌNG: Tách tiền từ ví ra để trả
      // tx.gas là đại diện cho ví hiện tại. Chúng ta tách ra 1 đồng coin có giá trị bằng đúng `price`
      const [paymentCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(price)]);

      // Gọi hàm complete_order
      tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::complete_order`,
        arguments: [
          tx.object(orderId),   // ID lô thuốc
          paymentCoin,          // Đồng coin vừa tách ra để trả tiền
          tx.pure.string(hash), // Hash metadata
        ],
      });

      // --- [FIX] QUAN TRỌNG: Trả lại coin thừa về ví ---
      // Vì hàm complete_order chỉ "mượn" coin (reference), nên object paymentCoin vẫn còn đó.
      // Move yêu cầu phải xử lý nó (chuyển về chủ sở hữu) trước khi kết thúc transaction.
      tx.transferObjects([paymentCoin], account.address);
      // -------------------------------------------------

      // Thực thi
      signAndExecuteTransaction(
        { transaction: tx },
        {
          onSuccess: (result) => {
            setStatus(`✅ Giao dịch thành công! Đã trả tiền & Nhận hàng. Digest: ${result.digest}`);
            setLoading(false);
            setOrderId(''); // Clear input
          },
          onError: (error) => {
            console.error(error);
            setStatus('❌ Lỗi thanh toán: ' + error.message);
            setLoading(false);
          },
        }
      );

    } catch (error: any) {
      setStatus('Lỗi: ' + error.message);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-green-50 rounded-xl border border-green-200 mt-10">
      <h2 className="text-2xl font-bold mb-4 text-green-800">🏥 Dành cho Nhà Thuốc (Người mua)</h2>
      
      {!account ? (
        <p>Vui lòng kết nối ví để thanh toán và nhận hàng.</p>
      ) : (
        <div className="space-y-4">
           <p className="text-sm text-gray-600">
             Nhập ID đơn hàng đã được Ship. Hệ thống sẽ tự động trừ SUI để thanh toán cho Nhà sản xuất.
           </p>
           <div className="flex gap-4">
            <input 
                type="text" 
                placeholder="Nhập ID lô thuốc cần Nhận & Thanh toán" 
                className="flex-1 p-3 border rounded focus:ring-green-500 focus:border-green-500"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
            />
            <button 
                onClick={handleReceiveAndPay}
                disabled={loading}
                className="bg-green-600 text-white px-6 py-3 rounded font-bold hover:bg-green-700 disabled:bg-gray-400"
            >
                {loading ? "Đang xử lý..." : "Nhận Hàng & Trả Tiền"}
            </button>
           </div>
        </div>
      )}
      
      {status && <div className={`mt-3 text-sm font-medium ${status.includes('Lỗi') ? 'text-red-600' : 'text-green-700'}`}>{status}</div>}
    </div>
  );
}