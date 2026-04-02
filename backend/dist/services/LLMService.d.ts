import type { Transcript, Article, ExtractionResult } from '@video-transcriber/shared';
declare class LLMService {
    generateArticle(transcript: Transcript, options?: {
        articleStyle?: string;
        frameCount?: number;
    }): Promise<Article>;
    extractInfo(transcript: Transcript): Promise<ExtractionResult>;
    private buildTranscriptText;
}
export declare const llmService: LLMService;
export {};
