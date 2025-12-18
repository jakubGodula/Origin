module origin::founders_nft {
    use sui::url::{Self, Url};
    use std::string::{Self, String};
    use sui::event;

    // ===== Errors =====
    const ETierFull: u64 = 1;
    const EInvalidTier: u64 = 2;

    // ===== Constants =====
    const MAX_TIER_1: u64 = 1;
    const MAX_TIER_2: u64 = 10;
    const MAX_TIER_3: u64 = 100;

    /// The Founders NFT object
    public struct FoundersNFT has key, store {
        id: UID,
        name: String,
        description: String,
        url: Url,
        tier: u8,
        founder_id: u64,
    }

    /// Shared object to track collection state
    public struct CollectionInfo has key {
        id: UID,
        tier1_minted: u64,
        tier2_minted: u64,
        tier3_minted: u64,
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
            tier1_minted: 0,
            tier2_minted: 0,
            tier3_minted: 0,
        };
        transfer::share_object(info);
    }

    /// Mint a new Founders NFT
    public entry fun mint(
        info: &mut CollectionInfo,
        name: vector<u8>,
        description: vector<u8>,
        url: vector<u8>,
        tier: u8,
        founder_id: u64,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        
        // Check supply limits based on tier
        if (tier == 1) {
            assert!(info.tier1_minted < MAX_TIER_1, ETierFull);
            info.tier1_minted = info.tier1_minted + 1;
        } else if (tier == 2) {
            assert!(info.tier2_minted < MAX_TIER_2, ETierFull);
            info.tier2_minted = info.tier2_minted + 1;
        } else if (tier == 3) {
            assert!(info.tier3_minted < MAX_TIER_3, ETierFull);
            info.tier3_minted = info.tier3_minted + 1;
        } else {
            abort EInvalidTier
        };

        let nft = FoundersNFT {
            id: object::new(ctx),
            name: string::utf8(name),
            description: string::utf8(description),
            url: url::new_unsafe_from_bytes(url),
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

    /// Update the NFT description
    public entry fun update_description(
        nft: &mut FoundersNFT,
        new_description: vector<u8>,
        _: &mut TxContext
    ) {
        nft.description = string::utf8(new_description);
    }

    /// Burn the NFT
    public entry fun burn(nft: FoundersNFT, _: &mut TxContext) {
        let FoundersNFT { id, name: _, description: _, url: _, tier: _, founder_id: _ } = nft;
        object::delete(id);
    }

    // ===== Getters =====

    public fun name(nft: &FoundersNFT): &String {
        &nft.name
    }

    public fun description(nft: &FoundersNFT): &String {
        &nft.description
    }

    public fun url(nft: &FoundersNFT): &Url {
        &nft.url
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
}
