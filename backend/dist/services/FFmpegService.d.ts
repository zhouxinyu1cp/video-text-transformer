declare class FFmpegService {
    extractAudio(videoUrl: string, sessionId: string): Promise<string>;
    extractFrames(videoUrl: string, sessionId: string, count?: number): Promise<string[]>;
    getVideoDuration(videoUrl: string): Promise<number>;
}
export declare const ffmpegService: FFmpegService;
export {};
