// Import the typechain-generated types
import { ResumeNFT, VerificationRegistry } from '../../../contract-create/typechain-types/contracts';
import { ResumeNFT__factory, VerificationRegistry__factory } from '../../../contract-create/typechain-types/factories/contracts';

// Re-export them for use in the frontend
export {
    ResumeNFT__factory,
    VerificationRegistry__factory
};
    export type {
        ResumeNFT,
        VerificationRegistry
    };

// Export types for contract initialization
export type ContractTypes = {
  ResumeNFT: ResumeNFT;
  VerificationRegistry: VerificationRegistry;
};

// Export the structured types we need
export type { ResumeNFT as ContractStructs } from '../../../contract-create/typechain-types/contracts/ResumeNFT'; 