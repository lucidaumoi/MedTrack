import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSignAndExecuteTransaction, useCurrentAccount, useSuiClient } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { PACKAGE_ID } from "../constants";
import { Key, Eye, EyeOff, Copy, Lock, Truck, ArrowLeft } from "lucide-react";
import nacl from 'tweetnacl';
import naclUtil from 'tweetnacl-util';
import {
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
  const navigate = useNavigate();
  const suiClient = useSuiClient();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const currentAccount = useCurrentAccount();

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
    alert("✅ Đã tạo cặp khóa mới thành công!\n\nHãy copy Public Key và gửi cho Producer.");
  };

  // Handle data decryption
  const handleDecrypt = async () => {
    try {
      if (!privateKey) {
        alert("❌ Vui lòng tạo khóa trước!");
        return;
      }

      if (!encryptedData) {
        alert("❌ Vui lòng nhập chuỗi mã hóa!");
        return;
      }

      const encryptedObject = JSON.parse(encryptedData);
      const decrypted = await decryptData(encryptedObject, privateKey);

      setDecryptedInfo(decrypted);
      alert("✅ Đã giải mã thành công!");
    } catch (error) {
      console.error("Decryption error:", error);
      alert("❌ Lỗi giải mã: " + (error instanceof Error ? error.message : String(error)));
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


      // Validate inputs
      if (!batchId) {
        alert("❌ Please enter Batch ID!");
        return;
      }

      // Check batch status first
      try {
        console.log("Checking batch status before update...");
        const batchObj = await suiClient.getObject({
          id: batchId,
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
          txb.object(batchId), // MedicineBatch object
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

            // Wait for transaction to be confirmed
            alert("✅ Shipping status updated successfully!\n\n⏳ Waiting for transaction confirmation on blockchain...\n\nAfter 10-15 seconds, go to Tracking page and click Refresh to see updated timeline.");
            // Reset form
            setBatchId("");
            setEncryptedData("");
            setDecryptedInfo("");
            setShipperName("");
            setShipperPhone("");
            setDeliveryLocation("");
          },
          onError: (error) => {
            console.error("Shipping update error:", error);
            alert("❌ Shipping update error: " + (error instanceof Error ? error.message : String(error)));
          }
        }
      );

    } catch (error) {
      console.error("Update shipping error:", error);
      alert("❌ Lỗi: " + (error instanceof Error ? error.message : String(error)));
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
        <h1 className="text-3xl font-bold mb-8 text-center">🚛 Trang Vận Chuyển</h1>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Left Column: Key Management */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Key className="w-5 h-5 text-blue-500" />
                Quản lý Khóa
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
                    title={showPrivateKey ? "Ẩn Private Key" : "Hiện Private Key"}
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