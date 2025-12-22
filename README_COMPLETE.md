# MedTrack - Hệ Thống Quản Lý Chuỗi Cung Ứng Thuốc Blockchain

## 📋 Mục Lục
1. [Tổng Quan](#-tổng-quan)
2. [Kiến Trúc Hệ Thống](#-kiến-trúc-hệ-thống)
3. [Công Nghệ Sử Dụng](#-công-nghệ-sử-dụng)
4. [Tính Năng Chính](#-tính-năng-chính)
5. [Hướng Dẫn Sử Dụng](#-hướng-dẫn-sử-dụng)
6. [Smart Contract API](#-smart-contract-api)
7. [Bảo Mật & Ủy Quyền](#-bảo-mật--ủy-quyền)
8. [Troubleshooting](#-troubleshooting)
9. [Development Guide](#-development-guide)

---

## 🎯 Tổng Quan

**MedTrack** là hệ thống quản lý chuỗi cung ứng thuốc sử dụng công nghệ blockchain Sui để đảm bảo tính minh bạch, bảo mật và truy xuất nguồn gốc của thuốc từ nhà sản xuất đến người tiêu dùng.

### 🎯 Mục Tiêu
- **Minh bạch**: Theo dõi toàn bộ hành trình của thuốc trên blockchain
- **Bảo mật**: Mã hóa thông tin nhạy cảm, chỉ người được ủy quyền mới truy cập
- **Truy xuất**: Dễ dàng tra cứu lịch sử và trạng thái của từng lô thuốc
- **Tuân thủ**: Đáp ứng các quy định về quản lý thuốc

### 🎯 Quy Trình Hoạt Động
```
🏭 Producer → 🚚 Carrier → 🏥 Pharmacy → 👥 Consumer
     ↓         ↓         ↓         ↓
  Tạo đơn   Cập nhật   Nhận hàng  Tra cứu
  hàng      vận chuyển  hoàn tất   hành trình
```

---

## 🏗️ Kiến Trúc Hệ Thống

### 📁 Cấu Trúc Thư Mục
```
MedTrack/
├── medtrack/                    # Smart Contract (Move)
│   ├── sources/
│   │   └── supply_chain.move    # Logic chính
│   ├── tests/                   # Unit tests
│   └── Move.toml               # Dependencies
│
├── medtrack-fe/                 # Frontend (React + TypeScript)
│   ├── src/
│   │   ├── pages/               # Các trang UI
│   │   │   ├── ProducerPage.tsx # Trang nhà sản xuất
│   │   │   ├── CarrierPage.tsx  # Trang vận chuyển
│   │   │   ├── PharmacyPage.tsx # Trang nhà thuốc
│   │   │   └── TrackingPage.tsx # Trang tra cứu
│   │   ├── utils/               # Utilities
│   │   ├── constants.ts         # Cấu hình
│   │   └── App.tsx             # Main app
│   ├── package.json            # Dependencies
│   └── tailwind.config.ts      # Styling
│
└── README_COMPLETE.md          # Documentation này
```

### 🔄 Luồng Dữ Liệu
```
Frontend (React) ↔ Sui dApp Kit ↔ Smart Contract (Move)
        ↓              ↓                ↓
   User Interface → Wallet Signing → Blockchain Storage
```

---

## 💻 Công Nghệ Sử Dụng

### 🎨 Frontend
- **React 19** - Modern React với hooks
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS
- **Sui dApp Kit** - Sui blockchain integration
- **Vite** - Fast development server

### 🔗 Blockchain
- **Sui Network** - High-performance blockchain
- **Move Language** - Safe programming language
- **Sui CLI** - Development tools

### 🔐 Bảo Mật
- **TweetNaCl** - Encryption/Decryption
- **Wallet Authorization** - Chỉ cho phép ví được ủy quyền
- **Input Validation** - Validate tất cả dữ liệu đầu vào

---

## 🚀 Tính Năng Chính

### 1. 🏭 Nhà Sản Xuất (Producer)
- **Tạo đơn hàng** với mã hóa thông tin nhạy cảm
- **Mã thuốc format**: `[Tên viết tắt 2-4 chữ]-YYYY-MM`
- **Thông tin mã hóa**: Địa chỉ giao hàng, số điện thoại người nhận
- **Public Key**: Sử dụng để mã hóa cho Carrier

### 2. 🚚 Đơn Vị Vận Chuyển (Carrier)
- **Giải mã thông tin** bằng Private Key
- **Cập nhật trạng thái** "Đang vận chuyển"
- **Key Pair Generation**: Tạo cặp khóa công khai/bí mật
- **Location Tracking**: Ghi nhận vị trí giao hàng

### 3. 🏥 Nhà Thuốc (Pharmacy)
- **Nhận hàng** và hoàn thành giao dịch
- **Xác nhận delivery** với thông tin nhà thuốc
- **Status Update**: Chuyển trạng thái thành "Đã nhận hàng"

### 4. 🔍 Tra Cứu Hành Trình (Tracking)
- **Batch ID Lookup**: Tìm kiếm theo ID lô thuốc
- **Timeline Display**: Hiển thị lịch sử đầy đủ
- **Contact Information**: Số điện thoại liên hệ tại mỗi bước

---

## 📖 Hướng Dẫn Sử Dụng

### 🔑 Chuẩn Bị
1. **Kết nối ví Sui** (Sui Wallet, etc.)
2. **Địa chỉ ví phải được ủy quyền** (check danh sách ALLOWED_WALLETS)
3. **Đủ SUI** để thực hiện transaction

### 🏭 Quy Trình Tạo Đơn Hàng

#### Bước 1: Truy cập Producer Page
```
URL: http://localhost:5173/#/producer
```

#### Bước 2: Điền thông tin
- **Mã thuốc**: `PTS-2025-12` (Paracetamol-2025-tháng 12)
- **Tên nhà sản xuất**: `Công ty Dược phẩm ABC`
- **Số điện thoại**: `0896739545`
- **Tên công ty nhận**: `Nhà thuốc XYZ`
- **Địa chỉ giao**: `123 Đường ABC, Phường DEF, Quận GHI, TP.HCM`
- **Số điện thoại nhận**: `0987654321`

#### Bước 3: Nhận Public Key từ Carrier
- Carrier tạo cặp khóa và gửi Public Key
- Producer dán Public Key vào ô tương ứng

#### Bước 4: Mã hóa & Submit
- Click "🔒 Mã hóa & Gửi lên Blockchain"
- Approve transaction trong ví
- Nhận Batch ID và encrypted data

### 🚚 Quy Trình Vận Chuyển

#### Bước 1: Tạo Key Pair
```
URL: http://localhost:5173/#/carrier
```
- Click "🆕 Tạo Cặp Khóa Mới"
- **Lưu Private Key** vào nơi an toàn
- Copy Public Key gửi cho Producer

#### Bước 2: Nhận đơn hàng
- Nhận Batch ID và encrypted data từ Producer
- Dán vào các ô tương ứng

#### Bước 3: Giải mã thông tin
- Dán Private Key
- Click "🔓 Giải Mã Ngay"
- Xem địa chỉ và số điện thoại giao hàng

#### Bước 4: Cập nhật vận chuyển
- Điền thông tin vận chuyển
- Click "📦 Xác Nhận Đang Giao Hàng"
- Approve transaction

### 🏥 Quy Trình Nhận Hàng

#### Bước 1: Truy cập Pharmacy Page
```
URL: http://localhost:5173/#/pharmacy
```

#### Bước 2: Điền thông tin
- **Batch ID**: Dán từ Producer/Carrier
- **Tên nhà thuốc**: `Nhà thuốc ABC`
- **Số điện thoại**: `0987654321`
- **Địa chỉ**: `456 Đường XYZ, Quận DEF, TP.HCM`

#### Bước 3: Hoàn thành giao hàng
- Click "✅ Xác Nhận Đã Nhận Hàng"
- Approve transaction

### 🔍 Tra Cứu Hành Trình

#### Bước 1: Truy cập Tracking Page
```
URL: http://localhost:5173/#/tracking
```

#### Bước 2: Tìm kiếm
- Dán Batch ID vào ô tìm kiếm
- Click "Tìm"

#### Bước 3: Xem timeline
- **📦 Đã khởi tạo**: Thông tin nhà sản xuất + số điện thoại
- **🚚 Đang vận chuyển**: Thông tin carrier + địa chỉ giao
- **✅ Đã nhận hàng**: Thông tin nhà thuốc + confirmation

---

## 📚 Smart Contract API

### 🎯 Structs

#### MedicineBatch
```move
public struct MedicineBatch has key {
    id: UID,
    medicine_code: String,        // Mã thuốc (PTS-2025-12)
    current_status: u8,          // Trạng thái hiện tại
    history: vector<ID>          // Lịch sử các record IDs
}
```

#### StatusRecord
```move
public struct StatusRecord has key {
    id: UID,
    batch_id: ID,               // ID của MedicineBatch
    status: u8,                 // 1: Created, 2: Shipping, 3: Delivered
    actor: address,             // Địa chỉ ví thực hiện
    location_info: String,      // Thông tin địa điểm
    phone: String,              // Số điện thoại liên hệ
    timestamp: u64,             // Thời gian Unix
    note: String                // Ghi chú
}
```

### 🔧 Entry Functions

#### create_record
```move
entry fun create_record(
    medicine_code: String,      // Mã thuốc
    manufacturer: String,       // Tên nhà sản xuất
    producer_phone: String,     // Số điện thoại nhà sản xuất
    receiver_company: String,   // Tên công ty nhận
    info: String,              // Thông tin mã hóa (địa chỉ + phone)
    clock: &Clock,
    ctx: &mut TxContext
)
```

#### update_record_shipping
```move
entry fun update_record_shipping(
    batch: &mut MedicineBatch,  // Batch object
    carrier_name: String,       // Tên đơn vị vận chuyển
    carrier_phone: String,      // Số điện thoại tài xế
    delivery_location: String,  // Địa chỉ giao hàng
    clock: &Clock,
    ctx: &mut TxContext
)
```

#### complete_record_delivery
```move
entry fun complete_record_delivery(
    batch: &mut MedicineBatch,  // Batch object
    pharmacy_name: String,      // Tên nhà thuốc
    pharmacy_phone: String,     // Số điện thoại nhà thuốc
    pharmacy_location: String,  // Địa chỉ nhà thuốc
    clock: &Clock,
    ctx: &mut TxContext
)
```

### 📊 Status Constants
```move
const STATUS_CREATED: u8 = 1;    // Đã khởi tạo
const STATUS_SHIPPING: u8 = 2;   // Đang vận chuyển
const STATUS_DELIVERED: u8 = 3;  // Đã nhận hàng
```

---

## 🔐 Bảo Mật & Ủy Quyền

### 👛 Wallet Authorization
Chỉ các ví được liệt kê trong `ALLOWED_WALLETS` mới được phép sử dụng:

```typescript
export const ALLOWED_WALLETS = [
  "0x915342dba62fb2dceb7405a22fe19e0e3627bedbe9bca822c0b3464546e312b3", // Admin
  "0x90eb4ce69bf7fc934f8e8bd688d2da7bc8916a8a30358bb568aa6087efe89a50", // Authorized
];
```

### 🔒 Mã Hóa Dữ Liệu
- **Thuật toán**: TweetNaCl (libsodium)
- **Key exchange**: X25519
- **Thông tin mã hóa**: Địa chỉ giao hàng, số điện thoại người nhận
- **Truy cập**: Chỉ Carrier với Private Key mới giải mã được

### ✅ Input Validation
- **Mã thuốc**: Regex `^[A-Za-z]{2,4}-\d{4}-\d{2}$`
- **Số điện thoại**: Format Việt Nam `0xxxxxxxxx` hoặc `+84xxxxxxxxx`
- **Địa chỉ**: Ít nhất 10 ký tự, có số nhà + đường + phường/quận
- **Batch ID**: Hex format `0x[64 ký tự hex]`

---

## 🛠️ Troubleshooting

### ❌ "User rejected the request"
**Nguyên nhân**: Người dùng cancel transaction trong ví
**Giải pháp**: Click lại nút và approve trong ví

### ❌ "Transaction failed: undefined"
**Nguyên nhân**: Transaction không thành công
**Giải pháp**: Check console logs, verify gas balance, retry

### ❌ "No effects in transaction result"
**Nguyên nhân**: Transaction chưa được process hoàn toàn
**Giải pháp**: Đợi vài giây và thử lại

### ❌ "Incorrect number of arguments"
**Nguyên nhân**: Smart contract ABI mismatch
**Giải pháp**: Redeploy contract và update PACKAGE_ID

### ❌ "Địa chỉ ví không được phép"
**Nguyên nhân**: Ví không có trong ALLOWED_WALLETS
**Giải pháp**: Thêm ví vào danh sách hoặc sử dụng ví được phép

### ❌ "Giải mã thất bại"
**Nguyên nhân**: Sai Private Key hoặc dữ liệu bị lỗi
**Giải pháp**: Verify Private Key và thử lại

### 🔍 Debug Tips
- **F12**: Mở Developer Console để xem logs
- **Console logs**: Chi tiết arguments, transaction status
- **Transaction Digest**: Tra cứu trên Sui Explorer
- **Gas Balance**: Đảm bảo đủ SUI để thực hiện

---

## 🛠️ Development Guide

### 🚀 Chạy Development Server
```bash
cd MedTrack/medtrack-fe
npm install
npm run dev
# Access: http://localhost:5173/
```

### 📦 Deploy Smart Contract
```bash
cd MedTrack/medtrack
sui move build
sui client publish --gas-budget 200000000
# Update PACKAGE_ID in constants.ts
```

### 🧪 Testing
```bash
# Smart contract tests
cd MedTrack/medtrack
sui move test

# Frontend tests
cd MedTrack/medtrack-fe
npm test
```

### 🔧 Environment Setup
```bash
# Install Sui CLI
# Install Node.js 18+
# Install dependencies
npm install
```

### 📝 Code Structure
- **Components**: Functional React components với TypeScript
- **State Management**: React hooks (useState, useEffect)
- **Blockchain Integration**: Sui dApp Kit
- **Styling**: Tailwind CSS utility classes
- **Validation**: Custom validation functions

### 🔄 CI/CD
- **Linting**: ESLint + TypeScript
- **Formatting**: Prettier
- **Testing**: Jest + React Testing Library
- **Build**: Vite production build

---

## 📞 Liên Hệ & Hỗ Trợ

### 👥 Development Team
- **Lead Developer**: MedTrack Team
- **Blockchain Engineer**: Move/Sui Specialist
- **Frontend Developer**: React/TypeScript Expert

### 📧 Support Channels
- **Issues**: GitHub Issues
- **Documentation**: README files
- **Updates**: Changelog

### 🌟 Contributing
1. Fork repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

---

## 📋 Checklist Production Ready

- [x] Smart contract deployed on Sui testnet
- [x] Frontend fully functional
- [x] Wallet authorization implemented
- [x] End-to-end workflow tested
- [x] Documentation complete
- [x] Error handling robust
- [x] Input validation comprehensive
- [x] Security measures in place

---

**🎉 MedTrack - Nâng Tầm An Toàn Thuốc Cho Tương Lai!**

*Last updated: December 2025*
*Version: 1.0.0*
