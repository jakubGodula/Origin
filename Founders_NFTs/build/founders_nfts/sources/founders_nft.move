#[allow(lint(self_transfer))]
module founders_nfts::founders_nft {
    use sui::url::{Self, Url};
    use std::string::{Self, String};
    use sui::event;
    use sui::package;
    use sui::display;

    const TIER1_LIMIT: u64 = 1;
    const TIER2_LIMIT: u64 = 10;
    const TIER3_LIMIT: u64 = 100;

    /// Errors
    const ESoldOut: u64 = 1;

    public struct FOUNDERS_NFT has drop {}

    public struct FoundersNFT has key, store {
        id: UID,
        name: String,
        description: String,
        url: Url,
        tier: String,
    }

    public struct Fundraiser has key {
        id: UID,
        tier1_sold: u64,
        tier2_sold: u64,
        tier3_sold: u64,
    }

    public struct AdminCap has key {
        id: UID,
    }

    // Events
    public struct NFTMinted has copy, drop {
        id: ID,
        minter: address,
        tier: String,
    }

    fun init(otw: FOUNDERS_NFT, ctx: &mut TxContext) {
        let keys = vector[
            string::utf8(b"name"),
            string::utf8(b"link"),
            string::utf8(b"image_url"),
            string::utf8(b"description"),
            string::utf8(b"project_url"),
            string::utf8(b"creator"),
        ];

        let values = vector[
            string::utf8(b"{name}"),
            string::utf8(b"https://github.com/jakubGodula/Origin/tree/main/Founders_NFTs"),
            string::utf8(b"{url}"),
            string::utf8(b"{description}"),
            string::utf8(b"https://github.com/jakubGodula/Origin"),
            string::utf8(b"Origin Project"),
        ];

        let publisher = package::claim(otw, ctx);
        let mut display = display::new_with_fields<FoundersNFT>(
            &publisher, keys, values, ctx
        );

        display::update_version(&mut display);

        let fundraiser = Fundraiser {
            id: object::new(ctx),
            tier1_sold: 0,
            tier2_sold: 0,
            tier3_sold: 0,
        };

        let admin_cap = AdminCap {
            id: object::new(ctx),
        };

        transfer::public_transfer(publisher, ctx.sender());
        transfer::public_transfer(display, ctx.sender());
        transfer::transfer(admin_cap, ctx.sender());
        transfer::share_object(fundraiser);
    }

    public fun mint_tier1(
        fundraiser: &mut Fundraiser,
        ctx: &mut TxContext
    ) {
        assert!(fundraiser.tier1_sold < TIER1_LIMIT, ESoldOut);

        fundraiser.tier1_sold = fundraiser.tier1_sold + 1;

        let nft = FoundersNFT {
            id: object::new(ctx),
            name: string::utf8(b"Origin Founder NFT - Tier 1"),
            description: string::utf8(b"Exclusive Tier 1 Founder NFT for the Origin Project. See https://github.com/jakubGodula/Origin/blob/main/Founders_NFTs/README.md for details."),
            url: url::new_unsafe_from_bytes(b"https://github.com/jakubGodula/Origin/blob/main/Founders_NFTs/imgs/tier1.png?raw=true"),
            tier: string::utf8(b"Tier 1"),
        };

        event::emit(NFTMinted {
            id: object::id(&nft),
            minter: ctx.sender(),
            tier: string::utf8(b"Tier 1"),
        });

        transfer::public_transfer(nft, ctx.sender());
    }

