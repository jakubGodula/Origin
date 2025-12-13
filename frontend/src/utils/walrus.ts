export const WALRUS_PUBLISHER_URL = 'https://publisher.walrus-testnet.walrus.space/v1/blobs';
export const WALRUS_AGGREGATOR_URL = 'https://aggregator.walrus-testnet.walrus.space/v1';

export interface WalrusUploadResponse {
    newlyCreated: {
        blobObject: {
            id: string;
            storedEpoch: number;
            blobId: string;
            size: number;
            encodingType: string;
        };
        resourceOperation: {
            registerResource: {
                encodedLength: number;
            };
        };
        cost: number;
    };
    alreadyCertified: any;
}

/**
 * Uploads a file to the Walrus Testnet Publisher.
 * @param file The file to upload.
 * @returns The Blob ID of the uploaded file.
 */
export async function uploadToWalrus(file: File): Promise<string> {
    console.log('Uploading to Walrus:', WALRUS_PUBLISHER_URL);

    try {
        const response = await fetch(`${WALRUS_PUBLISHER_URL}?epochs=5`, {
            method: 'PUT',
            body: file,
        });

        console.log('Walrus response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Walrus upload error:', errorText);
            throw new Error(`Walrus upload failed (${response.status}): ${response.statusText}. ${errorText}`);
        }

        const data: WalrusUploadResponse = await response.json();
        console.log('Walrus response data:', data);

        // Return the Blob ID
        // Note: Structure might vary slightly based on API version, but this matches v1 docs.
        if (data.newlyCreated?.blobObject?.blobId) {
            return data.newlyCreated.blobObject.blobId;
        } else if (data.alreadyCertified?.blobId) {
            return data.alreadyCertified.blobId;
        }

        throw new Error('Invalid response structure from Walrus');
    } catch (error) {
        console.error('Error uploading to Walrus:', error);
        throw error;
    }
}

/**
 * Constructs a URL to view/download a blob from the Walrus Aggregator.
 * @param blobId The ID of the blob.
 * @returns The URL.
 */
export function getWalrusBlobUrl(blobId: string): string {
    return `${WALRUS_AGGREGATOR_URL}/${blobId}`;
}

// TODO: Implement SEAL encryption for Walrus uploads
// Use @mysten/seal SDK to encrypt files before upload with role-based access control:
// - Employer & Freelancer: Always have access
// - Admins/Moderators: Only during active disputes (dispute_active = true)
// See implementation plan: /Users/jakubgodula/.gemini/antigravity/brain/d4d9c32c-c8ef-4da4-a6b9-82dd339e8db4/implementation_plan.md
// Reference docs: https://seal-docs.wal.app
// WARNING: Currently all files are uploaded unencrypted and are public.
