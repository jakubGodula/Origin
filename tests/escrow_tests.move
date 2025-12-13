#[test_only]
module origin::escrow_tests {
    use sui::test_scenario::{Self as ts, Scenario};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use origin::escrow::{Self, Escrow};
    use origin::marketplace::{Self, Marketplace};
    use sui::clock::{Self, Clock};

    // Test addresses
    const ADMIN: address = @0xAD;
    const FEE_COLLECTOR: address = @0xFEE;
    const EMPLOYER: address = @0xA1;
    const FREELANCER: address = @0xB1;

    // Helper struct for generic job
    public struct TestJob has key, store {
        id: UID
    }

    #[test]
    fun test_escrow_lifecycle_happy_path() {
        let mut scenario = ts::begin(ADMIN);
        
        // 1. Setup Marketplace
        ts::next_tx(&mut scenario, ADMIN);
        {
            marketplace::create_marketplace(100, FEE_COLLECTOR, ts::ctx(&mut scenario)); // 1% fee
        };

        // 2. Create Escrow
        ts::next_tx(&mut scenario, EMPLOYER);
        {
            let mut marketplace = ts::take_shared<Marketplace>(&scenario);
            let coin = coin::mint_for_testing<SUI>(1000, ts::ctx(&mut scenario));
            
            let job = TestJob { id: object::new(ts::ctx(&mut scenario)) };
            
            let clock = clock::create_for_testing(ts::ctx(&mut scenario));
            
            escrow::create_escrow<TestJob>(
                &mut marketplace,
                &job,
                EMPLOYER,
                FREELANCER,
                coin,
                &clock,
                ts::ctx(&mut scenario)
            );
            
            clock::destroy_for_testing(clock);
            transfer::public_transfer(job, EMPLOYER); // Keep job alive/owned
            ts::return_shared(marketplace);
        };

        // 3. Mark Delivered
        ts::next_tx(&mut scenario, FREELANCER);
        {
            let mut escrow = ts::take_shared<Escrow>(&scenario);
            let clock = clock::create_for_testing(ts::ctx(&mut scenario));
            
            escrow::mark_delivered(
                &mut escrow,
                b"work_oid",
                ts::ctx(&mut scenario)
            );
            
            clock::destroy_for_testing(clock);
            ts::return_shared(escrow);
        };

        // 4. Approve and Release
        ts::next_tx(&mut scenario, EMPLOYER);
        {
            let mut escrow = ts::take_shared<Escrow>(&scenario);
            let mut marketplace = ts::take_shared<Marketplace>(&scenario);
            
            escrow::approve_and_release(
                &mut escrow,
                &marketplace,
                ts::ctx(&mut scenario)
            );
            
            ts::return_shared(escrow);
            ts::return_shared(marketplace);
        };

        // 5. Verify Balances
        ts::next_tx(&mut scenario, FREELANCER);
        {
            // Fee is 1% of 1000 = 10. Freelancer should get 990.
            // Note: create_escrow takes full amount.
            // Fee is deducted at release.
            
            // Freelancer should have a coin object now.
            // Since mint_for_testing doesn't use the same global supply as transferred coins often in tests unless we manage IDs, 
            // but `take_from_address` should work for transferred coins.
            let coin = ts::take_from_address<Coin<SUI>>(&scenario, FREELANCER);
            assert!(coin::value(&coin) == 990, 0);
            ts::return_to_address(FREELANCER, coin);

            // Fee Collector
            let fee_coin = ts::take_from_address<Coin<SUI>>(&scenario, FEE_COLLECTOR);
            assert!(coin::value(&fee_coin) == 10, 1);
            ts::return_to_address(FEE_COLLECTOR, fee_coin);
        };
        
        ts::end(scenario);
    }

    #[test]
    fun test_dispute_split() {
        let mut scenario = ts::begin(ADMIN);
        
        // Setup Marketplace
        ts::next_tx(&mut scenario, ADMIN);
        {
            marketplace::create_marketplace(100, FEE_COLLECTOR, ts::ctx(&mut scenario));
        };

        // Create Escrow
        ts::next_tx(&mut scenario, EMPLOYER);
        {
            let mut marketplace = ts::take_shared<Marketplace>(&scenario);
            let coin = coin::mint_for_testing<SUI>(1000, ts::ctx(&mut scenario));
             let job = TestJob { id: object::new(ts::ctx(&mut scenario)) };
             let clock = clock::create_for_testing(ts::ctx(&mut scenario));
             escrow::create_escrow<TestJob>(
                &mut marketplace,
                &job,
                EMPLOYER,
                FREELANCER,
                coin,
                &clock,
                ts::ctx(&mut scenario)
             );
             clock::destroy_for_testing(clock);
             transfer::public_transfer(job, EMPLOYER); // Keep job alive/owned
             ts::return_shared(marketplace);
        };

        // Initiate Dispute (Employer side)
        ts::next_tx(&mut scenario, EMPLOYER);
        {
            let mut escrow = ts::take_shared<Escrow>(&scenario);
            escrow::initiate_dispute(&mut escrow, ts::ctx(&mut scenario));
            
            assert!(escrow::is_dispute_active(&escrow), 0);
            ts::return_shared(escrow);
        };

        // Admin Resolve Split (50/50 of REMAINDER)
        // Total: 1000. Fee: 10. Remainder: 990.
        // Split 50% (5000 bps) of 990 = 495 each.
        ts::next_tx(&mut scenario, ADMIN);
        {
            let mut escrow = ts::take_shared<Escrow>(&scenario);
            let marketplace = ts::take_shared<Marketplace>(&scenario);
            
            escrow::resolve_dispute_split(
                &mut escrow,
                &marketplace,
                5000, // 50%
                ts::ctx(&mut scenario)
            );
            
            ts::return_shared(escrow);
            ts::return_shared(marketplace);
        };

        // Verify
        ts::next_tx(&mut scenario, ADMIN);
        {
            let fl_coin = ts::take_from_address<Coin<SUI>>(&scenario, FREELANCER);
            assert!(coin::value(&fl_coin) == 495, 1);
            ts::return_to_address(FREELANCER, fl_coin);
            
            let emp_coin = ts::take_from_address<Coin<SUI>>(&scenario, EMPLOYER);
            assert!(coin::value(&emp_coin) == 495, 2);
            ts::return_to_address(EMPLOYER, emp_coin);
        };

        ts::end(scenario);
    }
}
