'use client';

import React, { useState, useRef } from 'react';
import { ipfsService } from '@/app/lib/services/ipfs';

interface FileUploaderProps {
  onFileUploaded: (ipfsUri: string, httpUrl: string, file: File) => void;
  onError?: (error: Error) => void;
  accept?: string;
  multiple?: boolean;
  className?: string;
  buttonText?: string;
  loadingText?: string;
}

/**
 * A reusable file uploader component that uploads files to IPFS
 */
export default function FileUploader({
  onFileUploaded,
  onError,
  accept = '*/*',
  multiple = false,
  className = '',
  buttonText = 'Upload File',
  loadingText = 'Uploading...'
}: FileUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    try {
      // Process each file - we'll upload them one by one for now
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Upload the file to IPFS
        const ipfsUri = await ipfsService.uploadFile(file);
        
        // Get the HTTP URL for display/retrieval
        const httpUrl = ipfsService.getHttpUrl(ipfsUri);
        
        // Notify the parent component
        onFileUploaded(ipfsUri, httpUrl, file);
      }
    } catch (error: any) {
      console.error('Error uploading file to IPFS:', error);
      if (onError) {
        onError(error instanceof Error ? error : new Error(error?.message || 'Unknown error'));
      }
    } finally {
      setIsUploading(false);
      
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className={`relative ${className}`}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={accept}
        multiple={multiple}
        className="hidden"
      />
      <button
        type="button"
        onClick={triggerFileInput}
        disabled={isUploading}
        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isUploading ? loadingText : buttonText}
      </button>
    </div>
  );
} 