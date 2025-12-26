import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSignAndExecuteTransaction, useCurrentAccount, useSuiClient, ConnectButton } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { MIST_PER_SUI } from "@mysten/sui/utils";
import { PACKAGE_ID } from "../constants";
import { Key, Eye, EyeOff, Copy, Lock, Truck } from "lucide-react";
import nacl from 'tweetnacl';
import naclUtil from 'tweetnacl-util';
import logoPng from '../assets/logo.png'; // ✅ Import Logo

import {
  validateCarrierName,
  validatePhoneNumber,
  validateAddress,
  validateBatchId,
  normalizeBatchId
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

  // Key management states
  const [publicKey, setPublicKey] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [showPrivateKey, setShowPrivateKey] = useState(false);

  // Decryption states
  const [batchId, setBatchId] = useState("");
  const [encryptedData, setEncryptedData] = useState("");
  const [decryptedInfo, setDecryptedInfo] = useState("");

  // Shipping update states
  const [shipperName, setShipperName] = useState("");
  const [shipperPhone, setShipperPhone] = useState("");
  const [deliveryLocation, setDeliveryLocation] = useState("");

  // Handle key generation
  const handleGenerateKey = () => {
    const newKeyPair = generateKeyPair();
    setPublicKey(newKeyPair.publicKey);
    setPrivateKey(newKeyPair.secretKey);
    alert("✅ New key pair created successfully!\n\nPlease copy the Public Key and send it to the Producer.");
  };

  // Handle data decryption
  const handleDecrypt = async () => {
    try {
      if (!privateKey) {
        alert("❌ Please generate keys first!");
        return;
      }

      if (!encryptedData) {
        alert("❌ Please enter the encrypted string!");
        return;
      }

      const encryptedObject = JSON.parse(encryptedData);
      const decrypted = await decryptData(encryptedObject, privateKey);

      setDecryptedInfo(decrypted);
      alert("✅ Decryption successful!");
    } catch (error) {
      console.error("Decryption error:", error);
      alert("❌ Decryption error: " + (error instanceof Error ? error.message : String(error)));
    }
  };

  // Handle shipping update
  const handleUpdateShipping = async () => {
    try {
      // Wallet authorization check
      if (!currentAccount) {
        alert("❌ Please connect your Sui wallet first!");
        return;
      }


      // Validate and normalize batch ID
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

      // Check batch status first
      try {
        console.log("Checking batch status before update...");
        const batchObj = await suiClient.getObject({
          id: normalizedBatchId,
          options: { showContent: true },
        });

        if (!batchObj.data?.content) {
          alert("❌ Batch does not exist!");
          return;
        }

        const fields = (batchObj.data.content as any).fields;
        const currentStatus = fields.current_status || fields.status || 0;

        console.log("Batch current status:", currentStatus);

        if (currentStatus !== 1) {
          const statusMsg = currentStatus === 0 ? "not initialized" :
                           currentStatus === 2 ? "in transit" :
                           currentStatus === 3 ? "delivered" :
                           `status ${currentStatus}`;

          alert(`❌ Cannot update shipping!\n\nCurrent batch status: ${statusMsg}\n\nCan only update batch with "Created" status.`);
          return;
        }
      } catch (statusError) {
        console.error("Error checking batch status:", statusError);
        alert("❌ Cannot check batch status. Please try again.");
        return;
      }

      if (!decryptedInfo) {
        alert("❌ Please decrypt delivery information first!");
        return;
      }

      // Validate shipping info
      const shipperNameValidation = validateCarrierName(shipperName);
      if (!shipperNameValidation.isValid) {
        alert("❌ " + shipperNameValidation.error);
        return;
      }

      const shipperPhoneValidation = validatePhoneNumber(shipperPhone);
      if (!shipperPhoneValidation.isValid) {
        alert("❌ " + shipperPhoneValidation.error);
        return;
      }

      const locationValidation = validateAddress(deliveryLocation);
      if (!locationValidation.isValid) {
        alert("❌ " + locationValidation.error);
        return;
      }

      // Create transaction
      const txb = new Transaction();
      txb.setGasBudget(200000000);

      txb.moveCall({
        target: `${PACKAGE_ID}::supply_chain::update_record_shipping`,
        arguments: [
          txb.object(normalizedBatchId), // MedicineBatch object
          txb.pure.string(shipperName),
          txb.pure.string(shipperPhone),
          txb.pure.string(deliveryLocation),
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
            console.log("Shipping update success:", result);
            console.log("Transaction digest:", result.digest);
            console.log("Transaction effects:", result.effects);
            console.log("Transaction objectChanges:", (result as any).objectChanges);
            console.log("Transaction events:", (result as any).events);

            // Refresh balance after transaction (gas fee deduction)
            await fetchBalance();

            // Wait for transaction to be confirmed
            alert("✅ Shipping status updated successfully!\n\n⏳ Transaction is being confirmed on blockchain...\n\nThe Tracking page will automatically refresh to show the updated timeline. You can now proceed to Pharmacy page for delivery confirmation.");
            // Reset form
            setBatchId("");
            setEncryptedData("");
            setDecryptedInfo("");
            setShipperName("");
            setShipperPhone("");
            setDeliveryLocation("");
          },
          onError: async (error) => {
            console.error("Shipping update error:", error);
            // Refresh balance in case of error (to ensure accurate display)
            await fetchBalance();
            alert("❌ Shipping update error: " + (error instanceof Error ? error.message : String(error)));
          }
        }
      );

    } catch (error) {
      console.error("Update shipping error:", error);
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
          <h1 className="text-3xl font-bold text-gray-800">Carrier Page</h1>
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
        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Left Column: Key Management */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Key className="w-5 h-5 text-blue-500" />
                Key Management
              </h2>

              {/* Generate Key Button */}
              <button
                onClick={handleGenerateKey}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 mb-4"
              >
                <Key className="w-4 h-4" />
                Generate New Key
              </button>

              {/* Public Key */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Public Key (Send to Producer)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={publicKey}
                    className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-md font-mono text-sm"
                    placeholder="Key not generated yet..."
                  />
                  <button
                    onClick={() => navigator.clipboard.writeText(publicKey)}
                    disabled={!publicKey}
                    className="p-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:cursor-not-allowed rounded-md transition-colors"
                    title="Copy Public Key"
                  >
                    <Copy className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>

              {/* Private Key */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Private Key (Keep Secret)
                </label>
                <div className="flex gap-2">
                  <input
                    type={showPrivateKey ? "text" : "password"}
                    readOnly
                    value={privateKey}
                    className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-md font-mono text-sm"
                    placeholder="Key not generated yet..."
                  />
                  <button
                    onClick={() => setShowPrivateKey(!showPrivateKey)}
                    disabled={!privateKey}
                    className="p-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:cursor-not-allowed rounded-md transition-colors"
                    title={showPrivateKey ? "Hide Private Key" : "Show Private Key"}
                  >
                    {showPrivateKey ? <EyeOff className="w-4 h-4 text-gray-600" /> : <Eye className="w-4 h-4 text-gray-600" />}
                  </button>
                  <button
                    onClick={() => navigator.clipboard.writeText(privateKey)}
                    disabled={!privateKey}
                    className="p-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:cursor-not-allowed rounded-md transition-colors"
                    title="Copy Private Key"
                  >
                    <Copy className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Receive & Update */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="bg-blue-500 text-white p-4">
                <h2 className="text-xl font-bold">Receive & Update</h2>
              </div>
              <div className="p-6 space-y-4">

                {/* Batch ID */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Batch ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={batchId}
                    onChange={(e) => setBatchId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter Batch ID from Producer..."
                  />
                </div>

                {/* Encrypted Data */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Encrypted Data <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={encryptedData}
                    onChange={(e) => setEncryptedData(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Paste encrypted data from Producer..."
                  />
                </div>

                {/* Decrypt Button */}
                <button
                  onClick={handleDecrypt}
                  disabled={!batchId || !encryptedData || !privateKey}
                  className="w-full bg-blue-400 hover:bg-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  Decrypt Delivery Information
                </button>

                {/* Decrypted Result */}
                {decryptedInfo && (
                  <div className="bg-white border border-gray-300 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-2">📍 Decrypted Delivery Information:</h3>
                    <textarea
                      readOnly
                      value={decryptedInfo}
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded font-mono text-sm min-h-[80px]"
                      onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                    />
                  </div>
                )}

                {/* Shipping Update Form */}
                {decryptedInfo && (
                  <div className="space-y-4 pt-4 border-t border-gray-200">
                    <h3 className="font-medium text-gray-900">🚚 Shipping Information:</h3>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Shipper Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={shipperName}
                        onChange={(e) => setShipperName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Delivery person name..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Shipper Phone <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        value={shipperPhone}
                        onChange={(e) => setShipperPhone(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Delivery person phone..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Delivery Location <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={deliveryLocation}
                        onChange={(e) => setDeliveryLocation(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Delivery location..."
                      />
                    </div>

                    {/* Update Shipping Button */}
                    <button
                      onClick={handleUpdateShipping}
                      disabled={!shipperName || !shipperPhone || !deliveryLocation}
                      className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-full transition-colors flex items-center justify-center gap-2 shadow-lg"
                    >
                      <Truck className="w-5 h-5" />
                      Confirm In Transit
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}