# 🚚 Hướng Dẫn Cho Carrier - Tạo & Chia Sẻ Public Key

## 🎯 Mục đích
Carrier cần tạo một cặp khóa mã hóa (Public Key + Private Key) để:
- **Public Key**: Chia sẻ với Nhà Sản Xuất để họ mã hóa thông tin địa chỉ và số điện thoại
- **Private Key**: Giữ bí mật để giải mã thông tin khi nhận được từ blockchain

## ✅ Production Mode: Smart Contract đã được deploy

**Smart Contract đã được deploy thành công lên Sui testnet:**

- ✅ **Package ID:** `0x4d111b43d14bbb1c2621644903746929b69dd8b7bd2ad775e9e9c241e0f103e0`
- ✅ **Hoạt động:** Tất cả tính năng blockchain
- ✅ **Transaction:** Có thể cập nhật trạng thái vận chuyển
- ✅ **Batch ID:** Sử dụng ID thật từ blockchain

---

## ⚠️ QUAN TRỌNG: Public Key KHÔNG PHẢI từ Sui Wallet

**Public Key cho mã hóa này KHÔNG PHẢI từ ví Sui (Sui wallet address).**

- ❌ **KHÔNG** lấy từ Sui wallet
- ❌ **KHÔNG** dùng Sui address
- ✅ Phải tạo cặp khóa riêng bằng công cụ trên trang "Vận chuyển"

**Lý do**: 
- Sui wallet sử dụng Ed25519 hoặc ECDSA secp256r1
- Mã hóa trong ứng dụng này sử dụng Ed25519 (tweetnacl library)
- Hai loại khóa này không tương thích với nhau

---

## 📋 Các Bước Tạo & Chia Sẻ Public Key

### **Bước 1: Truy cập trang Vận chuyển**
1. Mở ứng dụng MedTrack
2. Click vào tab **"Vận chuyển"** trên thanh điều hướng
3. Bạn sẽ thấy phần **"🔑 Tạo & Hiển Thị Public Key"** ở đầu trang

---

### **Bước 2: Tạo Cặp Khóa Mới**

#### **Nếu bạn CHƯA có Private Key:**

1. Nhấn nút **"🆕 Tạo Cặp Khóa Mới"**
2. Hệ thống sẽ tự động tạo cặp khóa và hiển thị:

   **🔴 Private Key (màu đỏ - BÍ MẬT):**
   - Hiển thị trong khung màu đỏ
   - **PHẢI LƯU NGAY** vào nơi an toàn
   - Copy bằng nút "📋 Copy Private Key"

   **🔵 Public Key (màu xanh - CÔNG KHAI):**
   - Hiển thị trong khung màu xanh
   - Có thể chia sẻ công khai
   - Copy bằng nút "📋 Copy Public Key"

3. **⚠️ QUAN TRỌNG**:
   - **KHÔNG BAO GIỜ** chia sẻ Private Key với ai
   - Nếu mất Private Key, bạn sẽ **KHÔNG THỂ** giải mã thông tin
   - Hãy lưu Private Key vào password manager hoặc file mã hóa

4. Public Key sẽ hiển thị trong khung màu xanh lá

---

### **Bước 3: Copy Public Key**

1. Public Key sẽ hiển thị trong textarea (khung nhập liệu)
2. Click vào textarea để chọn toàn bộ Public Key
3. Hoặc nhấn nút **"📋 Copy Public Key"** để tự động copy
4. Xác nhận thông báo "✅ Đã copy Public Key vào clipboard!"

---

### **Bước 4: Chia Sẻ Public Key với Nhà Sản Xuất**

1. Gửi Public Key cho Nhà Sản Xuất qua:
   - Email
   - Tin nhắn
   - Hoặc bất kỳ phương thức liên lạc nào

2. **Lưu ý**:
   - ✅ Public Key có thể chia sẻ công khai (không cần bảo mật)
   - ✅ Nhiều người có thể biết Public Key của bạn
   - ⚠️ **KHÔNG BAO GIỜ** chia sẻ Private Key

---

## 🔄 Nếu Bạn ĐÃ CÓ Private Key

Nếu bạn đã có Private Key từ lần tạo trước:

1. Dán Private Key vào ô "Private Key" trong phần "🔐 Giải Mã Địa Chỉ Giao Hàng"
2. Nhấn nút **"🔍 Lấy Public Key từ Private Key"**
3. Hệ thống sẽ tạo cặp khóa mới và hiển thị cả Private Key và Public Key
4. **Quan trọng:** Lưu Private Key mới vào nơi an toàn
5. Copy Public Key và chia sẻ với Nhà Sản Xuất

