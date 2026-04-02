import { create } from 'zustand'
import type {
  VideoMeta,
  Transcript,
  SpeakerMap,
  Article,
  ExtractionResult,
  ProcessingStatus,
} from '@video-transcriber/shared'

interface AppState {
  // Session
  sessionId: string | null
  status: ProcessingStatus
  error: string | null

  // Video info
  videoMeta: VideoMeta | null

  // Transcript
  transcript: Transcript | null
  speakerMap: SpeakerMap

  // Article
  article: Article | null

  // Extraction
  extraction: ExtractionResult | null

  // Actions
  setSessionId: (id: string) => void
  setStatus: (status: ProcessingStatus) => void
  setError: (error: string | null) => void
  setVideoMeta: (meta: VideoMeta) => void
  setTranscript: (transcript: Transcript) => void
  updateSpeakerName: (speakerId: string, name: string) => void
  setArticle: (article: Article) => void
  setExtraction: (result: ExtractionResult) => void
  reset: () => void
}

const initialState = {
  sessionId: null,
  status: 'idle' as ProcessingStatus,
  error: null,
  videoMeta: null,
  transcript: null,
  speakerMap: {} as SpeakerMap,
  article: null,
  extraction: null,
}

export const useAppStore = create<AppState>((set) => ({
  ...initialState,

  setSessionId: (id) => set({ sessionId: id }),

  setStatus: (status) => set({ status }),

  setError: (error) => set({ error }),

  setVideoMeta: (meta) => set({ videoMeta: meta }),

  setTranscript: (transcript) =>
    set({
      transcript,
      speakerMap: transcript.speakerMap,
    }),

  updateSpeakerName: (speakerId, name) =>
    set((state) => {
      const newSpeakerMap = {
        ...state.speakerMap,
        [speakerId]: name,
      }
      // Also update in transcript segments
      if (state.transcript) {
        const newTranscript = {
          ...state.transcript,
          speakerMap: newSpeakerMap,
        }
        return { speakerMap: newSpeakerMap, transcript: newTranscript }
      }
      return { speakerMap: newSpeakerMap }
    }),

  setArticle: (article) => set({ article }),

  setExtraction: (result) => set({ extraction: result }),

  reset: () => set(initialState),
}))
