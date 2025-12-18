import { getPythSupportedTokens } from './pyth';

// All tokens supported by Pyth Network
export const PYTH_TOKENS: Token[] = [
    {
        symbol: 'SUI',
        name: 'Sui',
        type: '0x2::sui::SUI',
        decimals: 9,
        logoUrl: 'https://assets.coingecko.com/coins/images/26375/small/sui_asset.jpeg'
    },
    {
        symbol: 'USDC',
        name: 'USD Coin',
        type: '0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN',
        decimals: 6,
        logoUrl: 'https://assets.coingecko.com/coins/images/6319/small/usdc.png'
    },
    {
        symbol: 'USDT',
        name: 'Tether USD',
        type: '0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d48aceab08c::coin::COIN',
        decimals: 6,
        logoUrl: 'https://assets.coingecko.com/coins/images/325/small/Tether.png'
    },
    {
        symbol: 'WETH',
        name: 'Wrapped Ethereum',
        type: '0xaf8cd5edc19c4512f4259f0bee101a40d41ebed738ade5874359610ef8eeced5::coin::COIN',
        decimals: 8,
        logoUrl: 'https://assets.coingecko.com/coins/images/2518/small/weth.png'
    },
    {
        symbol: 'WBTC',
        name: 'Wrapped Bitcoin',
        type: '0x27792d9fed7f9844eb4839566001bb6f6cb4804f66aa2da6fe1ee242d896881::coin::COIN',
        decimals: 8,
        logoUrl: 'https://assets.coingecko.com/coins/images/7598/small/wrapped_bitcoin_wbtc.png'
    },
    {
        symbol: 'CETUS',
        name: 'Cetus Protocol',
        type: '0x6864a6f921804860930db6ddbe2e16acdf8504495ea7481637a1c8b9a8fe54b::cetus::CETUS',
        decimals: 9,
        logoUrl: 'https://strapi-dev.scand.app/uploads/cetus_c434c5b78e.png'
    },
];

export const POPULAR_TOKENS = PYTH_TOKENS;

export interface Token {
    symbol: string;
    name: string;
    type: string;
    decimals: number;
    logoUrl?: string;
}

/**
 * Return all tokens supported by Pyth Network
 * We use a static list since we know exactly which tokens have Pyth feeds
 */
export async function fetchTokenList(): Promise<Token[]> {
    return PYTH_TOKENS;
}
