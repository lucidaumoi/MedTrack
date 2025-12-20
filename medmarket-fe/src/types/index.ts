export enum OrderStatus {
  PENDING = 0,   // Nhà SX vừa tạo
  SHIPPING = 1,  // Shipper đang giữ
  DELIVERED = 2, // Đã về tới Nhà thuốc
}

export interface MedicineBatchOnChain {
  id: { id: string };
  price: string;
  seller: string;
  transporter?: string | null;
  buyer?: string | null;
  status: number;
  // Các hash lưu trên chain
  manufacture_ref: string;
  shipping_ref?: string | null;
  receipt_ref?: string | null;
}

// Cấu trúc đầy đủ để hiển thị Timeline trên UI
export interface TimelineEvent {
  step: number; // 1, 2, hoặc 3
  title: string; // "Sản xuất", "Vận chuyển", "Đã nhận"
  actor: string; // Địa chỉ ví người thực hiện
  timestamp: string; // Lấy từ trong JSON IPFS
  details: any; // Toàn bộ data JSON (địa chỉ, ảnh, tên thuốc...)
  hash: string;
  isCompleted: boolean;
}