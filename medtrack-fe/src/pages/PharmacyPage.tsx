import { useState } from "react";
import { useSignAndExecuteTransaction, useCurrentAccount } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { PACKAGE_ID, MODULE_NAME, ALLOWED_WALLETS } from "../constants";
import {
  validateBatchId,
  validatePharmacyName,
  validatePhoneNumber,
  validateAddress,
  validateReceiverCompany
} from '../utils/validation';

export default function PharmacyPage() {
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const currentAccount = useCurrentAccount();
  const [formData, setFormData] = useState({
    batchId: "", pharmacyName: "", pharmacyPhone: "", pharmacyLocation: ""
  });

  const completeDelivery = () => {
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

    // Validate tên nhà thuốc
    const pharmacyNameValidation = validatePharmacyName(formData.pharmacyName);
    if (!pharmacyNameValidation.isValid) {
      alert("❌ " + pharmacyNameValidation.error);
      return;
    }

    // Validate số điện thoại nhà thuốc
    const pharmacyPhoneValidation = validatePhoneNumber(formData.pharmacyPhone);
    if (!pharmacyPhoneValidation.isValid) {
      alert("❌ " + pharmacyPhoneValidation.error);
      return;
    }

    // Validate địa chỉ nhà thuốc
    const pharmacyLocationValidation = validateAddress(formData.pharmacyLocation);
    if (!pharmacyLocationValidation.isValid) {
      alert("❌ " + pharmacyLocationValidation.error);
      return;
    }

    const tx = new Transaction();

    tx.moveCall({
      target: `${PACKAGE_ID}::${MODULE_NAME}::complete_record_delivery`,
      arguments: [
        tx.object(formData.batchId),           // Batch Object ID
        tx.pure.string(formData.pharmacyName),   // Tên nhà thuốc
        tx.pure.string(formData.pharmacyPhone),  // SĐT nhà thuốc
        tx.pure.string(formData.pharmacyLocation), // Địa chỉ nhà thuốc
        tx.object("0x6"),                      // Clock
      ],
    });

    signAndExecute(
      {
        transaction: tx,
      },
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

      <h2 className="text-2xl font-bold mb-4 text-green-700">🏥 Cổng Nhà Thuốc (Nhận Hàng)</h2>
      <div className="bg-green-100 border border-green-400 rounded p-3 mb-4">
        <p className="text-sm text-green-800 font-medium">
          ✅ <strong>Smart Contract đã được deploy!</strong> Có thể xác nhận nhận hàng.
        </p>
        <p className="text-sm text-green-700 mt-1">
          Nhập Batch ID từ Carrier để hoàn thành quy trình giao hàng.
        </p>
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ID Lô thuốc (Đang chờ nhận)</label>
          <input 
            placeholder="Paste Batch ID vào đây..." 
            className="border p-3 rounded-lg w-full bg-gray-50 font-mono text-sm"
            onChange={(e) => setFormData({...formData, batchId: e.target.value})}
          />
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          <input
            placeholder="VD: Pharmacity, Nhà thuốc An Khang, Guardian"
            className="border p-3 rounded-lg w-full"
            onChange={(e) => setFormData({...formData, pharmacyName: e.target.value})}
          />
          <input
            placeholder="VD: 0987654321 (số điện thoại nhà thuốc)"
            className="border p-3 rounded-lg w-full"
            onChange={(e) => setFormData({...formData, pharmacyPhone: e.target.value})}
          />
          <textarea
            placeholder="VD: 456 Đường XYZ, Quận UVW, TP.HCM (địa chỉ nhà thuốc)"
            className="border p-3 rounded-lg w-full h-20 resize-none"
            onChange={(e) => setFormData({...formData, pharmacyLocation: e.target.value})}
          />
        </div>

        <button
          onClick={completeDelivery}
          disabled={!formData.batchId || !formData.pharmacyName || !formData.pharmacyPhone || !formData.pharmacyLocation}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg w-full transition-all mt-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Xác Nhận Đã Nhận Hàng ✅
        </button>
        <p className="text-xs text-center text-gray-500 mt-2">
          Vui lòng điền đầy đủ Batch ID và thông tin nhà thuốc
        </p>
      </div>
    </div>
  );
}