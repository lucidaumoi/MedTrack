import { useState } from 'react';
import { useSuiClient } from '@mysten/dapp-kit';
import { fetchTimelineData } from '../services/storage';

export default function Tracking() {
  const suiClient = useSuiClient();
  const [searchId, setSearchId] = useState('');
  const [loading, setLoading] = useState(false);
  const [timelineEvents, setTimelineEvents] = useState<any[]>([]);
  const [error, setError] = useState('');

  // Hàm xử lý khi bấm nút "Tra cứu"
  const handleSearch = async () => {
    if (!searchId) return;
    setLoading(true);
    setError('');
    setTimelineEvents([]);

    try {
      // 1. Lấy dữ liệu từ Blockchain
      const objectData: any = await suiClient.getObject({
        id: searchId,
        options: { showContent: true },
      });

      if (objectData.error) {
        throw new Error("Không tìm thấy lô thuốc này trên Blockchain!");
      }

      const fields = objectData.data?.content?.fields;
      if (!fields) throw new Error("Dữ liệu không hợp lệ.");

      // 2. Phân tích dữ liệu Move (Struct MedicineBatch)
      console.log("On-chain Data:", fields);

      const events = [];

      // --- MỐC 1: NHÀ SẢN XUẤT (Luôn có) ---
      const manHash = fields.manufacture_ref;
      const manData = await fetchTimelineData(manHash);
      events.push({
        step: 1,
        title: "Đã sản xuất",
        status: "success",
        hash: manHash,
        data: manData,
        actor: fields.seller,
        timestamp: manData?.manufactureDate || "N/A"
      });

      // --- MỐC 2: VẬN CHUYỂN (Kiểm tra Option) ---
      // Trong Move JSON, Option<String> thường trả về { vec: [] } (None) hoặc { vec: ['hash'] } (Some)
      // Hoặc đôi khi API trả về null trực tiếp. Ta xử lý cả 2 cas.
      const shipHashVec = fields.shipping_ref?.fields?.vec || fields.shipping_ref; 
      // Logic: Nếu là array và có phần tử thì lấy phần tử đầu, nếu là string thì lấy luôn
      const shipHash = Array.isArray(shipHashVec) ? shipHashVec[0] : shipHashVec;

      if (shipHash) {
        const shipData = await fetchTimelineData(shipHash);
        events.push({
          step: 2,
          title: "Đang vận chuyển",
          status: "shipping",
          hash: shipHash,
          data: shipData,
          actor: fields.transporter?.fields?.vec?.[0] || "Shipper", // Lấy Address shipper
          timestamp: shipData?.pickupTime || "N/A"
        });
      } else {
        // Chưa có shipper nhận
        events.push({ step: 2, title: "Chờ vận chuyển", status: "pending" });
      }

      // --- MỐC 3: NHÀ THUỐC (Kiểm tra Option) ---
      const receiptHashVec = fields.receipt_ref?.fields?.vec || fields.receipt_ref;
      const receiptHash = Array.isArray(receiptHashVec) ? receiptHashVec[0] : receiptHashVec;

      if (receiptHash) {
        const receiptData = await fetchTimelineData(receiptHash);
        events.push({
          step: 3,
          title: "Đã nhận hàng",
          status: "delivered",
          hash: receiptHash,
          data: receiptData,
          actor: fields.buyer?.fields?.vec?.[0] || "Pharmacy",
          timestamp: receiptData?.receivedTime || "N/A"
        });
      } else {
         events.push({ step: 3, title: "Chờ nhận hàng", status: "pending" });
      }

      setTimelineEvents(events);

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 mt-10">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">🔍 Truy xuất nguồn gốc</h2>
      
      {/* Search Bar */}
      <div className="flex gap-4 mb-10">
        <input 
          type="text" 
          placeholder="Nhập ID lô thuốc (Ví dụ: 0x123...)" 
          className="flex-1 p-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
          value={searchId}
          onChange={(e) => setSearchId(e.target.value)}
        />
        <button 
          onClick={handleSearch}
          disabled={loading}
          className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:bg-gray-400"
        >
          {loading ? "Đang tìm..." : "Tra cứu"}
        </button>
      </div>

      {error && <div className="text-red-500 mb-4 bg-red-50 p-3 rounded">{error}</div>}

      {/* Timeline UI */}
      <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
        
        {timelineEvents.map((event, index) => (
          <div key={index} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            
            {/* Icon tròn ở giữa */}
            <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-300 group-[.is-active]:bg-blue-500 text-slate-500 group-[.is-active]:text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
              {event.status === 'success' || event.status === 'delivered' ? '✓' : event.step}
            </div>
            
            {/* Card thông tin */}
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded border border-slate-200 bg-white shadow">
              <div className="flex items-center justify-between space-x-2 mb-1">
                <div className="font-bold text-slate-900">{event.title}</div>
                <time className="font-caveat font-medium text-indigo-500">{event.timestamp?.split('T')[0]}</time>
              </div>
              
              {/* Hiển thị chi tiết JSON từ Walrus/IPFS */}
              {event.data ? (
                <div className="text-sm text-slate-500 mt-2">
                   {event.data.imageUrl && <img src={event.data.imageUrl} alt="img" className="w-full h-32 object-cover rounded mb-2"/>}
                   <p><strong>Đơn vị:</strong> {event.data.manufacturerName || event.data.transporterName || event.data.pharmacyName}</p>
                   <p><strong>Địa chỉ:</strong> {event.data.location || event.data.currentLocation || event.data.pharmacyAddress}</p>
                   <div className="mt-2 p-2 bg-gray-100 rounded text-xs break-all">
                     Hash: {event.hash}
                   </div>
                </div>
              ) : (
                <p className="text-slate-400 italic">Chưa có dữ liệu</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}