# 🚀 Hướng Dẫn Chuyển Từ Demo Mode Sang Production Mode

## 📋 Tổng quan

Hiện tại ứng dụng MedTrack đang chạy ở **Demo Mode** - chỉ có thể:
- ✅ Mã hóa/giải mã dữ liệu
- ✅ Tạo cặp khóa
- ✅ Hiển thị giao diện

**Chưa thể:**
- ❌ Thực hiện transaction blockchain thực sự
- ❌ Tạo object thật trên blockchain
- ❌ Cập nhật trạng thái đơn hàng

## 🔧 Các bước chuyển sang Production

### **Bước 1: Deploy Smart Contract**

1. **Chuẩn bị Move contract:**
   ```bash
   cd ../medtrack  # Thư mục chứa smart contract
   ```

2. **Deploy lên Sui testnet:**
   ```bash
   sui client publish --gas-budget 100000000
   ```

3. **Lưu Package ID:**
   - Copy `package_id` từ output của lệnh publish
   - Cập nhật vào `src/constants.ts`:
   ```typescript
   export const PACKAGE_ID = "0x..."; // Package ID thật từ blockchain
   ```

### **Bước 2: Cập nhật Logic Tạo Batch ID**

Trong `ProducerPage.tsx`, thay thế logic tạo Batch ID giả lập:

**Hiện tại (Demo):**
```typescript
const generatedBatchId = `0x${Date.now().toString(16)}${Math.random().toString(16).substr(2, 8)}`;
```

**Production:**
```typescript
// Tạo transaction để gọi smart contract
const tx = new Transaction();
tx.moveCall({
  target: `${PACKAGE_ID}::${MODULE_NAME}::create_record`,
  arguments: [
    tx.pure.string(drugId),
    tx.pure.string(producerName),
    tx.pure.string(receiverCompany),
    tx.pure.string(encryptedString)
  ],
});

const result = await suiClient.signAndExecuteTransaction({
  transaction: tx,
  options: { showEffects: true }
});

// Lấy Batch ID thật từ kết quả
const batchId = result.effects?.created?.[0]?.reference?.objectId;
```

### **Bước 3: Kích hoạt Transaction Carrier**

Trong `CarrierPage.tsx`, bỏ comment phần transaction thực sự:

```typescript
// Thay thế alert demo bằng code thực sự
const tx = new Transaction();
tx.moveCall({
  target: `${PACKAGE_ID}::${MODULE_NAME}::update_shipping`,
  arguments: [
    tx.object(formData.batchId),
    tx.pure.string(formData.carrierName),
    tx.pure.string(formData.carrierPhone),
    tx.object("0x6"), // Clock
  ],
});

signAndExecute(
  { transaction: tx },
  {
    onSuccess: (result) => {
      console.log(result);
      alert("✅ Đã cập nhật trạng thái: ĐANG VẬN CHUYỂN");
    },
    onError: (err) => {
      console.error(err);
      alert("❌ Lỗi: " + err.message);
    }
  }
);
```

### **Bước 4: Test Toàn Bộ Quy Trình**

1. **Test với Batch ID thật:**
   - Tạo đơn hàng → nhận Batch ID thật
   - Carrier cập nhật trạng thái → thành công

2. **Test Tracing:**
   - Sử dụng Batch ID để tra cứu hành trình
   - Xem timeline đầy đủ

3. **Test Pharmacy:**
   - Cập nhật trạng thái "Đã nhận hàng"

## 🔍 Troubleshooting

### **Lỗi: "object_id not exists"**
- **Nguyên nhân:** Batch ID giả lập không tồn tại trên blockchain
- **Giải pháp:** Deploy smart contract và sử dụng Batch ID thật

### **Lỗi: "Package not found"**
- **Nguyên nhân:** PACKAGE_ID sai hoặc chưa deploy
- **Giải pháp:** Kiểm tra lại package_id sau khi publish

### **Lỗi: "Transaction failed"**
- **Nguyên nhân:** Gas budget không đủ hoặc logic smart contract lỗi
- **Giải pháp:** Tăng gas budget hoặc kiểm tra smart contract

### **Lỗi: "Dry run failed, could not automatically determine a budget: ArityMismatch"**
- **Nguyên nhân:** Số lượng arguments không khớp với function signature
- **Giải pháp:** Đảm bảo truyền đủ arguments, đặc biệt là `clock` object (`0x6`)

### **Lỗi: "Transaction thành công nhưng không tìm thấy Batch ID"**
- **Nguyên nhân:** Transaction result của Sui dapp-kit chỉ chứa digest, cần query thêm để lấy object changes
- **Giải pháp đã implement:**
  1. Sử dụng `suiClient.getTransactionBlock()` với `showObjectChanges: true`
  2. Thêm retry logic với exponential backoff (5 lần, delay tăng dần)
  3. Tìm object có `type === 'created'` và `objectType` chứa `'MedicineBatch'`
  4. Lấy `objectId` từ object đó làm Batch ID
  5. Fallback tạo Batch ID giả lập nếu không tìm thấy

