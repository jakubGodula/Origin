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
    use origin::listing::Listing;

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

    // ===== Public Functions =====
    
    /// Create escrow and lock funds
    public entry fun create_escrow(
        marketplace: &mut Marketplace,
        job: &Listing, // Pass job to verify budget
        freelancer: address,
        payment: Coin<SUI>,
        ctx: &mut TxContext
    ) {
        let amount = coin::value(&payment);
        
        assert!(amount > 0, EWrongAmount);

        let platform_fee_bps = marketplace::get_platform_fee_bps(marketplace);
        let platform_fee = (amount * platform_fee_bps) / 10000;
        
        let escrow_id = object::new(ctx);
        let escrow_uid = object::uid_to_inner(&escrow_id);
        
        let escrow = Escrow {
            id: escrow_id,
            job_id: object::id(job), 
            employer: tx_context::sender(ctx),
            freelancer,
            amount: coin::into_balance(payment),
            platform_fee,
            released: false,
            employer_approved: false,
            freelancer_delivered: false,
            dispute_active: false,
            created_at: tx_context::epoch(ctx),
        };
        
        marketplace::add_volume(marketplace, amount);
        
        event::emit(EscrowCreated {
            escrow_id: escrow_uid,
            job_id: object::id(job),
            amount,
        });
        
        transfer::share_object(escrow);
    }

    /// Freelancer marks work as delivered
    public entry fun mark_delivered(
        escrow: &mut Escrow,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == escrow.freelancer, ENotAuthorized);
        assert!(!escrow.released, EAlreadyReleased);
        assert!(!escrow.dispute_active, EDisputeActive);
        
        escrow.freelancer_delivered = true;
        
        event::emit(WorkDelivered {
            escrow_id: object::uid_to_inner(&escrow.id),
            freelancer: escrow.freelancer,
        });
    }

    /// Employer approves and releases payment
    public entry fun approve_and_release(
        escrow: &mut Escrow,
        marketplace: &Marketplace,
        ctx: &mut TxContext
    ) {
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
        assert!(tx_context::sender(ctx) == marketplace::get_admin(marketplace), ENotAuthorized);
        
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
}
