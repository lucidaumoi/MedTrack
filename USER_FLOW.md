# MedTrack - User Flow & Workflow Documentation

## 📋 Tổng quan User Flow

**MedTrack** có 4 luồng người dùng chính:
- **🏭 Producer (Nhà sản xuất)**: Tạo đơn hàng
- **🚚 Carrier (Đơn vị vận chuyển)**: Vận chuyển hàng
- **🏥 Pharmacy (Nhà thuốc)**: Nhận hàng
- **👥 Consumer (Người tiêu dùng)**: Tra cứu thông tin

---

## 🎯 User Flow Chi Tiết

### 1. 🔐 SETUP & ONBOARDING

#### **Bước 1: Kết nối ví Sui**
```
User Action:
├── Mở browser → Truy cập trang web
├── Click "Connect Wallet"
├── Chọn ví Sui (Sui Wallet, etc.)
├── Approve connection
└── Verify: Địa chỉ ví được hiển thị

System Response:
├── ✅ Wallet connected
├── ✅ Show wallet authorization status
└── ✅ Enable authorized features
```

#### **Bước 2: Kiểm tra ủy quyền**
```
Decision Point: Wallet Authorized?
├── YES → Proceed to role selection
└── NO → Show error message
    ├── "Địa chỉ ví không được phép sử dụng"
    └── "Vui lòng liên hệ quản trị viên"
```

---

### 2. 🏭 PRODUCER FLOW - Tạo đơn hàng

#### **Bước 1: Truy cập Producer Page**
```
Navigation:
├── URL: http://localhost:5173/#/producer
├── Verify: Wallet connected & authorized
└── Verify: Wallet status = "✅ Ví được ủy quyền"
```

#### **Bước 2: Nhận Public Key từ Carrier**
```
External Communication:
├── Liên hệ Carrier qua email/phone
├── Yêu cầu Public Key để mã hóa
├── Carrier tạo key pair và gửi Public Key
└── Producer nhận và lưu Public Key
```

#### **Bước 3: Điền thông tin đơn hàng**
```
Form Input Validation:
├── Mã thuốc: "PTS-2025-12"
│   ├── Format: [A-Z]{2,4}-YYYY-MM
│   ├── Validation: Regex check
│   └── Error: "Mã thuốc phải có format đúng"
│
├── Tên nhà sản xuất: "Công ty Dược phẩm ABC"
│   ├── Validation: Required, min 3 chars
│   └── Error: "Tên công ty phải có ít nhất 3 ký tự"
│
├── Số điện thoại: "0896739545"
│   ├── Format: 0xxxxxxxxx or +84xxxxxxxxx
│   └── Error: "Số điện thoại không hợp lệ"
│
├── Tên công ty nhận: "Nhà thuốc XYZ"
│   ├── Validation: Required, min 3 chars
│   └── Error: "Tên công ty phải có ít nhất 3 ký tự"
│
├── Địa chỉ giao hàng: "123 Đường ABC, Phường DEF..."
│   ├── Validation: Required, min 10 chars, has number + street
│   └── Error: "Địa chỉ phải đầy đủ thông tin"
│
├── Số điện thoại nhận: "0987654321"
│   ├── Format: Phone validation
│   └── Error: "Số điện thoại không hợp lệ"
│
└── Public Key Carrier: [Base64 string]
    ├── Validation: Required, valid base64
    └── Error: "Public Key không hợp lệ"
```

#### **Bước 4: Mã hóa dữ liệu**
```
Encryption Process:
├── Collect sensitive data:
│   ├── address: receiverAddress
│   └── phone: receiverPhone
│
├── Generate encryption object:
│   ├── ephemeralKeyPair: X25519 key pair
│   ├── nonce: Random nonce
│   └── encrypted: NaCl box encryption
│
├── Create encrypted string:
│   └── JSON.stringify({
│       encrypted: "...",
│       nonce: "...",
│       ephemeralPublicKey: "..."
│   })
│
└── Result: Encrypted JSON string for blockchain
```

#### **Bước 5: Submit Transaction**
```
Blockchain Transaction:
├── Create Transaction object
├── Set gas budget: 200,000,000 MIST
├── Call: create_record() function
├── Arguments:
│   ├── medicine_code: drugId
│   ├── manufacturer: producerName
│   ├── producer_phone: producerPhone
│   ├── receiver_company: receiverCompany
│   ├── info: encryptedString
│   └── clock: Clock object (0x6)
│
├── Sign & Execute:
│   ├── User approves in wallet
│   ├── Transaction submitted to Sui testnet
│   └── Wait for confirmation
│
└── Result: Batch ID returned
```

