declare class FileService {
    private baseDir;
    constructor();
    createSession(sessionId: string): Promise<string>;
    write(sessionId: string, filePath: string, content: string): Promise<void>;
    read(sessionId: string, filePath: string): Promise<string>;
    exists(sessionId: string, filePath: string): Promise<boolean>;
    cleanup(sessionId: string): Promise<void>;
    getSessionDir(sessionId: string): string;
    getFileUrl(sessionId: string, filePath: string): string;
    getFrameUrl(sessionId: string, framePath: string): string;
}
export declare const fileService: FileService;
export {};
