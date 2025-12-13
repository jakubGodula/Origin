import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { fromB64 } from '@mysten/sui/utils';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Configuration
const PACKAGE_ID = '0x998ac5444720781faa353368e3810b288db1efc38b8843f8f1ecff1f37689e6c';
const MARKETPLACE_ID = '0xe606eacf1d43b54378468ae8d1c11ef80bf4cc0557a071c5657d247b87508a5f';
const MODULE_NAME = 'listing';
const CLOCK_ID = '0x6';

// Job Data
const JOBS = [
    {
        title: "Senior Move Smart Contract Developer",
        description: "We are looking for an expert in Move to help us build the next generation of DeFi protocols on Sui.",
        details: "You will be responsible for designing and implementing secure smart contracts. Experience with Sui Move is a must.",
        skills: [{ name: "Move", years: 3 }, { name: "Rust", years: 5 }, { name: "DeFi", years: 2 }],
        tags: ["DeFi", "Smart Contracts", "Remote"],
        budget: 5000, // SUI
        paymentType: 0, // Fixed
        durationValue: 3,
        durationUnit: 3, // Months
        location: "Remote",
        locationRequired: true,
    },
    {
        title: "Frontend Engineer (React/Next.js)",
        description: "Join our team to build a beautiful and responsive frontend for our NFT marketplace.",
        details: "You will work closely with designers and backend engineers to deliver a seamless user experience.",
        skills: [{ name: "React", years: 4 }, { name: "Next.js", years: 2 }, { name: "TailwindCSS", years: 3 }],
        tags: ["Frontend", "NFT", "Web3"],
        budget: 40, // SUI/hr
        paymentType: 1, // Hourly
        durationValue: 6,
        durationUnit: 3, // Months
        location: "New York, NY",
        locationRequired: false,
    },
    {
        title: "Community Manager",
        description: "We need a charismatic community manager to grow and engage our Discord and Twitter communities.",
        details: "Responsibilities include content creation, moderation, and event organization.",
        skills: [{ name: "Community Management", years: 2 }, { name: "Social Media", years: 3 }],
        tags: ["Community", "Marketing", "Social"],
        budget: 2000, // SUI/month
        paymentType: 2, // Monthly
        durationValue: 0, // Indefinite
        durationUnit: 0, // None
        location: "Remote",
        locationRequired: false,
    },
    {
        title: "Rust Backend Developer",
        description: "Seeking a Rust developer to optimize our off-chain indexer and API services.",
        details: "High performance and reliability are critical. You will be working with large datasets.",
        skills: [{ name: "Rust", years: 4 }, { name: "PostgreSQL", years: 3 }, { name: "GraphQL", years: 2 }],
        tags: ["Backend", "Infrastructure", "Rust"],
        budget: 6000, // SUI
        paymentType: 0, // Fixed
        durationValue: 2,
        durationUnit: 3, // Months
        location: "London, UK",
        locationRequired: true,
    },
    {
        title: "UI/UX Designer",
        description: "Design the future of decentralized identity. We need a visionary designer.",
        details: "Create high-fidelity mockups and prototypes. Experience with Figma is required.",
        skills: [{ name: "Figma", years: 5 }, { name: "UI Design", years: 4 }, { name: "UX Research", years: 3 }],
        tags: ["Design", "UI/UX", "Creative"],
        budget: 3500, // SUI
        paymentType: 0, // Fixed
        durationValue: 1,
        durationUnit: 3, // Months
        location: "Remote",
        locationRequired: false,
    }
];

async function main() {
    // 1. Get Keypair from Sui CLI Keystore
    const homeDir = process.env.HOME || process.env.USERPROFILE;
    const keystorePath = path.join(homeDir!, '.sui', 'sui_config', 'sui.keystore');

    if (!fs.existsSync(keystorePath)) {
        console.error(`Keystore not found at ${keystorePath}`);
        process.exit(1);
    }

    const keystore = JSON.parse(fs.readFileSync(keystorePath, 'utf-8'));
    if (keystore.length === 0) {
        console.error("No keys found in keystore");
        process.exit(1);
    }

    // Use the first key (usually the active one)
    const keyBytes = fromB64(keystore[0]);
    // The first byte is the scheme flag (0x00 for Ed25519), so we slice it off
    const keypair = Ed25519Keypair.fromSecretKey(keyBytes.slice(1));
    const address = keypair.getPublicKey().toSuiAddress();
    console.log(`Using address: ${address}`);

    // 2. Setup Client
    const client = new SuiClient({ url: getFullnodeUrl('devnet') });

    // 3. Create Jobs
    for (const job of JOBS) {
        console.log(`Creating job: ${job.title}...`);

        const tx = new Transaction();
        const budgetMIST = BigInt(job.budget * 1_000_000_000);
        const deadline = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days from now

        tx.moveCall({
            target: `${PACKAGE_ID}::${MODULE_NAME}::create_job`,
            arguments: [
                tx.object(MARKETPLACE_ID),
                tx.pure.string(job.title),
                tx.pure.string(job.description),
                tx.pure.string(job.details),
                tx.pure.vector("vector<u8>", job.skills.map(s => new TextEncoder().encode(s.name))),
                tx.pure.vector("u8", job.skills.map(s => s.years)),
                tx.pure.vector("vector<u8>", job.tags.map(tag => new TextEncoder().encode(tag))),
                tx.pure.u64(budgetMIST),
                tx.pure.u8(job.paymentType),
                tx.pure.u64(job.durationValue),
                tx.pure.u8(job.durationUnit),
                tx.pure.vector("u8", new TextEncoder().encode(job.location)),
                tx.pure.bool(job.locationRequired),
                tx.pure.u64(deadline),
                tx.object(CLOCK_ID),
            ],
        });

        try {
            const result = await client.signAndExecuteTransaction({
                signer: keypair,
                transaction: tx,
                options: {
                    showEffects: true,
                },
            });

            if (result.effects?.status.status === 'success') {
                console.log(`✅ Job created! Digest: ${result.digest}`);
            } else {
                console.error(`❌ Failed to create job. Status: ${result.effects?.status.status}`);
            }
        } catch (e) {
            console.error(`❌ Error creating job: ${e}`);
        }
    }
}

main().catch(console.error);
