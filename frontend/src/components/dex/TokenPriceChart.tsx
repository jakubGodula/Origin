"use client";

import React, { useState, useEffect } from 'react';
import { POPULAR_TOKENS, Token, fetchTokenList } from '@/utils/tokens';
import { fetchPythPrice } from '@/utils/pyth';
import { ChevronDown, Search, TrendingUp, TrendingDown } from 'lucide-react';

export function TokenPriceChart() {
    const [availableTokens, setAvailableTokens] = useState<Token[]>(POPULAR_TOKENS);
    const [selectedToken, setSelectedToken] = useState<Token>(POPULAR_TOKENS[0]);
    const [currentPrice, setCurrentPrice] = useState<number | null>(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        fetchTokenList().then(tokens => {
            setAvailableTokens(tokens);
            const sui = tokens.find(t => t.symbol === 'SUI');
            if (sui) setSelectedToken(sui);
        });
    }, []);

    useEffect(() => {
        const fetchPrice = async () => {
            setIsLoading(true);
            try {
                const price = await fetchPythPrice(selectedToken.type);
                if (price !== null) {
                    setCurrentPrice(price);
                }
            } catch (error) {
                console.error("Error fetching price:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPrice();
        const interval = setInterval(fetchPrice, 10000); // Refresh every 10s

        return () => clearInterval(interval);
    }, [selectedToken]);

    const filteredTokens = availableTokens.filter(token =>
        token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        token.symbol.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleTokenSelect = (token: Token) => {
        setSelectedToken(token);
        setIsDropdownOpen(false);
        setSearchQuery("");
    };

    return (
        <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
                <div className="relative">
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center gap-2 text-zinc-300 hover:text-white transition-colors"
                    >
                        {selectedToken.logoUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={selectedToken.logoUrl} alt={selectedToken.symbol} className="w-8 h-8 rounded-full" />
                        )}
                        <div className="text-left">
                            <div className="text-sm text-zinc-400">{selectedToken.name}</div>
                            <div className="text-xl font-bold">{selectedToken.symbol}</div>
                        </div>
                        <ChevronDown className="w-4 h-4" />
                    </button>

                    {isDropdownOpen && (
                        <div className="absolute top-full left-0 mt-2 w-64 max-h-96 overflow-y-auto bg-black/90 border border-white/10 rounded-xl backdrop-blur-xl py-2 shadow-xl z-20">
                            <div className="px-3 pb-2 mb-2 border-b border-white/10 sticky top-0 bg-black/95 backdrop-blur-xl pt-2">
                                <div className="flex items-center gap-2 bg-zinc-900 rounded-lg px-3 py-1.5 border border-zinc-800">
                                    <Search className="w-4 h-4 text-zinc-500" />
                                    <input
                                        type="text"
                                        placeholder="Search tokens..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="bg-transparent outline-none text-sm w-full placeholder-zinc-600"
                                        autoFocus
                                    />
                                </div>
                            </div>

                            {filteredTokens.map((token) => (
                                <button
                                    key={token.type}
                                    onClick={() => handleTokenSelect(token)}
                                    className="w-full px-3 py-2 hover:bg-white/5 transition-colors flex items-center gap-2 text-left"
                                >
                                    {token.logoUrl && (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={token.logoUrl} alt={token.symbol} className="w-6 h-6 rounded-full" />
                                    )}
                                    <div className="flex-1">
                                        <div className="text-sm font-medium">{token.symbol}</div>
                                        <div className="text-xs text-zinc-500">{token.name}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="text-right">
                    {isLoading && currentPrice === null ? (
                        <div className="text-2xl font-bold text-zinc-500">Loading...</div>
                    ) : currentPrice !== null ? (
                        <div className="text-3xl font-bold text-white">
                            ${currentPrice.toFixed(currentPrice < 1 ? 4 : 2)}
                        </div>
                    ) : (
                        <div className="text-2xl font-bold text-zinc-500">No price data</div>
                    )}
                    <div className="text-sm text-zinc-400 mt-1">
                        Live Price
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/5">
                <div>
                    <div className="text-xs text-zinc-500 mb-1">24h Volume</div>
                    <div className="text-sm font-medium text-zinc-300">-</div>
                </div>
                <div>
                    <div className="text-xs text-zinc-500 mb-1">Market Cap</div>
                    <div className="text-sm font-medium text-zinc-300">-</div>
                </div>
                <div>
                    <div className="text-xs text-zinc-500 mb-1">Circulating Supply</div>
                    <div className="text-sm font-medium text-zinc-300">-</div>
                </div>
            </div>
        </div>
    );
}
