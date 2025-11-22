export interface Job {
    id: number;
    title: string;
    description: string;
    price: string;
    tags: string[];
    postedBy: string;
    postedAt: string;
}

export const MOCK_JOBS: Job[] = [
    {
        id: 1,
        title: "Smart Contract Auditor Needed",
        description: "Looking for an experienced Move developer to audit our DeFi protocol's smart contracts. Focus on security and gas optimization.",
        price: "5000",
        tags: ["Smart Contracts", "Move", "Audit", "DeFi"],
        postedBy: "0x1234...5678",
        postedAt: "2 hours ago"
    },
    {
        id: 2,
        title: "Frontend Developer for NFT Marketplace",
        description: "We need a React/Next.js expert to build the frontend for our upcoming NFT marketplace on Sui. Must have experience with wallet integration.",
        price: "3500",
        tags: ["Frontend", "React", "Next.js", "NFT"],
        postedBy: "0x8765...4321",
        postedAt: "5 hours ago"
    },
    {
        id: 3,
        title: "Technical Writer for Whitepaper",
        description: "Seeking a technical writer to help draft the whitepaper for a new GameFi project. Must understand tokenomics and blockchain mechanics.",
        price: "1200",
        tags: ["Writing", "GameFi", "Tokenomics"],
        postedBy: "0xabcd...ef01",
        postedAt: "1 day ago"
    },
    {
        id: 4,
        title: "Community Manager",
        description: "Looking for a community manager to handle our Discord and Twitter. Experience in the Sui ecosystem is a plus.",
        price: "800",
        tags: ["Marketing", "Community", "Social Media"],
        postedBy: "0x9876...5432",
        postedAt: "1 day ago"
    },
    {
        id: 5,
        title: "Graphic Designer for Brand Identity",
        description: "Need a complete brand identity package including logo, color palette, and typography for a new DeFi protocol.",
        price: "1500",
        tags: ["Design", "Branding", "UI/UX"],
        postedBy: "0x2468...1357",
        postedAt: "2 days ago"
    }
];

export const getJobById = (id: string | number): Job | undefined => {
    return MOCK_JOBS.find(job => job.id === Number(id));
};
