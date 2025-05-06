# ProofOfWork On-Chain Resume Builder - Smart Contracts

This directory contains the smart contracts for the On-Chain Resume Builder project.

## Contracts

- **ResumeNFT**: The main contract that manages resume entries, verification requests, and soulbound NFT functionality.
- **VerificationRegistry**: A registry contract that keeps track of verified organizations.

## Getting Started

### Prerequisites

- Node.js 16+
- pnpm or npm
- Hardhat

### Installation

```bash
# Install dependencies
pnpm install
```

## Development

### Testing

Run the tests to ensure everything is working correctly:

```bash
npx hardhat test
```

### Deployment Scripts

This project provides three deployment scripts for different scenarios:

#### 1. Deploy All Contracts

Deploy both VerificationRegistry and ResumeNFT in one step:

```bash
npx hardhat run scripts/deploy-all.ts --network localhost
```

#### 2. Deploy VerificationRegistry Only

```bash
npx hardhat run scripts/deploy-verification-registry.ts --network localhost
```

#### 3. Deploy ResumeNFT

**A. With a new VerificationRegistry:**
```bash
npx hardhat run scripts/deploy-resume-nft.ts --network localhost
```

**B. Using an existing VerificationRegistry address:**
```bash
# Set the registry address as an environment variable
REGISTRY_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3 npx hardhat run scripts/deploy-resume-nft.ts --network localhost
```

### Local Deployment

To deploy the contracts to a local Hardhat node:

1. Start a local Hardhat node in a separate terminal:
```bash
npx hardhat node
```

2. Deploy using one of the deployment scripts as shown above.

### Testnet Deployment

To deploy to a testnet (e.g., Sepolia):

1. Create a `.env` file with your private key and API key:
```
PRIVATE_KEY=your_private_key_here
ETHERSCAN_API_KEY=your_etherscan_api_key_here
```

2. Ensure your account has enough testnet ETH (get from a faucet).

3. Deploy to the testnet:
```bash
npx hardhat run scripts/deploy-all.ts --network sepolia
```

Or for separate deployments:
```bash
npx hardhat run scripts/deploy-verification-registry.ts --network sepolia
REGISTRY_ADDRESS=your_deployed_registry_address npx hardhat run scripts/deploy-resume-nft.ts --network sepolia
```

### Verifying Contracts

After deployment, the scripts will provide the exact verification commands to use:

```bash
npx hardhat verify --network sepolia REGISTRY_ADDRESS
npx hardhat verify --network sepolia RESUME_NFT_ADDRESS REGISTRY_ADDRESS OWNER_ADDRESS
```

## License

MIT