    public fun mint_tier2(
        fundraiser: &mut Fundraiser,
        ctx: &mut TxContext
    ) {
        assert!(fundraiser.tier2_sold < TIER2_LIMIT, ESoldOut);

        fundraiser.tier2_sold = fundraiser.tier2_sold + 1;

        let nft = FoundersNFT {
            id: object::new(ctx),
            name: string::utf8(b"Origin Founder NFT - Tier 2"),
            description: string::utf8(b"Tier 2 Founder NFT for the Origin Project. See https://github.com/jakubGodula/Origin/blob/main/Founders_NFTs/README.md for details."),
            url: url::new_unsafe_from_bytes(b"https://github.com/jakubGodula/Origin/blob/main/Founders_NFTs/imgs/tier2.png?raw=true"),
            tier: string::utf8(b"Tier 2"),
        };

        event::emit(NFTMinted {
            id: object::id(&nft),
            minter: ctx.sender(),
            tier: string::utf8(b"Tier 2"),
        });

        transfer::public_transfer(nft, ctx.sender());
    }

    public fun mint_tier3(
        fundraiser: &mut Fundraiser,
        ctx: &mut TxContext
    ) {
        assert!(fundraiser.tier3_sold < TIER3_LIMIT, ESoldOut);

        fundraiser.tier3_sold = fundraiser.tier3_sold + 1;

        let nft = FoundersNFT {
            id: object::new(ctx),
            name: string::utf8(b"Origin Founder NFT - Tier 3"),
            description: string::utf8(b"Tier 3 Founder NFT for the Origin Project. See https://github.com/jakubGodula/Origin/blob/main/Founders_NFTs/README.md for details."),
            url: url::new_unsafe_from_bytes(b"https://github.com/jakubGodula/Origin/blob/main/Founders_NFTs/imgs/tier3.png?raw=true"),
            tier: string::utf8(b"Tier 3"),
        };

        event::emit(NFTMinted {
            id: object::id(&nft),
            minter: ctx.sender(),
            tier: string::utf8(b"Tier 3"),
        });

        transfer::public_transfer(nft, ctx.sender());
    }

    public fun batch_mint_tier2(
        fundraiser: &mut Fundraiser,
        quantity: u64,
        ctx: &mut TxContext
    ) {
        assert!(fundraiser.tier2_sold + quantity <= TIER2_LIMIT, ESoldOut);

        let mut i = 0;
        while (i < quantity) {
            fundraiser.tier2_sold = fundraiser.tier2_sold + 1;

            let nft = FoundersNFT {
                id: object::new(ctx),
                name: string::utf8(b"Origin Founder NFT - Tier 2"),
                description: string::utf8(b"Tier 2 Founder NFT for the Origin Project. See https://github.com/jakubGodula/Origin/blob/main/Founders_NFTs/README.md for details."),
                url: url::new_unsafe_from_bytes(b"https://github.com/jakubGodula/Origin/blob/main/Founders_NFTs/imgs/tier2.png?raw=true"),
                tier: string::utf8(b"Tier 2"),
            };

            event::emit(NFTMinted {
                id: object::id(&nft),
                minter: ctx.sender(),
                tier: string::utf8(b"Tier 2"),
            });

            transfer::public_transfer(nft, ctx.sender());
            i = i + 1;
        };
    }

    public fun batch_mint_tier3(
        fundraiser: &mut Fundraiser,
        quantity: u64,
        ctx: &mut TxContext
    ) {
        assert!(fundraiser.tier3_sold + quantity <= TIER3_LIMIT, ESoldOut);

        let mut i = 0;
        while (i < quantity) {
            fundraiser.tier3_sold = fundraiser.tier3_sold + 1;

            let nft = FoundersNFT {
                id: object::new(ctx),
                name: string::utf8(b"Origin Founder NFT - Tier 3"),
                description: string::utf8(b"Tier 3 Founder NFT for the Origin Project. See https://github.com/jakubGodula/Origin/blob/main/Founders_NFTs/README.md for details."),
                url: url::new_unsafe_from_bytes(b"https://github.com/jakubGodula/Origin/blob/main/Founders_NFTs/imgs/tier3.png?raw=true"),
                tier: string::utf8(b"Tier 3"),
            };

            event::emit(NFTMinted {
                id: object::id(&nft),
                minter: ctx.sender(),
                tier: string::utf8(b"Tier 3"),
            });

            transfer::public_transfer(nft, ctx.sender());
            i = i + 1;
        };
    }
}
