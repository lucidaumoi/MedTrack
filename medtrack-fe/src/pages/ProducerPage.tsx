import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSuiClient, useSignAndExecuteTransaction, useCurrentAccount } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { PACKAGE_ID } from '../constants';
import { ShieldCheck, QrCode, ArrowLeft } from 'lucide-react';
import nacl from 'tweetnacl';
import naclUtil from 'tweetnacl-util';
import {
  validateDrugId,
  validateProducerName,
  validateReceiverCompany,
  validateAddress,
  validatePhoneNumber
} from '../utils/validation';

// Helper function to encrypt data with Carrier's public key
async function encryptData(publicKey: string, data: string) {
  // Generate ephemeral keypair for this encryption session
  const ephemeralKeyPair = nacl.box.keyPair();

  // Generate a random nonce
  const nonce = nacl.randomBytes(nacl.box.nonceLength);

  // Encrypt the data
  const encrypted = nacl.box(
    naclUtil.decodeUTF8(data),           // Data to encrypt
    nonce,                               // Random nonce
    naclUtil.decodeBase64(publicKey),   // Recipient's public key
    ephemeralKeyPair.secretKey          // Ephemeral secret key
  );

  return {
    encrypted: naclUtil.encodeBase64(encrypted),
    nonce: naclUtil.encodeBase64(nonce),
    ephemeralPublicKey: naclUtil.encodeBase64(ephemeralKeyPair.publicKey)
  };
}