**⚠️ Lưu ý:** Nút này sẽ tạo cặp khóa MỚI thay thế cặp khóa cũ.

---

## 🔐 Sử Dụng Private Key Để Giải Mã

Sau khi Nhà Sản Xuất đã tạo đơn hàng:

1. Nhận **Batch ID** và **chuỗi mã hóa** từ Nhà Sản Xuất
2. **Bước 1 - Giải mã địa chỉ:**
   - Dán chuỗi mã hóa vào phần "🔐 Giải Mã Địa Chỉ Giao Hàng"
   - Nhập Private Key của bạn
   - Nhấn nút **"🔓 Giải Mã Ngay"**
   - Hệ thống sẽ hiển thị:
     - 📍 Địa chỉ chi tiết
     - 📞 Số điện thoại người nhận

3. **Bước 2 - Cập nhật trạng thái vận chuyển:**
   - Dán Batch ID vào phần "🚚 Cập Nhật Vận Chuyển"
   - Điền thông tin đơn vị vận chuyển và số điện thoại tài xế
   - Nhấn nút **"📦 Xác Nhận Đang Giao Hàng"**
   - Trạng thái đơn hàng sẽ được cập nhật trên blockchain

---

## 📝 Ví Dụ Quy Trình Hoàn Chỉnh

### **Lần đầu sử dụng:**

1. **Carrier**: 
   - Vào trang "Vận chuyển"
   - Nhấn "Tạo Cặp Khóa Mới"
   - Copy Public Key
   - Gửi Public Key cho Nhà Sản Xuất
   - **Lưu Private Key vào nơi an toàn**

2. **Nhà Sản Xuất**:
   - Nhận Public Key từ Carrier
   - Nhập Public Key vào form tạo đơn hàng
   - Điền thông tin địa chỉ và số điện thoại
   - Nhấn "Mã hóa & Gửi lên Blockchain"
   - **Batch ID và chuỗi mã hóa hiển thị trên màn hình**
   - Copy cả hai và gửi cho Carrier

3. **Carrier**:
   - Nhận Batch ID và chuỗi mã hóa từ Nhà Sản Xuất
   - Vào trang "Vận chuyển"
   - **Giải mã:** Dán chuỗi mã hóa và Private Key để xem địa chỉ
   - **Cập nhật:** Dán Batch ID để xác nhận đang giao hàng
   - Trạng thái đơn hàng được cập nhật trên blockchain

---

## ⚠️ Lưu Ý Bảo Mật

1. **Private Key**:
   - ⚠️ **TUYỆT ĐỐI KHÔNG** chia sẻ với ai
   - ⚠️ **TUYỆT ĐỐI KHÔNG** lưu trên máy tính công cộng
   - ✅ Lưu vào password manager hoặc nơi an toàn
   - ✅ Có thể viết ra giấy và cất giữ an toàn

2. **Public Key**:
   - ✅ Có thể chia sẻ công khai
   - ✅ Không cần bảo mật
   - ✅ Có thể dùng lại nhiều lần

3. **Mất Private Key**:
   - ❌ Nếu mất Private Key, bạn sẽ **KHÔNG THỂ** giải mã thông tin
   - ❌ Phải tạo cặp khóa mới và chia sẻ Public Key mới với Nhà Sản Xuất

---

## 🆘 Xử Lý Lỗi

### Lỗi: "Private Key không hợp lệ!"
- **Nguyên nhân**: Private Key sai định dạng hoặc bị thiếu ký tự
- **Giải pháp**: 
  - Kiểm tra lại Private Key đã copy đúng chưa
  - Đảm bảo không có khoảng trắng thừa
  - Nếu không nhớ Private Key, tạo cặp khóa mới

### Lỗi: "Giải mã thất bại!"
- **Nguyên nhân**: 
  - Private Key không khớp với Public Key đã dùng để mã hóa
  - Chuỗi mã hóa bị sai hoặc thiếu
- **Giải pháp**:
  - Kiểm tra lại Private Key có đúng không
  - Kiểm tra lại chuỗi mã hóa đã copy đầy đủ chưa
  - Liên hệ Nhà Sản Xuất để xác nhận

---

## 📞 Hỗ Trợ

Nếu gặp vấn đề:
1. Kiểm tra lại các bước trong hướng dẫn này
2. Đảm bảo đã copy đầy đủ Public Key/Private Key
3. Liên hệ đội kỹ thuật để được hỗ trợ

---

**Chúc bạn sử dụng thành công! 🎉**

