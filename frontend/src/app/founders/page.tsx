"use client";

import React, { useState, useEffect } from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { Button } from '@/components/Button';

// These should eventually be moved to a constants file or environment variables
const PACKAGE_ID = "0x..."; // Replace with actual package ID after deployment
const COLLECTION_INFO_ID = "0x..."; // Replace with actual collection info ID
const MODULE_NAME = "founders_nft";

const TIERS = [
    {
        id: 1,
        name: "Tier 1: Visionary",
        maxSupply: 1,
        price: "USDC based",
        defaultImage: "/nfts/tier1_official.png",
        description: "The ultimate founder status. Only one can be the Visionary."
    },
    {
        id: 2,
        name: "Tier 2: Pioneer",
        maxSupply: 10,
        price: "USDC based",
        defaultImage: "/nfts/tier2_official.png",
        description: "A vibrant and iridescent reflection of pioneering spirit."
    },
    {
        id: 3,
        name: "Tier 3: Early Adopter",
        maxSupply: 100,
        price: "USDC based",
        defaultImage: "/nfts/tier3_official.png",
        description: "Sharp, technological foundation for the first believers."
    },
];

export default function FoundersPage() {
    const account = useCurrentAccount();
    const { mutate: signAndExecute } = useSignAndExecuteTransaction();
    const [isMinting, setIsMinting] = useState(false);
    const [selectedTier, setSelectedTier] = useState(3);
    const [formData, setFormData] = useState({
        name: "Origin Founder NFT",
        description: TIERS[2].description,
        url: TIERS[2].defaultImage,
        founderId: "1"
    });

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

    const handleMint = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!account) {
            alert("Please connect your wallet first");
            return;
        }

        setIsMinting(true);
        try {
            const tx = new Transaction();
            tx.moveCall({
                target: `${PACKAGE_ID}::${MODULE_NAME}::mint`,
                arguments: [
                    tx.object(COLLECTION_INFO_ID),
                    tx.pure.string(formData.name),
                    tx.pure.string(formData.description),
                    tx.pure.string(formData.url),
                    tx.pure.u8(selectedTier),
                    tx.pure.u64(BigInt(formData.founderId)),
                ],
            });

            signAndExecute(
                { transaction: tx },
                {
                    onSuccess: (result) => {
                        console.log("Mint success:", result);
                        alert("Founders NFT minted successfully!");
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
            alert("Failed to prepare transaction");
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
                                            <div className="text-xs opacity-60">Max Supply: {tier.maxSupply}</div>
                                        </div>
                                        {selectedTier === tier.id && (
                                            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="grid gap-2">
                                <label htmlFor="name" className="block text-sm font-medium text-zinc-300">NFT Name</label>
                                <input
                                    id="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary/50 transition-all"
                                    required
                                />
                            </div>

                            <div className="grid gap-2">
                                <label htmlFor="description" className="block text-sm font-medium text-zinc-300">Description</label>
                                <textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows={3}
                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary/50 transition-all resize-none"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <label htmlFor="founderId" className="block text-sm font-medium text-zinc-300">Founder ID</label>
                                    <input
                                        id="founderId"
                                        type="number"
                                        value={formData.founderId}
                                        onChange={handleInputChange}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary/50 transition-all"
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <label htmlFor="url" className="block text-sm font-medium text-zinc-300">Metadata URL</label>
                                    <input
                                        id="url"
                                        value={formData.url}
                                        onChange={handleInputChange}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary/50 transition-all"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={isMinting || !account}
                            className="w-full py-6 text-lg font-bold"
                        >
                            {!account ? "Connect Wallet" : isMinting ? "Processing..." : `Mint Tier ${selectedTier} NFT`}
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
                        <div className={`relative w-80 aspect-[3/4] rounded-2xl border bg-black/80 backdrop-blur-xl overflow-hidden transition-all duration-500 group-hover:scale-[1.02] shadow-2xl ${selectedTier === 1 ? "border-yellow-500/30 shadow-[0_0_50px_rgba(234,179,8,0.1)]" :
                            selectedTier === 2 ? "border-blue-500/30 shadow-[0_0_50px_rgba(59,130,246,0.1)]" :
                                "border-white/10 shadow-[0_0_50px_rgba(255,255,255,0.05)]"
                            }`}>
                            {/* Card Header */}
                            <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-20">
                                <div className={`text-[10px] font-black uppercase tracking-[0.2em] px-2 py-1 rounded bg-black/40 backdrop-blur-md text-white border border-white/10`}>
                                    Origin Founder
                                </div>
                                <div className="text-xs font-mono text-zinc-500 bg-black/40 px-2 py-1 rounded backdrop-blur-sm border border-white/5">#{formData.founderId}</div>
                            </div>

                            {/* Image/Art */}
                            <div className="absolute inset-0 z-10 transition-transform duration-700 group-hover:scale-110">
                                {formData.url && (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={formData.url}
                                        alt="NFT"
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            console.warn("NFT image load error, falling back to gradient");
                                            (e.target as HTMLImageElement).style.display = 'none';
                                        }}
                                    />
                                )}
                                {/* We removed the hue overlay because the images are now themed */}
                            </div>

                            {/* Center Visual Overlay for Tier */}
                            <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                                <div className={`w-20 h-20 rounded-full border flex items-center justify-center backdrop-blur-[2px] ${selectedTier === 1 ? "border-yellow-500/20 bg-yellow-500/5 text-yellow-500/40" :
                                    selectedTier === 2 ? "border-blue-500/20 bg-blue-500/5 text-blue-500/40" :
                                        "border-white/5 bg-white/5 text-white/20"
                                    }`}>
                                    <span className="text-4xl font-black">{selectedTier}</span>
                                </div>
                            </div>

                            {/* Card Footer */}
                            <div className="absolute bottom-0 left-0 right-0 p-8 z-20 bg-gradient-to-t from-black via-black/90 to-transparent">
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
