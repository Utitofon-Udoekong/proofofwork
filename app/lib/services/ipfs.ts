import { create, Client } from '@web3-storage/w3up-client';
import { NFTStorage } from 'nft.storage';
import { ResumeMetadata, ProfileMetadata } from '../types';

// You should add these to .env.local file
const NFT_STORAGE_TOKEN = process.env.NEXT_PUBLIC_NFT_STORAGE_TOKEN || '';
const WEB3_STORAGE_EMAIL = process.env.NEXT_PUBLIC_WEB3_STORAGE_EMAIL || '';

/**
 * Service for interacting with IPFS via Web3.Storage or NFT.Storage
 */
export class IPFSService {
  private static instance: IPFSService;
  private nftStorageClient: NFTStorage | null = null;
  private web3StorageClient: Client | null = null;
  private initialized = false;
  private spaceProvisioned = false;

  private constructor() {
    // Initialize NFT.Storage client if token is available
    if (NFT_STORAGE_TOKEN) {
      this.nftStorageClient = new NFTStorage({ token: NFT_STORAGE_TOKEN });
    }
  }

  /**
   * Get the singleton instance of the IPFS service
   */
  public static getInstance(): IPFSService {
    if (!IPFSService.instance) {
      IPFSService.instance = new IPFSService();
    }
    return IPFSService.instance;
  }

  /**
   * Initialize the Web3.Storage client and provision a space
   * This must be called before using w3up-client methods
   */
  private async initializeWeb3Storage(): Promise<void> {
    if (!this.web3StorageClient && !this.initialized) {
      try {
        // Create the client
        this.web3StorageClient = await create();
        this.initialized = true;
        console.log('Web3.Storage client initialized');
      } catch (error) {
        console.error('Failed to initialize Web3.Storage client:', error);
        this.initialized = false;
        return;
      }
    }

    // Skip space provisioning if we've already done it or if we don't have an email
    if (this.spaceProvisioned || !WEB3_STORAGE_EMAIL || !WEB3_STORAGE_EMAIL.includes('@') || !this.web3StorageClient) {
      return;
    }

    try {
      // Need to provision a space for uploads to work
      console.log('Attempting to login with email:', WEB3_STORAGE_EMAIL);
      
      // Login with email address to authenticate agent
      // This will trigger email verification first time
      // The login method expects an email in template literal type format
      const email = WEB3_STORAGE_EMAIL as `${string}@${string}`;
      const account = await this.web3StorageClient.login(email);
      console.log('Login successful');

      // Wait for a payment plan with a 15-minute timeout
      // Only needed first time when registering
      try {
        await account.plan.wait();
        console.log('Payment plan confirmed');
      } catch (planError) {
        console.warn('Plan wait timed out or failed:', planError);
        // Continue anyway as we might already have a plan
      }
      
      // Try to get existing spaces or create a new one
      const spaces = this.web3StorageClient.spaces();
      
      if (spaces.length > 0) {
        // Use existing space
        await this.web3StorageClient.setCurrentSpace(spaces[0].did());
        console.log('Using existing space:', spaces[0].did());
        this.spaceProvisioned = true;
      } else {
        // Create a new space
        try {
          const space = await this.web3StorageClient.createSpace('proofofwork-space', { account });
          await this.web3StorageClient.setCurrentSpace(space.did());
          
          console.log('New space created and associated with account:', space.did());
          this.spaceProvisioned = true;
        } catch (createError) {
          console.error('Error creating space:', createError);
        }
      }
    } catch (error) {
      console.error('Error provisioning Web3.Storage space:', error);
    }
  }

  /**
   * Upload resume metadata to IPFS
   * @param metadata - The resume metadata to upload
   * @returns The IPFS URI for the uploaded metadata
   */
  public async uploadResumeMetadata(metadata: any): Promise<string> {
    try {
      if (this.nftStorageClient) {
        // Use NFT.Storage (better for NFT metadata)
        const cid = await this.nftStorageClient.store({
          name: metadata.name || "Resume",
          description: metadata.description || "ProofOfWork Resume",
          image: metadata.image || "https://proofofwork.crypto/logo.png",
          attributes: metadata.attributes || [],
          ...metadata,
        });
        return `ipfs://${cid.ipnft}/metadata.json`;
      } else {
        // Fallback to direct JSON upload with base64 encoding
        return this.uploadJsonWithFallback(metadata);
      }
    } catch (error) {
      console.error('Error uploading metadata to IPFS:', error);
      return this.uploadJsonWithFallback(metadata);
    }
  }

