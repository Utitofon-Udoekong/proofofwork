import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ResumeMetadata, ResumeEntry } from '../types';

// Define a DraftResumeEntry for use in drafts (attachments are DraftAttachment[])
export type DraftResumeEntry = Omit<ResumeEntry, 'attachments'> & { attachments?: DraftAttachment[] };

// The draft is now just ResumeMetadata plus a few UI fields
export type ResumeDraft = Omit<ResumeMetadata, 'entries'> & {
  entries: DraftResumeEntry[];
  tokenId?: string; // If associated with an existing resume
  activeEntryIndex: number | null;
  // Optionally, add UI-only fields here
};

// Update ResumeEntry type for drafts (for clarity in this file)
export type DraftAttachment = {
  name: string;
  type: string;
  data: string; // data URL or blob URL
};

export type ResumeDraftsState = {
  drafts: Record<string, ResumeDraft>;
  currentDraftId: string | null;
  // Actions
  createDraft: (tokenId?: string, name?: string, initialDraft?: Partial<ResumeDraft>) => string;
  updateDraft: (draftId: string, updates: Partial<ResumeDraft>) => void;
  setCurrentDraft: (draftId: string | null) => void;
  addEntry: (draftId: string, entry: DraftResumeEntry) => void;
  updateEntry: (draftId: string, entryIndex: number, updates: Partial<DraftResumeEntry>) => void;
  removeEntry: (draftId: string, entryIndex: number) => void;
  setActiveEntry: (draftId: string, entryIndex: number | null) => void;
  deleteDraft: (draftId: string) => void;
  clearAllDrafts: () => void;
  serializeDraftForIPFS: (draftId: string) => ResumeMetadata | null;
  // Attachment methods
  addAttachment: (draftId: string, entryIndex: number, attachment: DraftAttachment) => void;
  removeAttachment: (draftId: string, entryIndex: number, attachmentName: string) => void;
  // Helper to upload all attachments at mint time
  processAttachmentsForMint: (draftId: string) => Promise<ResumeMetadata | null>;
};

