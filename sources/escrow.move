module origin::escrow {
//    use sui::object_bag;
//    use sui::transfer;
//    use sui::tx_context;
    // ===== Imports =====
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::balance::{Self, Balance};
    use sui::event;
    use origin::marketplace::{Self, Marketplace};
    use origin::listing;
    use std::string::{Self, String};

    // ===== Errors =====
    const ENotAuthorized: u64 = 0;
    const EWrongAmount: u64 = 1;
    const EAlreadyReleased: u64 = 2;
    const ENotReadyForRelease: u64 = 3;
    const EDisputeActive: u64 = 5;

    // ===== Structs =====
    
    /// Escrow object holding funds
    public struct Escrow has key, store {
        id: UID,
        job_id: ID,
        employer: address,
        freelancer: address,
        amount: Balance<SUI>,
        platform_fee: u64,
        released: bool,
        employer_approved: bool,
        freelancer_delivered: bool,
        dispute_active: bool,
        work_oid: Option<String>,
        created_at: u64,
    }

    // ===== Events =====
    
    public struct EscrowCreated has copy, drop {
        escrow_id: ID,
        job_id: ID,
        amount: u64,
    }

    public struct WorkDelivered has copy, drop {
        escrow_id: ID,
        freelancer: address,
    }

    public struct PaymentReleased has copy, drop {
        escrow_id: ID,
        freelancer: address,
        amount: u64,
        platform_fee: u64,
    }

    public struct DisputeStarted has copy, drop {
        escrow_id: ID,
        initiator: address,
    }

    public struct DisputeResolved has copy, drop {
        escrow_id: ID,
        winner: address,
        amount: u64,
    }

    public struct DisputeResolvedSplit has copy, drop {
        escrow_id: ID,
        freelancer_share: u64,
        employer_share: u64,
    }

    // ===== Public Functions =====
    
    use origin::employer; // Added import

    // ...

    /// Create escrow and lock funds
    public entry fun create_escrow<T: key + store>(
        marketplace: &mut Marketplace,
        _employer_profile: &employer::EmployerProfile, // Enforce employer profile ownership
        job: &T,
        employer: address,
        freelancer: address,
        payment: Coin<SUI>,
        clock: &sui::clock::Clock,
        ctx: &mut TxContext
    ) {
        let amount = coin::value(&payment);
        assert!(amount > 0, EWrongAmount);

        let escrow_uid = object::new(ctx);
        
        // Fee logic - calculate but don't deduct yet
        // Fee will be deducted upon release (if successful)
        let fee_amt = (amount * marketplace::get_platform_fee_bps(marketplace)) / 10000; // 1% = 100 bps
        let escrow_bal = coin::into_balance(payment);
        
        let escrow = Escrow {
            id: escrow_uid,
            job_id: object::id(job),
            employer,
            freelancer,
            amount: escrow_bal,
            platform_fee: fee_amt,
            released: false,
            employer_approved: false,
            freelancer_delivered: false,
            dispute_active: false,
            work_oid: option::none(),
            created_at: sui::clock::timestamp_ms(clock),
        };
        
        marketplace::add_volume(marketplace, amount);
        
        event::emit(EscrowCreated {
            escrow_id: object::uid_to_inner(&escrow.id),
            job_id: object::id(job),
            amount,
        });
        
        transfer::share_object(escrow);
    }

    /// Freelancer marks work as delivered
    public entry fun mark_delivered(
        escrow: &mut Escrow,
        work_oid: vector<u8>,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == escrow.freelancer, ENotAuthorized);
        assert!(!escrow.released, EAlreadyReleased);
        assert!(!escrow.dispute_active, EDisputeActive);
        
        escrow.freelancer_delivered = true;
        escrow.work_oid = option::some(string::utf8(work_oid));
        
        event::emit(WorkDelivered {
            escrow_id: object::uid_to_inner(&escrow.id),
            freelancer: escrow.freelancer,
        });
    }

    /// Employer approves and releases payment
    public entry fun approve_and_release(
        escrow: &mut Escrow,
        job: &mut listing::Listing,
        marketplace: &Marketplace,
        ctx: &mut TxContext
    ) {
        // Mark job as completed
        listing::complete_job(job);

        assert!(tx_context::sender(ctx) == escrow.employer, ENotAuthorized);
        assert!(!escrow.released, EAlreadyReleased);
        assert!(escrow.freelancer_delivered, ENotReadyForRelease);
        assert!(!escrow.dispute_active, EDisputeActive);
        
        escrow.employer_approved = true;
        escrow.released = true;
        
        let total_amount = balance::value(&escrow.amount);
        let fee_amount = escrow.platform_fee;
        let freelancer_amount = total_amount - fee_amount;
        
        // Split payment
        let fee_balance = balance::split(&mut escrow.amount, fee_amount);
        let freelancer_balance = balance::withdraw_all(&mut escrow.amount);
        
        // Transfer to fee collector
        let fee_coin = coin::from_balance(fee_balance, ctx);
        transfer::public_transfer(fee_coin, marketplace::get_fee_collector(marketplace));
        
        // Transfer to freelancer
        let freelancer_coin = coin::from_balance(freelancer_balance, ctx);
        transfer::public_transfer(freelancer_coin, escrow.freelancer);
        
        event::emit(PaymentReleased {
            escrow_id: object::uid_to_inner(&escrow.id),
            freelancer: escrow.freelancer,
            amount: freelancer_amount,
            platform_fee: fee_amount,
        });
    }

    /// Initiate a dispute
    public entry fun initiate_dispute(
        escrow: &mut Escrow,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(sender == escrow.employer || sender == escrow.freelancer, ENotAuthorized);
        assert!(!escrow.released, EAlreadyReleased);
        
        escrow.dispute_active = true;
        
        event::emit(DisputeStarted {
            escrow_id: object::uid_to_inner(&escrow.id),
            initiator: sender,
        });
    }

    /// Resolve dispute (admin only) - simplified version
    /// In a real app, this would be more complex (e.g. partial refunds)
    public entry fun resolve_dispute(
        escrow: &mut Escrow,
        marketplace: &Marketplace,
        winner_is_freelancer: bool,
        ctx: &mut TxContext
    ) {
        assert!(marketplace::is_admin(marketplace, tx_context::sender(ctx)), ENotAuthorized);
        
        assert!(escrow.dispute_active, 0); // Should be EDisputeNotActive
        
        escrow.released = true;
        escrow.dispute_active = false;
        
        let winner: address;
        let amount: u64;

        if (winner_is_freelancer) {
            let fee_amount = escrow.platform_fee;
            let fee_balance = balance::split(&mut escrow.amount, fee_amount);
            let freelancer_balance = balance::withdraw_all(&mut escrow.amount);
            amount = balance::value(&freelancer_balance);
            winner = escrow.freelancer;

            // Transfer fee
            let fee_coin = coin::from_balance(fee_balance, ctx);
            transfer::public_transfer(fee_coin, marketplace::get_fee_collector(marketplace));

            // Transfer to freelancer
            let freelancer_coin = coin::from_balance(freelancer_balance, ctx);
            transfer::public_transfer(freelancer_coin, winner);
        } else {
            // Employer wins - full refund
            let employer_balance = balance::withdraw_all(&mut escrow.amount);
            amount = balance::value(&employer_balance);
            winner = escrow.employer;

            // Transfer full amount to employer
            let employer_coin = coin::from_balance(employer_balance, ctx);
            transfer::public_transfer(employer_coin, winner);
        };
        
        event::emit(DisputeResolved {
            escrow_id: object::uid_to_inner(&escrow.id),
            winner,
            amount,
        });
    }

    /// Resolve dispute with a split (admin only)
    /// freelancer_share_bps: Basis points (0-10000) of the *remaining* amount (after fee) that goes to freelancer.
    public entry fun resolve_dispute_split(
        escrow: &mut Escrow,
        marketplace: &Marketplace,
        freelancer_share_bps: u64,
        ctx: &mut TxContext
    ) {
        assert!(marketplace::is_admin(marketplace, tx_context::sender(ctx)), ENotAuthorized);
        assert!(escrow.dispute_active, 0); // EDisputeNotActive
        assert!(freelancer_share_bps <= 10000, 100); // EInvalidBps

        escrow.released = true;
        escrow.dispute_active = false;

        // 1. Deduct Platform Fee
        let fee_amount = escrow.platform_fee;
        let fee_balance = balance::split(&mut escrow.amount, fee_amount);
        let fee_coin = coin::from_balance(fee_balance, ctx);
        transfer::public_transfer(fee_coin, marketplace::get_fee_collector(marketplace));

        // 2. Calculate Split on Remainder
        let total_remaining = balance::value(&escrow.amount);
        let freelancer_amount = (total_remaining * freelancer_share_bps) / 10000;
        let employer_amount = total_remaining - freelancer_amount;

        // 3. Transfer to Freelancer
        if (freelancer_amount > 0) {
            let freelancer_balance = balance::split(&mut escrow.amount, freelancer_amount);
            let freelancer_coin = coin::from_balance(freelancer_balance, ctx);
            transfer::public_transfer(freelancer_coin, escrow.freelancer);
        };

        // 4. Transfer to Employer (remainder)
        if (employer_amount > 0) {
            let employer_balance = balance::withdraw_all(&mut escrow.amount);
            let employer_coin = coin::from_balance(employer_balance, ctx);
            transfer::public_transfer(employer_coin, escrow.employer);
        };
        // If balance is exactly 0 now, withdraw_all returns zero balance, which is fine/handled.

        // Emit generic event (using null address for "winner" in split? or emit new event?)
        // For backwards compatibility let's just emit one event? Or maybe creating a new event type is cleaner.
        // Let's reuse DisputeResolved but with winner = @0x0 to indicate split?
        // Or emit two events? 
        // Let's create a new event `DisputeResolvedSplit`
        event::emit(DisputeResolvedSplit {
            escrow_id: object::uid_to_inner(&escrow.id),
            freelancer_share: freelancer_amount,
            employer_share: employer_amount,
        });
    }

    // ===== Getters =====
    
    public fun is_released(escrow: &Escrow): bool {
        escrow.released
    }

    public fun get_amount(escrow: &Escrow): u64 {
        balance::value(&escrow.amount)
    }
    
    public fun is_dispute_active(escrow: &Escrow): bool {
        escrow.dispute_active
    }

    /// Get work OID - restricted access
    /// - Employer and Freelancer can always see it
    /// - Admin can ONLY see it if dispute is active
    public fun get_work_oid(
        escrow: &Escrow, 
        marketplace: &Marketplace, 
        ctx: &TxContext
    ): Option<String> {
        let sender = tx_context::sender(ctx);
        
        // Participants always have access
        if (sender == escrow.employer || sender == escrow.freelancer) {
            return escrow.work_oid
        };

        // Admins only if dispute is active
        if (marketplace::is_admin(marketplace, sender)) {
            if (escrow.dispute_active) {
                return escrow.work_oid
            } else {
                return option::none() // Hide if no dispute
            }
        };

        // Default deny
        option::none()
    }
}
