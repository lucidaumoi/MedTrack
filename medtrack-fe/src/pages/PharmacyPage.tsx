import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSignAndExecuteTransaction, useCurrentAccount, useSuiClient, ConnectButton } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { MIST_PER_SUI } from "@mysten/sui/utils";
import { PACKAGE_ID } from "../constants";
import {
  validatePharmacyName,
  validatePhoneNumber,
  validateBatchId,
  normalizeBatchId
} from '../utils/validation';
import logoPng from '../assets/logo.png';

export default function PharmacyPage() {
  const navigate = useNavigate();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();

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
        alert("❌ Please connect your Sui wallet first!");
        return;
      }


      // Validate all required fields
      if (!batchId) {
        alert("❌ Please enter Batch ID!");
        return;
      }

      const batchIdValidation = validateBatchId(batchId);
      if (!batchIdValidation.isValid) {
        alert("❌ " + batchIdValidation.error);
        return;
      }

      const normalizedBatchId = normalizeBatchId(batchId);
      console.log("Original batchId:", batchId);
      console.log("Normalized batchId:", normalizedBatchId);


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
          txb.object(normalizedBatchId), // Object ID of the batch
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
          onSuccess: async (result) => {
            console.log("Delivery confirmation success:", result);

            // Refresh balance after transaction (gas fee deduction)
            await fetchBalance();

            alert("✅ Delivery confirmed successfully!\n\nThe Tracking page will automatically refresh to show the completed delivery timeline.");

            // Reset form
            setBatchId("");
            setPharmacyName("");
            setPharmacyPhone("");
          },
          onError: async (error) => {
            console.error("Delivery confirmation error:", error);
            // Refresh balance in case of error (to ensure accurate display)
            await fetchBalance();
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
          <h1 className="text-3xl font-bold text-gray-800">Pharmacy Page</h1>
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

      <div className="max-w-6xl mx-auto">
        {/* Pharmacy Form */}
        <div className="max-w-6xl mx-auto px-8">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="bg-green-500 text-white p-3">
                <h3 className="text-lg font-bold">🏥 Receiving Pharmacy</h3>
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
                    Phone <span className="text-red-500">*</span>
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