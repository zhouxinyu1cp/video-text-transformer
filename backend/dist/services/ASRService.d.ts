import type { TranscriptSegment } from '@video-transcriber/shared';
declare class WhisperNodeJSService {
    private modelName;
    constructor();
    /**
     * Transcribe audio file using nodejs-whisper (whisper.cpp base model)
     * @param audioPath - Path to audio file (mp3, wav, etc.)
     * @returns Array of transcript segments with timestamps
     */
    transcribe(audioPath: string): Promise<TranscriptSegment[]>;
    private convertToSegments;
    private parseTimestamp;
}
declare class ASRService {
    private whisperService;
    constructor();
    transcribe(audioPath: string): Promise<TranscriptSegment[]>;
    separateSpeakers(segments: TranscriptSegment[]): TranscriptSegment[];
}
export declare const asrService: ASRService;
export { WhisperNodeJSService };
