# ProofOfWork: On-Chain Resume Builder

ProofOfWork is an on-chain resume platform that allows professionals to create verifiable work and education credentials as soulbound NFTs.

## Project Structure

- `app/` - Next.js frontend application
- `contract-create/` - Smart contracts and deployment scripts

## Getting Started

### Frontend Development

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```bash
# Required for NFT.Storage integration (for storing NFT metadata)
NEXT_PUBLIC_NFT_STORAGE_TOKEN=your_nft_storage_token

# Optional: Web3.Storage configuration (alternative storage option)
NEXT_PUBLIC_WEB3_STORAGE_TOKEN=your_web3_storage_token
NEXT_PUBLIC_WEB3_STORAGE_EMAIL=your_web3_storage_email@example.com
```

You can get API tokens by:
- NFT.Storage: Register at [nft.storage](https://nft.storage) to get an API token
- Web3.Storage: Register at [web3.storage](https://web3.storage) to get an API token and create an account with your email

### Smart Contract Management

This project includes scripts to manage smart contracts from the root directory:

```bash
# Clean all deployment artifacts and caches
npm run contracts:clean

# Deploy all contracts
npm run contracts:deploy

# Deploy individual contracts
npm run contracts:deploy:registry  # Deploy only VerificationRegistry
npm run contracts:deploy:resume    # Deploy only ResumeNFT

# Compile contracts
npm run contracts:compile

# Run contract tests
npm run contracts:test

# Check deployed contract addresses
npm run contracts:addresses
```

## Smart Contract Architecture

ProofOfWork consists of two main smart contracts:

1. **ResumeNFT.sol** - A soulbound NFT contract for storing resume entries with verification capabilities
2. **VerificationRegistry.sol** - A registry for managing verified organizations that can validate resume entries

For more details on smart contracts, see the [contract-create/README.md](./contract-create/README.md).

## Frontend Features

- Resume creation and management
- Verification request workflow
- Civic Auth integration for secure authentication
- Mobile-responsive design

## Deployment

The frontend application can be deployed on Vercel:

```bash
npm run build
npm run start
```

For smart contract deployment to testnets or mainnet, see the detailed instructions in [contract-create/README.md](./contract-create/README.md).

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Hardhat Documentation](https://hardhat.org/docs)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)
