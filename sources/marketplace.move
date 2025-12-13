module origin::marketplace {
//    use sui::object;
//    use sui::tx_context;
    use sui::coin;
//    use sui::sui::SUI;
    use sui::event;
    use sui::table;
    use std::string::String;
    
    // ===== Errors =====
    const ENotAuthorized: u64 = 0;
    const EMarketplacePaused: u64 = 1;
    const EInvalidFee: u64 = 2;

    // ===== Structs =====
    
    /// Main marketplace object - shared object
    public struct Marketplace has key {
        id: UID,
        admin: address,  // Original creator (primary super admin)
        super_admins: table::Table<address, bool>,  // Additional super admins
        admins: table::Table<address, bool>,  // Regular admins
        moderators: table::Table<address, vector<String>>,  // Moderators with their languages
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

    public struct AdminAdded has copy, drop {
        marketplace_id: ID,
        admin: address,
        added_by: address,
    }

    public struct AdminRemoved has copy, drop {
        marketplace_id: ID,
        admin: address,
        removed_by: address,
    }

    public struct SuperAdminPromoted has copy, drop {
        marketplace_id: ID,
        admin: address,
        promoted_by: address,
    }

    public struct SuperAdminDemoted has copy, drop {
        marketplace_id: ID,
        admin: address,
        demoted_by: address,
    }

    public struct ModeratorAdded has copy, drop {
        marketplace_id: ID,
        moderator: address,
        languages: vector<String>,
        added_by: address,
    }

    public struct ModeratorRemoved has copy, drop {
        marketplace_id: ID,
        moderator: address,
        removed_by: address,
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
            super_admins: table::new(ctx),
            admins: table::new(ctx),
            moderators: table::new(ctx),
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

    /// Update platform fee (super admins only)
    public entry fun update_fee(
        marketplace: &mut Marketplace,
        _cap: &MarketplaceCap,
        new_fee_bps: u64,
        ctx: &mut TxContext
    ) {
        // Only super admins can update fees
        assert!(is_super_admin(marketplace, tx_context::sender(ctx)), ENotAuthorized);
        assert!(new_fee_bps <= 1000, EInvalidFee); // Max 10%
        
        let old_fee = marketplace.platform_fee_bps;
        marketplace.platform_fee_bps = new_fee_bps;
        
        event::emit(FeeUpdated {
            marketplace_id: object::uid_to_inner(&marketplace.id),
            old_fee,
            new_fee: new_fee_bps,
        });
    }

    /// Pause or unpause marketplace (super admins only)
    public entry fun set_paused(
        marketplace: &mut Marketplace,
        _cap: &MarketplaceCap,
        paused: bool,
        ctx: &mut TxContext
    ) {
        // Only super admins can pause/unpause
        assert!(is_super_admin(marketplace, tx_context::sender(ctx)), ENotAuthorized);
        marketplace.paused = paused;
    }

    /// Add a new admin (super admin only)
    public entry fun add_admin(
        marketplace: &mut Marketplace,
        _cap: &MarketplaceCap,
        new_admin: address,
        ctx: &mut TxContext
    ) {
        // Only the super admin can add new admins
        assert!(tx_context::sender(ctx) == marketplace.admin, ENotAuthorized);
        
        table::add(&mut marketplace.admins, new_admin, true);
        
        event::emit(AdminAdded {
            marketplace_id: object::uid_to_inner(&marketplace.id),
            admin: new_admin,
            added_by: tx_context::sender(ctx),
        });
    }

    /// Remove an admin (super admin only)
    public entry fun remove_admin(
        marketplace: &mut Marketplace,
        _cap: &MarketplaceCap,
        admin_to_remove: address,
        ctx: &mut TxContext
    ) {
        // Only the super admin can remove admins
        assert!(tx_context::sender(ctx) == marketplace.admin, ENotAuthorized);
        // Cannot remove the super admin
        assert!(admin_to_remove != marketplace.admin, ENotAuthorized);
        
        table::remove(&mut marketplace.admins, admin_to_remove);
        
        event::emit(AdminRemoved {
            marketplace_id: object::uid_to_inner(&marketplace.id),
            admin: admin_to_remove,
            removed_by: tx_context::sender(ctx),
        });
    }

    /// Promote an admin to super admin (any super admin can do this)
    public entry fun promote_to_super_admin(
        marketplace: &mut Marketplace,
        _cap: &MarketplaceCap,
        admin_to_promote: address,
        ctx: &mut TxContext
    ) {
        // Only super admins can promote
        assert!(is_super_admin(marketplace, tx_context::sender(ctx)), ENotAuthorized);
        // Cannot promote the primary admin (already super admin)
        assert!(admin_to_promote != marketplace.admin, ENotAuthorized);
        
        table::add(&mut marketplace.super_admins, admin_to_promote, true);
        
        event::emit(SuperAdminPromoted {
            marketplace_id: object::uid_to_inner(&marketplace.id),
            admin: admin_to_promote,
            promoted_by: tx_context::sender(ctx),
        });
    }

    /// Demote a super admin to regular admin (any super admin can do this, except themselves)
    public entry fun demote_from_super_admin(
        marketplace: &mut Marketplace,
        _cap: &MarketplaceCap,
        admin_to_demote: address,
        ctx: &mut TxContext
    ) {
        // Only super admins can demote
        assert!(is_super_admin(marketplace, tx_context::sender(ctx)), ENotAuthorized);
        // Cannot demote the primary admin
        assert!(admin_to_demote != marketplace.admin, ENotAuthorized);
        // Cannot demote yourself
        assert!(admin_to_demote != tx_context::sender(ctx), ENotAuthorized);
        
        table::remove(&mut marketplace.super_admins, admin_to_demote);
        
        event::emit(SuperAdminDemoted {
            marketplace_id: object::uid_to_inner(&marketplace.id),
            admin: admin_to_demote,
            demoted_by: tx_context::sender(ctx),
        });
    }

    /// Add a moderator (admins only)
    public entry fun add_moderator(
        marketplace: &mut Marketplace,
        _cap: &MarketplaceCap,
        moderator: address,
        languages: vector<String>,
        ctx: &mut TxContext
    ) {
        // Only admins or super admins can add moderators
        assert!(is_super_admin(marketplace, tx_context::sender(ctx)) || 
                table::contains(&marketplace.admins, tx_context::sender(ctx)), ENotAuthorized);
        
        
        table::add(&mut marketplace.moderators, moderator, languages);
        
        event::emit(ModeratorAdded {
            marketplace_id: object::uid_to_inner(&marketplace.id),
            moderator,
            languages,
            added_by: tx_context::sender(ctx),
        });
    }

    /// Remove a moderator (admins only)
    public entry fun remove_moderator(
        marketplace: &mut Marketplace,
        _cap: &MarketplaceCap,
        moderator: address,
        ctx: &mut TxContext
    ) {
        // Only admins or super admins can remove moderators
        assert!(is_super_admin(marketplace, tx_context::sender(ctx)) || 
                table::contains(&marketplace.admins, tx_context::sender(ctx)), ENotAuthorized);
        
        table::remove(&mut marketplace.moderators, moderator);
        
        event::emit(ModeratorRemoved {
            marketplace_id: object::uid_to_inner(&marketplace.id),
            moderator,
            removed_by: tx_context::sender(ctx),
        });
    }

    /// Update moderator languages (admins only)
    public entry fun update_moderator_languages(
        marketplace: &mut Marketplace,
        _cap: &MarketplaceCap,
        moderator: address,
        new_languages: vector<String>,
        ctx: &mut TxContext
    ) {
        // Only admins or super admins can update moderators
        assert!(is_super_admin(marketplace, tx_context::sender(ctx)) || 
                table::contains(&marketplace.admins, tx_context::sender(ctx)), ENotAuthorized);
        
        // Check if moderator exists
        assert!(table::contains(&marketplace.moderators, moderator), ENotAuthorized);
        
        // Update languages
        *table::borrow_mut(&mut marketplace.moderators, moderator) = new_languages;
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

    /// Check if an address is a super admin (primary admin or in super_admins table)
    public fun is_super_admin(marketplace: &Marketplace, addr: address): bool {
        if (addr == marketplace.admin) {
            return true
        };
        table::contains(&marketplace.super_admins, addr)
    }

    /// Check if an address is an admin (super admin or regular admin)
    public fun is_admin(marketplace: &Marketplace, addr: address): bool {
        // First check if super admin
        if (is_super_admin(marketplace, addr)) {
            return true
        };
        // Then check if regular admin
        table::contains(&marketplace.admins, addr)
    }

    /// Check if an address is a moderator
    public fun is_moderator(marketplace: &Marketplace, addr: address): bool {
        table::contains(&marketplace.moderators, addr)
    }

    /// Get languages for a moderator
    public fun get_moderator_languages(marketplace: &Marketplace, moderator: address): vector<String> {
        if (!table::contains(&marketplace.moderators, moderator)) {
            return vector::empty()
        };
        *table::borrow(&marketplace.moderators, moderator)
    }
}
