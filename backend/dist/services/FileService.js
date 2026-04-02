import fs from 'fs/promises';
import path from 'path';
class FileService {
    baseDir;
    constructor() {
        this.baseDir = process.env.STORAGE_BASE_DIR || '/tmp/video-transcriber';
    }
    async createSession(sessionId) {
        const sessionDir = path.join(this.baseDir, sessionId);
        const subDirs = ['audio', 'frames', 'output'];
        for (const subDir of subDirs) {
            await fs.mkdir(path.join(sessionDir, subDir), { recursive: true });
        }
        return sessionDir;
    }
    async write(sessionId, filePath, content) {
        const fullPath = path.join(this.baseDir, sessionId, filePath);
        await fs.mkdir(path.dirname(fullPath), { recursive: true });
        await fs.writeFile(fullPath, content, 'utf-8');
    }
    async read(sessionId, filePath) {
        const fullPath = path.join(this.baseDir, sessionId, filePath);
        return fs.readFile(fullPath, 'utf-8');
    }
    async exists(sessionId, filePath) {
        const fullPath = path.join(this.baseDir, sessionId, filePath);
        try {
            await fs.access(fullPath);
            return true;
        }
        catch {
            return false;
        }
    }
    async cleanup(sessionId) {
        const sessionDir = path.join(this.baseDir, sessionId);
        try {
            await fs.rm(sessionDir, { recursive: true, force: true });
        }
        catch (error) {
            console.error(`Failed to cleanup session ${sessionId}:`, error);
        }
    }
    getSessionDir(sessionId) {
        return path.join(this.baseDir, sessionId);
    }
    getFileUrl(sessionId, filePath) {
        // 返回可访问的 URL 路径
        return `/api/files/${sessionId}/${filePath}`;
    }
    getFrameUrl(sessionId, framePath) {
        // 从完整路径中提取相对于 session 的 frames 子路径
        const relativePath = framePath.split('/frames/').pop() || framePath;
        // 返回完整的后端 URL，避免前端相对路径解析到错误端口
        const baseUrl = process.env.API_BASE_URL || 'http://localhost:3001';
        return `${baseUrl}/api/files/${sessionId}/frames/${relativePath}`;
    }
}
export const fileService = new FileService();
