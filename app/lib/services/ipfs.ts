import { create, Client } from '@web3-storage/w3up-client';
import { ResumeMetadata } from '../types';

/**
 * Service for interacting with IPFS via Web3.Storage (w3up-client only)
 */
export class IPFSService {
  private static instance: IPFSService;
  private web3StorageClient: Client | null = null;
  private initialized = false;
  private spaceProvisioned = false;

  private constructor() { }

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
  public async initialize(): Promise<void> {
    if (!this.web3StorageClient && !this.initialized) {
      try {
        this.web3StorageClient = await create();
        this.initialized = true;
      } catch (error) {
        console.error('Failed to initialize Web3.Storage client:', error);
        this.initialized = false;
        return;
      }
    }

    // Skip space provisioning if we've already done it or if we don't have an email
    if (this.spaceProvisioned || !this.web3StorageClient) {
      return;
    }

    try {
      await this.web3StorageClient.setCurrentSpace(process.env.ipfsStorageKey as `did:${string}:${string}`);
      this.spaceProvisioned = true;
    } catch (error) {
      console.error('Error provisioning Web3.Storage space:', error);
    }
  }

  /**
   * Upload a file to IPFS using web3StorageClient
   * @param file - The file to upload
   * @returns The IPFS URI for the uploaded file
   */
  public async uploadFile(file: File): Promise<string> {
    if (!this.web3StorageClient) throw new Error('Web3.Storage client not initialized');
    const cid = await this.web3StorageClient.uploadFile(file);
    return `ipfs://${cid}`;
  }

  /**
   * Upload multiple files as a directory to IPFS using web3StorageClient
   * @param files - Array of files to upload
   * @returns The IPFS URI for the uploaded directory
   */
  public async uploadDirectory(files: File[]): Promise<string> {
    if (!this.web3StorageClient) throw new Error('Web3.Storage client not initialized');
    const cid = await this.web3StorageClient.uploadDirectory(files);
    return `ipfs://${cid}`;
  }

  /**
   * Upload resume metadata to IPFS using web3StorageClient
   * @param metadata - The resume metadata to upload
   * @returns The IPFS URI for the uploaded metadata
   */
  public async uploadResumeMetadata(metadata: ResumeMetadata): Promise<string> {
    if (!this.web3StorageClient) throw new Error('Web3.Storage client not initialized');
    const blob = new Blob([JSON.stringify(metadata)], { type: 'application/json' });
    // web3StorageClient.uploadFile expects a File, so we create one
    const file = new File([blob], 'resume.json', { type: 'application/json' });
    const cid = await this.web3StorageClient.uploadFile(file);
    return `ipfs://${cid}`;
  }

  /**
   * Get HTTP URL from IPFS URI
   * @param ipfsUri - The IPFS URI (ipfs://...)
   * @returns HTTP URL for the IPFS content
   */
  public getHttpUrl(ipfsUri: string): string {
    if (!ipfsUri) return '';
    if (ipfsUri.startsWith('http')) return ipfsUri;
    if (ipfsUri.startsWith('data:')) return ipfsUri;
    if (ipfsUri.startsWith('ipfs://')) {
      const cid = ipfsUri.replace('ipfs://', '');
      return `https://${cid}.ipfs.w3s.link`;
    }
    return ipfsUri;
  }

  /**
   * Get resume metadata from IPFS URI
   * @param ipfsUri - The IPFS URI (ipfs://...)
   * @returns The resume metadata
   */
  public async getResumeMetadata(ipfsUri: string): Promise<ResumeMetadata> {
    if (!ipfsUri) throw new Error('No IPFS URI provided');

    const httpUrl = this.getHttpUrl(ipfsUri);
    const response = await fetch(httpUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch resume metadata: ${response.statusText}`);
    }

    const metadata = await response.json();
    return metadata as ResumeMetadata;
  }
}

// Export a singleton instance
export const ipfsService = IPFSService.getInstance(); 