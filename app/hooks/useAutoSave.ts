import { useEffect, useRef } from 'react';
import { useDebouncedCallback } from '@react-hookz/web';



/**
 * Hook for auto-saving form data with debounce
 * 
 * @param value The value to auto-save
 * @param onSave Callback function to save the value
 * @param delay Debounce delay in milliseconds
 */
export function useAutoSave<T>(
  value: T,
  onSave: (value: T) => void,
  delay: number = 1000
): void {
  // Track if this is the initial render
  const isFirstRender = useRef(true);
  
  // Create a debounced save function
  const debouncedSave = useDebouncedCallback(
    (valueToSave: T) => {
      if (!isFirstRender.current) {
        onSave(valueToSave);
      }
    },
    [],
    delay
  );
  
  // Effect to handle the save when value changes
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    
    debouncedSave(value);
  }, [value, debouncedSave]);
}

/**
 * Hook for auto-saving form data with support for unsaved changes warning
 * 
 * @param value The value to auto-save
 * @param onSave Callback function to save the value
 * @param options Configuration options
 */
export function useFormAutoSave<T>(
  value: T,
  onSave: (value: T) => void, 
  options: {
    delay?: number;
    enableNavigationWarning?: boolean;
    warningMessage?: string;
  } = {}
): { 
  hasUnsavedChanges: boolean;
  markAsSaved: () => void;
} {
  const { 
    delay = 2000, 
    enableNavigationWarning = true,
    warningMessage = 'You have unsaved changes. Are you sure you want to leave?'
  } = options;
  
  // Track if this is the initial render
  const isFirstRender = useRef(true);
  
  // Track unsaved changes status
  const hasUnsavedChangesRef = useRef(false);
  
  // Create a debounced save function
  const debouncedSave = useDebouncedCallback(
    (valueToSave: T) => {
      onSave(valueToSave);
      hasUnsavedChangesRef.current = false;
    },
    [],
    delay
  );
  
  // Track if there are unsaved changes
  const markAsSaved = () => {
    hasUnsavedChangesRef.current = false;
  };
  
  // Effect to handle the save when value changes
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    
    // Mark as having unsaved changes
    hasUnsavedChangesRef.current = true;
    
    // Trigger the debounced save
    debouncedSave(value);
  }, [value, debouncedSave]);
  
  // Add navigation warning if enabled
  useEffect(() => {
    if (!enableNavigationWarning) return;
    
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChangesRef.current) {
        e.preventDefault();
        e.returnValue = warningMessage;
        return warningMessage;
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [enableNavigationWarning, warningMessage]);
  
  return { 
    hasUnsavedChanges: hasUnsavedChangesRef.current,
    markAsSaved
  };
} 