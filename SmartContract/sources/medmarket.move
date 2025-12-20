module medmarket::medicine_market {
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use std::string::{Self, String};
    use std::option::{Self, Option};

    // --- Errors Codes ---
    const EInsufficientPayment: u64 = 0;
    const EInvalidStatus: u64 = 1;
    const ENotAuthorized: u64 = 2;

    // --- Enum States (Mô phỏng bằng u8) ---
    const STATUS_PENDING: u8 = 0;   // Vừa sản xuất, chờ vận chuyển
    const STATUS_SHIPPING: u8 = 1;  // Đang vận chuyển
    const STATUS_DELIVERED: u8 = 2; // Đã nhận và thanh toán

    // --- Structs ---

    // Object chính đại diện cho lô thuốc
    struct MedicineBatch has key, store {
        id: UID,
        price: u64,             // Giá bán (tính bằng MIST)
        seller: address,        // Địa chỉ Nhà sản xuất
        transporter: Option<address>, // Địa chỉ Đơn vị vận chuyển (lúc đầu chưa có)
        buyer: Option<address>,       // Địa chỉ Nhà thuốc (lúc đầu chưa có)
        status: u8,             // Trạng thái hiện tại
        
        // --- Off-chain Data References (Hash/URL từ Walrus) ---
        // Giai đoạn 1: Thông tin sản xuất
        manufacture_ref: String, 
        // Giai đoạn 2: Thông tin vận chuyển (Dùng Option vì lúc đầu chưa có)
        shipping_ref: Option<String>,
        // Giai đoạn 3: Thông tin nhận hàng (Dùng Option vì lúc đầu chưa có)
        receipt_ref: Option<String>,
    }

    // --- Functions ---

    /// Giai đoạn 1: Nhà Sản Xuất tạo đơn hàng (Create Order)
    /// Input: Giá bán, Hash dữ liệu sản xuất từ Walrus
    public entry fun create_order(
        price: u64,
        manufacture_hash: vector<u8>,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);

        let batch = MedicineBatch {
            id: object::new(ctx),
            price: price,
            seller: sender,
            transporter: option::none(),
            buyer: option::none(),
            status: STATUS_PENDING, // Khởi tạo là PENDING
            manufacture_ref: string::utf8(manufacture_hash),
            shipping_ref: option::none(),
            receipt_ref: option::none(),
        };

        // Biến thành Shared Object để Shipper và Buyer có thể tương tác sau này
        transfer::share_object(batch);
    }

    /// Giai đoạn 2: Đơn vị Vận Chuyển xác nhận giao hàng (Transporter)
    /// Input: ID lô thuốc, Hash dữ liệu vận chuyển từ Walrus
    public entry fun transport_order(
        batch: &mut MedicineBatch,
        shipping_hash: vector<u8>,
        ctx: &mut TxContext
    ) {
        // 1. Kiểm tra trạng thái phải là PENDING
        assert!(batch.status == STATUS_PENDING, EInvalidStatus);

        let sender = tx_context::sender(ctx);

        // 2. Cập nhật thông tin
        batch.transporter = option::some(sender);
        batch.shipping_ref = option::some(string::utf8(shipping_hash));
        batch.status = STATUS_SHIPPING; // Chuyển sang SHIPPING
    }

    /// Giai đoạn 3: Nhà Thuốc nhận hàng & Thanh toán (Complete Order)
    /// Input: ID lô thuốc, Coin thanh toán, Hash dữ liệu nhận hàng
    public entry fun complete_order(
        batch: &mut MedicineBatch,
        payment: &mut Coin<SUI>, // Người dùng truyền nguyên object Coin vào
        receipt_hash: vector<u8>,
        ctx: &mut TxContext
    ) {
        // 1. Kiểm tra trạng thái phải là SHIPPING
        assert!(batch.status == STATUS_SHIPPING, EInvalidStatus);

        let price = batch.price;
        let payment_value = coin::value(payment);

        // 2. Kiểm tra tiền
        assert!(payment_value >= price, EInsufficientPayment);

        let sender = tx_context::sender(ctx);

        // 3. Xử lý thanh toán: Tách tiền từ ví người mua chuyển cho Seller
        // Dùng coin::split để lấy đúng số tiền price, phần dư giữ lại trong `payment` object
        let coin_to_transfer = coin::split(payment, price, ctx);
        transfer::public_transfer(coin_to_transfer, batch.seller);

        // 4. Cập nhật thông tin lô thuốc
        batch.buyer = option::some(sender);
        batch.receipt_ref = option::some(string::utf8(receipt_hash));
        batch.status = STATUS_DELIVERED; // Hoàn tất
    }

    // --- Getter Functions (Hỗ trợ Frontend hiển thị nếu cần) ---
    public fun get_batch_info(batch: &MedicineBatch): (u64, u8, String) {
        (batch.price, batch.status, batch.manufacture_ref)
    }
}