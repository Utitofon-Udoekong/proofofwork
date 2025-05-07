'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { ipfsService } from '@/app/lib/services/ipfs';

interface IPFSImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
}

/**
 * Component for rendering IPFS images with fallback
 */
export default function IPFSImage({ src, alt, width, height, className = '' }: IPFSImageProps) {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [error, setError] = useState<boolean>(false);
  
  // Default fallback image
  const fallbackImage = '/placeholder-image.png';
  
  useEffect(() => {
    // Convert IPFS URI to HTTP URL
    if (src) {
      const url = ipfsService.getHttpUrl(src);
      setImageUrl(url);
      setError(false);
    } else {
      setError(true);
    }
  }, [src]);
  
  const handleError = () => {
    setError(true);
  };
  
  return (
    <Image
      src={error ? fallbackImage : imageUrl}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onError={handleError}
    />
  );
} 