// Import the typechain-generated types
import { ResumeNFT, VerificationManager } from '@/app/typechain-types/contracts';
import { ResumeNFT__factory, VerificationManager__factory } from '@/app/typechain-types/factories/contracts';

// Re-export them for use in the frontend
export {
    ResumeNFT__factory,
    VerificationManager__factory
};
export type {
    ResumeNFT,
    VerificationManager
};

// Export types for contract initialization
export type ContractTypes = {
  ResumeNFT: ResumeNFT;
  VerificationManager: VerificationManager;
};

// Export the structured types we need
export type { ResumeNFT as ContractStructs } from '@/app/typechain-types/contracts/ResumeNFT';