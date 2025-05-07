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
  id: number | string;
  type: EntryType;
  title: string;
  company: string; // Organization, institution, or issuer
  description?: string;
  startDate: string;
  endDate: string;
  verified: boolean;
  organization?: string; // Verifying organization
  verificationRequested?: boolean;
  
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

export interface VerificationRequest {
  entryId: number | string;
  organization: string;
  status: 'pending' | 'approved' | 'rejected';
  requestDate: string;
  responseDate?: string;
}

// Contract addresses for deployed contracts
export interface ContractAddresses {
  verificationRegistry?: string;
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
  [key: string]: any; // For future extensibility
}

// Complete resume metadata structure with both profile and entries
export interface ResumeMetadata {
  version: string; // For versioning the metadata structure
  profile: ProfileMetadata;
  entries?: ResumeEntry[]; // Optional - entries can also be stored on-chain
  chainId?: number; // The blockchain network ID
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
} 