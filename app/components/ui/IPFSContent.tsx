'use client';

import React, { useState, useEffect } from 'react';
import { ipfsService } from '@/app/lib/services/ipfs';
import IPFSImage from './IPFSImage';

interface IPFSContentProps {
  ipfsUri: string;
  className?: string;
  fallbackText?: string;
}

/**
 * Component to display content from IPFS based on content type
 */
export default function IPFSContent({ 
  ipfsUri, 
  className = '', 
  fallbackText = 'Content not available' 
}: IPFSContentProps) {
  const [content, setContent] = useState<any>(null);
  const [contentType, setContentType] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchIPFSContent = async () => {
      if (!ipfsUri) {
        setError('No IPFS URI provided');
        setLoading(false);
        return;
      }

      try {
        // Handle data URIs directly
        if (ipfsUri.startsWith('data:')) {
          const contentTypeMatch = ipfsUri.match(/^data:([^;]+);/);
          const contentType = contentTypeMatch ? contentTypeMatch[1] : 'text/plain';
          setContentType(contentType);
          
          if (contentType === 'application/json') {
            // Extract JSON from data URI
            const base64Data = ipfsUri.split(',')[1];
            const jsonString = atob(base64Data);
            setContent(JSON.parse(jsonString));
          } else {
            // Just use the data URI directly
            setContent(ipfsUri);
          }
          
          setLoading(false);
          return;
        }

        // Get HTTP URL for IPFS content
        const httpUrl = ipfsService.getHttpUrl(ipfsUri);
        
        // Fetch the content
        const response = await fetch(httpUrl);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.statusText}`);
        }
        
        // Get content type
        const contentType = response.headers.get('content-type') || '';
        setContentType(contentType);
        
        // Handle different content types
        if (contentType.includes('application/json')) {
          const jsonData = await response.json();
          setContent(jsonData);
        } else if (contentType.includes('text/')) {
          const textData = await response.text();
          setContent(textData);
        } else if (contentType.includes('image/')) {
          // For images, we just need the URL
          setContent(httpUrl);
        } else {
          // For other content types (PDF, etc.), provide download link
          setContent(httpUrl);
        }
      } catch (err: any) {
        console.error('Error fetching IPFS content:', err);
        setError(err.message || 'Failed to load content');
      } finally {
        setLoading(false);
      }
    };

    fetchIPFSContent();
  }, [ipfsUri]);

  if (loading) {
    return <div className={className}>Loading content...</div>;
  }

  if (error) {
    return <div className={`text-red-500 ${className}`}>{error}</div>;
  }

  // Render content based on content type
  if (contentType.includes('application/json')) {
    return (
      <pre className={`overflow-auto p-4 bg-gray-100 rounded ${className}`}>
        {JSON.stringify(content, null, 2)}
      </pre>
    );
  }

  if (contentType.includes('text/')) {
    return <div className={className}>{content}</div>;
  }

  if (contentType.includes('image/')) {
    return (
      <IPFSImage
        src={content}
        alt="IPFS content"
        width={400}
        height={300}
        className={className}
      />
    );
  }

  // Default: provide download link for other content types
  return (
    <div className={className}>
      <a 
        href={content} 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-blue-500 hover:underline"
      >
        View/Download Content
      </a>
    </div>
  );
} 