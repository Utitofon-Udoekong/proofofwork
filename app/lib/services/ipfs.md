# IPFS Service Documentation

The IPFS Service in ProofOfWork provides a unified interface for storing files and metadata on IPFS using either NFT.Storage or Web3.Storage.

## Overview

The service is implemented as a singleton and offers methods to:
- Upload single files
- Upload directories of files
- Upload and store resume metadata
- Convert IPFS URIs to HTTP URLs (for displaying content)

## Setting Up

1. Create a `.env.local` file in the root directory with the following variables:

```
# Required for NFT.Storage integration (for storing NFT metadata)
NEXT_PUBLIC_NFT_STORAGE_TOKEN=your_nft_storage_token

# Optional: Web3.Storage configuration (alternative storage option)
NEXT_PUBLIC_WEB3_STORAGE_EMAIL=your_web3_storage_email@example.com
```

2. Get API tokens:
   - NFT.Storage: Register at [nft.storage](https://nft.storage) to get an API token
   - Web3.Storage: Register at [web3.storage](https://web3.storage) to create an account with your email

## Usage

```typescript
import { ipfsService } from '@/app/lib/services/ipfs';

// Upload a single file
const file = new File(['file content'], 'example.txt');
const ipfsUri = await ipfsService.uploadFile(file);
// Returns: ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi

// Upload a directory of files
const files = [
  new File(['file content 1'], 'folder/example1.txt'),
  new File(['file content 2'], 'folder/example2.txt')
];
const ipfsDirectoryUri = await ipfsService.uploadDirectory(files);

// Upload resume metadata
const metadata = {
  name: "Software Developer Resume",
  description: "My professional experience",
  skills: ["JavaScript", "TypeScript", "React"]
};
const metadataUri = await ipfsService.uploadResumeMetadata(metadata);

// Convert IPFS URI to HTTP URL for display
const httpUrl = ipfsService.getHttpUrl(ipfsUri);
// Returns: https://w3s.link/ipfs/bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi
```

## Implementation Details

### Service Priority

1. The service attempts to use both NFT.Storage and Web3.Storage, with preference given to:
   - NFT.Storage for metadata (better suited for NFT metadata)
   - Web3.Storage for file uploads (with fallback to NFT.Storage)

2. If uploads fail with Web3.Storage, the service will automatically fall back to NFT.Storage when possible.

### w3up-client Integration

This service utilizes `@web3-storage/w3up-client` to interact with Web3.Storage's w3up platform. The implementation follows these steps:

1. **Client Initialization**: A client is created on-demand when first needed.

2. **Authentication Flow**:
   - When a user needs to upload, the service logs in with the provided email
   - This triggers an email verification process (first time only)
   - After verification, the service can access or create a Space

3. **Space Provisioning**:
   - A Space is a namespace for your content on Web3.Storage
   - The service either uses an existing Space or creates a new one
   - All uploads are associated with this Space

4. **Upload Process**:
   - Files are processed locally to generate IPFS Content IDs (CIDs)
   - Data is uploaded to Web3.Storage and associated with your Space
   - The resulting CID can be used to access your data through any IPFS gateway

For more advanced usage of w3up-client (including custom authentication flows, space creation, and delegation), refer to the [official documentation](https://web3.storage/docs/w3up-client/).

## Troubleshooting

- **First-time Setup**: The first upload attempt may take longer as it needs to complete the email verification and space setup.
- **Email Verification**: If uploads fail, check your email for a verification link from Web3.Storage.
- **API Tokens**: Ensure your API tokens are valid and correctly set in your `.env.local` file.
- **Connection Issues**: For large files, Web3.Storage may be more reliable as it handles sharding automatically.
- **Error Logging**: Check the console for detailed error messages if uploads fail. 