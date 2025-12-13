export function getRelativeTime(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;

    // Convert to seconds
    const seconds = Math.floor(diff / 1000);

    if (seconds < 60) return 'Just now';

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;

    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo ago`;

    return `${Math.floor(months / 12)}y ago`;
}

export const formatSui = (mist: string | number) => {
    const val = Number(mist);
    return isNaN(val) ? '0' : (val / 1_000_000_000).toLocaleString();
};