const generateId = () => `draft_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

export const useResumeDraftStore = create<ResumeDraftsState>()(
  persist(
    (set, get) => ({
      drafts: {},
      currentDraftId: null,

      createDraft: (tokenId, name, initialDraft) => {
        const draftId = generateId();
        const now = new Date().toISOString();
        const defaultName = name || `Draft Resume ${Object.keys(get().drafts).length + 1}`;
        
        // Create a properly typed draft object
        const newDraft: ResumeDraft = {
          name: defaultName,
          version: (initialDraft?.version || '1.0'),
          resumeId: '', // Required field
          profile: {
            name: defaultName,
            lastUpdated: now,
            ...(initialDraft?.profile || {})
          },
          entries: initialDraft?.entries || [],
          chainId: initialDraft?.chainId || 0, // Default chainId
          createdAt: now,
          updatedAt: now,
          tokenId: tokenId,
          activeEntryIndex: null,
          // Add remaining fields from initialDraft that match ResumeDraft type
          ...(initialDraft || {})
        };

        set((state) => ({
          drafts: {
            ...state.drafts,
            [draftId]: newDraft
          },
          currentDraftId: draftId
        }));
        return draftId;
      },

      updateDraft: (draftId, updates) => {
        set((state) => {
          const draft = state.drafts[draftId];
          if (!draft) return state;
          const now = new Date().toISOString();
          return {
            drafts: {
              ...state.drafts,
              [draftId]: {
                ...draft,
                ...updates,
                updatedAt: now,
                profile: {
                  ...draft.profile,
                  ...(updates.profile || {}),
                  lastUpdated: (updates.profile && updates.profile.lastUpdated) || (draft.profile && draft.profile.lastUpdated) || now,
                },
                entries: Array.isArray(updates.entries)
                  ? updates.entries.map(e => ({ ...e, attachments: Array.isArray(e.attachments) ? e.attachments : [] }))
                  : Array.isArray(draft.entries)
                    ? draft.entries.map(e => ({ ...e, attachments: Array.isArray(e.attachments) ? e.attachments : [] }))
                    : [],
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
          const entries = Array.isArray(draft.entries) ? draft.entries : [];
          // Ensure attachments is always DraftAttachment[]
          let attachments: DraftAttachment[] = [];
          if (Array.isArray(entry.attachments) && entry.attachments.length > 0 && entry.attachments.every((att: unknown) => typeof att === 'object' && att !== null && 'data' in att)) {
            attachments = entry.attachments as DraftAttachment[];
          } else {
            attachments = [];
          }
          return {
            drafts: {
              ...state.drafts,
              [draftId]: {
                ...draft,
                entries: [...entries, { ...entry, attachments }],
                activeEntryIndex: entries.length,
                updatedAt: new Date().toISOString(),
              }
            }
          };
        });
      },

      updateEntry: (draftId, entryIndex, updates) => {
        set((state) => {
          const draft = state.drafts[draftId];
          const entries = Array.isArray(draft?.entries) ? draft.entries : [];
          if (!draft || entryIndex < 0 || entryIndex >= entries.length) return state;
          const updatedEntries = [...entries];
          // Ensure attachments is always DraftAttachment[]
          let attachments: DraftAttachment[] = updatedEntries[entryIndex].attachments || [];
          if (Array.isArray(updates.attachments) && updates.attachments.length > 0 && updates.attachments.every((att: unknown) => typeof att === 'object' && att !== null && 'data' in att)) {
            attachments = updates.attachments as DraftAttachment[];
          } else {
            attachments = [];
          }
          updatedEntries[entryIndex] = {
            ...updatedEntries[entryIndex],
            ...updates,
            attachments
          };
          return {
            drafts: {
              ...state.drafts,
              [draftId]: {
                ...draft,
                entries: updatedEntries,
                updatedAt: new Date().toISOString(),
              }
            }
          };
        });
      },

      removeEntry: (draftId, entryIndex) => {
        set((state) => {
          const draft = state.drafts[draftId];
          const entries = Array.isArray(draft?.entries) ? draft.entries : [];
          if (!draft || entryIndex < 0 || entryIndex >= entries.length) return state;
          const updatedEntries = entries.filter((_, i) => i !== entryIndex);
          return {
            drafts: {
              ...state.drafts,
              [draftId]: {
                ...draft,
                entries: updatedEntries,
                activeEntryIndex: null,
                updatedAt: new Date().toISOString(),
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
          const remainingDrafts = { ...state.drafts };
          delete remainingDrafts[draftId];
          return {
            drafts: remainingDrafts,
            currentDraftId: state.currentDraftId === draftId ? null : state.currentDraftId
          };
        });
      },

      clearAllDrafts: () => {
        set(() => ({ drafts: {}, currentDraftId: null }));
      },

      // Attachment methods
      addAttachment: (draftId, entryIndex, attachment) => {
        set((state) => {
          const draft = state.drafts[draftId];
          const entries = Array.isArray(draft?.entries) ? draft.entries : [];
          if (!draft || entryIndex < 0 || entryIndex >= entries.length) return state;
          const updatedEntries = [...entries];
          const currentEntry = updatedEntries[entryIndex];
          const currentAttachments: DraftAttachment[] = Array.isArray(currentEntry.attachments) && currentEntry.attachments.length > 0 && typeof currentEntry.attachments[0] === 'object' && 'data' in currentEntry.attachments[0]
            ? currentEntry.attachments as DraftAttachment[]
            : [];
          updatedEntries[entryIndex] = {
            ...currentEntry,
            attachments: [...currentAttachments, attachment]
          };
          return {
            drafts: {
              ...state.drafts,
              [draftId]: {
                ...draft,
                entries: updatedEntries,
                updatedAt: new Date().toISOString(),
              }
            }
          };
        });
      },

      removeAttachment: (draftId, entryIndex, attachmentName) => {
        set((state) => {
          const draft = state.drafts[draftId];
          const entries = Array.isArray(draft?.entries) ? draft.entries : [];
          if (!draft || entryIndex < 0 || entryIndex >= entries.length) return state;
          const updatedEntries = [...entries];
          const currentEntry = updatedEntries[entryIndex];
          const currentAttachments: DraftAttachment[] = Array.isArray(currentEntry.attachments) && currentEntry.attachments.length > 0 && typeof currentEntry.attachments[0] === 'object' && 'data' in currentEntry.attachments[0]
            ? currentEntry.attachments as DraftAttachment[]
            : [];
          updatedEntries[entryIndex] = {
            ...currentEntry,
            attachments: currentAttachments.filter(att => att.name !== attachmentName)
          };
          return {
            drafts: {
              ...state.drafts,
              [draftId]: {
                ...draft,
                entries: updatedEntries,
                updatedAt: new Date().toISOString(),
              }
            }
          };
        });
      },

      // Helper to process and upload all attachments at mint time
      processAttachmentsForMint: async (draftId) => {
        const draft = get().drafts[draftId];
        if (!draft) return null;
        
        const processedEntries: ResumeEntry[] = await Promise.all((draft.entries || []).map(async (entry) => {
          if (Array.isArray(entry.attachments) && entry.attachments.length > 0) {
            const ipfsUrls: string[] = [];
            for (const att of entry.attachments as DraftAttachment[]) {
              if (typeof att === 'object' && att.data) {
                const arr = att.data.split(',');
                const mime = arr[0].match(/:(.*?);/)?.[1] || att.type || 'application/octet-stream';
                const bstr = atob(arr[1]);
                let n = bstr.length;
                const u8arr = new Uint8Array(n);
                while (n--) {
                  u8arr[n] = bstr.charCodeAt(n);
                }
                const file = new File([u8arr], att.name, { type: mime });
                const url = await import('../services/ipfs').then(m => m.ipfsService.uploadFile(file));
                ipfsUrls.push(url);
              }
            }
            return { ...entry, attachments: ipfsUrls } as ResumeEntry;
          } else {
            return { ...entry, attachments: [] } as ResumeEntry;
          }
        }));

        // Directly construct the ResumeMetadata object, omitting tokenId and activeEntryIndex
        const result: ResumeMetadata = {
          resumeId: draft.resumeId,
          name: draft.name,
          version: draft.version,
          profile: draft.profile,
          entries: processedEntries, // Use the processed entries
          chainId: draft.chainId,
          createdAt: draft.createdAt,
          updatedAt: draft.updatedAt,
          // Conditionally add optional fields from draft if they exist
          ...(draft.description && { description: draft.description }),
          ...(draft.image && { image: draft.image }),
          ...(draft.transactionHash && { transactionHash: draft.transactionHash }),
        };

        return result;
      },

      // Helper to get the canonical ResumeMetadata for IPFS upload
      serializeDraftForIPFS: (draftId) => {
        const draft = get().drafts[draftId];
        if (!draft) return null;

        // Directly construct the ResumeMetadata object, omitting tokenId and activeEntryIndex
        // Note: draft.entries are DraftResumeEntry[], ResumeMetadata expects ResumeEntry[].
        // This was previously hidden by a broader cast. Making the cast explicit on entries.
        const result: ResumeMetadata = {
          resumeId: draft.resumeId,
          name: draft.name,
          version: draft.version,
          profile: draft.profile,
          entries: draft.entries as unknown as ResumeEntry[], // Explicit cast for entries
          chainId: draft.chainId,
          createdAt: draft.createdAt,
          updatedAt: draft.updatedAt,
          // Conditionally add optional fields from draft if they exist
          ...(draft.description && { description: draft.description }),
          ...(draft.image && { image: draft.image }),
          ...(draft.transactionHash && { transactionHash: draft.transactionHash }),
        };
        return result;
      },
    }),
    {
      name: 'resume-drafts',
      storage: createJSONStorage(() => localStorage),
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
  // Ensure entries is always an array
  const entries = Array.isArray(draft.entries) ? draft.entries : [];
  return entries[draft.activeEntryIndex];
};

// Hook to get all drafts sorted by last updated (use updatedAt on the draft root)
export const useSortedDrafts = () => {
  const drafts = useResumeDraftStore(state => state.drafts);
  // Sort drafts by updatedAt date (always present)
  const sortedDrafts = Object.entries(drafts)
    .map(([id, draft]) => ({ id, ...draft }))
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  return sortedDrafts;
}; 