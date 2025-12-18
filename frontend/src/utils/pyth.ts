// Pyth Network price feed integration for Sui
import { HermesClient } from "@pythnetwork/hermes-client";

// Pyth feed IDs for supported tokens on Sui
// https://pyth.network/developers/price-feed-ids
export const PYTH_FEED_IDS: Record<string, string> = {
    // Native Sui token
    "0x2::sui::SUI": "0x23d7315113f5b1d3ba7a83604c44b94d79f4fd69af77f804fc7f920a6dc65744",

    // Stablecoins
    "0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN": // USDC
        "0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a",
    "0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d48aceab08c::coin::COIN": // USDT
        "0x2b89b9dc8fdf9f34709a5b106b472f0f39bb6ca9ce04b0fd7f2e971688e2e53b",

    // Wrapped assets
    "0xaf8cd5edc19c4512f4259f0bee101a40d41ebed738ade5874359610ef8eeced5::coin::COIN": // WETH
        "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace",
    "0x27792d9fed7f9844eb4839566001bb6f6cb4804f66aa2da6fe1ee242d896881::coin::COIN": // WBTC  
        "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43",

    // Sui ecosystem tokens
    "0x6864a6f921804860930db6ddbe2e16acdf8504495ea7481637a1c8b9a8fe54b::cetus::CETUS":
        "0xe5b274b2611143df055d6e7cd8d93fe1961716bcd4dca1cad87a83bc1e78c1ef",
    "0x5d1f47ea69bb0de31c313d7acf89b890dbb8991ea8e03c6c355171f84bb1ba4a::turbos::TURBOS":
        "0xf9c2e890443dd995d0baafc08eea3358be1ffb874f93f99c30b3816c460bbac3",
};

// Initialize Hermes client
const hermesClient = new HermesClient("https://hermes.pyth.network");

/**
 * Fetch current price for a token from Pyth
 */
export async function fetchPythPrice(coinType: string): Promise<number | null> {
    const feedId = PYTH_FEED_IDS[coinType];

    if (!feedId) {
        console.warn(`No Pyth feed ID for ${coinType}`);
        return null;
    }

    try {
        const priceUpdates = await hermesClient.getLatestPriceUpdates([feedId]);

        if (!priceUpdates.parsed || priceUpdates.parsed.length === 0) {
            return null;
        }

        const priceData = priceUpdates.parsed[0].price;
        const price = Number(priceData.price) * Math.pow(10, priceData.expo);

        return price;
    } catch (error) {
        console.error(`Error fetching Pyth price for ${coinType}:`, error);
        return null;
    }
}

/**
 * Get all tokens that have Pyth price feeds
 */
export function getPythSupportedTokens(): string[] {
    return Object.keys(PYTH_FEED_IDS);
}
