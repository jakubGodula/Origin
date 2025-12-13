"use client";

import { X, ExternalLink, AlertTriangle, CheckCircle } from 'lucide-react';
import { getWalrusBlobUrl } from '@/utils/walrus';
import { Button } from './Button';

interface ReviewSubmissionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    workOid: string | null;
    jobTitle: string;
    amount: string;
}

export function ReviewSubmissionModal({ isOpen, onClose, onConfirm, workOid, jobTitle, amount }: ReviewSubmissionModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="relative w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl p-6 md:p-8 animate-in fade-in zoom-in-95 duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-white mb-2">Review Submission</h2>
                    <p className="text-zinc-400">
                        Please review the work submitted for <span className="text-white font-medium">{jobTitle}</span> before releasing funds.
                    </p>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8">
                    <div className="mb-4">
                        <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-2">Submitted Work</h3>
                        {workOid ? (
                            <div className="flex items-center justify-between bg-primary/10 border border-primary/20 p-4 rounded-lg">
                                <span className="text-primary font-mono text-sm truncate flex-1 mr-4">
                                    Blob ID: {workOid}
                                </span>
                                <a
                                    href={getWalrusBlobUrl(workOid)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-white hover:text-primary transition-colors text-sm font-medium"
                                >
                                    Open File <ExternalLink className="w-4 h-4" />
                                </a>
                            </div>
                        ) : (
                            <div className="text-red-400 text-sm">No work file ID found.</div>
                        )}
                    </div>
                </div>

                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex gap-3 mb-6">
                    <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <div>
                        <h4 className="text-sm font-bold text-red-400 mb-1">Final Confirmation Required</h4>
                        <p className="text-sm text-red-200/70">
                            Releasing the payment of <span className="font-bold text-white">{amount} SUI</span> is irreversible.
                            Ensure you have verified the submitted work meets your requirements.
                        </p>
                    </div>
                </div>

                <div className="flex justify-end gap-3">
                    <Button
                        onClick={onClose}
                        variant="secondary"
                        className="bg-white/5 hover:bg-white/10 border-white/10 text-white"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={onConfirm}
                        className="bg-green-600 hover:bg-green-500 text-white border-none shadow-[0_0_20px_rgba(22,163,74,0.3)]"
                    >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve & Release Payment
                    </Button>
                </div>
            </div>
        </div>
    );
}
