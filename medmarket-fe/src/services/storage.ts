import axios from 'axios';

// Giả sử dùng Gateway công cộng hoặc API của bạn
const IPFS_GATEWAY = "https://gateway.pinata.cloud/ipfs/"; 
// Nếu dùng Walrus, thay bằng: "https://aggregator.walrus-testnet.walrus.space/v1/"

export interface ManufacturerData {
  drugName: string;
  manufacturerName: string;
  manufactureDate: string; // Quan trọng: Thời điểm
  location: string;
  imageUrl: string;
}

export interface ShippingData {
  transporterName: string;
  pickupTime: string; // Quan trọng: Thời điểm
  shippingStatus: string;
  currentLocation: string;
}

export interface PharmacyData {
  pharmacyName: string;
  receivedTime: string; // Quan trọng: Thời điểm
  pharmacyAddress: string;
  notes: string;
}

// Hàm giả lập Upload (Trong thực tế bạn sẽ gọi API POST lên Pinata/Walrus)
export const uploadMetadata = async (data: any): Promise<string> => {
  try {
    // DEMO: Vì chưa có server upload thực, tớ sẽ log ra để bạn thấy flow
    // Trong thực tế: const res = await axios.post('API_UPLOAD_URL', data); return res.data.hash;
    
    console.log("Mock Uploading to Walrus/IPFS:", data);
    
    // Giả lập trả về một hash ngẫu nhiên (để test logic Smart Contract)
    // Khi tích hợp thật, dòng này sẽ là hash thật trả về từ API
    const mockHash = "QmMockHash" + Date.now().toString(); 
    return mockHash;
  } catch (error) {
    console.error("Upload failed", error);
    throw error;
  }
};

// Hàm lấy dữ liệu Timeline (Quan trọng nhất cho trang Tracking)
export const fetchTimelineData = async (hash: string) => {
  if (!hash || hash === "") return null;
  
  try {
    // FIX: Trả về đầy đủ trường dữ liệu giả lập
    if (hash.startsWith("QmMock")) {
        return {
            // Dữ liệu chung
            drugName: "Panadol Extra (Demo)",
            imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=400",
            
            // Dữ liệu SX
            manufacturerName: "Dược Phẩm DHG (Demo)",
            manufactureDate: new Date().toISOString(),
            location: "KCN Tân Tạo, TP.HCM",

            // Dữ liệu Vận chuyển
            transporterName: "Giao Hàng Nhanh (Demo)",
            pickupTime: new Date().toISOString(),
            currentLocation: "Kho trung chuyển Đà Nẵng",

            // Dữ liệu Nhà thuốc
            pharmacyName: "Nhà Thuốc Long Châu (Demo)",
            receivedTime: new Date().toISOString(),
            pharmacyAddress: "123 Hai Bà Trưng, Hà Nội"
        };
    }

    const response = await axios.get(`${IPFS_GATEWAY}${hash}`);
    return response.data;
  } catch (error) {
    console.error("Fetch metadata failed", error);
    return null;
  }
};