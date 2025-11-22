module origin::marketplace {
//    use sui::object;
//    use sui::tx_context;
    use sui::coin;
//    use sui::sui::SUI;
    use sui::event;
    use sui::table;
    
    // ===== Errors =====
    const ENotAuthorized: u64 = 0;
    const EMarketplacePaused: u64 = 1;
    const EInvalidFee: u64 = 2;

    // ===== Structs =====
    
    /// Main marketplace object - shared object
    public struct Marketplace has key {
        id: UID,
        admin: address,
        platform_fee_bps: u64,  // basis points (100 = 1%)
        total_jobs: u64,
        total_volume: u64,
        paused: bool,
        fee_collector: address,
    }

    /// Marketplace capability - admin privileges
    public struct MarketplaceCap has key, store {
        id: UID,
        marketplace_id: ID,
    }

    // ===== Events =====
    
    public struct MarketplaceCreated has copy, drop {
        marketplace_id: ID,
        admin: address,
        platform_fee_bps: u64,
    }

    public struct FeeUpdated has copy, drop {
        marketplace_id: ID,
        old_fee: u64,
        new_fee: u64,
    }

    // ===== Public Functions =====
    
    /// Initialize the marketplace
    public entry fun create_marketplace(
        platform_fee_bps: u64,
        fee_collector: address,
        ctx: &mut TxContext
    ) {
        assert!(platform_fee_bps <= 1000, EInvalidFee); // Max 10%
        
        let marketplace_id = object::new(ctx);
        let marketplace_uid = object::uid_to_inner(&marketplace_id);
        
        let marketplace = Marketplace {
            id: marketplace_id,
            admin: tx_context::sender(ctx),
            platform_fee_bps,
            total_jobs: 0,
            total_volume: 0,
            paused: false,
            fee_collector,
        };
        
        let cap = MarketplaceCap {
            id: object::new(ctx),
            marketplace_id: marketplace_uid,
        };
        
        event::emit(MarketplaceCreated {
            marketplace_id: marketplace_uid,
            admin: tx_context::sender(ctx),
            platform_fee_bps,
        });
        
        transfer::share_object(marketplace);
        transfer::transfer(cap, tx_context::sender(ctx));
    }

    /// Update platform fee (admin only)
    public entry fun update_fee(
        marketplace: &mut Marketplace,
        _cap: &MarketplaceCap,
        new_fee_bps: u64,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == marketplace.admin, ENotAuthorized);
        assert!(new_fee_bps <= 1000, EInvalidFee);
        
        let old_fee = marketplace.platform_fee_bps;
        marketplace.platform_fee_bps = new_fee_bps;
        
        event::emit(FeeUpdated {
            marketplace_id: object::uid_to_inner(&marketplace.id),
            old_fee,
            new_fee: new_fee_bps,
        });
    }

    /// Pause/unpause marketplace
    public entry fun set_paused(
        marketplace: &mut Marketplace,
        _cap: &MarketplaceCap,
        paused: bool,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == marketplace.admin, ENotAuthorized);
        marketplace.paused = paused;
    }

    // ===== Package Functions =====

    public(package) fun increment_jobs(marketplace: &mut Marketplace) {
        marketplace.total_jobs = marketplace.total_jobs + 1;
    }

    public(package) fun add_volume(marketplace: &mut Marketplace, amount: u64) {
        marketplace.total_volume = marketplace.total_volume + amount;
    }

    // ===== Getters =====
    
    public fun get_platform_fee_bps(marketplace: &Marketplace): u64 {
        marketplace.platform_fee_bps
    }

    public fun get_fee_collector(marketplace: &Marketplace): address {
        marketplace.fee_collector
    }

    public fun get_admin(marketplace: &Marketplace): address {
        marketplace.admin
    }

    public fun is_paused(marketplace: &Marketplace): bool {
        marketplace.paused
    }
}