#### **Bước 6: Xử lý kết quả**
```
Success Flow:
├── ✅ Transaction successful
├── 🔄 Fetch transaction details (retry logic)
├── 📊 Parse object changes
├── 🎯 Extract Batch ID
├── 💾 Store encrypted data & batch ID
└── 🎉 Show success UI with Batch ID

Error Flow:
├── ❌ Transaction failed → Show error
├── ⚠️ No Batch ID found → Fallback ID
└── 🔄 Retry logic for fetching details
```

#### **Bước 7: Chia sẻ thông tin**
```
Post-Transaction Actions:
├── Copy Batch ID
├── Copy Encrypted Data
├── Send to Carrier via email/phone
└── Wait for Carrier confirmation
```

---

### 3. 🚚 CARRIER FLOW - Vận chuyển hàng

#### **Bước 1: Setup Key Pair**
```
Key Management:
├── Navigate: http://localhost:5173/#/carrier
├── Click: "🆕 Tạo Cặp Khóa Mới"
├── Generate: X25519 key pair
├── Display: Public Key (shareable)
├── ⚠️ Save: Private Key (secret)
└── Confirm: "Đã lưu Private Key"
```

#### **Bước 2: Nhận đơn hàng từ Producer**
```
Receive Order:
├── Get Batch ID from Producer
├── Get Encrypted Data from Producer
├── Paste into respective fields
└── Verify data integrity
```

#### **Bước 3: Giải mã thông tin**
```
Decryption Process:
├── Input: Private Key + Encrypted Data
├── Parse: JSON encrypted object
├── Decode: Base64 strings
├── Decrypt: NaCl box.open()
├── Extract: Original address + phone
└── Display: Decrypted delivery information
```

#### **Bước 4: Cập nhật trạng thái vận chuyển**
```
Shipping Update:
├── Fill carrier information:
│   ├── carrier_name: "Giao Hàng Nhanh"
│   ├── carrier_phone: "0987654321"
│   └── delivery_location: "123 Đường ABC..."
│
├── Submit transaction:
│   ├── Call: update_record_shipping()
│   ├── Arguments: batch, carrier_name, carrier_phone, delivery_location
│   └── Gas budget: 200M MIST
│
├── Success: Status = "Đang vận chuyển"
└── Share: Batch ID with Pharmacy
```

---

### 4. 🏥 PHARMACY FLOW - Nhận hàng

#### **Bước 1: Nhận thông tin từ Carrier**
```
Receive Information:
├── Get Batch ID from Carrier
├── Navigate: http://localhost:5173/#/pharmacy
└── Paste Batch ID
```

#### **Bước 2: Điền thông tin nhà thuốc**
```
Pharmacy Information:
├── pharmacy_name: "Nhà thuốc ABC"
├── pharmacy_phone: "0987654321"
└── pharmacy_location: "456 Đường XYZ..."
```

#### **Bước 3: Xác nhận nhận hàng**
```
Delivery Confirmation:
├── Submit transaction:
│   ├── Call: complete_record_delivery()
│   ├── Arguments: batch, pharmacy_name, pharmacy_phone, pharmacy_location
│   └── Gas budget: 200M MIST
│
├── Success: Status = "Đã nhận hàng"
└── Complete: Supply chain workflow
```

---

### 5. 👥 CONSUMER FLOW - Tra cứu thông tin

#### **Bước 1: Truy cập Tracking Page**
```
Navigation:
├── URL: http://localhost:5173/#/tracking
├── No wallet required (public access)
└── Enter Batch ID
```

#### **Bước 2: Tìm kiếm đơn hàng**
```
Search Process:
├── Input: Batch ID (hex format)
├── Validation: 0x[64 hex chars]
├── Query: Sui blockchain
└── Retrieve: MedicineBatch object
```

#### **Bước 3: Hiển thị timeline**
```
Timeline Display:
├── 📦 Created: Producer info + phone
├── 🚚 Shipping: Carrier info + location
├── ✅ Delivered: Pharmacy info + confirmation
└── 🔍 Contact info at each step
```

---

