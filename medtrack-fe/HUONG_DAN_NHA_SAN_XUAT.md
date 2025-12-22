# 📋 Hướng Dẫn Sử Dụng Trang Nhà Sản Xuất

## 🎯 Mục đích
Trang Nhà Sản Xuất cho phép bạn tạo đơn hàng mới và mã hóa thông tin nhạy cảm (địa chỉ, số điện thoại) trước khi lưu lên blockchain.

## ✅ Production Mode: Smart Contract đã được deploy

**Smart Contract đã được deploy thành công lên Sui testnet:**

- ✅ **Package ID:** `0x4d111b43d14bbb1c2621644903746929b69dd8b7bd2ad775e9e9c241e0f103e0`
- ✅ **Hoạt động:** Tất cả tính năng blockchain
- ✅ **Batch ID:** Được tạo thực sự trên blockchain
- ✅ **Transaction:** Có thể thực hiện đầy đủ

**Quy trình hoàn chỉnh:**
1. Nhà Sản Xuất tạo đơn hàng → Batch ID thật được tạo
2. Carrier cập nhật trạng thái vận chuyển → Transaction thành công
3. Nhà Thuốc xác nhận nhận hàng → Hoàn thành quy trình

---

## 📝 Các Bước Nhập Thông Tin

### **Bước 1: Thông tin Đơn hàng** 📦

#### 1.1. Mã thuốc (Bắt buộc)
- **Mục đích**: Mã định danh duy nhất cho lô thuốc
- **Ví dụ**: `MED-2024-001`, `DRUG-ABC-123`, `THUOC-2024-05-15`
- **Lưu ý**: 
  - Mã này sẽ được lưu công khai trên blockchain
  - Nên sử dụng mã có quy tắc để dễ quản lý

#### 1.2. Tên Nhà sản xuất (Bắt buộc)
- **Mục đích**: Tên công ty/đơn vị sản xuất thuốc
- **Ví dụ**: `Công ty Dược phẩm ABC`, `Pharma XYZ Co., Ltd`
- **Lưu ý**: Thông tin này công khai trên blockchain

---

### **Bước 2: Thông tin Vận chuyển** 🚚

#### 2.1. Tên Công ty nhận hàng (Bắt buộc)
- **Mục đích**: Tên đơn vị sẽ nhận hàng (nhà thuốc, công ty logistics)
- **Ví dụ**: 
  - `Nhà thuốc Long Châu - Chi nhánh Quận 1`
  - `Công ty Vận chuyển Giao Hàng Nhanh`
- **Lưu ý**: 
  - ✅ Thông tin này **CÔNG KHAI** trên blockchain
  - ✅ Mọi người có thể xem được

#### 2.2. Địa chỉ chi tiết (Bắt buộc - Sẽ được mã hóa) ⚠️
- **Mục đích**: Địa chỉ giao hàng chi tiết
- **Ví dụ**: 
  - `123 Đường Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM`
  - `Số 45, Ngõ 12, Phố ABC, Phường XYZ, Quận Đống Đa, Hà Nội`
- **Lưu ý**: 
  - ⚠️ Thông tin này sẽ được **MÃ HÓA** bằng Public Key của Carrier
  - 🔐 Chỉ có Carrier mới giải mã được
  - 📍 Nên nhập đầy đủ để Carrier dễ tìm địa chỉ

#### 2.3. Số điện thoại người nhận (Bắt buộc - Sẽ được mã hóa) ⚠️
- **Mục đích**: Số điện thoại liên hệ người nhận hàng
- **Ví dụ**: `0901234567`, `0987654321`, `+84901234567`
- **Lưu ý**: 
  - ⚠️ Thông tin này sẽ được **MÃ HÓA** bằng Public Key của Carrier
  - 🔐 Chỉ có Carrier mới giải mã được
  - 📞 Nên nhập đúng định dạng số điện thoại Việt Nam

---

### **Bước 3: Khóa bảo mật** 🔑

#### 3.1. Public Key của Carrier (Bắt buộc)
- **Mục đích**: Dùng để mã hóa thông tin địa chỉ và số điện thoại
- **⚠️ QUAN TRỌNG**: Public Key này **KHÔNG PHẢI** từ Sui wallet (ví Sui). Đây là một cặp khóa mã hóa riêng được tạo bằng `tweetnacl` (Ed25519).

- **Cách lấy Public Key từ Carrier**:

  **Phương án 1: Carrier tự tạo trên trang Vận chuyển (Khuyến nghị)**
  1. Carrier vào trang **"Vận chuyển"** trên ứng dụng
  2. Nhấn nút **"🆕 Tạo Cặp Khóa Mới"**
  3. Hệ thống sẽ hiển thị:
     - **🔴 Private Key (màu đỏ)**: Carrier PHẢI lưu vào nơi an toàn
     - **🔵 Public Key (màu xanh)**: Có thể chia sẻ công khai
  4. Carrier nhấn nút **"📋 Copy Public Key"** để copy Public Key
  5. Carrier gửi Public Key này cho bạn (Nhà Sản Xuất)

  **Phương án 2: Carrier đã có Private Key**
  1. Carrier vào trang **"Vận chuyển"**
  2. Nhập Private Key của họ vào ô "Private Key"
  3. Nhấn nút **"🔍 Lấy Public Key từ Private Key"**
  4. Hệ thống sẽ hiển thị Public Key tương ứng
  5. Carrier copy và gửi cho bạn

