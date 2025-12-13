"use client";

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Button } from '@/components/Button';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useIsSuperAdmin } from '@/hooks/useIsSuperAdmin';
import { useSuiClientQuery, useSignAndExecuteTransaction, useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { MARKETPLACE_ID, PACKAGE_ID, LANGUAGES } from '@/utils/constants';
import { formatSui } from '@/utils/format';
import { Transaction } from '@mysten/sui/transactions';

export default function AdminPage() {
    const account = useCurrentAccount();
    const suiClient = useSuiClient();
    const { isAdmin, isLoading: isAdminLoading } = useIsAdmin();
    const { isSuperAdmin } = useIsSuperAdmin();
    const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
    const [newFee, setNewFee] = useState('');
    const [newAdminAddress, setNewAdminAddress] = useState('');
    const [transferAdminAddress, setTransferAdminAddress] = useState('');
    const [newModeratorAddress, setNewModeratorAddress] = useState('');
    const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
    const [isUpdating, setIsUpdating] = useState(false);
    const [marketplaceCap, setMarketplaceCap] = useState<string | null>(null);
    const [adminsList, setAdminsList] = useState<string[]>([]);
    const [moderatorsList, setModeratorsList] = useState<{ address: string, languages: string[] }[]>([]);
    const [isLoadingAdmins, setIsLoadingAdmins] = useState(true);
    const [isLoadingModerators, setIsLoadingModerators] = useState(true);
    const [editingModeratorAddress, setEditingModeratorAddress] = useState<string | null>(null);
    const [editingLanguages, setEditingLanguages] = useState<string[]>([]);

    // Fetch marketplace data
    const { data: marketplace, isLoading: isMarketplaceLoading, refetch } = useSuiClientQuery(
        'getObject',
        {
            id: MARKETPLACE_ID,
            options: {
                showContent: true,
            },
        }
    );

    // Fetch MarketplaceCap owned by current user
    useEffect(() => {
        async function fetchMarketplaceCap() {
            if (!account) return;

            try {
                const objects = await suiClient.getOwnedObjects({
                    owner: account.address,
                    filter: {
                        StructType: `${PACKAGE_ID}::marketplace::MarketplaceCap`
                    },
                });

                if (objects.data && objects.data.length > 0) {
                    setMarketplaceCap(objects.data[0].data?.objectId || null);
                }
            } catch (error) {
                console.error('Error fetching MarketplaceCap:', error);
            }
        }

        fetchMarketplaceCap();
    }, [account, suiClient]);

    // Fetch admins list by querying dynamic fields
    useEffect(() => {
        async function fetchAdmins() {
            if (!marketplace?.data) return;

            try {
                const marketplaceContent = marketplace.data.content;
                if (!marketplaceContent || !('fields' in marketplaceContent)) return;

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const fields = marketplaceContent.fields as any;
                const adminsTableId = fields.admins?.fields?.id?.id;

                if (!adminsTableId) {
                    setAdminsList([]);
                    setIsLoadingAdmins(false);
                    return;
                }

                // Fetch dynamic fields (admins)
                const dynamicFields = await suiClient.getDynamicFields({
                    parentId: adminsTableId,
                });

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const adminAddresses = dynamicFields.data.map((field: any) => {
                    // The name of the dynamic field is the admin address
                    return field.name.value;
                });

                setAdminsList(adminAddresses);
            } catch (error) {
                console.error('Error fetching admins:', error);
                setAdminsList([]);
            } finally {
                setIsLoadingAdmins(false);
            }
        }

        fetchAdmins();
    }, [marketplace, suiClient]);

    // Fetch moderators list with languages
    useEffect(() => {
        async function fetchModerators() {
            if (!marketplace?.data?.content) {
                setIsLoadingModerators(false);
                return;
            }

            try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const fields = marketplace.data.content.fields as any;
                const moderatorsTableId = fields?.moderators?.fields?.id?.id;

                if (!moderatorsTableId) {
                    setModeratorsList([]);
                    setIsLoadingModerators(false);
                    return;
                }

                const dynamicFields = await suiClient.getDynamicFields({
                    parentId: moderatorsTableId,
                });

                // Fetch each moderator's details (languages)
                const moderatorsWithLanguages = await Promise.all(
                    dynamicFields.data.map(async (field: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
                        try {
                            const fieldData = await suiClient.getDynamicFieldObject({
                                parentId: moderatorsTableId,
                                name: field.name,
                            });

                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            const moderatorData = fieldData.data?.content as any;
                            const languages = moderatorData?.fields?.value || [];

                            return {
                                address: field.name.value,
                                languages: languages,
                            };
                        } catch (error) {
                            console.error(`Error fetching moderator ${field.name.value}:`, error);
                            return {
                                address: field.name.value,
                                languages: [],
                            };
                        }
                    })
                );

                setModeratorsList(moderatorsWithLanguages);
            } catch (error) {
                console.error('Error fetching moderators:', error);
                setModeratorsList([]);
            } finally {
                setIsLoadingModerators(false);
            }
        }

        fetchModerators();
    }, [marketplace, suiClient]);

    if (isAdminLoading || isMarketplaceLoading) {
        return (
            <div className="min-h-screen bg-background text-foreground">
                <Header />
                <main className="pt-24 pb-12 px-6">
                    <div className="container mx-auto max-w-5xl">
                        <div className="text-white text-center">Loading...</div>
                    </div>
                </main>
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-background text-foreground">
                <Header />
                <main className="pt-24 pb-12 px-6">
                    <div className="container mx-auto max-w-5xl">
                        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-8 text-center">
                            <h1 className="text-3xl font-bold text-red-400 mb-4">Access Denied</h1>
                            <p className="text-zinc-400">
                                You do not have permission to access the admin panel.
                            </p>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    // Extract marketplace fields
    const marketplaceContent = marketplace?.data?.content;
    const fields = marketplaceContent && 'fields' in marketplaceContent
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ? (marketplaceContent.fields as any)
        : null;

    const platformFeeBps = fields?.platform_fee_bps || 0;
    const totalJobs = fields?.total_jobs || 0;
    const totalVolume = fields?.total_volume || 0;
    const isPaused = fields?.paused || false;
    const feeCollector = fields?.fee_collector || 'N/A';
    const superAdmin = fields?.admin || 'N/A';

    const handleUpdateFee = async () => {
        const feeBps = parseInt(newFee);
        if (isNaN(feeBps) || feeBps < 0 || feeBps > 1000) {
            alert('Fee must be between 0 and 1000 basis points (0-10%)');
            return;
        }

        if (!marketplaceCap) {
            alert('MarketplaceCap not found. Only the marketplace creator can update fees.');
            return;
        }

        setIsUpdating(true);

        try {
            const tx = new Transaction();
            tx.moveCall({
                target: `${PACKAGE_ID}::marketplace::update_fee`,
                arguments: [
                    tx.object(MARKETPLACE_ID),
                    tx.object(marketplaceCap),
                    tx.pure.u64(feeBps),
                ],
            });

            signAndExecuteTransaction(
                { transaction: tx },
                {
                    onSuccess: () => {
                        alert('Fee updated successfully!');
                        setNewFee('');
                        refetch();
                    },
                    onError: (error) => {
                        console.error('Error updating fee:', error);
                        alert(`Failed to update fee: ${error.message}`);
                    },
                }
            );
        } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            console.error('Error updating fee:', error);
            alert(`Failed to update fee: ${error.message}`);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleTogglePause = async () => {
        if (!marketplaceCap) {
            alert('MarketplaceCap not found. Only the marketplace creator can pause/unpause.');
            return;
        }

        setIsUpdating(true);

        try {
            const tx = new Transaction();
            tx.moveCall({
                target: `${PACKAGE_ID}::marketplace::set_paused`,
                arguments: [
                    tx.object(MARKETPLACE_ID),
                    tx.object(marketplaceCap),
                    tx.pure.bool(!isPaused),
                ],
            });

            signAndExecuteTransaction(
                { transaction: tx },
                {
                    onSuccess: () => {
                        alert(`Marketplace ${!isPaused ? 'paused' : 'resumed'} successfully!`);
                        refetch();
                    },
                    onError: (error) => {
                        console.error('Error toggling pause:', error);
                        alert(`Failed to toggle pause: ${error.message}`);
                    },
                }
            );
        } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            console.error('Error toggling pause:', error);
            alert(`Failed to toggle pause: ${error.message}`);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleAddAdmin = async () => {
        if (!newAdminAddress || newAdminAddress.length !== 66 || !newAdminAddress.startsWith('0x')) {
            alert('Please enter a valid Sui address (66 characters starting with 0x)');
            return;
        }

        if (!marketplaceCap) {
            alert('MarketplaceCap not found. Only the super admin can add admins.');
            return;
        }

        setIsUpdating(true);

        try {
            const tx = new Transaction();
            tx.moveCall({
                target: `${PACKAGE_ID}::marketplace::add_admin`,
                arguments: [
                    tx.object(MARKETPLACE_ID),
                    tx.object(marketplaceCap),
                    tx.pure.address(newAdminAddress),
                ],
            });

            signAndExecuteTransaction(
                { transaction: tx },
                {
                    onSuccess: () => {
                        alert('Admin added successfully!');
                        setNewAdminAddress('');
                        refetch();
                        // Refresh admins list
                        setTimeout(() => window.location.reload(), 1000);
                    },
                    onError: (error) => {
                        console.error('Error adding admin:', error);
                        alert(`Failed to add admin: ${error.message}`);
                    },
                }
            );
        } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            console.error('Error adding admin:', error);
            alert(`Failed to add admin: ${error.message}`);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleRemoveAdmin = async (adminAddress: string) => {
        if (!confirm(`Are you sure you want to remove admin: ${adminAddress.slice(0, 10)}...${adminAddress.slice(-8)}?`)) {
            return;
        }

        if (!marketplaceCap) {
            alert('MarketplaceCap not found. Only the super admin can remove admins.');
            return;
        }

        setIsUpdating(true);

        try {
            const tx = new Transaction();
            tx.moveCall({
                target: `${PACKAGE_ID}::marketplace::remove_admin`,
                arguments: [
                    tx.object(MARKETPLACE_ID),
                    tx.object(marketplaceCap),
                    tx.pure.address(adminAddress),
                ],
            });

            signAndExecuteTransaction(
                { transaction: tx },
                {
                    onSuccess: () => {
                        alert('Admin removed successfully!');
                        refetch();
                        // Refresh admins list
                        setTimeout(() => window.location.reload(), 1000);
                    },
                    onError: (error) => {
                        console.error('Error removing admin:', error);
                        alert(`Failed to remove admin: ${error.message}`);
                    },
                }
            );
        } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            console.error('Error removing admin:', error);
            alert(`Failed to remove admin: ${error.message}`);
        } finally {
            setIsUpdating(false);
        }
    };

    const handlePromoteToSuperAdmin = async () => {
        if (!transferAdminAddress || transferAdminAddress.length !== 66 || !transferAdminAddress.startsWith('0x')) {
            alert('Please enter a valid Sui address (66 characters starting with 0x)');
            return;
        }

        if (!confirm(`Promote ${transferAdminAddress} to Super Admin?\n\nThey will have full admin rights including the ability to add/remove admins and other super admins.`)) {
            return;
        }

        if (!marketplaceCap) {
            alert('MarketplaceCap not found. Only super admins can promote to super admin.');
            return;
        }

        setIsUpdating(true);

        try {
            const tx = new Transaction();
            tx.moveCall({
                target: `${PACKAGE_ID}::marketplace::promote_to_super_admin`,
                arguments: [
                    tx.object(MARKETPLACE_ID),
                    tx.object(marketplaceCap),
                    tx.pure.address(transferAdminAddress),
                ],
            });

            signAndExecuteTransaction(
                { transaction: tx },
                {
                    onSuccess: () => {
                        alert('Successfully promoted to super admin!');
                        setTransferAdminAddress('');
                        refetch();
                        setTimeout(() => window.location.reload(), 1000);
                    },
                    onError: (error) => {
                        console.error('Error promoting to super admin:', error);
                        alert(`Failed to promote: ${error.message}`);
                    },
                }
            );
        } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            console.error('Error promoting to super admin:', error);
            alert(`Failed to promote: ${error.message}`);
        } finally {
            setIsUpdating(false);
        }
    };

    // Moderator Management Handlers
    const handleAddModerator = async () => {
        if (!newModeratorAddress || newModeratorAddress.length !== 66 || !newModeratorAddress.startsWith('0x')) {
            alert('Please enter a valid Sui address (66 characters starting with 0x)');
            return;
        }

        if (!marketplaceCap) {
            alert('MarketplaceCap not found.');
            return;
        }

        setIsUpdating(true);

        try {
            const tx = new Transaction();
            tx.moveCall({
                target: `${PACKAGE_ID}::marketplace::add_moderator`,
                arguments: [
                    tx.object(MARKETPLACE_ID),
                    tx.object(marketplaceCap),
                    tx.pure.address(newModeratorAddress),
                    tx.pure.vector("string", selectedLanguages),
                ],
            });

            signAndExecuteTransaction(
                { transaction: tx },
                {
                    onSuccess: () => {
                        alert('Moderator added successfully!');
                        setNewModeratorAddress('');
                        setSelectedLanguages([]);
                        refetch();
                    },
                    onError: (error) => {
                        console.error('Error adding moderator:', error);
                        alert(`Failed to add moderator: ${error.message}`);
                    },
                }
            );
        } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            console.error('Error adding moderator:', error);
            alert(`Failed to add moderator: ${error.message}`);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleRemoveModerator = async (moderatorAddress: string) => {
        if (!confirm(`Are you sure you want to remove this moderator?\n\n${moderatorAddress}`)) {
            return;
        }

        if (!marketplaceCap) {
            alert('MarketplaceCap not found.');
            return;
        }

        setIsUpdating(true);

        try {
            const tx = new Transaction();
            tx.moveCall({
                target: `${PACKAGE_ID}::marketplace::remove_moderator`,
                arguments: [
                    tx.object(MARKETPLACE_ID),
                    tx.object(marketplaceCap),
                    tx.pure.address(moderatorAddress),
                ],
            });

            signAndExecuteTransaction(
                { transaction: tx },
                {
                    onSuccess: () => {
                        alert('Moderator removed successfully!');
                        refetch();
                    },
                    onError: (error) => {
                        console.error('Error removing moderator:', error);
                        alert(`Failed to remove moderator: ${error.message}`);
                    },
                }
            );
        } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            console.error('Error removing moderator:', error);
            alert(`Failed to remove moderator: ${error.message}`);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleUpdateModeratorLanguages = async (moderatorAddress: string) => {
        if (editingLanguages.length === 0) {
            alert('Please select at least one language');
            return;
        }

        if (!marketplaceCap) {
            alert('MarketplaceCap not found.');
            return;
        }

        setIsUpdating(true);

        try {
            const tx = new Transaction();
            tx.moveCall({
                target: `${PACKAGE_ID}::marketplace::update_moderator_languages`,
                arguments: [
                    tx.object(MARKETPLACE_ID),
                    tx.object(marketplaceCap),
                    tx.pure.address(moderatorAddress),
                    tx.pure.vector("string", editingLanguages),
                ],
            });

            signAndExecuteTransaction(
                { transaction: tx },
                {
                    onSuccess: () => {
                        alert('Moderator languages updated successfully!');
                        setEditingModeratorAddress(null);
                        setEditingLanguages([]);
                        refetch();
                    },
                    onError: (error) => {
                        console.error('Error updating moderator languages:', error);
                        alert(`Failed to update languages: ${error.message}`);
                    },
                }
            );
        } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            console.error('Error updating moderator languages:', error);
            alert(`Failed to update languages: ${error.message}`);
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Header />
            <main className="pt-24 pb-12 px-6">
                <div className="container mx-auto max-w-5xl">
                    <div className="mb-12">
                        <h1 className="text-4xl font-bold text-white mb-4">Admin Panel</h1>
                        <p className="text-zinc-400 text-lg">
                            Manage platform settings and monitor marketplace activity
                        </p>
                        {isSuperAdmin && (
                            <div className="mt-2 inline-block px-3 py-1 rounded-full bg-primary/20 text-primary border border-primary/30 text-sm font-medium">
                                Super Admin
                            </div>
                        )}
                    </div>

                    {/* Platform Statistics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-black/30 border border-white/10 rounded-xl p-6">
                            <div className="text-zinc-400 text-sm mb-2">Total Jobs</div>
                            <div className="text-3xl font-bold text-white">{totalJobs}</div>
                        </div>
                        <div className="bg-black/30 border border-white/10 rounded-xl p-6">
                            <div className="text-zinc-400 text-sm mb-2">Total Volume</div>
                            <div className="text-3xl font-bold text-white">{formatSui(totalVolume)} SUI</div>
                        </div>
                        <div className="bg-black/30 border border-white/10 rounded-xl p-6">
                            <div className="text-zinc-400 text-sm mb-2">Platform Fee</div>
                            <div className="text-3xl font-bold text-white">{platformFeeBps} bps</div>
                            <div className="text-xs text-zinc-500 mt-1">({(platformFeeBps / 100).toFixed(1)}%)</div>
                        </div>
                    </div>

                    {/* Moderator Management - All Admins */}
                    <div className="bg-black/30 border border-white/10 rounded-xl p-6 mb-8">
                        <h2 className="text-xl font-bold text-white mb-4">Moderator Management</h2>

                        {/* Current Moderators List */}
                        <div className="mb-6">
                            <div className="text-zinc-400 text-sm mb-2">Current Moderators ({moderatorsList.length})</div>
                            {isLoadingModerators ? (
                                <div className="text-zinc-500 text-sm">Loading moderators...</div>
                            ) : moderatorsList.length === 0 ? (
                                <div className="text-zinc-500 text-sm">No moderators added yet</div>
                            ) : (
                                <div className="space-y-3">
                                    {moderatorsList.map((moderator) => (
                                        <div key={moderator.address} className="bg-black/30 p-4 rounded-lg border border-white/5">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex-1">
                                                    <span className="text-white font-mono text-sm break-all block mb-2">{moderator.address}</span>
                                                    {editingModeratorAddress === moderator.address ? (
                                                        <div className="mt-3">
                                                            <div className="flex flex-wrap gap-2 mb-3">
                                                                {LANGUAGES.map((lang) => (
                                                                    <button
                                                                        key={lang}
                                                                        onClick={() => {
                                                                            setEditingLanguages(prev =>
                                                                                prev.includes(lang)
                                                                                    ? prev.filter(l => l !== lang)
                                                                                    : [...prev, lang]
                                                                            );
                                                                        }}
                                                                        className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${editingLanguages.includes(lang)
                                                                            ? 'bg-primary/20 border-primary text-primary'
                                                                            : 'bg-black/30 border-white/10 text-zinc-400 hover:border-white/30'
                                                                            }`}
                                                                    >
                                                                        {lang}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <Button
                                                                    onClick={() => handleUpdateModeratorLanguages(moderator.address)}
                                                                    disabled={isUpdating || editingLanguages.length === 0}
                                                                    className="text-sm"
                                                                >
                                                                    Save
                                                                </Button>
                                                                <Button
                                                                    onClick={() => {
                                                                        setEditingModeratorAddress(null);
                                                                        setEditingLanguages([]);
                                                                    }}
                                                                    variant="secondary"
                                                                    className="text-sm"
                                                                >
                                                                    Cancel
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-wrap gap-2">
                                                            {moderator.languages.length > 0 ? (
                                                                moderator.languages.map((lang) => (
                                                                    <span
                                                                        key={lang}
                                                                        className="px-2 py-1 rounded-full text-xs bg-primary/20 border border-primary/30 text-primary"
                                                                    >
                                                                        {lang}
                                                                    </span>
                                                                ))
                                                            ) : (
                                                                <span className="text-zinc-500 text-xs italic">No languages assigned</span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex gap-2 ml-4">
                                                    {editingModeratorAddress !== moderator.address && (
                                                        <Button
                                                            variant="secondary"
                                                            onClick={() => {
                                                                setEditingModeratorAddress(moderator.address);
                                                                setEditingLanguages(moderator.languages);
                                                            }}
                                                            disabled={isUpdating}
                                                            className="text-sm whitespace-nowrap"
                                                        >
                                                            Edit Languages
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="secondary"
                                                        onClick={() => handleRemoveModerator(moderator.address)}
                                                        disabled={isUpdating}
                                                        className="text-sm whitespace-nowrap text-red-400 hover:text-red-300"
                                                    >
                                                        Remove
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Add Moderator */}
                        <div className="border-t border-white/10 pt-6">
                            <h3 className="text-white font-medium mb-3">Add New Moderator</h3>
                            <div className="flex gap-4">
                                <input
                                    type="text"
                                    value={newModeratorAddress}
                                    onChange={(e) => setNewModeratorAddress(e.target.value)}
                                    placeholder="Enter moderator address (0x...)"
                                    className="flex-1 px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-primary/50 font-mono text-sm"
                                />
                            </div>

                            <div className="mt-4 mb-4">
                                <label className="text-zinc-400 text-sm mb-2 block">
                                    Languages (Select at least one)
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {LANGUAGES.map((lang) => (
                                        <button
                                            key={lang}
                                            onClick={() => {
                                                setSelectedLanguages(prev =>
                                                    prev.includes(lang)
                                                        ? prev.filter(l => l !== lang)
                                                        : [...prev, lang]
                                                );
                                            }}
                                            className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${selectedLanguages.includes(lang)
                                                ? 'bg-primary/20 border-primary text-primary'
                                                : 'bg-black/30 border-white/10 text-zinc-400 hover:border-white/30'
                                                }`}
                                        >
                                            {lang}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <Button
                                    onClick={handleAddModerator}
                                    disabled={isUpdating || !newModeratorAddress || !marketplaceCap || selectedLanguages.length === 0}
                                    className="whitespace-nowrap"
                                >
                                    Add Moderator
                                </Button>
                            </div>
                            <div className="text-xs text-zinc-500 mt-2">
                                Moderators can verify candidate/employer profiles and view disputes.
                            </div>
                        </div>
                    </div>

                    {/* Admin Management - Super Admin Only */}
                    {isSuperAdmin && (
                        <div className="bg-black/30 border border-white/10 rounded-xl p-6 mb-8">
                            <h2 className="text-xl font-bold text-white mb-4">Admin Management</h2>

                            {/* Super Admin Info */}
                            <div className="mb-6">
                                <div className="text-zinc-400 text-sm mb-2">Super Admin (You)</div>
                                <div className="text-white font-mono text-sm break-all bg-black/30 p-3 rounded-lg border border-primary/30">
                                    {superAdmin}
                                </div>
                            </div>

                            {/* Current Admins List */}
                            <div className="mb-6">
                                <div className="text-zinc-400 text-sm mb-2">Additional Admins ({adminsList.length})</div>
                                {isLoadingAdmins ? (
                                    <div className="text-zinc-500 text-sm">Loading admins...</div>
                                ) : adminsList.length === 0 ? (
                                    <div className="text-zinc-500 text-sm italic">No additional admins</div>
                                ) : (
                                    <div className="space-y-2">
                                        {adminsList.map((admin, index) => (
                                            <div key={index} className="flex items-center justify-between bg-black/30 p-3 rounded-lg border border-white/5">
                                                <div className="text-white font-mono text-sm break-all flex-1">{admin}</div>
                                                <Button
                                                    onClick={() => handleRemoveAdmin(admin)}
                                                    disabled={isUpdating}
                                                    variant="secondary"
                                                    className="ml-4 text-red-400 hover:text-red-300"
                                                >
                                                    Remove
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Add New Admin */}
                            <div>
                                <label className="text-zinc-400 text-sm mb-2 block">
                                    Add New Admin
                                </label>
                                <div className="flex gap-4">
                                    <input
                                        type="text"
                                        value={newAdminAddress}
                                        onChange={(e) => setNewAdminAddress(e.target.value)}
                                        placeholder="0x..."
                                        className="flex-1 px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-primary/50 font-mono text-sm"
                                    />
                                    <Button
                                        onClick={handleAddAdmin}
                                        disabled={isUpdating || !newAdminAddress || !marketplaceCap}
                                        className="whitespace-nowrap"
                                    >
                                        Add Admin
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Promote to Super Admin - Super Admin Only */}
                    {isSuperAdmin && (
                        <div className="bg-primary/10 border border-primary/30 rounded-xl p-6 mb-8">
                            <h2 className="text-xl font-bold text-primary mb-2">Promote Admin to Super Admin</h2>
                            <p className="text-zinc-400 text-sm mb-4">
                                Promote any address to super admin status. Multiple super admins provide redundancy and avoid the "bus factor".
                            </p>

                            <div className="flex gap-4">
                                <input
                                    type="text"
                                    value={transferAdminAddress}
                                    onChange={(e) => setTransferAdminAddress(e.target.value)}
                                    placeholder="0x... (address to promote)"
                                    className="flex-1 px-4 py-3 bg-black/50 border border-primary/30 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-primary/50 font-mono text-sm"
                                />
                                <Button
                                    onClick={handlePromoteToSuperAdmin}
                                    disabled={isUpdating || !transferAdminAddress || !marketplaceCap}
                                    className="whitespace-nowrap"
                                >
                                    Promote to Super Admin
                                </Button>
                            </div>
                        </div>
                    )}


                    {/* Marketplace Information */}
                    <div className="bg-black/30 border border-white/10 rounded-xl p-6 mb-8">
                        <h2 className="text-xl font-bold text-white mb-4">Marketplace Information</h2>
                        <div className="space-y-3">
                            <div>
                                <div className="text-zinc-400 text-sm">Fee Collector</div>
                                <div className="text-white font-mono text-sm break-all">{feeCollector}</div>
                            </div>
                            <div>
                                <div className="text-zinc-400 text-sm">Marketplace Status</div>
                                <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${isPaused
                                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                    : 'bg-green-500/20 text-green-400 border border-green-500/30'
                                    }`}>
                                    {isPaused ? 'Paused' : 'Active'}
                                </div>
                            </div>
                            {marketplaceCap && (
                                <div>
                                    <div className="text-zinc-400 text-sm">MarketplaceCap</div>
                                    <div className="text-green-400 font-mono text-sm break-all">✓ Found</div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Fee Management - Super Admin Only */}
                    {isSuperAdmin && (
                        <div className="bg-black/30 border border-white/10 rounded-xl p-6 mb-8">
                            <h2 className="text-xl font-bold text-white mb-4">Fee Management</h2>
                            <div className="flex gap-4 items-end">
                                <div className="flex-1">
                                    <label className="text-zinc-400 text-sm mb-2 block">
                                        New Platform Fee (basis points, max 1000)
                                    </label>
                                    <input
                                        type="number"
                                        value={newFee}
                                        onChange={(e) => setNewFee(e.target.value)}
                                        placeholder={`Current: ${platformFeeBps} bps`}
                                        className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-primary/50"
                                        min="0"
                                        max="1000"
                                    />
                                    <div className="text-xs text-zinc-500 mt-1">
                                        {newFee && !isNaN(parseInt(newFee)) && `${(parseInt(newFee) / 100).toFixed(1)}%`}
                                    </div>
                                </div>
                                <Button
                                    onClick={handleUpdateFee}
                                    disabled={isUpdating || !newFee || !marketplaceCap}
                                    className="whitespace-nowrap"
                                >
                                    Update Fee
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Marketplace Controls - Super Admin Only */}
                    {isSuperAdmin && (
                        <div className="bg-black/30 border border-white/10 rounded-xl p-6 mb-8">
                            <h2 className="text-xl font-bold text-white mb-4">Marketplace Controls</h2>
                            <div className="flex gap-4">
                                <Button
                                    onClick={handleTogglePause}
                                    disabled={isUpdating || !marketplaceCap}
                                    variant={isPaused ? 'primary' : 'secondary'}
                                >
                                    {isPaused ? 'Unpause Marketplace' : 'Pause Marketplace'}
                                </Button>
                            </div>
                            <p className="text-zinc-500 text-sm mt-4">
                                {isPaused
                                    ? 'The marketplace is currently paused. No new jobs can be created.'
                                    : 'The marketplace is currently active. You can pause it to prevent new job listings.'}
                            </p>
                        </div>
                    )}

                    {/* Status Message */}
                    {!marketplaceCap && (
                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6">
                            <h3 className="text-yellow-400 font-semibold mb-2">⚠️ MarketplaceCap Not Found</h3>
                            <p className="text-zinc-400 text-sm">
                                The MarketplaceCap object is required to execute admin functions. Only the super admin who created the marketplace has this capability.
                            </p>
                        </div>
                    )}
                </div>
            </main >
        </div >
    );
}
