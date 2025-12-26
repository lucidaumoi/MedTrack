import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSignAndExecuteTransaction, useCurrentAccount } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { PACKAGE_ID } from "../constants";
import { ArrowLeft } from 'lucide-react';
import {
  validatePharmacyName,
  validatePhoneNumber
} from '../utils/validation';

export default function PharmacyPage() {
  const navigate = useNavigate();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const currentAccount = useCurrentAccount();

  // Form states
  const [batchId, setBatchId] = useState("");
  const [pharmacyName, setPharmacyName] = useState("");
  const [pharmacyPhone, setPharmacyPhone] = useState("");
  const [pharmacyLocation] = useState(""); // Empty string for smart contract compatibility



  // Handle confirm receive
  const handleConfirmReceive = async () => {
    try {
      // Wallet authorization check
      if (!currentAccount) {
        alert("❌ Vui lòng kết nối ví Sui trước!");
        return;
      }


      // Validate all required fields
      if (!batchId) {
        alert("❌ Vui lòng nhập Batch ID!");
        return;
      }


      // Validate pharmacy info
      const pharmacyNameValidation = validatePharmacyName(pharmacyName);
      if (!pharmacyNameValidation.isValid) {
        alert("❌ " + pharmacyNameValidation.error);
        return;
      }

      const pharmacyPhoneValidation = validatePhoneNumber(pharmacyPhone);
      if (!pharmacyPhoneValidation.isValid) {
        alert("❌ " + pharmacyPhoneValidation.error);
        return;
      }

      // Create transaction
      const txb = new Transaction();
      txb.setGasBudget(200000000);

      txb.moveCall({
        target: `${PACKAGE_ID}::supply_chain::complete_record_delivery`,
        arguments: [
          txb.object(batchId), // Object ID of the batch
          txb.pure.string(pharmacyName),
          txb.pure.string(pharmacyPhone),
          txb.pure.string(pharmacyLocation), // Empty string for compatibility
          txb.object("0x6"), // Clock object
        ],
      });

      // Execute transaction
      signAndExecute(
        {
          transaction: txb,
        },
        {
          onSuccess: (result) => {
            console.log("Delivery confirmation success:", result);
            alert("✅ Delivery confirmed successfully!");

            // Reset form
            setBatchId("");
            setPharmacyName("");
            setPharmacyPhone("");
          },
          onError: (error) => {
            console.error("Delivery confirmation error:", error);
            alert("❌ Delivery confirmation error: " + (error instanceof Error ? error.message : String(error)));
          }
        }
      );

    } catch (error) {
      console.error("Confirm receive error:", error);
      alert("❌ Error: " + (error instanceof Error ? error.message : String(error)));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Wallet Status */}
      <div className={`mb-6 max-w-6xl mx-auto p-4 rounded-lg border-2 ${
        currentAccount
          ? 'bg-green-50 border-green-300'
          : 'bg-red-50 border-red-300'
      }`}>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${
            currentAccount
              ? 'bg-green-500'
              : 'bg-red-500'
          }`}></div>
          <span className="font-medium">
            {currentAccount
              ? '✅ Ví đã kết nối'
              : '❌ Chưa kết nối ví'}
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
      </div>

      {/* Back to Dashboard Button */}
      <div className="max-w-6xl mx-auto mb-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back to Dashboard</span>
        </button>
      </div>

      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">🏥 Trang Nhà Thuốc</h1>

        {/* Pharmacy Form */}
        <div className="max-w-6xl mx-auto px-8">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="bg-green-500 text-white p-3">
                <h3 className="text-lg font-bold">🏥 Nhà thuốc nhận</h3>
              </div>
              <div className="p-8 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Batch ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={batchId}
                    onChange={(e) => setBatchId(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-4 focus:ring-2 focus:ring-green-500 outline-none transition-all"
                    placeholder="Enter Batch ID to confirm order"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pharmacy Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={pharmacyName}
                    onChange={(e) => setPharmacyName(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-4 focus:ring-2 focus:ring-green-500 outline-none transition-all"
                    placeholder="Enter pharmacy name..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Số điện thoại <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={pharmacyPhone}
                    onChange={(e) => setPharmacyPhone(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-4 focus:ring-2 focus:ring-green-500 outline-none transition-all"
                    placeholder="Enter phone number..."
                  />
                </div>


                <div className="pt-4">
                  <button
                    onClick={handleConfirmReceive}
                    disabled={!batchId || !pharmacyName || !pharmacyPhone}
                    className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-full transition-colors shadow-lg text-lg"
                  >
                    ✅ Confirm Order Received
                  </button>
                </div>

                <p className="text-xs text-center text-gray-500 mt-6">
                  Please fill in all information to confirm receipt
                </p>
              </div>
            </div>
          </div>
        </div>
    </div>
  );
}