export default function ProducerPage() {
  const navigate = useNavigate();
  const suiClient = useSuiClient();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const currentAccount = useCurrentAccount();

  // Form states
  const [drugId, setDrugId] = useState('');
  const [producerName, setProducerName] = useState('');
  const [producerPhone, setProducerPhone] = useState('');
  const [receiverCompany, setReceiverCompany] = useState('');
  const [receiverAddress, setReceiverAddress] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [carrierPublicKey, setCarrierPublicKey] = useState('');

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [encryptedResult, setEncryptedResult] = useState<string | null>(null);
  const [batchId, setBatchId] = useState('');

  const handleCreateOrder = async () => {
    try {
      // Wallet authorization check
      if (!currentAccount) {
        alert("❌ Please connect your Sui wallet first!");
        return;
      }


      // Validate carrier public key
      if (!carrierPublicKey) {
        alert("Please enter the Carrier's Public Key for encryption!");
        return;
      }

      // Validate all form fields
      const drugIdValidation = validateDrugId(drugId);
      if (!drugIdValidation.isValid) {
        alert("❌ " + drugIdValidation.error);
        return;
      }

      const producerNameValidation = validateProducerName(producerName);
      if (!producerNameValidation.isValid) {
        alert("❌ " + producerNameValidation.error);
        return;
      }

      const producerPhoneValidation = validatePhoneNumber(producerPhone);
      if (!producerPhoneValidation.isValid) {
        alert("❌ " + producerPhoneValidation.error);
        return;
      }

      const receiverCompanyValidation = validateReceiverCompany(receiverCompany);
      if (!receiverCompanyValidation.isValid) {
        alert("❌ " + receiverCompanyValidation.error);
        return;
      }

      const addressValidation = validateAddress(receiverAddress);
      if (!addressValidation.isValid) {
        alert("❌ " + addressValidation.error);
        return;
      }

      const phoneValidation = validatePhoneNumber(receiverPhone);
      if (!phoneValidation.isValid) {
        alert("❌ " + phoneValidation.error);
        return;
      }

      // Encrypt sensitive data
      const secretData = {
        address: receiverAddress,
        phone: receiverPhone
      };

      const encryptedObject = await encryptData(
        carrierPublicKey,
        JSON.stringify(secretData)
      );

      const encryptedString = JSON.stringify(encryptedObject);

      console.log("Chuỗi mã hóa sẽ lưu lên Chain:", encryptedString);

      // Create transaction
      const txb = new Transaction();
      txb.setGasBudget(200000000);

      txb.moveCall({
        target: `${PACKAGE_ID}::supply_chain::create_record`,
        arguments: [
          txb.pure.string(drugId),
          txb.pure.string(producerName),
          txb.pure.string(producerPhone),
          txb.pure.string(receiverCompany),
          txb.pure.string(encryptedString),
          txb.object("0x6"), // Clock object
        ],
      });

      // Add delay before submission
      await new Promise(resolve => setTimeout(resolve, 500));

      // Execute transaction
      signAndExecute(
        {
          transaction: txb,
        },
        {
          onSuccess: async (result) => {
            console.log("Transaction result:", result);

            try {
              // Get transaction details with retry logic
              const getTransactionDetails = async (retries = 5, delay = 1000) => {
                for (let i = 0; i < retries; i++) {
                  try {
                    const txDetails = await suiClient.getTransactionBlock({
                      digest: result.digest,
                      options: {
                        showObjectChanges: true,
                        showEffects: true,
                      },
                    });
                    return txDetails;
                  } catch (error) {
                    console.log(`❌ Attempt ${i + 1} failed:`, error);
                    if (i < retries - 1) {
                      await new Promise(resolve => setTimeout(resolve, delay));
                      delay *= 2; // Exponential backoff
                    }
                  }
                }
                throw new Error(`Failed to fetch transaction details after ${retries} attempts`);
              };

              const txDetails = await getTransactionDetails();

              if (txDetails.effects?.status?.status !== 'success') {
                throw new Error(`Transaction failed: ${txDetails.effects?.status?.error}`);
              }

              // Extract Batch ID from objectChanges or events
              let batchIdValue = null;
              console.log("Transaction objectChanges:", txDetails.objectChanges);
              console.log("Transaction events:", txDetails.events);

              // First try to find from events (if smart contract emits event)
              if (txDetails.events && txDetails.events.length > 0) {
                const batchCreatedEvent = txDetails.events.find((event: any) =>
                  event.type?.includes('BatchCreatedEvent') || event.type?.includes('supply_chain')
                );
                if (batchCreatedEvent && batchCreatedEvent.parsedJson && (batchCreatedEvent.parsedJson as any).batch_id) {
                  batchIdValue = (batchCreatedEvent.parsedJson as any).batch_id;
                  console.log("Found batch ID from event:", batchIdValue);
                }
              }

              // If not found in events, try objectChanges
              if (!batchIdValue && txDetails.objectChanges) {
                // Try to find created object first
                let targetObject = txDetails.objectChanges.find((change: any) =>
                  change.type === 'created' &&
                  (change.objectType?.includes('MedicineBatch') || change.objectType?.includes('::supply_chain::'))
                );

                // If not found, try published/shared object
                if (!targetObject) {
                  targetObject = txDetails.objectChanges.find((change: any) =>
                    change.type === 'published' &&
                    (change.objectType?.includes('MedicineBatch') || change.objectType?.includes('::supply_chain::'))
                  );
                }

                // If still not found, try any object that might be the batch
                if (!targetObject) {
                  targetObject = txDetails.objectChanges.find((change: any) =>
                    change.objectType?.includes('MedicineBatch') || change.objectType?.includes('::supply_chain::')
                  );
                }

                if (targetObject) {
                  batchIdValue = (targetObject as any).objectId || (targetObject as any).objectID || (targetObject as any).packageId;
                  console.log("Found object:", targetObject);
                }
              }

              // Last resort: try to find any created object
              if (!batchIdValue && txDetails.objectChanges) {
                const anyCreatedObject = txDetails.objectChanges.find((change: any) => change.type === 'created');
                if (anyCreatedObject) {
                  batchIdValue = (anyCreatedObject as any).objectId || (anyCreatedObject as any).objectID;
                  console.log("Using any created object as batch ID:", batchIdValue);
                }
              }

              if (batchIdValue) {
                console.log("✅ Batch ID created:", batchIdValue);
                setEncryptedResult(encryptedString);
                setBatchId(batchIdValue);
                setShowModal(true);
              } else {
                console.error("❌ Batch ID not found in transaction details:", txDetails);
                alert("⚠️ Transaction successful but Batch ID not found. Please check console logs.");
              }

            } catch (detailError) {
              console.error("Error fetching transaction details:", detailError);
              alert(`⚠️ Transaction successful but could not retrieve Batch ID details.\n\nError: ${(detailError as Error).message}`);
            }
          },
          onError: (error) => {
            console.error("Transaction error:", error);
            alert("❌ Transaction execution error: " + (error as Error).message);
          }
        }
      );

    } catch (error) {
      console.error("Transaction error:", error);
      alert("❌ Lỗi khi tạo đơn hàng: " + (error as Error).message);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50 p-6">
        {/* Wallet Status */}
        <div className={`mb-6 max-w-4xl mx-auto p-4 rounded-lg border-2 ${
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
              ⚠️ Please connect your Sui wallet to use the system
            </div>
          )}
        </div>

      {/* Back to Dashboard Button */}
      <div className="max-w-4xl mx-auto mb-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back to Dashboard</span>
        </button>
      </div>

      <div className="max-w-4xl mx-auto">
          {/* Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Card 1: Thông tin thuốc */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
              <div className="bg-[#3b82f6] text-white p-3">
                <h2 className="text-xl font-bold">💊 Medicine Information</h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">
                    Medicine Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ex: PhT-2025-12"
                    value={drugId}
                    onChange={e => setDrugId(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">
                    Medicine Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ex: Paracetamol"
                    value={producerName}
                    onChange={e => setProducerName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">
                    Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ex: 0987654321"
                    value={producerPhone}
                    onChange={e => setProducerPhone(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Card 2: Thông tin nhận */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
              <div className="bg-[#3b82f6] text-white p-3">
                <h2 className="text-xl font-bold">📦 Receiver Information</h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">
                    Receiver Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ex: Pharmacy ABC"
                    value={receiverCompany}
                    onChange={e => setReceiverCompany(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">
                    Delivery Address <span className="text-red-500">*</span>
                    <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Encrypted</span>
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ex: 123 ABC Street, District 1, Ho Chi Minh City"
                    value={receiverAddress}
                    onChange={e => setReceiverAddress(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">
                    Phone <span className="text-red-500">*</span>
                    <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Encrypted</span>
                  </label>
                  <input
                    type="tel"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ex: 0987654321"
                    value={receiverPhone}
                    onChange={e => setReceiverPhone(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Mã bảo mật - Full width */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden mb-8">
            <div className="bg-[#3b82f6] text-white p-3">
              <h2 className="text-xl font-bold">🔐 Security Code</h2>
            </div>
            <div className="p-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-900 font-medium mb-2">📋 How to get Public Key:</p>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside ml-2">
                  <li>Contact the carrier to get their Public Key</li>
                  <li>Public Key is usually a long string starting with "0x..." or hex format</li>
                  <li>Only the Carrier can decrypt address and phone information</li>
                </ol>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">
                  Public Key <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Dán Public Key của Carrier vào đây..."
                  value={carrierPublicKey}
                  onChange={e => setCarrierPublicKey(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center">
            <button
              onClick={handleCreateOrder}
              disabled={!drugId || !producerName || !producerPhone || !receiverCompany || !receiverAddress || !receiverPhone || !carrierPublicKey}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-3 px-12 rounded-full transition-all duration-200 shadow-lg hover:shadow-xl disabled:shadow-none"
            >
              🔒 Create Order
            </button>
          </div>
          <p className="text-xs text-center text-gray-500 mt-4">
            Please fill in all required fields marked with <span className="text-red-500">*</span>
          </p>
        </div>
      </div>

      {/* Success Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">

            {/* Icon Area */}
            <div className="p-6 flex justify-center">
              <ShieldCheck className="w-20 h-20 text-blue-500" />
            </div>

            {/* Blue Header */}
            <div className="bg-blue-500 py-3 text-center">
              <h3 className="text-white font-bold text-lg uppercase">Order Created</h3>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              {/* Batch ID Input Group */}
              <div>
                <label className="text-xs text-gray-500 mb-2 block">Batch ID</label>
                <div className="flex gap-2 items-center border rounded-md p-2 bg-gray-50">
                  <span className="text-sm font-mono truncate flex-1">{batchId}</span>
                  <QrCode className="w-6 h-6 text-gray-700 flex-shrink-0" />
                </div>
              </div>

              {/* Encrypted Data Section (Optional - collapsed) */}
              <details className="group">
                <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700 flex items-center gap-1">
                  <span>📋 Encrypted Data</span>
                  <svg className="w-3 h-3 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="mt-2">
                  <textarea
                    readOnly
                    value={encryptedResult || ''}
                    className="w-full p-2 bg-gray-50 border border-gray-300 rounded text-xs font-mono min-h-[80px]"
                    onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(encryptedResult || '');
                        alert("✅ Encrypted data copied!");
                      }}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-3 rounded text-xs transition-all"
                    >
                      📋 Copy
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`Batch ID: ${batchId}\n\nEncrypted Data: ${encryptedResult}`);
                        alert("✅ Complete information copied!");
                      }}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-xs transition-all"
                    >
                      📋 Copy All
                    </button>
                  </div>
                </div>
              </details>

              {/* Footer Actions */}
              <div className="pt-4 flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowModal(false);
                    // Reset form
                    setEncryptedResult(null);
                    setBatchId('');
                    setDrugId('');
                    setProducerName('');
                    setProducerPhone('');
                    setReceiverCompany('');
                    setReceiverAddress('');
                    setReceiverPhone('');
                    setCarrierPublicKey('');
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Create New Order
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}