'use client';

import React, { useState, useRef } from 'react';

interface FileUploaderProps {
  onFileUploaded: (file: File, dataUrl: string) => void;
  onError?: (error: Error) => void;
  accept?: string;
  multiple?: boolean;
  className?: string;
  buttonText?: string;
  loadingText?: string;
  maxSizeMB?: number;
}

/**
 * A reusable file uploader component that handles local file storage
 * Files are converted to data URLs and stored locally until the resume is saved
 */
export default function FileUploader({
  onFileUploaded,
  onError,
  accept = '*/*',
  multiple = false,
  className = '',
  buttonText = 'Upload File',
  loadingText = 'Processing...',
  maxSizeMB = 5
}: FileUploaderProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      return `File size must be less than ${maxSizeMB}MB`;
    }

    // Check file type if accept is specified
    if (accept !== '*/*') {
      const acceptedTypes = accept.split(',').map(type => type.trim());
      const fileType = file.type;
      const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`;
      
      const isAccepted = acceptedTypes.some(type => {
        if (type.startsWith('.')) {
          return fileExtension === type.toLowerCase();
        }
        return fileType.startsWith(type.replace('*', ''));
      });

      if (!isAccepted) {
        const supportedTypes = acceptedTypes
          .map(type => type.replace('.', '').toUpperCase())
          .join(', ');
        return `File type not supported. Please upload a ${supportedTypes} file.`;
      }
    }

    return null;
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsProcessing(true);

    try {
      // Process each file
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate file
        const validationError = validateFile(file);
        if (validationError) {
          throw new Error(validationError);
        }

        // Convert file to data URL
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error('Failed to read file'));
          reader.readAsDataURL(file);
        });
        
        // Notify the parent component with both the original file and data URL
        onFileUploaded(file, dataUrl);
      }
    } catch (error: unknown) {
      console.error('Error processing file:', error);
      if (onError) {
        onError(error instanceof Error ? error : new Error(error instanceof Error ? error.message : 'File upload failed'));
      }
    } finally {
      setIsProcessing(false);
      
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
        disabled={isProcessing}
        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isProcessing ? loadingText : buttonText}
      </button>
    </div>
  );
} 