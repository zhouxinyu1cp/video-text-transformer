// Platform enum
export type Platform = 'bilibili' | 'douyin' | 'youtube' | 'wechat_video';

// Video metadata
export interface VideoMeta {
  platform: Platform;
  videoUrl: string;
  title: string;
  thumbnail: string;
  duration: number;
  author?: string;
}

// Transcript segment
export interface TranscriptSegment {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  speakerId: string;
  confidence?: number;
}

// Speaker mapping
export interface SpeakerMap {
  [speakerId: string]: string;
}

// Frame
export interface Frame {
  id: string;
  timestamp: number;
  imageUrl: string;
  description?: string;
}

// Extraction result
export interface FactItem {
  id: string;
  content: string;
  type: 'data' | 'fact';
}

export interface ActionItem {
  id: string;
  content: string;
  assignee?: string;
  deadline?: string;
}

export interface ExtractionResult {
  corePoints: string[];
  facts: FactItem[];
  actionItems: ActionItem[];
}

// Full transcript
export interface Transcript {
  videoMeta: VideoMeta;
  segments: TranscriptSegment[];
  speakerMap: SpeakerMap;
  duration: number;
  language: string;
  createdAt: string;
}

// Article
export interface Article {
  title: string;
  content: string;
  frames: Frame[];
  originalSummary?: string;
  wordCount: number;
  createdAt: string;
}

// Processing status
export type ProcessingStatus =
  | 'idle'
  | 'parsing'
  | 'extracting'
  | 'transcribing'
  | 'separating'
  | 'generating'
  | 'extracting_frames'
  | 'done'
  | 'error';

// API Error
export interface APIError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

// API Success response types
export interface ParseLinkResponse {
  success: true;
  data: {
    sessionId: string;
    videoMeta: VideoMeta;
  };
}

export interface ExtractInfoResponse {
  success: true;
  data: {
    extraction: ExtractionResult;
  };
}
