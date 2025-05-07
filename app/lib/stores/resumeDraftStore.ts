import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { EntryType, ProfileMetadata } from '../types';

export type ResumeDraftEntryType = {
  id?: string; // Auto-generated when saving
  type: EntryType;
  title: string;
  company: string;
  description: string;
  startDate: string;
  endDate: string;
  organization: string;
  [key: string]: any; // Additional fields
};

export type ResumeDraft = {
  tokenId?: string; // If associated with an existing resume
  lastUpdated: string;
  entries: ResumeDraftEntryType[];
  activeEntryIndex: number | null;
  name?: string;
  attachments?: { ipfsUri: string; httpUrl: string; name: string; type: string }[];
  profileData?: Partial<ProfileMetadata>; // Profile information
};

export type ResumeDraftsState = {
  drafts: Record<string, ResumeDraft>;
  currentDraftId: string | null;
  // Actions
  createDraft: (tokenId?: string, name?: string) => string;
  updateDraft: (draftId: string, updates: Partial<ResumeDraft>) => void;
  setCurrentDraft: (draftId: string | null) => void;
  addEntry: (draftId: string, entry: ResumeDraftEntryType) => void;
  updateEntry: (draftId: string, entryIndex: number, updates: Partial<ResumeDraftEntryType>) => void;
  removeEntry: (draftId: string, entryIndex: number) => void;
  setActiveEntry: (draftId: string, entryIndex: number | null) => void;
  deleteDraft: (draftId: string) => void;
  addAttachment: (draftId: string, attachment: { ipfsUri: string; httpUrl: string; name: string; type: string }) => void;
  removeAttachment: (draftId: string, ipfsUri: string) => void;
  clearAllDrafts: () => void;
};

// Helper to generate unique IDs
const generateId = () => `draft_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

// Create the store with persistence
export const useResumeDraftStore = create<ResumeDraftsState>()(
  persist(
    (set, get) => ({
      drafts: {},
      currentDraftId: null,

      createDraft: (tokenId, name) => {
        const draftId = generateId();
        set((state) => ({
          drafts: {
            ...state.drafts,
            [draftId]: {
              tokenId,
              name: name || `Draft Resume ${Object.keys(state.drafts).length + 1}`,
              lastUpdated: new Date().toISOString(),
              entries: [],
              activeEntryIndex: null,
              attachments: []
            }
          },
          currentDraftId: draftId
        }));
        return draftId;
      },

      updateDraft: (draftId, updates) => {
        set((state) => {
          const draft = state.drafts[draftId];
          if (!draft) return state;

          return {
            drafts: {
              ...state.drafts,
              [draftId]: {
                ...draft,
                ...updates,
                lastUpdated: new Date().toISOString()
              }
            }
          };
        });
      },

      setCurrentDraft: (draftId) => {
        set({ currentDraftId: draftId });
      },

      addEntry: (draftId, entry) => {
        set((state) => {
          const draft = state.drafts[draftId];
          if (!draft) return state;

          const newEntry = {
            ...entry,
            id: `entry_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
          };

          return {
            drafts: {
              ...state.drafts,
              [draftId]: {
                ...draft,
                entries: [...draft.entries, newEntry],
                activeEntryIndex: draft.entries.length,
                lastUpdated: new Date().toISOString()
              }
            }
          };
        });
      },

      updateEntry: (draftId, entryIndex, updates) => {
        set((state) => {
          const draft = state.drafts[draftId];
          if (!draft || entryIndex < 0 || entryIndex >= draft.entries.length) return state;

          const updatedEntries = [...draft.entries];
          updatedEntries[entryIndex] = {
            ...updatedEntries[entryIndex],
            ...updates
          };

          return {
            drafts: {
              ...state.drafts,
              [draftId]: {
                ...draft,
                entries: updatedEntries,
                lastUpdated: new Date().toISOString()
              }
            }
          };
        });
      },

      removeEntry: (draftId, entryIndex) => {
        set((state) => {
          const draft = state.drafts[draftId];
          if (!draft || entryIndex < 0 || entryIndex >= draft.entries.length) return state;

          const updatedEntries = draft.entries.filter((_, i) => i !== entryIndex);
          
          return {
            drafts: {
              ...state.drafts,
              [draftId]: {
                ...draft,
                entries: updatedEntries,
                activeEntryIndex: null,
                lastUpdated: new Date().toISOString()
              }
            }
          };
        });
      },

      setActiveEntry: (draftId, entryIndex) => {
        set((state) => {
          const draft = state.drafts[draftId];
          if (!draft) return state;

          return {
            drafts: {
              ...state.drafts,
              [draftId]: {
                ...draft,
                activeEntryIndex: entryIndex
              }
            }
          };
        });
      },

      deleteDraft: (draftId) => {
        set((state) => {
          const { [draftId]: _, ...remainingDrafts } = state.drafts;
          
          return {
            drafts: remainingDrafts,
            currentDraftId: state.currentDraftId === draftId ? null : state.currentDraftId
          };
        });
      },

      addAttachment: (draftId, attachment) => {
        set((state) => {
          const draft = state.drafts[draftId];
          if (!draft) return state;

          return {
            drafts: {
              ...state.drafts,
              [draftId]: {
                ...draft,
                attachments: [...(draft.attachments || []), attachment],
                lastUpdated: new Date().toISOString()
              }
            }
          };
        });
      },

      removeAttachment: (draftId, ipfsUri) => {
        set((state) => {
          const draft = state.drafts[draftId];
          if (!draft || !draft.attachments) return state;

          return {
            drafts: {
              ...state.drafts,
              [draftId]: {
                ...draft,
                attachments: draft.attachments.filter(att => att.ipfsUri !== ipfsUri),
                lastUpdated: new Date().toISOString()
              }
            }
          };
        });
      },

      clearAllDrafts: () => {
        set({ drafts: {}, currentDraftId: null });
      }
    }),
    {
      name: 'pow-resume-drafts',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        drafts: state.drafts,
        currentDraftId: state.currentDraftId 
      })
    }
  )
);

// Utility hooks for common operations
export const useCurrentDraft = () => {
  const drafts = useResumeDraftStore(state => state.drafts);
  const currentDraftId = useResumeDraftStore(state => state.currentDraftId);

  return currentDraftId ? drafts[currentDraftId] : null;
};

export const useCurrentEntry = () => {
  const draft = useCurrentDraft();
  
  if (!draft || draft.activeEntryIndex === null) {
    return null;
  }
  
  return draft.entries[draft.activeEntryIndex];
};

// Hook to get all drafts sorted by last updated
export const useSortedDrafts = () => {
  const drafts = useResumeDraftStore(state => state.drafts);
  
  // Sort drafts by last updated date
  const sortedDrafts = Object.entries(drafts)
    .map(([id, draft]) => ({ id, ...draft }))
    .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
    
  return sortedDrafts;
}; 