module origin::admin {
    use sui::event;
    use origin::marketplace::Marketplace;
    use origin::candidate::{Self, CandidateProfile};
    use origin::employer::{Self, EmployerProfile};

    // ===== Events =====
    
    public struct CandidateVerified has copy, drop {
        profile_id: ID,
        verified_by: address,
    }

    public struct CandidateUnverified has copy, drop {
        profile_id: ID,
        unverified_by: address,
    }

    public struct EmployerVerified has copy, drop {
        profile_id: ID,
        verified_by: address,
    }

    public struct EmployerUnverified has copy, drop {
        profile_id: ID,
        unverified_by: address,
    }

    // ===== Profile Verification Functions =====

    /// Verify a candidate profile (moderators + admins only)
    public entry fun verify_candidate(
        marketplace: &Marketplace,
        profile: &mut CandidateProfile,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        
        // Check if sender is moderator or admin
        assert!(
            origin::marketplace::is_moderator(marketplace, sender) ||
            origin::marketplace::is_admin(marketplace, sender),
            0 // ENotAuthorized
        );
        
        // Update verification status
        candidate::set_verified(
            profile,
            true,
            option::some(sender),
            option::some(tx_context::epoch(ctx))
        );
        
        event::emit(CandidateVerified {
            profile_id: object::id(profile),
            verified_by: sender,
        });
    }

    /// Unverify a candidate profile (moderators + admins only)
    public entry fun unverify_candidate(
        marketplace: &Marketplace,
        profile: &mut CandidateProfile,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        
        // Check if sender is moderator or admin
        assert!(
            origin::marketplace::is_moderator(marketplace, sender) ||
            origin::marketplace::is_admin(marketplace, sender),
            0 // ENotAuthorized
        );
        
        // Remove verification
        candidate::set_verified(
            profile,
            false,
            option::none(),
            option::none()
        );
        
        event::emit(CandidateUnverified {
            profile_id: object::id(profile),
            unverified_by: sender,
        });
    }

    /// Verify an employer profile (moderators + admins only)
    public entry fun verify_employer(
        marketplace: &Marketplace,
        profile: &mut EmployerProfile,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        
        // Check if sender is moderator or admin
        assert!(
            origin::marketplace::is_moderator(marketplace, sender) ||
            origin::marketplace::is_admin(marketplace, sender),
            0 // ENotAuthorized
        );
        
        // Update verification status
        employer::set_verified(
            profile,
            true,
            option::some(sender),
            option::some(tx_context::epoch(ctx))
        );
        
        event::emit(EmployerVerified {
            profile_id: object::id(profile),
            verified_by: sender,
        });
    }

    /// Unverify an employer profile (moderators + admins only)
    public entry fun unverify_employer(
        marketplace: &Marketplace,
        profile: &mut EmployerProfile,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        
        // Check if sender is moderator or admin
        assert!(
            origin::marketplace::is_moderator(marketplace, sender) ||
            origin::marketplace::is_admin(marketplace, sender),
            0 // ENotAuthorized
        );
        
        // Remove verification
        employer::set_verified(
            profile,
            false,
            option::none(),
            option::none()
        );
        
        event::emit(EmployerUnverified {
            profile_id: object::id(profile),
            unverified_by: sender,
        });
    }
}
