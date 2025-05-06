export type EntryType = 'work' | 'education' | 'certification' | 'project' | 'skill' | 'award';

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