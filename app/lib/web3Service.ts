declare global {
  interface Window {
    ethereum?: any;
  }
}

"use client";

import { ethers } from 'ethers';
import { ResumeEntry, EntryType } from './types';
import { contractAddresses } from './contracts/addresses';
// Import the typed contract interfaces and factories
import { 
  ResumeNFT, 
  VerificationRegistry,
  ResumeNFT__factory,
  VerificationRegistry__factory,
  ContractStructs
} from './contracts/contract-types';

// Load contract addresses from the generated addresses file
const RESUME_NFT_ADDRESS = contractAddresses.resumeNFT || '0x5FbDB2315678afecb367f032d93F642f64180aa3';
const VERIFICATION_REGISTRY_ADDRESS = contractAddresses.verificationRegistry || '0x5FbDB2315678afecb367f032d93F642f64180aa3';

// Helper function to convert EntryType string to uint8 for contract
const entryTypeToUint8 = (type: EntryType): number => {
  const typeMap: Record<EntryType, number> = {
    'work': 0,
    'education': 1,
    'certification': 2,
    'project': 3,
    'skill': 4,
    'award': 5
  };
  return typeMap[type];
};

// Helper function to convert uint8 from contract to EntryType string
const uint8ToEntryType = (typeValue: number): EntryType => {
  const typeMap: Record<number, EntryType> = {
    0: 'work',
    1: 'education',
    2: 'certification',
    3: 'project',
    4: 'skill',
    5: 'award'
  };
  return typeMap[typeValue] || 'work';
};

export class Web3Service {
  provider: ethers.BrowserProvider | null = null;
  signer: ethers.Signer | null = null;
  // Use the typed contract interfaces
  resumeNFTContract: ResumeNFT | null = null;
  verificationRegistryContract: VerificationRegistry | null = null;
  userAddress: string | null = null;
  tokenId: number | null = null;

  async initialize() {
    try {
      // Check if window is defined (browser environment)
      if (typeof window !== 'undefined' && window.ethereum) {
        this.provider = new ethers.BrowserProvider(window.ethereum);
        this.signer = await this.provider.getSigner();
        this.userAddress = await this.signer.getAddress();
        
        // Initialize contracts using the factory patterns from typechain
        this.resumeNFTContract = ResumeNFT__factory.connect(
          RESUME_NFT_ADDRESS,
          this.signer
        );
        
        this.verificationRegistryContract = VerificationRegistry__factory.connect(
          VERIFICATION_REGISTRY_ADDRESS,
          this.signer
        );
        
        // Get the user's token ID (assuming they have one)
        try {
          const tokenIds = await this.resumeNFTContract.getEntriesByOwner(this.userAddress);
          if (tokenIds && tokenIds.length > 0) {
            this.tokenId = Number(tokenIds[0]);
          }
        } catch (error) {
          console.error("Error getting user's token ID:", error);
        }
        
        return {
          isConnected: true,
          address: this.userAddress
        };
      }
      return { isConnected: false };
    } catch (error) {
      console.error("Error initializing web3:", error);
      return { isConnected: false, error };
    }
  }

  async connectWallet() {
    try {
      if (typeof window !== 'undefined' && window.ethereum) {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        return await this.initialize();
      }
      throw new Error("Ethereum provider not found");
    } catch (error) {
      console.error("Error connecting wallet:", error);
      throw error;
    }
  }

  async createResume(metadataURI = "") {
    try {
      if (!this.resumeNFTContract || !this.signer || !this.userAddress) {
        throw new Error("Contracts not initialized");
      }
      
      const tx = await this.resumeNFTContract.mintResume(this.userAddress, metadataURI);
      const receipt = await tx.wait();
      
      // Get the token ID from the event
      const event = receipt?.logs.find(log => {
        try {
          const parsedLog = this.resumeNFTContract?.interface.parseLog(log);
          return parsedLog?.name === "ResumeMinted";
        } catch (e) {
          return false;
        }
      });
      
      if (event) {
        const parsedLog = this.resumeNFTContract!.interface.parseLog(event);
        this.tokenId = Number(parsedLog?.args.tokenId);
        return this.tokenId;
      }
      
      throw new Error("Failed to get token ID from transaction");
    } catch (error) {
      console.error("Error creating resume:", error);
      throw error;
    }
  }

