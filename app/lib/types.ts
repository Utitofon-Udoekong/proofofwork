// Legacy type definition
export type EntryType = 'work' | 'education' | 'certification' | 'project' | 'skill' | 'award';

// New enum for better type safety (use this in new code)
export enum EntryTypeEnum {
  WORK = 0,
  EDUCATION = 1,
  CERTIFICATION = 2,
  PROJECT = 3,
  SKILL = 4,
  AWARD = 5
}

export interface ResumeEntry {
  id: string;
  type: EntryType;
  title: string;
  company: string; // Organization, institution, or issuer
  description?: string;
  startDate: string;
  endDate: string;
  verified: boolean;
  organization?: string; // Verifying organization
  verificationRequested?: boolean;
  attachments?: string[]; // Array of IPFS URIs for attachments
  
  // Work-specific fields
  role?: string;
  location?: string;
  
  // Education-specific fields
  degree?: string;
  fieldOfStudy?: string;
  grade?: string;
  
  // Certification-specific fields
  issuedBy?: string;
  credentialID?: string;
  expirationDate?: string;
  
  // Project-specific fields
  projectUrl?: string;
  
  // Skills
  proficiencyLevel?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  
  // Awards
  issuer?: string;
  dateAwarded?: string;
}

export type VerificationRequestStatus = "pending" | "approved" | "rejected";

export interface VerificationRequest {
  id: number;
  user: string;
  resumeId: number;
  organization: string;
  entryId: string;
  details: string;
  status: VerificationRequestStatus;
  timestamp: number;
  verificationDetails: string;
}

// Contract addresses for deployed contracts
export interface ContractAddresses {
  verificationManager?: string;
  resumeNFT?: string;
  networkName?: string;
  deploymentTimestamp?: string;
}

// New types for the profile metadata structure

// Social media profile links
export interface SocialLinks {
  linkedin?: string;
  github?: string;
  twitter?: string;
  website?: string;
  [key: string]: string | undefined; // Allow for additional platforms
}

// User profile metadata structure
export interface ProfileMetadata {
  name: string;
  headline?: string;
  bio?: string;
  location?: string;
  contactEmail?: string;
  avatarUrl?: string;
  skills?: string[];
  languages?: string[];
  socialLinks?: SocialLinks;
  lastUpdated: string; // ISO date string
  email?: string;
  phone?: string;
}

// Complete resume metadata structure with both profile and entries
export interface ResumeMetadata {
  resumeId: string;
  version: string;
  profile: ProfileMetadata;
  entries: ResumeEntry[];
  chainId?: number;
  createdAt: string;
  updatedAt: string;
  tokenId?: string;
  name?: string;
  description?: string;
  image?: string;
  external_url?: string;
  attributes?: Array<{
    trait_type: string;
    value: string;
  }>;
  transactionHash?: string;
} 

export interface Organization {
  address: string;
  name: string;
  email: string;
  website: string;
  isVerified: boolean;
  verificationTimestamp: number;
  lastUpdateTimestamp: number;
  exists: boolean;
}