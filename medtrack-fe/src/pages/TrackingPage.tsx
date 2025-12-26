import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSuiClient } from "@mysten/dapp-kit";
import { Search, Factory, Truck, Store, CheckCircle2, ArrowLeft } from "lucide-react";
import logoPng from '../assets/logo.png';

export default function TrackingPage() {
  const navigate = useNavigate();
  const suiClient = useSuiClient();
  const [batchId, setBatchId] = useState("");
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Separate state for each tracking stage
  const [createdRecord, setCreatedRecord] = useState<any>(null);
  const [shippingRecord, setShippingRecord] = useState<any>(null);
  const [deliveredRecord, setDeliveredRecord] = useState<any>(null);
  const [medicineCode, setMedicineCode] = useState<string>("");
  const [normalizedBatchId, setNormalizedBatchId] = useState<string>("");
  const [currentStatus, setCurrentStatus] = useState<number>(0);
  const [error, setError] = useState<string>("");

  // Auto-refresh functionality
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (autoRefresh && normalizedBatchId && currentStatus < 3) {
      // Auto refresh every 5 seconds if we have a batch ID but status is not delivered
      intervalId = setInterval(() => {
        console.log("Auto-refreshing timeline data...");
        fetchTimeline();
      }, 5000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [autoRefresh, normalizedBatchId, currentStatus]);

  const fetchTimeline = async () => {
    if (!batchId) return;
    setLoading(true);

    // Reset all records
    setCreatedRecord(null);
    setShippingRecord(null);
    setDeliveredRecord(null);
    setMedicineCode("");
    setNormalizedBatchId("");
    setCurrentStatus(0);
    setError("");

    // Normalize batch ID (remove 0x prefix if present)
    const normalizedId = batchId.trim().startsWith('0x')
      ? batchId.trim().substring(2)
      : batchId.trim();

    setNormalizedBatchId(normalizedId);

    console.log("=== TRACKING DEBUG ===");
    console.log("Original batchId:", batchId);
    console.log("Normalized batchId:", normalizedId);

    // Basic validation
    if (!/^[0-9a-f]{64}$/.test(normalizedId)) {
      console.error("❌ INVALID FORMAT: Batch ID must be 64 hex characters");
      setError("Invalid Batch ID format! Must be 64 hex characters (0-9, a-f).");
      setLoading(false);
      return;
    }

    try {
      // BƯỚC 1: Lấy MedicineBatch object trực tiếp (batchId CHÍNH LÀ Object ID)
      console.log("Fetching MedicineBatch with ID:", normalizedId);
      const batchObj = await suiClient.getObject({
        id: normalizedId,
        options: { showContent: true },
      });

      if (!batchObj || !batchObj.data) {
        console.error("❌ MedicineBatch not found!");
        setError("Không tìm thấy lô thuốc với ID đã nhập. Vui lòng kiểm tra lại Batch ID.");
        setLoading(false);
        return;
      }

      if (!batchObj.data?.content) {
        setError("Object không có nội dung hợp lệ.");
        setLoading(false);
        return;
      }

      // Lấy fields từ MedicineBatch
      const fields = (batchObj.data.content as any).fields as any;
      if (!fields) {
        setError("MedicineBatch không có dữ liệu hợp lệ.");
        setLoading(false);
        return;
      }

      // Lấy thông tin cơ bản
      const code = fields.medicine_code || fields.code || "N/A";
      const currentStatus = fields.current_status || fields.status || 0;
      const historyIds: string[] = fields.history || fields.history_ids || [];

      console.log("Medicine code:", code);
      console.log("Current status:", currentStatus);
      console.log("History IDs:", historyIds);
      console.log("History count:", historyIds.length);

      // Set thông tin cơ bản (luôn hiển thị ngay cả khi chưa có history)
      setMedicineCode(code);
      setCurrentStatus(currentStatus);

      // BƯỚC 2: Nếu có history, lấy chi tiết tất cả StatusRecord
      if (historyIds && historyIds.length > 0) {
        console.log("Fetching history records:", historyIds);
        const records = await suiClient.multiGetObjects({
          ids: historyIds,
          options: { showContent: true },
        });

        if (!records || !Array.isArray(records)) {
          console.error("Cannot retrieve history data");
          setError("Không thể tải dữ liệu lịch sử giao dịch.");
          setLoading(false);
          return;
        }

        // BƯỚC 3: Xử lý và phân loại tất cả records (không filter, hiện đủ)
        console.log("Processing", records.length, "history records");
        records.forEach((record: any, index: number) => {
          try {
            if (!record.data || !record.data.content) {
              console.warn(`Record ${index} has no content, skipping`);
              return;
            }

            const f = record.data.content.fields;
            if (!f) {
              console.warn(`Record ${index} has no fields, skipping`);
              return;
            }

            // Xử lý phone number
            let phoneDisplay = f.phone;
            if (typeof phoneDisplay === 'string') {
              phoneDisplay = phoneDisplay.trim();
              if (phoneDisplay === "" || phoneDisplay === "N/A") {
                phoneDisplay = null;
              } else if (phoneDisplay.match(/^(\+84|0)[0-9]{9,10}$/)) {
                phoneDisplay = phoneDisplay.replace(/^\+84/, '0');
              }
            }

            // Safe timestamp conversion
            let formattedTime = "N/A";
            try {
              if (f.timestamp) {
                const timestamp = Number(f.timestamp);
                if (!isNaN(timestamp)) {
                  formattedTime = new Date(timestamp).toLocaleString();
                }
              }
            } catch (timeError) {
              console.warn(`Error formatting timestamp for record ${index}:`, timeError);
            }

            const formattedRecord = {
              status: f.status,
              actor: f.actor,
              location: f.location_info,
              phone: phoneDisplay,
              note: f.note,
              time: formattedTime,
            };

            // Phân loại theo status (1=Created, 2=Shipping, 3=Delivered)
            const status = f.status;
            if (status === 1) {
              setCreatedRecord(formattedRecord);
              console.log("✅ Set created record");
            } else if (status === 2) {
              setShippingRecord(formattedRecord);
              console.log("✅ Set shipping record");
            } else if (status === 3) {
              setDeliveredRecord(formattedRecord);
              console.log("✅ Set delivered record");
            } else {
              console.warn(`Unknown status: ${status}`);
            }
          } catch (recordError) {
            console.error(`Error processing record ${index}:`, recordError);
          }
        });

        console.log("✅ History records processed successfully");
      } else {
        console.log("ℹ️ No history records yet - showing basic info only");
      }

    } catch (err) {
      console.error("Tracking error:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`Lỗi khi tải dữ liệu: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Enable auto-refresh if we have basic info but incomplete timeline
  const shouldAutoRefresh = medicineCode && currentStatus < 3 && (!shippingRecord || !deliveredRecord);
  useEffect(() => {
    setAutoRefresh(shouldAutoRefresh);
  }, [shouldAutoRefresh]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Back to Dashboard Button */}
      <div className="max-w-6xl mx-auto mb-6">
        <button
          onClick={() => navigate('/dashboard')}
          // flex: xếp ngang | items-center: căn giữa dọc | hover:scale-105: hiệu ứng phóng to cả cụm
          className="flex items-center gap-4 transition-transform duration-300 hover:scale-105 group"
        >
          {/* Phần Logo */}
          <div className="rounded-full">
            <img
              src={logoPng}
              alt="MedTrack Logo"
              className="h-15 w-auto drop-shadow-sm" /* Kích thước h-20 (80px) */
            />
          </div>

          {/* Phần Chữ MedTrack */}
          <span className="text-4xl font-bold text-gray-900 tracking-tight group-hover:text-blue-600 transition-colors">
            MedTrack
          </span>
        </button>
      </div>

      <div className="max-w-3xl mx-auto">
        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">

          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6">
            <h1 className="text-2xl font-bold text-center">Trace Pharmaceutical Origin</h1>
          </div>

          {/* Search Section */}
          <div className="p-6 bg-gray-50">
            <div className="flex gap-0">
              <input
                type="text"
                placeholder="Enter Batch ID..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                value={batchId}
                onChange={(e) => setBatchId(e.target.value)}
              />
              <button
                onClick={fetchTimeline}
                disabled={loading}
                className="bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-r-lg transition-colors flex items-center gap-2"
              >
                <Search className="w-5 h-5" />
                {loading ? "Searching..." : "Search"}
              </button>
            </div>
          </div>

          {/* Basic Info Section */}
          {medicineCode && (
            <div className="p-6 bg-blue-50 rounded-lg border border-blue-200 mb-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-blue-800">📦 Basic Information</h3>
                <button
                  onClick={() => fetchTimeline()}
                  disabled={loading}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm rounded transition-colors flex items-center gap-1"
                >
                  🔄 {loading ? "Loading..." : "Refresh"}
                </button>
              </div>
              <div className="text-sm text-blue-700">
                <p><strong>Medicine Code:</strong> {medicineCode}</p>
                <p><strong>Batch ID:</strong> {normalizedBatchId}</p>
                <p><strong>Status:</strong> {
                  currentStatus === 0 ? "Not initialized" :
                  currentStatus === 1 ? "Created (Ready for shipping)" :
                  currentStatus === 2 ? "In transit" :
                  currentStatus === 3 ? "Delivered" :
                  `Status ${currentStatus}`
                }</p>
              </div>
              <div className="mt-3 p-3 bg-blue-100 rounded text-xs">
                <p><strong>💡 Note:</strong> If you don't see the timeline, it means the batch has no transaction history yet. Update shipping status on the Carrier page, then click Refresh to update the data.</p>
                {autoRefresh && (
                  <p className="mt-2 text-blue-700">
                    <strong>🔄 Auto-refresh:</strong> This page will automatically refresh every 5 seconds to check for updates.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="p-6 bg-red-50 rounded-lg border border-red-200 mb-6">
              <h3 className="text-lg font-semibold text-red-800 mb-2">❌ Error</h3>
              <div className="text-sm text-red-700">
                <p style={{whiteSpace: 'pre-line'}}>{error}</p>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => fetchTimeline()}
                    disabled={loading}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white text-sm rounded transition-colors"
                  >
                    {loading ? "Retrying..." : "🔄 Retry"}
                  </button>
                  <button
                    onClick={() => setError("")}
                    className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white text-sm rounded transition-colors"
                  >
                    Hide Error
                  </button>
                </div>
                <p className="mt-2 text-xs">Check console for more details.</p>
              </div>
            </div>
          )}

          {/* Timeline Section */}
          <div className="p-6">

            {/* No Data State */}
            {!createdRecord && !shippingRecord && !deliveredRecord && !loading && medicineCode && (
              <div className="text-center py-16 text-gray-400">
                <div className="text-4xl mb-4">📋</div>
                <p className="text-lg">Basic information found but no transaction history yet</p>
                <p className="text-sm mt-2">This batch may not have been updated with status</p>
              </div>
            )}

            {!createdRecord && !shippingRecord && !deliveredRecord && !loading && !medicineCode && (
              <div className="text-center py-16 text-gray-400">
                <div className="text-6xl mb-4">🔍</div>
                <p className="text-lg">Enter Batch ID to trace medicine journey</p>
              </div>
            )}

            {/* Timeline */}
            {(createdRecord || shippingRecord || deliveredRecord) && (
              <div className="relative">

                {/* Production Stage - Always show if exists */}
                {createdRecord && (
                  <div className="relative pl-16 py-6">
                    {/* Vertical Line */}
                    <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-blue-100"></div>

                    {/* Icon Wrapper */}
                    <div className="absolute left-0 top-6 w-12 h-12 bg-white border-2 border-blue-100 rounded-full flex items-center justify-center z-10 shadow-md">
                      <Factory className="w-6 h-6 text-blue-500" />
                    </div>

                    {/* Content */}
                    <div className="bg-gray-50 rounded-lg p-4 ml-4 border border-gray-100">
                      <h3 className="font-bold text-gray-800 text-lg mb-2">🏭 Manufacturing</h3>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>🏢 Medicine Name: <span className="font-medium text-gray-900">{createdRecord.location}</span></p>
                        <p>💊 Medicine Code: <span className="font-medium text-gray-900">{medicineCode}</span></p>
                        <p>📅 Created Date: <span className="font-medium text-gray-900">{createdRecord.time}</span></p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Shipping Stage - Show if exists */}
                {shippingRecord && (
                  <div className="relative pl-16 py-6">
                    {/* Vertical Line */}
                    <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-blue-100"></div>

                    {/* Icon Wrapper */}
                    <div className="absolute left-0 top-6 w-12 h-12 bg-white border-2 border-blue-100 rounded-full flex items-center justify-center z-10 shadow-md">
                      <Truck className="w-6 h-6 text-orange-500" />
                    </div>

                    {/* Content */}
                    <div className="bg-gray-50 rounded-lg p-4 ml-4 border border-gray-100">
                      <h3 className="font-bold text-gray-800 text-lg mb-2">🚚 Shipping</h3>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>🚛 Carrier: <span className="font-medium text-gray-900">{shippingRecord.location}</span></p>
                        {shippingRecord.phone && (
                          <p>📞 Phone: <span className="font-medium text-gray-900">{shippingRecord.phone}</span></p>
                        )}
                        <p>📅 Shipping Date: <span className="font-medium text-gray-900">{shippingRecord.time}</span></p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Pharmacy Stage - Show if exists */}
                {deliveredRecord && (
                  <div className="relative pl-16 py-6">
                    {/* Vertical Line */}
                    <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-green-100"></div>

                    {/* Icon Wrapper */}
                    <div className="absolute left-0 top-6 w-12 h-12 bg-white border-2 border-green-100 rounded-full flex items-center justify-center z-10 shadow-md">
                      <div className="relative">
                        <Store className="w-6 h-6 text-green-500" />
                        <CheckCircle2 className="w-4 h-4 text-green-600 absolute -top-1 -right-1 bg-white rounded-full" />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="bg-green-50 rounded-lg p-4 ml-4 border border-green-200">
                      <h3 className="font-bold text-gray-800 text-lg mb-2">🏥 Pharmacy</h3>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>🏢 Pharmacy Name: <span className="font-medium text-gray-900">{deliveredRecord.location}</span></p>
                        {deliveredRecord.phone && (
                          <p>📞 Phone: <span className="font-medium text-gray-900">{deliveredRecord.phone}</span></p>
                        )}
                        <p>📅 Delivery Date: <span className="font-medium text-gray-900">{deliveredRecord.time}</span></p>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}