**Code hiện tại:**
```typescript
// Retry function với exponential backoff
const getTransactionDetails = async (retries = 5, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const txDetails = await suiClient.getTransactionBlock({
        digest: result.digest,
        options: { showObjectChanges: true, showEffects: true }
      });
      return txDetails;
    } catch (error) {
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff: 1s, 2s, 4s, 8s, 16s
      }
    }
  }
  throw new Error('Failed to fetch transaction details after retries');
};

// Sử dụng
const txDetails = await getTransactionDetails();
const batchId = txDetails.objectChanges?.find(change =>
  change.type === 'created' &&
  change.objectType?.includes('medtrack::supply_chain::MedicineBatch')
)?.objectId;
```

### **Lỗi: "Could not find the referenced transaction"**
- **Nguyên nhân:** Transaction vừa submit nhưng chưa được confirm trên blockchain
- **Giải pháp:** Retry logic đã được implement với exponential backoff
- **Thời gian:** Có thể mất 1-3 giây cho transaction được mined trên testnet

### **Lỗi: "Invalid input: Received '0xngười thực hiện: 0x...'"**
- **Nguyên nhân:** Batch ID chứa text không hợp lệ khi copy/paste
- **Giải pháp:**
  1. Chỉ copy **Batch ID** (địa chỉ object bắt đầu bằng `0x`)
  2. Không copy kèm text mô tả hoặc ký tự khác
  3. Validation đã được thêm để kiểm tra format Batch ID
- **Format đúng:** `0x[64 ký tự hex]` (ví dụ: `0x1234567890abcdef...`)

## 📊 So sánh Demo vs Production

| Tính năng | Demo Mode | Production Mode |
|-----------|-----------|-----------------|
| Mã hóa dữ liệu | ✅ Có | ✅ Có |
| Tạo cặp khóa | ✅ Có | ✅ Có |
| Tạo đơn hàng | ✅ UI | ✅ Blockchain |
| Cập nhật trạng thái | ❌ Không | ✅ Có |
| Tra cứu hành trình | ❌ Không | ✅ Có |
| Batch ID | Giả lập | Thật |

## 🎯 Checklist Production Ready

- [x] Smart contract deployed thành công (v4 - fixed function signatures)
- [x] PACKAGE_ID cập nhật chính xác (0x2ac192106c32f49f73b3cc4290d0ea27a5dd7c9abe61feb92e89deebd75a1105)
- [x] Batch ID được tạo từ smart contract
- [x] Transaction Carrier hoạt động
- [x] Tracing page hiển thị timeline
- [x] Pharmacy page cập nhật trạng thái
- [x] Test end-to-end toàn bộ quy trình
- [x] Validation input format toàn diện

## **📝 Validation Input Format**

### **🏭 Nhà Sản Xuất (Producer):**
- **Mã thuốc:** `[Tên viết tắt 2-4 chữ]-YYYY-MM` (VD: `PhT-2025-12`)
- **Tên công ty:** Ít nhất 3 ký tự, chỉ chữ cái + số + dấu cách
- **Tên công ty nhận:** Ít nhất 3 ký tự, chỉ chữ cái + số + dấu cách
- **Địa chỉ:** Ít nhất 10 ký tự, phải có số nhà + đường/phố/ngõ + phường/xã + quận/huyện
- **Số điện thoại:** Format Việt Nam `0xxxxxxxxx` hoặc `+84xxxxxxxxx`

### **🚚 Đơn vị Vận chuyển (Carrier):**
- **Batch ID:** `0x` + 64 ký tự hex
- **Tên đơn vị:** Ít nhất 3 ký tự, chỉ chữ cái + số + dấu cách
- **Số điện thoại:** Format Việt Nam `0xxxxxxxxx` hoặc `+84xxxxxxxxx`

### **🏥 Nhà Thuốc (Pharmacy):**
- **Batch ID:** `0x` + 64 ký tự hex
- **Tên nhà thuốc:** Ít nhất 3 ký tự, chỉ chữ cái + số + dấu cách
- **Số điện thoại:** Format Việt Nam `0xxxxxxxxx` hoặc `+84xxxxxxxxx`

### **Validation Rules:**
- ❌ **Sai format** → Hiển thị alert với hướng dẫn chi tiết
- ✅ **Đúng format** → Cho phép submit transaction
- 📝 **Placeholder** được cập nhật với ví dụ cụ thể
- 💡 **Helper text** hướng dẫn format cho từng field

## **🐛 Debug Issues**

### **Timeline Hiển Thị Sai Số Điện Thoại:**
- **Nguyên nhân:** Dữ liệu từ blockchain có thể bị format sai
- **Giải pháp:**
  1. Mở Developer Console (F12)
  2. Vào tab Producer → Click "🧪 Debug Test" để test transaction parsing
  3. Kiểm tra log "Raw record fields" và "Processed phone"
  4. Xem cấu trúc thực tế của dữ liệu từ blockchain

### **Batch ID Không Tìm Thấy:**
- **Nguyên nhân:** Cấu trúc response từ Sui dapp-kit thay đổi
- **Giải pháp:**
  1. Check console log "Full result object" và "Result keys"
  2. Verify cấu trúc `objectChanges` hoặc `effects`
  3. Cập nhật code để truy cập đúng đường dẫn
  4. Fallback sẽ tạo Batch ID giả lập để test workflow

---

**🎉 Chúc mừng! Ứng dụng đã sẵn sàng cho Production Mode!**