  async addResumeEntry(entryData: {
    type: EntryType;
    title: string;
    company: string;
    description: string;
    startDate: string;
    endDate: string;
    organization: string;
    // Additional fields based on type
    [key: string]: any;
  }) {
    try {
      if (!this.resumeNFTContract || this.tokenId === null) {
        throw new Error("Resume not initialized");
      }
      
      // Convert dates to Unix timestamps
      const startTimestamp = Math.floor(new Date(entryData.startDate).getTime() / 1000);
      const endTimestamp = entryData.endDate 
        ? Math.floor(new Date(entryData.endDate).getTime() / 1000)
        : 0; // 0 for current positions
      
      // Convert the entry type to uint8 for the contract
      const entryTypeValue = entryTypeToUint8(entryData.type);
      
      // Extract core fields to avoid duplication in metadata
      const { title, description, startDate, endDate, organization, company, type, ...additionalFields } = entryData;
      
      // Create a metadata object to store additional fields based on entry type
      const metadata = JSON.stringify(additionalFields);
      
      // Use the typed contract method
      const tx = await this.resumeNFTContract.addResumeEntry(
        BigInt(this.tokenId),
        BigInt(entryTypeValue),
        entryData.title,
        entryData.description,
        BigInt(startTimestamp),
        BigInt(endTimestamp),
        entryData.organization || entryData.company,
        metadata
      );
      
      const receipt = await tx.wait();
      
      // Get the entry index from the event
      const event = receipt?.logs.find(log => {
        try {
          const parsedLog = this.resumeNFTContract?.interface.parseLog(log);
          return parsedLog?.name === "ResumeEntryAdded";
        } catch (e) {
          return false;
        }
      });
      
      if (event) {
        const parsedLog = this.resumeNFTContract!.interface.parseLog(event);
        return { 
          success: true, 
          entryIndex: Number(parsedLog?.args.entryIndex)
        };
      }
      
      return { success: true };
    } catch (error) {
      console.error("Error adding resume entry:", error);
      throw error;
    }
  }

  async getResumeEntries(): Promise<ResumeEntry[]> {
    try {
      if (!this.resumeNFTContract || this.tokenId === null) {
        return [];
      }
      
      // Use the typed contract method
      const entries = await this.resumeNFTContract.getResumeEntries(BigInt(this.tokenId));
      
      // Transform the contract data to our ResumeEntry format
      return entries.map((entry: ContractStructs.ResumeEntryStructOutput, index: number) => {
        // Convert the numeric entryType to string EntryType
        const type = uint8ToEntryType(Number(entry.entryType));
        
        // Parse the metadata JSON to extract additional fields
        let additionalFields = {};
        try {
          if (entry.metadata) {
            additionalFields = JSON.parse(entry.metadata);
          }
        } catch (e) {
          console.error("Failed to parse metadata JSON:", e);
        }
        
        return {
          id: index,
          type,
          title: entry.title,
          company: entry.organization,
          description: entry.description,
          startDate: new Date(Number(entry.startDate) * 1000).toISOString().split('T')[0],
          endDate: Number(entry.endDate) > 0 
            ? new Date(Number(entry.endDate) * 1000).toISOString().split('T')[0]
            : 'Present',
          verified: entry.verified,
          organization: entry.organization,
          ...additionalFields
        };
      });
    } catch (error) {
      console.error("Error getting resume entries:", error);
      return [];
    }
  }

  async requestVerification(entryIndex: number) {
    try {
      if (!this.resumeNFTContract || this.tokenId === null) {
        throw new Error("Resume not initialized");
      }
      
      // Use the typed contract method
      const tx = await this.resumeNFTContract.requestVerification(
        BigInt(this.tokenId), 
        BigInt(entryIndex)
      );
      await tx.wait();
      
      return { success: true };
    } catch (error) {
      console.error("Error requesting verification:", error);
      throw error;
    }
  }

  // Additional methods would be similarly updated with proper typing
} 