  /**
   * Upload standardized resume profile metadata to IPFS
   * @param profileData - The profile data to upload
   * @param entries - Optional resume entries
   * @returns The IPFS URI for the uploaded metadata
   */
  public async uploadStandardResumeMetadata(
    profileData: ProfileMetadata, 
    entries?: any[]
  ): Promise<string> {
    try {
      // Create a standardized metadata structure
      const metadata: ResumeMetadata = {
        version: "1.0.0",
        profile: profileData,
        entries: entries || [],
        chainId: 11155111, // Default to Sepolia testnet
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      if (this.nftStorageClient) {
        // Create a placeholder image if none is provided
        const imageUrl = profileData.avatarUrl || "https://proofofwork.crypto/logo.png";
        let imageBlob: Blob;
        
        // If it's already a data URL, convert it to Blob
        if (imageUrl.startsWith('data:')) {
          imageBlob = this.dataURLtoBlob(imageUrl);
        } else {
          // Create a placeholder SVG image
          const svgImage = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
            <rect width="100%" height="100%" fill="#3b82f6"/>
            <text x="50%" y="50%" font-family="Arial" font-size="24" fill="white" text-anchor="middle" dominant-baseline="middle">
              ${profileData.name?.substring(0, 2) || "PW"}
            </text>
          </svg>`;
          imageBlob = new Blob([svgImage], { type: 'image/svg+xml' });
        }
        
        // Store metadata using NFT.Storage, formatted for NFT standards
        const cid = await this.nftStorageClient.store({
          name: profileData.name || "ProofOfWork Resume",
          description: profileData.bio || "On-chain verified professional resume",
          image: new File([imageBlob], 'profile-image.png', { type: 'image/png' }),
          external_url: profileData.socialLinks?.website,
          // Add attributes formatted for NFT marketplaces
          attributes: [
            {
              trait_type: "Headline",
              value: profileData.headline || ""
            },
            {
              trait_type: "Location",
              value: profileData.location || ""
            },
            ...(profileData.skills?.map(skill => ({
              trait_type: "Skill",
              value: skill
            })) || [])
          ],
          // Include our full metadata structure
          resume_metadata: metadata
        });
        return `ipfs://${cid.ipnft}/metadata.json`;
      } else {
        // Fallback to direct JSON upload
        return this.uploadJsonWithFallback(metadata);
      }
    } catch (error) {
      console.error('Error uploading standardized resume metadata to IPFS:', error);
      // Use uploadJsonWithFallback for error case as well
      return this.uploadJsonWithFallback({
        version: "1.0.0",
        profile: profileData,
        entries: entries || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
  }

  /**
   * Convert data URL to Blob
   */
  private dataURLtoBlob(dataURL: string): Blob {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    
    return new Blob([u8arr], { type: mime });
  }

  /**
   * Upload JSON with fallback to base64 encoding
   */
  private uploadJsonWithFallback(data: any): string {
    try {
      // Just use base64 encoding for now
      const metadataStr = JSON.stringify(data);
      return `data:application/json;base64,${this.safeEncode(metadataStr)}`;
    } catch (error) {
      console.error('Error in base64 fallback:', error);
      return '';
    }
  }

  /**
   * Upload a file to IPFS
   * @param file - The file to upload
   * @returns The IPFS URI for the uploaded file
   */
  public async uploadFile(file: File): Promise<string> {
    try {
      await this.initializeWeb3Storage();
      
      // Try using w3up-client first
      if (this.web3StorageClient) {
        try {
          const cid = await this.web3StorageClient.uploadFile(file);
          return `ipfs://${cid}`;
        } catch (web3Error) {
          console.warn('Error using Web3.Storage client:', web3Error);
          // If web3 client fails, fall back to NFT.Storage
        }
      }
      
      // Fall back to NFT.Storage
      if (this.nftStorageClient) {
        const blob = new Blob([file], { type: file.type });
        const cid = await this.nftStorageClient.storeBlob(blob);
        return `ipfs://${cid}`;
      }
      
      throw new Error('No storage client available');
    } catch (error) {
      console.error('Error uploading file to IPFS:', error);
      throw error;
    }
  }

  /**
   * Upload multiple files as a directory to IPFS
   * @param files - Array of files to upload
   * @returns The IPFS URI for the uploaded directory
   */
  public async uploadDirectory(files: File[]): Promise<string> {
    try {
      await this.initializeWeb3Storage();
      
      if (this.web3StorageClient) {
        try {
          const cid = await this.web3StorageClient.uploadDirectory(files);
          return `ipfs://${cid}`;
        } catch (error) {
          console.warn('Error using Web3.Storage client for directory upload:', error);
          // We don't have a good fallback for directory uploads with NFT.Storage
          // Might need to implement a recursive approach using individual uploads
        }
      }
      
      throw new Error('Web3.Storage client not initialized or failed');
    } catch (error) {
      console.error('Error uploading directory to IPFS:', error);
      throw error;
    }
  }

  /**
   * Helper function to safely encode string to base64 (handles Unicode characters)
   * @param str - The string to encode
   * @returns The base64 encoded string
   */
  private safeEncode(str: string): string {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) => 
      String.fromCharCode(parseInt(p1, 16))
    ));
  }

  /**
   * Get HTTP URL from IPFS URI
   * @param ipfsUri - The IPFS URI (ipfs://...)
   * @returns HTTP URL for the IPFS content
   */
  public getHttpUrl(ipfsUri: string): string {
    if (!ipfsUri) return '';
    
    // Already an HTTP URL
    if (ipfsUri.startsWith('http')) {
      return ipfsUri;
    }
    
    // Data URI
    if (ipfsUri.startsWith('data:')) {
      return ipfsUri;
    }
    
    // IPFS URI
    if (ipfsUri.startsWith('ipfs://')) {
      // Replace ipfs:// with IPFS gateway URL
      const cid = ipfsUri.replace('ipfs://', '');
      return `https://w3s.link/ipfs/${cid}`;
    }
    
    return ipfsUri;
  }
}

// Export a singleton instance
export const ipfsService = IPFSService.getInstance(); 