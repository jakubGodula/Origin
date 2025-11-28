"use client";

import { createNetworkConfig, SuiClientProvider, WalletProvider } from "@mysten/dapp-kit";
import { getFullnodeUrl } from "@mysten/sui/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";


const { networkConfig } = createNetworkConfig({
    testnet: { url: getFullnodeUrl("testnet") },
    devnet: { url: getFullnodeUrl("devnet") },
});

// Custom theme with emerald green primary color
const customTheme = {
    blurs: {
        modalOverlay: '10px'
    },
    backgroundColors: {
        primaryButton: '#10b981',
        primaryButtonHover: '#059669',
        outlineButtonHover: 'rgba(16, 185, 129, 0.1)',
        walletItemHover: 'rgba(16, 185, 129, 0.1)',
        walletItemSelected: 'rgba(16, 185, 129, 0.2)',
        modalOverlay: 'rgba(0, 0, 0, 0.7)',
        modalPrimary: '#1a1a1a',
        modalSecondary: '#0a0a0a',
        iconButton: 'transparent',
        iconButtonHover: 'rgba(16, 185, 129, 0.1)',
        dropdownMenu: '#1a1a1a',
        dropdownMenuSeparator: '#2a2a2a',
    },
    borderColors: {
        outlineButton: '#10b981',
    },
    colors: {
        primaryButton: '#ffffff',
        outlineButton: '#10b981',
        iconButton: '#ededed',
        body: '#ededed',
        bodyMuted: '#9ca3af',
        bodyDanger: '#ef4444',
    },
    radii: {
        small: '6px',
        medium: '8px',
        large: '12px',
        xlarge: '16px',
    },
    shadows: {
        primaryButton: '0 0 10px rgba(16, 185, 129, 0.3)',
        walletItemSelected: '0 0 8px rgba(16, 185, 129, 0.2)',
    },
    fontWeights: {
        normal: '400',
        medium: '500',
        bold: '600',
    },
    fontSizes: {
        small: '14px',
        medium: '16px',
        large: '18px',
        xlarge: '20px',
    },
    typography: {
        fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        fontStyle: 'normal',
        lineHeight: '1.3',
        letterSpacing: 'normal',
    },
} as const;

export function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient());

    return (
        <QueryClientProvider client={queryClient}>
            <SuiClientProvider networks={networkConfig} defaultNetwork="devnet">
                <WalletProvider autoConnect theme={customTheme}>
                    {children}
                </WalletProvider>
            </SuiClientProvider>
        </QueryClientProvider>
    );
}
