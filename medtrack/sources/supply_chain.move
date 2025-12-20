module medtrack::supply_chain {
    use std::string::{Self, String};
    use sui::object::{Self, UID, ID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::clock::{Self, Clock};

    // --- Error Codes ---
    const EInvalidStatus: u64 = 1;

    // --- Status Constants ---
    const STATUS_CREATED: u8 = 1;
    const STATUS_SHIPPING: u8 = 2;
    const STATUS_DELIVERED: u8 = 3;

    // --- Structs ---
    public struct MedicineBatch has key {
        id: UID,
        medicine_code: String,
        current_status: u8,
        history: vector<ID>, 
    }

    public struct StatusRecord has key {
        id: UID,
        batch_id: ID,
        status: u8,
        actor: address,
        location_info: String,
        phone: String,
        timestamp: u64,
        note: String
    }

    // --- Functions ---
    // Đã xóa 'entry' để fix warning, chỉ giữ 'public'
    public fun create_order(
        medicine_code_bytes: vector<u8>,
        manufacturer_bytes: vector<u8>,
        postal_code_bytes: vector<u8>,
        sender_phone_bytes: vector<u8>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        let batch_uid = object::new(ctx);
        let batch_id = object::uid_to_inner(&batch_uid);

        let record = StatusRecord {
            id: object::new(ctx),
            batch_id: batch_id,
            status: STATUS_CREATED,
            actor: sender,
            location_info: string::utf8(postal_code_bytes),
            phone: string::utf8(sender_phone_bytes),
            timestamp: clock::timestamp_ms(clock),
            note: string::utf8(manufacturer_bytes)
        };

        let record_id = object::uid_to_inner(&record.id);
        transfer::freeze_object(record);

        // Fix lỗi 'let mut' bằng cách khai báo đúng chuẩn Move 2024
        let mut history_vec = vector::empty<ID>();
        vector::push_back(&mut history_vec, record_id);

        let batch = MedicineBatch {
            id: batch_uid,
            medicine_code: string::utf8(medicine_code_bytes),
            current_status: STATUS_CREATED,
            history: history_vec,
        };

        transfer::share_object(batch);
    }

    public fun update_shipping(
        batch: &mut MedicineBatch,
        carrier_name_bytes: vector<u8>,
        carrier_phone_bytes: vector<u8>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        assert!(batch.current_status == STATUS_CREATED, EInvalidStatus);
        let sender = tx_context::sender(ctx);

        let record = StatusRecord {
            id: object::new(ctx),
            batch_id: object::uid_to_inner(&batch.id),
            status: STATUS_SHIPPING,
            actor: sender,
            location_info: string::utf8(b"On the way"),
            phone: string::utf8(carrier_phone_bytes),
            timestamp: clock::timestamp_ms(clock),
            note: string::utf8(carrier_name_bytes)
        };

        let record_id = object::uid_to_inner(&record.id);
        transfer::freeze_object(record);

        batch.current_status = STATUS_SHIPPING;
        vector::push_back(&mut batch.history, record_id);
    }

    public fun complete_delivery(
        batch: &mut MedicineBatch,
        pharmacy_name_bytes: vector<u8>,
        pharmacy_phone_bytes: vector<u8>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        assert!(batch.current_status == STATUS_SHIPPING, EInvalidStatus);
        let sender = tx_context::sender(ctx);

        let record = StatusRecord {
            id: object::new(ctx),
            batch_id: object::uid_to_inner(&batch.id),
            status: STATUS_DELIVERED,
            actor: sender,
            location_info: string::utf8(pharmacy_name_bytes),
            phone: string::utf8(pharmacy_phone_bytes),
            timestamp: clock::timestamp_ms(clock),
            note: string::utf8(b"Delivered Success")
        };

        let record_id = object::uid_to_inner(&record.id);
        transfer::freeze_object(record);

        batch.current_status = STATUS_DELIVERED;
        vector::push_back(&mut batch.history, record_id);
    }

    public fun get_status(batch: &MedicineBatch): u8 {
        batch.current_status
    }
}