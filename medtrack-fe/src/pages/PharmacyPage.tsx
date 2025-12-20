import { useState } from "react";
import { useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { PACKAGE_ID, MODULE_NAME } from "../constants";

export default function PharmacyPage() {
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const [formData, setFormData] = useState({
    batchId: "", pharmacyName: "", pharmacyPhone: ""
  });

  const completeDelivery = () => {
    if (!formData.batchId) {
      alert("Vui lòng nhập ID lô thuốc!");
      return;
    }

    const tx = new Transaction();

    tx.moveCall({
      target: `${PACKAGE_ID}::${MODULE_NAME}::complete_delivery`,
      arguments: [
        tx.object(formData.batchId),           // Batch Object ID
        tx.pure.string(formData.pharmacyName),   // Tên nhà thuốc
        tx.pure.string(formData.pharmacyPhone),  // SĐT nhà thuốc
        tx.object("0x6"),                      // Clock
      ],
    });

    signAndExecute(
      { transaction: tx },
      {
        onSuccess: (result) => {
          console.log(result);
          alert("✅ Đã xác nhận: NHẬN HÀNG THÀNH CÔNG");
        },
        onError: (err) => {
          console.error(err);
          alert("❌ Lỗi: " + err.message);
        }
      }
    );
  };

  return (
    <div className="bg-white p-8 rounded-xl shadow-md border border-green-100">
      <h2 className="text-2xl font-bold mb-6 text-green-700">🏥 Cổng Nhà Thuốc (Nhận Hàng)</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ID Lô thuốc (Đang chờ nhận)</label>
          <input 
            placeholder="Paste Batch ID vào đây..." 
            className="border p-3 rounded-lg w-full bg-gray-50 font-mono text-sm"
            onChange={(e) => setFormData({...formData, batchId: e.target.value})}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <input 
            placeholder="Tên nhà thuốc (VD: Pharmacity)" 
            className="border p-3 rounded-lg w-full"
            onChange={(e) => setFormData({...formData, pharmacyName: e.target.value})}
          />
          <input 
            placeholder="SĐT liên hệ" 
            className="border p-3 rounded-lg w-full"
            onChange={(e) => setFormData({...formData, pharmacyPhone: e.target.value})}
          />
        </div>

        <button 
          onClick={completeDelivery}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg w-full transition-all mt-2"
        >
          Xác Nhận Đã Nhận Hàng ✅
        </button>
      </div>
    </div>
  );
}