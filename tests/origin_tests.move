#[test_only]
module origin::marketplace_tests {
    use sui::test_scenario::{Self as ts, Scenario};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use origin::marketplace::{Self, Marketplace, MarketplaceCap};

    // Test addresses
    const ADMIN: address = @0xAD;
    const FEE_COLLECTOR: address = @0xFEE;
    const USER1: address = @0xA1;

    #[test]
    fun test_create_marketplace() {
        let mut scenario = ts::begin(ADMIN);
        
        // Create marketplace
        ts::next_tx(&mut scenario, ADMIN);
        {
            marketplace::create_marketplace(
                200, // 2% fee
                FEE_COLLECTOR,
                ts::ctx(&mut scenario)
            );
        };
        
        // Verify marketplace was created and shared
        ts::next_tx(&mut scenario, ADMIN);
        {
            let marketplace = ts::take_shared<Marketplace>(&scenario);
            
            assert!(marketplace::get_platform_fee_bps(&marketplace) == 200, 0);
            assert!(marketplace::get_fee_collector(&marketplace) == FEE_COLLECTOR, 1);
            assert!(!marketplace::is_paused(&marketplace), 2);
            
            ts::return_shared(marketplace);
        };
        
        // Verify admin received capability
        ts::next_tx(&mut scenario, ADMIN);
        {
            let cap = ts::take_from_sender<MarketplaceCap>(&scenario);
            ts::return_to_sender(&scenario, cap);
        };
        
        ts::end(scenario);
    }

    #[test]
    fun test_update_fee() {
        let mut scenario = ts::begin(ADMIN);
        
        // Create marketplace
        ts::next_tx(&mut scenario, ADMIN);
        {
            marketplace::create_marketplace(
                200,
                FEE_COLLECTOR,
                ts::ctx(&mut scenario)
            );
        };
        
        // Update fee
        ts::next_tx(&mut scenario, ADMIN);
        {
            let mut marketplace = ts::take_shared<Marketplace>(&scenario);
            let cap = ts::take_from_sender<MarketplaceCap>(&scenario);
            
            marketplace::update_fee(
                &mut marketplace,
                &cap,
                300, // 3% fee
                ts::ctx(&mut scenario)
            );
            
            assert!(marketplace::get_platform_fee_bps(&marketplace) == 300, 0);
            
            ts::return_shared(marketplace);
            ts::return_to_sender(&scenario, cap);
        };
        
        ts::end(scenario);
    }

    #[test]
    fun test_pause_marketplace() {
        let mut scenario = ts::begin(ADMIN);
        
        // Create marketplace
        ts::next_tx(&mut scenario, ADMIN);
        {
            marketplace::create_marketplace(200, FEE_COLLECTOR, ts::ctx(&mut scenario));
        };
        
        // Pause marketplace
        ts::next_tx(&mut scenario, ADMIN);
        {
            let mut marketplace = ts::take_shared<Marketplace>(&scenario);
            let cap = ts::take_from_sender<MarketplaceCap>(&scenario);
            
            marketplace::set_paused(&mut marketplace, &cap, true, ts::ctx(&mut scenario));
            assert!(marketplace::is_paused(&marketplace), 0);
            
            ts::return_shared(marketplace);
            ts::return_to_sender(&scenario, cap);
        };
        
        ts::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = origin::marketplace::EInvalidFee)]
    fun test_create_marketplace_invalid_fee() {
        let mut scenario = ts::begin(ADMIN);
        
        ts::next_tx(&mut scenario, ADMIN);
        {
            marketplace::create_marketplace(
                1500, // 15% - too high
                FEE_COLLECTOR,
                ts::ctx(&mut scenario)
            );
        };
        
        ts::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = origin::marketplace::ENotAuthorized)]
    fun test_update_fee_unauthorized() {
        let mut scenario = ts::begin(ADMIN);
        
        // Create marketplace as ADMIN
        ts::next_tx(&mut scenario, ADMIN);
        {
            marketplace::create_marketplace(200, FEE_COLLECTOR, ts::ctx(&mut scenario));
        };
        
        // Try to update fee as USER1 (should fail)
        ts::next_tx(&mut scenario, USER1);
        {
            let mut marketplace = ts::take_shared<Marketplace>(&scenario);
            let cap = ts::take_from_address<MarketplaceCap>(&scenario, ADMIN);
            
            marketplace::update_fee(&mut marketplace, &cap, 300, ts::ctx(&mut scenario));
            
            ts::return_shared(marketplace);
            ts::return_to_address(ADMIN, cap);
        };
        
        ts::end(scenario);
    }
}
