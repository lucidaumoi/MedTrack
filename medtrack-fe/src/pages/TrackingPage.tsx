import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSuiClient } from "@mysten/dapp-kit";
import { Search, Factory, Truck, Store, CheckCircle2, ArrowLeft } from "lucide-react";

export default function TrackingPage() {
  const navigate = useNavigate();
  const suiClient = useSuiClient();
  const [batchId, setBatchId] = useState("");
  const [loading, setLoading] = useState(false);

  // Separate state for each tracking stage
  const [createdRecord, setCreatedRecord] = useState<any>(null);
  const [shippingRecord, setShippingRecord] = useState<any>(null);
  const [deliveredRecord, setDeliveredRecord] = useState<any>(null);
  const [medicineCode, setMedicineCode] = useState<string>("");
  const [normalizedBatchId, setNormalizedBatchId] = useState<string>("");
  const [currentStatus, setCurrentStatus] = useState<number>(0);
  const [error, setError] = useState<string>("");

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

    // Normalize batch ID (remove 0x prefix if present, ensure proper format)
    const normalizedId = batchId.trim().startsWith('0x')
      ? batchId.trim().substring(2)
      : batchId.trim();

    setNormalizedBatchId(normalizedId);

    console.log("=== TRACKING DEBUG ===");
    console.log("Original batchId:", batchId);
    console.log("Normalized batchId:", normalizedId);
    console.log("Normalized length:", normalizedId.length);
    console.log("Is valid Sui object ID format:", /^[0-9a-f]{64}$/.test(normalizedId));

    // Additional validation
    if (!/^[0-9a-f]{64}$/.test(normalizedId)) {
      console.error("❌ INVALID FORMAT: Batch ID must be 64 hex characters");
      console.error("Expected format: /^[0-9a-f]{64}$/");
      console.error("Got:", normalizedId);
      alert("Batch ID không đúng format! Phải là 64 ký tự hex.");
      setLoading(false);
      return;
    }

    // Special debug for reported batch IDs
    if (normalizedId === '132732818db296ba156185fb60f75a35eec18493fe0daf9e81734cc74e6e22fd' ||
        normalizedId === '54867e1a4cb4f5af1aa0156035d294b855597692fc8e7990c00c865cefafaad3') {
      console.log("🔍 DEBUGGING SPECIFIC BATCH ID:", normalizedId);
      console.log("This is a reported problematic batch ID");
      console.log("Will attempt to fetch from Sui testnet...");
    }

    try {
      // BƯỚC 1: Lấy Object chính (MedicineBatch)
      const batchObj = await suiClient.getObject({
        id: normalizedId,
        options: { showContent: true },
      });

      console.log("Batch object response:", batchObj);
      console.log("Batch object exists:", !!batchObj);
      console.log("Batch object data exists:", !!batchObj?.data);
      console.log("Batch object data type:", (batchObj?.data as any)?.dataType);

      if (!batchObj || !batchObj.data) {
        console.error("❌ Batch object not found!");
        console.error("Possible causes:");
        console.error("1. Batch ID incorrect:", normalizedId);
        console.error("2. Transaction not confirmed yet - wait a few seconds");
        console.error("3. Wrong network (should be testnet)");
        console.error("4. Smart contract error during creation");

        const errorMsg = `Không tìm thấy batch với ID: ${normalizedId}\n\n` +
                        `⚠️ Nguyên nhân có thể:\n` +
                        `• Transaction chưa được confirm (đợi 10-30 giây)\n` +
                        `• Network sai (phải là testnet)\n` +
                        `• Batch ID không đúng\n\n` +
                        `💡 Hãy thử lại sau vài giây!`;

        setError(errorMsg);
        console.log("❌ SEARCH FAILED - Error details above");

        // Don't show alert, just set error in UI
        // alert(errorMsg);
        setLoading(false);
        return;
      }

      if (!batchObj.data?.content) {
        alert("Object không có content!");
        setLoading(false);
        return;
      }

      // Ép kiểu để lấy trường history (vector<ID>) và medicine_code
      const fields = (batchObj.data.content as any).fields as any;
      console.log("=== BATCH OBJECT DEBUG ===");
      console.log("Full batch object:", batchObj);
      console.log("Batch object data:", batchObj.data);
      console.log("Batch object content:", batchObj.data?.content);
      console.log("Batch object fields:", fields);

      if (!fields) {
        console.error("Fields is null or undefined!");
        alert("Object không có fields hợp lệ!");
        setLoading(false);
        return;
      }

      console.log("Available field keys:", Object.keys(fields));
      console.log("Current status:", fields.current_status || fields.status);
      console.log("Medicine code:", fields.medicine_code);
      console.log("History field exists:", 'history' in fields);
      console.log("History value:", fields.history);
      console.log("History type:", typeof fields.history);
      console.log("History is array:", Array.isArray(fields.history));

      // Check if this is a StatusRecord instead of MedicineBatch
      const content = batchObj.data?.content as any;
      const objectType = content?.type || '';
      const isStatusRecord = objectType.includes('StatusRecord');
      const isMedicineBatch = objectType.includes('MedicineBatch');

      console.log("Object type:", objectType);
      console.log("Is StatusRecord:", isStatusRecord);
      console.log("Is MedicineBatch:", isMedicineBatch);

      if (isStatusRecord && !isMedicineBatch) {
        console.error("❌ WRONG OBJECT TYPE!");
        console.error("You searched for a StatusRecord ID, not MedicineBatch ID");
        console.error("StatusRecord batch_id:", fields.batch_id);
        console.error("Try searching with this MedicineBatch ID instead:", fields.batch_id);

        setError(`❌ Sai loại Object!\n\nBạn đã tìm kiếm StatusRecord ID thay vì MedicineBatch ID.\n\nMedicineBatch ID đúng: ${fields.batch_id}\n\nHãy copy ID trên và search lại.`);
        setLoading(false);
        return;
      }
      console.log("Current status:", fields.current_status || fields.status);

      // Try different field names for history
      const historyIds: string[] = fields.history || fields.history_ids || fields.records || [];
      const code = fields.medicine_code || fields.code || fields.medicineCode || "N/A";
      const currentStatus = fields.current_status || fields.status || 0;

      console.log("History IDs found:", historyIds);
      console.log("History IDs length:", historyIds?.length || 0);
      console.log("Medicine code:", code);
      console.log("Current status:", currentStatus);

      setMedicineCode(code);
      setCurrentStatus(currentStatus);

      // Additional debugging for history IDs
      if (historyIds && historyIds.length > 0) {
        console.log("First history ID:", historyIds[0]);
        console.log("History ID type:", typeof historyIds[0]);
      }

      if (!historyIds || historyIds.length === 0) {
        console.warn("No history IDs found, but continuing to show basic info");
        console.warn("This means the batch was created but no StatusRecords exist yet");
        console.warn("Status records are created when updating shipping status");
        setMedicineCode(code);
        alert("Batch tồn tại nhưng chưa có lịch sử giao dịch.\n\n• Hãy cập nhật trạng thái vận chuyển trên trang Carrier\n• Sau đó nhấn Refresh để xem timeline cập nhật!");
        setLoading(false);
        return;
      }

      setMedicineCode(code);

      // BƯỚC 2: MultiGet - Lấy chi tiết tất cả StatusRecord cùng lúc
      console.log("Calling multiGetObjects with IDs:", historyIds);
      const records = await suiClient.multiGetObjects({
        ids: historyIds,
        options: { showContent: true },
      });

      console.log("MultiGetObjects response:", records);

      if (!records || !Array.isArray(records)) {
        console.error("Invalid records response:", records);
        alert("Không thể lấy dữ liệu lịch sử!");
        setLoading(false);
        return;
      }

      // BƯỚC 3: Phân loại và gán vào từng record riêng biệt
      let hasCreated = false;
      let hasShipping = false;
      let hasDelivered = false;

      console.log("Records received:", records.length);
      records.forEach((record: any, index: number) => {
        try {
          console.log(`=== RECORD ${index} DEBUG ===`);
          console.log(`Record ${index} full:`, record);
          console.log(`Record ${index} data:`, record.data);
          console.log(`Record ${index} content:`, record.data?.content);

          if (!record.data || !record.data.content) {
            console.error(`Record ${index} has no content! Skipping record ${index}`);
            return;
          }

          const f = record.data.content.fields;
          console.log(`Record ${index} fields:`, f);

          if (!f) {
            console.error(`Record ${index} has no fields! Skipping.`);
            return;
          }

          console.log(`Record ${index} status:`, f.status);
          console.log(`Record ${index} actor:`, f.actor);
          console.log(`Record ${index} location_info:`, f.location_info);
          console.log(`Record ${index} phone:`, f.phone);
          console.log(`Record ${index} timestamp:`, f.timestamp);

        // Xử lý phone number
        let phoneDisplay = f.phone;
        if (typeof phoneDisplay === 'string') {
          phoneDisplay = phoneDisplay.trim();
          if (phoneDisplay === "" && f.status === 1) {
            phoneDisplay = null;
          } else if (phoneDisplay !== "") {
            if (phoneDisplay.match(/^(\+84|0)[0-9]{9,10}$/)) {
              phoneDisplay = phoneDisplay.replace(/^\+84/, '0');
            }
          } else {
            phoneDisplay = null;
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

        // Gán vào record tương ứng và track
        const status = f.status;
        console.log(`Processing record with status: ${status}, type: ${typeof status}`);

        // Special debug for the problematic batch
        if (normalizedId === '54867e1a4cb4f5af1aa0156035d294b855597692fc8e7990c00c865cefafaad3') {
          console.log(`🔍 RECORD STATUS DEBUG for batch ${normalizedId}:`);
          console.log(`Status value:`, status);
          console.log(`Status === 1:`, status === 1);
          console.log(`Status === 2:`, status === 2);
          console.log(`Status === 3:`, status === 3);
        }

        if (status === 1) {
          setCreatedRecord(formattedRecord);
          hasCreated = true;
          console.log("✅ Set created record:", formattedRecord);
        } else if (status === 2) {
          setShippingRecord(formattedRecord);
          hasShipping = true;
          console.log("✅ Set shipping record:", formattedRecord);
        } else if (status === 3) {
          setDeliveredRecord(formattedRecord);
          hasDelivered = true;
          console.log("✅ Set delivered record:", formattedRecord);
        } else {
          console.warn(`⚠️ Unknown status: ${status} for record:`, formattedRecord);
        }
        } catch (recordError) {
          console.error(`Error processing record ${index}:`, recordError);
          // Continue processing other records
        }
      });

      // Check if no records were found
      console.log("Record tracking:", { hasCreated, hasShipping, hasDelivered });
      if (!hasCreated && !hasShipping && !hasDelivered) {
        alert("Không tìm thấy dữ liệu hành trình!");
      } else {
        console.log("Successfully processed records");
      }

    } catch (err) {
      console.error("Tracking error:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      alert(`Lỗi khi tải dữ liệu: ${errorMessage}\n\nKiểm tra ID và thử lại.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Back to Dashboard Button */}
      <div className="max-w-3xl mx-auto mb-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back to Dashboard</span>
        </button>
      </div>

      <div className="max-w-3xl mx-auto">
        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">

          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6">
            <h1 className="text-2xl font-bold text-center">Tra cứu nguồn gốc thuốc</h1>
          </div>

          {/* Search Section */}
          <div className="p-6 bg-gray-50">
            <div className="flex gap-0">
              <input
                type="text"
                placeholder="Nhập Batch ID..."
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
                {loading ? "Đang tìm..." : "Tìm"}
              </button>
            </div>
          </div>

          {/* Basic Info Section */}
          {medicineCode && (
            <div className="p-6 bg-blue-50 rounded-lg border border-blue-200 mb-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-blue-800">📦 Thông tin cơ bản</h3>
                <button
                  onClick={() => fetchTimeline()}
                  disabled={loading}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm rounded transition-colors flex items-center gap-1"
                >
                  🔄 {loading ? "Đang tải..." : "Refresh"}
                </button>
              </div>
              <div className="text-sm text-blue-700">
                <p><strong>Mã thuốc:</strong> {medicineCode}</p>
                <p><strong>Batch ID:</strong> {normalizedBatchId}</p>
                <p><strong>Trạng thái:</strong> {
                  currentStatus === 0 ? "Chưa khởi tạo" :
                  currentStatus === 1 ? "Đã tạo (Sẵn sàng vận chuyển)" :
                  currentStatus === 2 ? "Đang vận chuyển" :
                  currentStatus === 3 ? "Đã giao" :
                  `Status ${currentStatus}`
                }</p>
              </div>
              <div className="mt-3 p-3 bg-blue-100 rounded text-xs">
                <p><strong>💡 Lưu ý:</strong> Nếu không thấy timeline, có nghĩa là batch chưa có lịch sử giao dịch. Hãy cập nhật trạng thái vận chuyển trên trang Carrier, sau đó nhấn Refresh để cập nhật dữ liệu.</p>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="p-6 bg-red-50 rounded-lg border border-red-200 mb-6">
              <h3 className="text-lg font-semibold text-red-800 mb-2">❌ Lỗi</h3>
              <div className="text-sm text-red-700">
                <p style={{whiteSpace: 'pre-line'}}>{error}</p>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => fetchTimeline()}
                    disabled={loading}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white text-sm rounded transition-colors"
                  >
                    {loading ? "Đang thử lại..." : "🔄 Thử lại"}
                  </button>
                  <button
                    onClick={() => setError("")}
                    className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white text-sm rounded transition-colors"
                  >
                    Ẩn lỗi
                  </button>
                </div>
                <p className="mt-2 text-xs">Kiểm tra console để biết thêm chi tiết.</p>
              </div>
            </div>
          )}

          {/* Timeline Section */}
          <div className="p-6">

            {/* No Data State */}
            {!createdRecord && !shippingRecord && !deliveredRecord && !loading && medicineCode && (
              <div className="text-center py-16 text-gray-400">
                <div className="text-4xl mb-4">📋</div>
                <p className="text-lg">Đã tìm thấy thông tin cơ bản nhưng chưa có lịch sử giao dịch</p>
                <p className="text-sm mt-2">Batch này có thể chưa được cập nhật trạng thái</p>
              </div>
            )}

            {!createdRecord && !shippingRecord && !deliveredRecord && !loading && !medicineCode && (
              <div className="text-center py-16 text-gray-400">
                <div className="text-6xl mb-4">🔍</div>
                <p className="text-lg">Nhập Batch ID để tra cứu hành trình thuốc</p>
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
                      <h3 className="font-bold text-gray-800 text-lg mb-2">🏭 Sản xuất</h3>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>🏢 Công ty: <span className="font-medium text-gray-900">{createdRecord.location}</span></p>
                        <p>💊 Mã thuốc: <span className="font-medium text-gray-900">{medicineCode}</span></p>
                        <p>📅 Ngày tạo: <span className="font-medium text-gray-900">{createdRecord.time}</span></p>
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
                      <h3 className="font-bold text-gray-800 text-lg mb-2">🚚 Vận chuyển</h3>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>🚛 Đơn vị vận chuyển: <span className="font-medium text-gray-900">{shippingRecord.location}</span></p>
                        {shippingRecord.phone && (
                          <p>📞 Số điện thoại: <span className="font-medium text-gray-900">{shippingRecord.phone}</span></p>
                        )}
                        <p>📅 Ngày vận chuyển: <span className="font-medium text-gray-900">{shippingRecord.time}</span></p>
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
                      <h3 className="font-bold text-gray-800 text-lg mb-2">🏥 Nhà thuốc</h3>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>🏢 Tên nhà thuốc: <span className="font-medium text-gray-900">{deliveredRecord.location}</span></p>
                        {deliveredRecord.phone && (
                          <p>📞 Số điện thoại: <span className="font-medium text-gray-900">{deliveredRecord.phone}</span></p>
                        )}
                        <p>📅 Ngày nhận hàng: <span className="font-medium text-gray-900">{deliveredRecord.time}</span></p>
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