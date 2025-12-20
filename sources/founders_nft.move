module origin::founders_nft {
    use sui::url::{Self, Url};
    use std::string::{Self, String};
    use sui::event;
    use sui::coin::{Self, Coin};
    use std::type_name::{Self, TypeName};


    // ===== Errors =====
    const ETierFull: u64 = 1;
    const EInvalidTier: u64 = 2;
    const EInvalidPayment: u64 = 3;
    const EWrongCoinType: u64 = 4;
    const ENotAdmin: u64 = 5;

    // ===== Constants =====
    const MAX_TIER_1: u64 = 1;
    const MAX_TIER_2: u64 = 10;
    const MAX_TIER_3: u64 = 100;

    const PRICE_TIER_1: u64 = 20_000_000_000; // 20,000 USDC
    const PRICE_TIER_2: u64 = 2_000_000_000;   // 2,000 USDC
    const PRICE_TIER_3: u64 = 200_000_000;     // 200 USDC

    /// The Founders NFT object
    public struct FoundersNFT has key, store {
        id: UID,
        name: String,
        description: String,
        funding_target: Url,
        tier: u8,
        founder_id: u64,
    }

    /// Shared object to track collection state
    public struct CollectionInfo has key {
        id: UID,
        admin: address,
        tier1_minted: u64,
        tier2_minted: u64,
        tier3_minted: u64,
        next_founder_id: u64,
        payment_type: option::Option<TypeName>,
    }

    // ===== Events =====

    public struct NFTMinted has copy, drop {
        object_id: ID,
        creator: address,
        name: String,
        tier: u8,
    }

    // ===== Functions =====

    /// Initialize the collection info
    fun init(ctx: &mut TxContext) {
        let info = CollectionInfo {
            id: object::new(ctx),
            admin: tx_context::sender(ctx),
            tier1_minted: 0,
            tier2_minted: 0,
            tier3_minted: 0,
            next_founder_id: 1,
            payment_type: option::none(),
        };
        transfer::share_object(info);
    }

    /// Mint a new Founders NFT
    public entry fun mint<P>(
        info: &mut CollectionInfo,
        tier: u8,
        payment: Coin<P>,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);

        // Verify payment
        let price = if (tier == 1) {
            PRICE_TIER_1
        } else if (tier == 2) {
            PRICE_TIER_2
        } else if (tier == 3) {
            PRICE_TIER_3
        } else {
            abort EInvalidTier
        };

        // Verify payment type (Strict enforcement based on stored payment_type)
        assert!(option::is_some(&info.payment_type), EWrongCoinType);
        let allowed_type = option::borrow(&info.payment_type);
        assert!(type_name::with_defining_ids<P>() == *allowed_type, EWrongCoinType);


        assert!(coin::value(&payment) == price, EInvalidPayment);

        transfer::public_transfer(payment, info.admin);

        let founder_id = info.next_founder_id;
        info.next_founder_id = info.next_founder_id + 1;
        
        let (name, description) = if (tier == 1) {
            assert!(info.tier1_minted < MAX_TIER_1, ETierFull);
            info.tier1_minted = info.tier1_minted + 1;
            (
                b"Origin Founder NFT",
                b"The ultimate founder status. Only one can be the Visionary."
            )
        } else if (tier == 2) {
            assert!(info.tier2_minted < MAX_TIER_2, ETierFull);
            info.tier2_minted = info.tier2_minted + 1;
            (
                b"Origin Founder NFT",
                b"A vibrant and iridescent reflection of pioneering spirit."
            )
        } else if (tier == 3) {
            assert!(info.tier3_minted < MAX_TIER_3, ETierFull);
            info.tier3_minted = info.tier3_minted + 1;
            (
                b"Origin Founder NFT",
                b"Sharp, technological foundation for the first believers."
            )
        } else {
            abort EInvalidTier
        };

        let nft = FoundersNFT {
            id: object::new(ctx),
            name: string::utf8(name),
            description: string::utf8(description),
            funding_target: url::new_unsafe_from_bytes(b"https://github.com/jakubGodula/Origin/blob/main/frontend/public/nfts/README.md"),
            tier,
            founder_id,
        };

        event::emit(NFTMinted {
            object_id: object::id(&nft),
            creator: sender,
            name: nft.name,
            tier: nft.tier,
        });

        transfer::public_transfer(nft, sender);
    }

    /// Burn the NFT
    public entry fun burn(nft: FoundersNFT, _: &mut TxContext) {
        let FoundersNFT { id, name: _, description: _, funding_target: _, tier: _, founder_id: _ } = nft;
        object::delete(id);
    }

    // ===== Getters =====

    public fun name(nft: &FoundersNFT): &String {
        &nft.name
    }

    public fun description(nft: &FoundersNFT): &String {
        &nft.description
    }

    public fun funding_target(nft: &FoundersNFT): &Url {
        &nft.funding_target
    }

    public fun tier(nft: &FoundersNFT): u8 {
        nft.tier
    }

    public fun founder_id(nft: &FoundersNFT): u64 {
        nft.founder_id
    }

    public fun tier_counts(info: &CollectionInfo): (u64, u64, u64) {
        (info.tier1_minted, info.tier2_minted, info.tier3_minted)
    }

    /// Admin can manually override the allowed payment type if needed (currently hardcoded for USDC)
    public entry fun set_payment_type<P>(info: &mut CollectionInfo, ctx: &mut TxContext) {
        assert!(tx_context::sender(ctx) == info.admin, ENotAdmin);
        let type_ = type_name::with_defining_ids<P>();

        if (option::is_some(&info.payment_type)) {
            option::swap(&mut info.payment_type, type_);
        } else {
            option::fill(&mut info.payment_type, type_);
        };
    }
}