- **Định dạng Public Key**:
  - Public Key là một chuỗi hex dài (thường khoảng 130 ký tự)
  - Không có prefix `0x`
  - Ví dụ Public Key:
    ```
    04a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2
    ```

- **Lưu ý**: 
  - 🔐 Chỉ có Carrier mới có Private Key tương ứng để giải mã
  - ✅ Đảm bảo copy đúng toàn bộ Public Key (không thiếu ký tự, không có khoảng trắng)
  - ⚠️ Nếu Public Key sai, việc mã hóa sẽ thất bại
  - ⚠️ Public Key này **KHÔNG LIÊN QUAN** đến Sui wallet address
  - ✅ Mỗi Carrier nên có một cặp khóa riêng để bảo mật

---

## ✅ Kiểm tra Trước Khi Gửi

Trước khi nhấn nút **"🔒 Mã hóa & Gửi lên Blockchain"**, hãy đảm bảo:

- [ ] Đã nhập đầy đủ **Mã thuốc**
- [ ] Đã nhập đầy đủ **Tên Nhà sản xuất**
- [ ] Đã nhập đầy đủ **Tên Công ty nhận hàng**
- [ ] Đã nhập đầy đủ **Địa chỉ chi tiết**
- [ ] Đã nhập đầy đủ **Số điện thoại người nhận**
- [ ] Đã nhập đầy đủ **Public Key của Carrier**
- [ ] Đã kiểm tra lại tất cả thông tin đã chính xác

---

## 🔄 Quy Trình Xử Lý

Khi bạn nhấn nút **"🔒 Mã hóa & Gửi lên Blockchain"**:

1. **Kiểm tra**: Hệ thống kiểm tra tất cả các trường bắt buộc
2. **Mã hóa**:
   - Gom địa chỉ và số điện thoại thành object
   - Mã hóa bằng Public Key của Carrier
   - Chuyển thành chuỗi để lưu trên blockchain
3. **Hiển thị kết quả**:
   - Batch ID và chuỗi mã hóa hiển thị trên màn hình
   - Copy cả Batch ID và chuỗi mã hóa để gửi cho Carrier
4. **Gửi lên Blockchain** (tương lai):
   - Gửi thông tin công khai (Mã thuốc, Tên nhà sản xuất, Tên công ty nhận)
   - Gửi thông tin đã mã hóa (Địa chỉ, Số điện thoại)

---

## ⚠️ Lưu Ý Quan Trọng

1. **Bảo mật**: 
   - ⚠️ Địa chỉ và số điện thoại sẽ được mã hóa, chỉ Carrier mới giải mã được
   - ✅ Tên công ty nhận sẽ công khai trên blockchain

2. **Public Key**: 
   - ⚠️ Phải lấy đúng Public Key từ Carrier
   - ⚠️ Nếu Public Key sai, việc mã hóa sẽ thất bại
   - ✅ Copy toàn bộ Public Key, không được thiếu ký tự

3. **Thông tin**: 
   - ✅ Nhập đầy đủ và chính xác để tránh sai sót
   - ✅ Kiểm tra lại trước khi gửi

---

## 🆘 Xử Lý Lỗi

### Lỗi: "Vui lòng nhập Public Key của Carrier để mã hóa!"
- **Nguyên nhân**: Chưa nhập Public Key
- **Giải pháp**: Nhập Public Key của Carrier vào ô "Public Key của Carrier"

### Lỗi: "Có lỗi khi mã hóa dữ liệu (Kiểm tra lại Public Key)"
- **Nguyên nhân**: Public Key không đúng định dạng hoặc bị sai
- **Giải pháp**: 
  1. Kiểm tra lại Public Key đã copy đúng chưa
  2. Liên hệ lại Carrier để lấy Public Key mới
  3. Đảm bảo Public Key không có khoảng trắng thừa

### Nút "Mã hóa & Gửi lên Blockchain" bị vô hiệu hóa (màu xám)
- **Nguyên nhân**: Còn thiếu thông tin bắt buộc
- **Giải pháp**: Điền đầy đủ tất cả các trường có dấu <span style="color: red;">*</span>

---

## 📞 Hỗ Trợ

Nếu gặp vấn đề, vui lòng:
1. Kiểm tra lại tất cả thông tin đã nhập
2. Xem lại hướng dẫn này
3. Liên hệ đội kỹ thuật để được hỗ trợ

---

**Chúc bạn sử dụng thành công! 🎉**

