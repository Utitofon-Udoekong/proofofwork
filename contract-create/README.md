# ProofOfWork Smart Contracts

This directory contains the smart contracts for the ProofOfWork project, an on-chain resume platform that allows for verifiable work and education credentials.

## Contracts

1. **ResumeNFT.sol** - A soulbound NFT contract for storing resume entries with verification capabilities
2. **VerificationRegistry.sol** - A registry for managing verified organizations that can validate resume entries

## Setup

```bash
# Install dependencies
npm install
```

## Usage

### Compilation

```bash
# Compile all contracts
npm run compile
```

### Testing

```bash
# Run all tests
npm run test

# Run specific test file
npx hardhat test test/ResumeNFT.ts
```

### Deployment

The deployment scripts will automatically save the contract addresses to:
- `deployments/contract-addresses.json`
- `app/lib/contracts/addresses.ts` (for frontend use)

```bash
# Deploy all contracts
npm run deploy

# Deploy only VerificationRegistry
npm run deploy:registry

# Deploy only ResumeNFT (requires VerificationRegistry to be deployed)
npm run deploy:resume
```

### Checking Deployed Addresses

```bash
# Check and display currently deployed contract addresses
npm run addresses
```

### Cleaning

To clean all deployment data, artifacts, and cached files:

```bash
# Clean everything
npm run clean
```

This is useful before redeploying contracts to ensure a fresh start. The clean command removes:

- Contract artifacts and cache
- Deployment records in `deployments/`
- Hardhat Ignition deployment files in `ignition/deployments/`
- Generated contract addresses in the frontend

## Contract Addresses

After deployment, the contract addresses will be available in:

```
deployments/contract-addresses.json
```

And automatically exported to the frontend in:

```
app/lib/contracts/addresses.ts
```

## Deployment with Environment Variables

You can set environment variables to control deployment parameters:

```bash
# Set verification registry address to use existing contract
export VERIFICATION_REGISTRY_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3

# Deploy only ResumeNFT with existing registry
npm run deploy:resume
```

## License

MIT
