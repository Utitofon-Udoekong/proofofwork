import { ipfsService } from '../services/ipfs';

/**
 * Examples of how to use the IPFS service in the ProofOfWork app
 * 
 * Note: These are example functions to show usage patterns,
 * not actual implementation code.
 */

/**
 * Example showing how to upload a resume metadata object to IPFS
 */
export async function uploadResumeMetadataExample() {
  try {
    // Create a sample resume metadata object
    const resumeMetadata = {
      name: "John Doe's Resume",
      description: "Professional resume for John Doe, Blockchain Developer",
      image: "https://proofofwork.crypto/logo.png", // Could be an IPFS URL to an uploaded image
      created_at: new Date().toISOString(),
      owner: "0x123456789abcdef",
      attributes: [
        {
          trait_type: "Experience Years",
          value: "5+"
        },
        {
          trait_type: "Industry",
          value: "Blockchain"
        }
      ]
    };
    
    // Upload metadata to IPFS
    const metadataUri = await ipfsService.uploadResumeMetadata(resumeMetadata);
    console.log(`Resume metadata uploaded to: ${metadataUri}`);
    
    // Get HTTP URL for display/retrieval
    const httpUrl = ipfsService.getHttpUrl(metadataUri);
    console.log(`HTTP URL for resume metadata: ${httpUrl}`);
    
    return metadataUri;
  } catch (error) {
    console.error("Error in uploadResumeMetadataExample:", error);
    throw error;
  }
}

/**
 * Example showing how to upload a file (like a resume PDF) to IPFS
 */
export async function uploadResumeFileExample(file: File) {
  try {
    // Upload a resume file (PDF, docx, etc.)
    const fileUri = await ipfsService.uploadFile(file);
    console.log(`Resume file uploaded to: ${fileUri}`);
    
    // Get HTTP URL for display/retrieval
    const httpUrl = ipfsService.getHttpUrl(fileUri);
    console.log(`HTTP URL for resume file: ${httpUrl}`);
    
    return fileUri;
  } catch (error) {
    console.error("Error in uploadResumeFileExample:", error);
    throw error;
  }
}

/**
 * Example showing how to upload multiple files (like certificates) to IPFS as a directory
 */
export async function uploadCertificatesExample(certificateFiles: File[]) {
  try {
    // Upload multiple certificate files
    const directoryUri = await ipfsService.uploadDirectory(certificateFiles);
    console.log(`Certificates uploaded to directory: ${directoryUri}`);
    
    // Get HTTP URL for display/retrieval
    const httpUrl = ipfsService.getHttpUrl(directoryUri);
    console.log(`HTTP URL for certificates directory: ${httpUrl}`);
    
    return directoryUri;
  } catch (error) {
    console.error("Error in uploadCertificatesExample:", error);
    throw error;
  }
}

/**
 * Example function to create a complete resume with metadata and file
 */
export async function createCompleteResume(
  resumeMetadata: any,
  resumeFile: File,
  certificateFiles: File[]
) {
  try {
    // 1. Upload the resume file
    const resumeFileUri = await ipfsService.uploadFile(resumeFile);
    
    // 2. Upload certificates as a directory
    const certificatesUri = await ipfsService.uploadDirectory(certificateFiles);
    
    // 3. Add the file and certificates URIs to the metadata
    const enhancedMetadata = {
      ...resumeMetadata,
      resumeFile: resumeFileUri,
      certificates: certificatesUri
    };
    
    // 4. Upload the complete metadata
    const metadataUri = await ipfsService.uploadResumeMetadata(enhancedMetadata);
    
    return {
      metadataUri,
      httpUrl: ipfsService.getHttpUrl(metadataUri)
    };
  } catch (error) {
    console.error("Error in createCompleteResume:", error);
    throw error;
  }
} 