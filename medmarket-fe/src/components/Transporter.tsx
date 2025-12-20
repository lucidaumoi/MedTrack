import { useState } from 'react';
import { useSignAndExecuteTransaction, useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { uploadMetadata } from '../services/storage';

// TODO: Đảm bảo PACKAGE_ID giống hệt bên CreateOrder
const PACKAGE_ID = "0x732b6101f0693cbcae3487684a91636361bb63db7c32b9a072c8200284c3079b"; 
const MODULE_NAME = "medicine_market";

export default function Transporter() {
  const account = useCurrentAccount();
  const suiClient = useSuiClient();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();

  const [orderId, setOrderId] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const handleTransport = async () => {
    if (!account || !orderId) return;
    setLoading(true);
    setStatus('Đang kiểm tra đơn hàng...');

    try {
      // 1. Upload thông tin vận chuyển lên Walrus/IPFS
      const shippingData = {
        transporterName: "Sui Logistics Express",
        pickupTime: new Date().toISOString(),
        shippingStatus: "In Transit",
        currentLocation: "Kho xuất phát"
      };
      
      const hash = await uploadMetadata(shippingData);
      console.log("Shipping Hash:", hash);

      // 2. Gọi Smart Contract
      const tx = new Transaction();
      
      tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::transport_order`,
        arguments: [
          tx.object(orderId),   // ID lô thuốc cần ship
          tx.pure.string(hash), // Hash thông tin ship
        ],
      });

      signAndExecuteTransaction(
        { transaction: tx },
        {
          onSuccess: (result) => {
            setStatus(`Đã nhận đơn! Digest: ${result.digest}`);
            setLoading(false);
          },
          onError: (error) => {
            setStatus('Lỗi: ' + error.message);
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
    <div className="max-w-2xl mx-auto p-6 bg-blue-50 rounded-xl border border-blue-200 mt-10">
      <h2 className="text-2xl font-bold mb-4 text-blue-800">🚚 Dành cho Đơn vị Vận chuyển</h2>
      
      {!account ? (
        <p>Vui lòng kết nối ví để nhận đơn.</p>
      ) : (
        <div className="flex gap-4">
          <input 
            type="text" 
            placeholder="Nhập ID lô thuốc cần Ship" 
            className="flex-1 p-3 border rounded"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
          />
          <button 
            onClick={handleTransport}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-3 rounded font-bold hover:bg-blue-700"
          >
            {loading ? "Đang xử lý..." : "Xác nhận Ship"}
          </button>
        </div>
      )}
      
      {status && <div className="mt-3 text-sm font-medium text-gray-700">{status}</div>}
    </div>
  );
}