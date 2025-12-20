import { useState } from "react";
import { useSuiClient } from "@mysten/dapp-kit";
import { ArrowDown } from "lucide-react";

export default function TrackingPage() {
  const suiClient = useSuiClient();
  const [batchId, setBatchId] = useState("");
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTimeline = async () => {
    if (!batchId) return;
    setLoading(true);
    setTimeline([]);

    try {
      // BƯỚC 1: Lấy Object chính (MedicineBatch)
      const batchObj = await suiClient.getObject({
        id: batchId,
        options: { showContent: true },
      });

      if (batchObj.data?.content?.dataType !== "moveObject") {
        alert("Không tìm thấy dữ liệu hoặc ID sai!");
        setLoading(false);
        return;
      }

      // Ép kiểu để lấy trường history (vector<ID>)
      const fields = batchObj.data.content.fields as any;
      const historyIds: string[] = fields.history;

      if (!historyIds || historyIds.length === 0) {
        alert("Chưa có lịch sử nào!");
        setLoading(false);
        return;
      }

      // BƯỚC 2: MultiGet - Lấy chi tiết tất cả StatusRecord cùng lúc
      const records = await suiClient.multiGetObjects({
        ids: historyIds,
        options: { showContent: true },
      });

      // BƯỚC 3: Map dữ liệu ra format đẹp để render
      const formattedTimeline = records.map((record: any) => {
        const f = record.data.content.fields;
        return {
          status: f.status, // 1: Created, 2: Shipping, 3: Delivered
          actor: f.actor,
          location: f.location_info,
          phone: f.phone,
          note: f.note,
          time: new Date(Number(f.timestamp)).toLocaleString(),
        };
      });

      setTimeline(formattedTimeline);
    } catch (err) {
      console.error(err);
      alert("Lỗi khi tải dữ liệu! Kiểm tra ID.");
    } finally {
      setLoading(false);
    }
  };

  // Helper để hiển thị badge trạng thái
  const getStatusBadge = (status: number) => {
    if (status === 1) return <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-sm">📦 Đã khởi tạo</span>;
    if (status === 2) return <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-sm">🚚 Đang vận chuyển</span>;
    if (status === 3) return <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-sm">✅ Đã nhận hàng</span>;
    return null;
  };

  return (
    <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100 min-h-[500px]">
      <h2 className="text-2xl font-bold mb-6 text-blue-900">🔍 Tra Cứu Hành Trình</h2>

      {/* Input Search */}
      <div className="flex gap-2 mb-8">
        <input 
          placeholder="Nhập Mã Lô Thuốc (Object ID)" 
          className="border p-3 rounded-lg w-full bg-gray-50"
          value={batchId}
          onChange={(e) => setBatchId(e.target.value)}
        />
        <button 
          onClick={fetchTimeline}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 rounded-lg font-bold disabled:opacity-50"
        >
          {loading ? "Đang tìm..." : "Tìm"}
        </button>
      </div>

      {/* Timeline Display */}
      <div className="space-y-0">
        {timeline.map((item, index) => (
          <div key={index} className="relative pl-8 pb-8 border-l-2 border-blue-200 last:border-0 last:pb-0">
            {/* Dot icon */}
            <div className="absolute -left-[9px] top-0 w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow"></div>
            
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-2">
                <div className="font-bold text-lg text-gray-800">{item.note}</div>
                {getStatusBadge(item.status)}
              </div>
              
              <div className="text-sm text-gray-600 space-y-1">
                <p>📍 Tại: <span className="font-medium text-gray-900">{item.location}</span></p>
                <p>📞 Liên hệ: {item.phone}</p>
                <p>🕒 Thời gian: {item.time}</p>
                <p className="text-xs text-gray-400 mt-2 truncate">Người thực hiện: {item.actor}</p>
              </div>
            </div>

            {/* Arrow Connector (trừ item cuối) */}
            {index < timeline.length - 1 && (
              <div className="mt-2 ml-4 text-blue-300">
                <ArrowDown size={20} />
              </div>
            )}
          </div>
        ))}

        {timeline.length === 0 && !loading && (
          <div className="text-center text-gray-400 py-10">
            Nhập ID lô thuốc để xem hành trình chi tiết.
          </div>
        )}
      </div>
    </div>
  );
}