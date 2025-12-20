"use client";

import React, { useState, useEffect } from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient, useSuiClientContext } from '@mysten/dapp-kit';

import { Transaction } from '@mysten/sui/transactions';
import { Button } from '@/components/Button';

// These should eventually be moved to a constants file or environment variables
const PACKAGE_ID = "0x15021c99a616d9e63d26e2313063a66d7a532f07c8fd65da8ece81f290d81022";
const COLLECTION_INFO_ID = "0x3d309423715dc5219dfc39715f209e5563d2dce7edb009d7041d436415bae967";
const MODULE_NAME = "founders_nft";
const FUNDING_TARGET_URL = "https://github.com/jakubGodula/Origin/blob/main/frontend/public/nfts/README.md";
const RAW_README_URL = "https://raw.githubusercontent.com/jakubGodula/Origin/main/frontend/public/nfts/README.md";
const USDC_TESTNET = "0xa1ec7fc00a6f40db9693ad1415d0c193ad3906494428cf252621037bd7117e29::usdc::USDC";
const USDC_MAINNET = "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC";


const TIERS = [
    {
        id: 1,
        name: "Tier 1: Visionary",
        maxSupply: 1,
        price: 20000,
        priceFormatted: "20,000 USDC",
        defaultImage: "https://github.com/jakubGodula/Origin/blob/main/frontend/public/nfts/tier1_official.png?raw=true",
        description: "The ultimate founder status. Only one can be the Visionary."
    },
    {
        id: 2,
        name: "Tier 2: Pioneer",
        maxSupply: 10,
        price: 2000,
        priceFormatted: "2,000 USDC",
        defaultImage: "https://github.com/jakubGodula/Origin/blob/main/frontend/public/nfts/tier2_official.png?raw=true",
        description: "A vibrant and iridescent reflection of pioneering spirit."
    },
    {
        id: 3,
        name: "Tier 3: Early Adopter",
        maxSupply: 100,
        price: 200,
        priceFormatted: "200 USDC",
        defaultImage: "https://github.com/jakubGodula/Origin/blob/main/frontend/public/nfts/tier3_official.png?raw=true",
        description: "Sharp, technological foundation for the first believers."
    },
];