### 6. 🔧 ADMIN FLOW - Quản lý hệ thống

#### **Bước 1: Thêm ví mới**
```
Wallet Management:
├── Edit: constants.ts ALLOWED_WALLETS
├── Add: New wallet address
├── Restart: Development server
└── Verify: New wallet can access system
```

#### **Bước 2: Monitor transactions**
```
Blockchain Monitoring:
├── Check: Transaction digests
├── Verify: Smart contract calls
├── Monitor: Gas usage
└── Debug: Failed transactions
```

---

## 🔄 Exception Flows

### **Wallet Not Connected**
```
Error: "Vui lòng kết nối ví Sui trước!"
Solution: Click "Connect Wallet" → Select Sui wallet → Approve
```

### **Wallet Not Authorized**
```
Error: "Địa chỉ ví không được phép sử dụng hệ thống"
Solution: Contact admin to add wallet to ALLOWED_WALLETS
```

### **Transaction Rejected**
```
Error: "User rejected the request"
Solution: Click transaction button again → Approve in wallet
```

### **Transaction Failed**
```
Error: "Transaction failed: [error message]"
Solutions:
├── Check gas balance
├── Verify input data
├── Retry transaction
└── Check Sui explorer for details
```

### **No Batch ID Found**
```
Warning: "Transaction thành công nhưng không tìm thấy Batch ID"
Solution:
├── Check console logs
├── Use fallback Batch ID for testing
└── Contact developer for debugging
```

---

## 📊 Data Flow Diagram

```
Producer Page
    ↓ Input validation
    ↓ Encryption (NaCl)
    ↓ Transaction creation
    ↓ Wallet signing
    ↓ Sui blockchain
    ↓ Batch ID generation
    ↓ Return to Producer

Batch ID → Carrier Page
    ↓ Decryption (NaCl)
    ↓ Update shipping status
    ↓ Wallet signing
    ↓ Sui blockchain
    ↓ Status = "Shipping"

Batch ID → Pharmacy Page
    ↓ Complete delivery
    ↓ Wallet signing
    ↓ Sui blockchain
    ↓ Status = "Delivered"

Batch ID → Tracking Page
    ↓ Query blockchain
    ↓ Display timeline
    ↓ Show all statuses
```

---

## ⏱️ Performance Expectations

### **Transaction Times**
- **Smart contract call**: 2-5 seconds
- **Transaction confirmation**: 3-10 seconds
- **Batch ID retrieval**: 1-3 seconds (with retry)
- **Decryption**: < 100ms

### **User Experience**
- **Page load**: < 2 seconds
- **Form validation**: Real-time
- **Error feedback**: Immediate
- **Success confirmation**: Clear UI feedback

---

## 🔐 Security Considerations

### **Wallet Security**
- ✅ Address-based authorization
- ✅ Private key never stored on server
- ✅ All transactions require user signature

### **Data Privacy**
- ✅ Sensitive data encrypted before blockchain
- ✅ Only authorized parties can decrypt
- ✅ Public data stored immutably

### **Transaction Security**
- ✅ Gas limits prevent infinite loops
- ✅ Input validation prevents malicious data
- ✅ Smart contract access controls

---

## 🧪 Testing Scenarios

### **Happy Path Testing**
1. ✅ Producer creates order successfully
2. ✅ Carrier decrypts and updates shipping
3. ✅ Pharmacy completes delivery
4. ✅ Consumer views complete timeline

### **Error Path Testing**
1. ❌ Wallet not connected
2. ❌ Wallet not authorized
3. ❌ Invalid input data
4. ❌ Transaction rejection
5. ❌ Network timeout

### **Edge Case Testing**
1. ⚠️ Very long input strings
2. ⚠️ Special characters in names
3. ⚠️ Network connectivity issues
4. ⚠️ Wallet disconnection during transaction

---

## 📈 Success Metrics

### **User Experience**
- ✅ 100% wallet connection success rate
- ✅ < 5% transaction failure rate
- ✅ < 3 seconds average transaction time
- ✅ 100% data encryption/decryption success

### **System Performance**
- ✅ < 2 second page load times
- ✅ < 10 second transaction completion
- ✅ 99.9% uptime
- ✅ 100% data integrity

---

**🎉 MedTrack User Flow - Comprehensive End-to-End Workflow Documentation**

*Version: 1.0.0*
*Last Updated: December 2025*
