#[test_only]
module medtrack::supply_chain_test {
    use medtrack::supply_chain::{Self, MedicineBatch};
    use sui::test_scenario;
    use sui::clock;

    // Sửa lại địa chỉ ví thành Hex hợp lệ (0-9, A-F)
    const ADMIN: address = @0xA;
    const CARRIER: address = @0xB; 
    const PHARMACY: address = @0xC; 

    #[test]
    fun test_happy_path() {
        let mut scenario = test_scenario::begin(ADMIN);
        let clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));

        // --- STEP 1: ADMIN TẠO ĐƠN ---
        {
            let ctx = test_scenario::ctx(&mut scenario);
            supply_chain::create_order(
                b"MED_001",
                b"PFIZER",
                b"70000",
                b"0909000111",
                &clock,
                ctx
            );
        };

        test_scenario::next_tx(&mut scenario, CARRIER);

        // --- STEP 2: CARRIER UPDATE SHIPPING ---
        {
            let mut batch = test_scenario::take_shared<MedicineBatch>(&scenario);
            let ctx = test_scenario::ctx(&mut scenario);

            assert!(supply_chain::get_status(&batch) == 1, 0);

            supply_chain::update_shipping(
                &mut batch,
                b"GRAB_EXPRESS",
                b"0888999000",
                &clock,
                ctx
            );

            assert!(supply_chain::get_status(&batch) == 2, 0);
            test_scenario::return_shared(batch);
        };

        test_scenario::next_tx(&mut scenario, PHARMACY);

        // --- STEP 3: PHARMACY NHẬN HÀNG ---
        {
            let mut batch = test_scenario::take_shared<MedicineBatch>(&scenario);
            let ctx = test_scenario::ctx(&mut scenario);

            supply_chain::complete_delivery(
                &mut batch,
                b"LONG_CHAU",
                b"18006060",
                &clock,
                ctx
            );

            assert!(supply_chain::get_status(&batch) == 3, 0);
            test_scenario::return_shared(batch);
        };

        clock::destroy_for_testing(clock);
        test_scenario::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = medtrack::supply_chain::EInvalidStatus)]
    fun test_error_flow() {
        let mut scenario = test_scenario::begin(ADMIN);
        let clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));

        // 1. Tạo đơn
        {
            let ctx = test_scenario::ctx(&mut scenario);
            supply_chain::create_order(b"A", b"B", b"C", b"D", &clock, ctx);
        };

        test_scenario::next_tx(&mut scenario, ADMIN);

        // 2. Cố tình Confirm luôn (Sẽ lỗi vì chưa shipping)
        {
            let mut batch = test_scenario::take_shared<MedicineBatch>(&scenario);
            let ctx = test_scenario::ctx(&mut scenario);
            
            supply_chain::complete_delivery(
                &mut batch,
                b"FAIL_TEST",
                b"000",
                &clock,
                ctx
            );
            
            test_scenario::return_shared(batch);
        };

        clock::destroy_for_testing(clock);
        test_scenario::end(scenario);
    }
}