export default function FoundersPage() {
    const account = useCurrentAccount();
    const { network } = useSuiClientContext();
    const USDC_TYPE = network === 'mainnet' ? USDC_MAINNET : USDC_TESTNET;
    const { mutate: signAndExecute } = useSignAndExecuteTransaction();

    const [isMinting, setIsMinting] = useState(false);
    const [selectedTier, setSelectedTier] = useState(3);
    const [quantity, setQuantity] = useState(1);
    const [formData, setFormData] = useState({
        name: "Origin Founder NFT",
        description: TIERS[2].description,
        url: TIERS[2].defaultImage
    });
    const client = useSuiClient();
    const [nextId, setNextId] = useState<number | null>(null);
    const [readmeDigest, setReadmeDigest] = useState<string>("Loading funding documentation...");
    const [supplyInfo, setSupplyInfo] = useState({ t1: 0, t2: 0, t3: 0 });

    // Fetch README digest
    useEffect(() => {
        const fetchReadme = async () => {
            try {
                const response = await fetch(RAW_README_URL);
                const text = await response.text();
                // Extract first 400 chars as a digest
                const digest = text.length > 400 ? text.substring(0, 400) + "..." : text;
                setReadmeDigest(digest);
            } catch (error) {
                console.error("Failed to fetch README:", error);
                setReadmeDigest("Error loading funding target documentation.");
            }
        };
        fetchReadme();
    }, []);

    // Fetch next Founder ID and supply from contract
    useEffect(() => {
        const fetchInfo = async () => {
            try {
                const obj = await client.getObject({
                    id: COLLECTION_INFO_ID,
                    options: { showContent: true }
                });
                if (obj.data?.content?.dataType === 'moveObject') {
                    const fields = obj.data.content.fields as any;
                    const nextFounderId = fields.next_founder_id;
                    setNextId(nextFounderId);
                    setSupplyInfo({
                        t1: Number(fields.tier1_minted),
                        t2: Number(fields.tier2_minted),
                        t3: Number(fields.tier3_minted)
                    });
                }
            } catch (error) {
                console.warn("Failed to fetch collection info:", error);
            }
        };
        fetchInfo();
        const interval = setInterval(fetchInfo, 10000);
        return () => clearInterval(interval);
    }, [client]);

    // Update form when tier changes
    useEffect(() => {
        const tier = TIERS.find(t => t.id === selectedTier);
        if (tier) {
            setFormData(prev => ({
                ...prev,
                description: tier.description,
                url: tier.defaultImage
            }));
        }
    }, [selectedTier]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    // Reset quantity when tier changes
    useEffect(() => {
        setQuantity(1);
    }, [selectedTier]);

    const handleMint = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!account) {
            alert("Please connect your wallet first");
            return;
        }

        const tier = TIERS.find(t => t.id === selectedTier);
        if (!tier) return;

        setIsMinting(true);
        try {
            const tx = new Transaction();

            // 1. Get USDC coins to pay
            const coins = await client.getCoins({
                owner: account.address,
                coinType: USDC_TYPE
            });

            if (coins.data.length === 0) {
                throw new Error("No USDC coins found in wallet");
            }

            // 2. Merge all coins into one for easier splitting
            const [mainCoin, ...otherCoins] = coins.data.map(c => c.coinObjectId);
            if (otherCoins.length > 0) {
                tx.mergeCoins(mainCoin, otherCoins);
            }

            // 3. Add mint calls for each quantity
            for (let i = 0; i < quantity; i++) {
                // Split the exact amount for this mint
                const [paymentCoin] = tx.splitCoins(mainCoin, [tx.pure.u64(tier.price * 1_000_000)]);

                tx.moveCall({
                    target: `${PACKAGE_ID}::${MODULE_NAME}::mint`,
                    typeArguments: [USDC_TYPE],
                    arguments: [
                        tx.object(COLLECTION_INFO_ID),
                        tx.pure.u8(selectedTier),
                        paymentCoin
                    ],
                });
            }

            signAndExecute(
                { transaction: tx },
                {
                    onSuccess: (result) => {
                        console.log("Mint success:", result);
                        alert(`Successfully minted ${quantity} ${tier.name} NFT(s)!`);
                        setIsMinting(false);
                    },
                    onError: (error) => {
                        console.error("Mint error:", error);
                        alert(`Minting failed: ${error.message}`);
                        setIsMinting(false);
                    },
                }
            );
        } catch (error: any) {
            console.error("Transaction preparation error:", error);
            alert(`Failed to prepare transaction: ${error.message}`);
            setIsMinting(false);
        }
    };

    return (
        <div className="container mx-auto max-w-5xl px-6 py-12 pt-32">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

                {/* Minting Form */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm relative overflow-hidden order-2 lg:order-1">
                    <div className="relative z-10 mb-8">
                        <h1 className="text-3xl font-bold text-white mb-2">Mint Your Founder Legacy</h1>
                        <p className="text-zinc-400">Join the elite circle of Origin founders and help shape the future of decentralized work.</p>
                    </div>

                    <form onSubmit={handleMint} className="space-y-6 relative z-10">
                        {/* Tier Selection */}
                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-zinc-300">Select Founder Tier</label>
                            <div className="grid grid-cols-1 gap-3">
                                {TIERS.map((tier) => (
                                    <button
                                        key={tier.id}
                                        type="button"
                                        onClick={() => setSelectedTier(tier.id)}
                                        className={`flex items-center justify-between p-4 rounded-xl border transition-all ${selectedTier === tier.id
                                            ? "bg-primary-transparent border-primary/50 text-white shadow-[0_0_20px_rgba(16,185,129,0.1)]"
                                            : "bg-black/20 border-white/5 text-zinc-400 hover:border-white/20"
                                            }`}
                                    >
                                        <div className="text-left">
                                            <div className="font-semibold">{tier.name}</div>
                                            <div className="text-xs text-primary font-bold">{tier.priceFormatted}</div>
                                            <div className="text-[10px] text-zinc-500 mt-1">
                                                Supply: {tier.id === 1 ? supplyInfo.t1 : tier.id === 2 ? supplyInfo.t2 : supplyInfo.t3} / {tier.maxSupply}
                                            </div>
                                        </div>
                                        {selectedTier === tier.id && (
                                            <div className="flex flex-col items-end gap-1">
                                                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Quantity Selector */}
                        {selectedTier > 1 && (
                            <div className="space-y-4">
                                <div className="flex justify-between items-end">
                                    <label className="block text-sm font-medium text-zinc-300">Quantity</label>
                                    <div className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">
                                        Remaining: {(TIERS.find(t => t.id === selectedTier)?.maxSupply ?? 0) - (selectedTier === 2 ? supplyInfo.t2 : supplyInfo.t3)}
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-xl p-2">
                                    <button
                                        type="button"
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        className="w-10 h-10 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center hover:bg-white/10 text-white transition-colors"
                                    >
                                        -
                                    </button>
                                    <input
                                        type="number"
                                        min="1"
                                        max={(TIERS.find(t => t.id === selectedTier)?.maxSupply ?? 0) - (selectedTier === 1 ? supplyInfo.t1 : selectedTier === 2 ? supplyInfo.t2 : supplyInfo.t3)}
                                        value={quantity}
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value) || 1;
                                            const tier = TIERS.find(t => t.id === selectedTier);
                                            const currentSupply = selectedTier === 1 ? supplyInfo.t1 : selectedTier === 2 ? supplyInfo.t2 : supplyInfo.t3;
                                            const max = (tier?.maxSupply ?? 0) - currentSupply;
                                            setQuantity(Math.max(1, Math.min(max, val)));
                                        }}
                                        className="w-16 bg-transparent text-center text-xl font-bold text-white font-mono focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const tier = TIERS.find(t => t.id === selectedTier);
                                            const currentSupply = selectedTier === 1 ? supplyInfo.t1 : selectedTier === 2 ? supplyInfo.t2 : supplyInfo.t3;
                                            const remaining = (tier?.maxSupply ?? 0) - currentSupply;
                                            setQuantity(Math.min(remaining, quantity + 1));
                                        }}
                                        className="w-10 h-10 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center hover:bg-white/10 text-white transition-colors"
                                    >
                                        +
                                    </button>
                                    <div className="ml-auto pr-4 border-l border-white/5 pl-4">
                                        <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-0.5">Total Cost</div>
                                        <div className="text-sm font-bold text-primary">
                                            {(TIERS.find(t => t.id === selectedTier)?.price! * quantity).toLocaleString()} USDC
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className="grid gap-2">
                                <label htmlFor="name" className="block text-sm font-medium text-zinc-300">NFT Name</label>
                                <input
                                    id="name"
                                    value={formData.name}
                                    readOnly
                                    className="w-full bg-white/5 border border-white/5 rounded-lg px-4 py-3 text-zinc-500 cursor-not-allowed focus:outline-none transition-all"
                                    required
                                />
                            </div>

                            <div className="grid gap-2">
                                <label htmlFor="description" className="block text-sm font-medium text-zinc-300">Description</label>
                                <textarea
                                    id="description"
                                    value={formData.description}
                                    readOnly
                                    rows={3}
                                    className="w-full bg-white/5 border border-white/5 rounded-lg px-4 py-3 text-zinc-500 cursor-not-allowed focus:outline-none transition-all resize-none"
                                    required
                                />
                            </div>

                            <div className="grid gap-2">
                                <label className="block text-sm font-medium text-zinc-300">Your Unique Founder ID</label>
                                <div className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-primary font-mono font-bold text-lg shadow-inner">
                                    #{nextId ?? "..."}
                                </div>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={isMinting || !account}
                            className="w-full py-6 text-lg font-bold"
                        >
                            {!account ? "Connect Wallet" : isMinting ? "Processing..." : `Mint ${quantity > 1 ? quantity : ''} Tier ${selectedTier} NFT${quantity > 1 ? 's' : ''}`}
                        </Button>
                    </form>
                </div>

                {/* NFT Visualization */}
                <div className="flex flex-col items-center justify-center order-1 lg:order-2 sticky top-32">
                    <div className="relative group">
                        {/* Glow Effect */}
                        <div className={`absolute -inset-4 rounded-[2rem] blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 ${selectedTier === 1 ? "bg-yellow-500" : selectedTier === 2 ? "bg-blue-500" : "bg-zinc-500"
                            }`} />

                        {/* Card Container */}
                        <div className={`relative w-80 aspect-[3/4] rounded-2xl border bg-[#050505] overflow-hidden transition-all duration-500 group-hover:scale-[1.02] shadow-2xl ${selectedTier === 1 ? "border-yellow-500/30 shadow-[0_0_50px_rgba(234,179,8,0.15)]" :
                            selectedTier === 2 ? "border-blue-500/30 shadow-[0_0_50px_rgba(59,130,246,0.15)]" :
                                "border-white/10 shadow-[0_0_50px_rgba(255,255,255,0.05)]"
                            }`}>
                            {/* Card Header */}
                            <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-20">
                                <div className={`text-[10px] font-black uppercase tracking-[0.2em] px-2 py-1 rounded bg-black/40 backdrop-blur-md text-white border border-white/10`}>
                                    Origin Founder
                                </div>
                                <div className="text-xs font-mono text-primary bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-md border border-primary/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                                    FOUNDER #{nextId ?? "..."}
                                </div>
                            </div>

                            <div className="absolute inset-0 z-10">
                                {formData.url && (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={formData.url}
                                        alt="NFT"
                                        className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                                        onLoad={() => console.log("Image loaded successfully:", formData.url)}
                                        onError={(e) => {
                                            console.error("NFT image load error:", formData.url);
                                            // Don't hide it, maybe the user can see what's wrong
                                        }}
                                    />
                                )}
                            </div>

                            {/* Center Visual Overlay for Tier */}
                            <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                                <div className={`w-20 h-20 rounded-full border-2 flex items-center justify-center backdrop-blur-md shadow-2xl ${selectedTier === 1 ? "border-yellow-500/40 bg-yellow-500/10 text-yellow-500/80 shadow-yellow-500/20" :
                                    selectedTier === 2 ? "border-blue-500/40 bg-blue-500/10 text-blue-500/80 shadow-blue-500/20" :
                                        "border-white/30 bg-white/10 text-white/90 shadow-white/10"
                                    }`}>
                                    <span className="text-4xl font-black drop-shadow-lg">{selectedTier}</span>
                                </div>
                            </div>

                            {/* Card Footer */}
                            <div className="absolute bottom-0 left-0 right-0 p-8 z-20 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                                <div className="space-y-1">
                                    <h3 className="text-xl font-bold text-white leading-tight">{formData.name}</h3>
                                    <div className={`text-xs font-semibold uppercase tracking-wider ${selectedTier === 1 ? "text-yellow-500" : selectedTier === 2 ? "text-blue-500" : "text-zinc-500"
                                        }`}>
                                        {TIERS.find(t => t.id === selectedTier)?.name.split(": ")[1]}
                                    </div>
                                </div>
                                <p className="mt-4 text-xs text-zinc-400 line-clamp-2 italic leading-relaxed">
                                    &quot;{formData.description}&quot;
                                </p>
                            </div>

                            {/* Particle/Reflect effect */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-30 pointer-events-none" />
                        </div>
                    </div>

                    <div className="mt-8 w-80">
                        <div className="bg-gradient-to-b from-white/10 to-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-xl">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-4 flex items-center gap-2">
                                <span className="w-1 h-1 rounded-full bg-primary animate-ping" />
                                Project Manifesto
                            </h4>
                            <div className="text-[12px] text-zinc-200 leading-relaxed font-medium overflow-hidden">
                                <div className="prose prose-invert prose-sm max-w-none opacity-80 italic">
                                    &ldquo;{readmeDigest.length > 150 ? readmeDigest.substring(0, 150) + '...' : readmeDigest}&rdquo;
                                </div>
                            </div>
                            <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-4">
                                <a
                                    href={FUNDING_TARGET_URL}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[10px] text-zinc-400 hover:text-white transition-colors font-bold uppercase tracking-widest flex items-center gap-1 group"
                                >
                                    Documentation
                                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                                </a>
                                <div className="text-[9px] text-zinc-600 font-mono">
                                    VERIFIED SOURCE
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 text-center">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">
                            Authentic Origin Founder Asset
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
