import { fileService } from './FileService.js';
import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);
// URLs that ffmpeg cannot handle directly (require yt-dlp)
const YTDLP_PLATFORMS = [
    'bilibili.com',
    'douyin.com',
    'weixin.com',
    'channels.weixin.qq.com',
];
function needsYtdlp(url) {
    return YTDLP_PLATFORMS.some((platform) => url.includes(platform));
}
class FFmpegService {
    async extractAudio(videoUrl, sessionId) {
        const audioDir = `${fileService.getSessionDir(sessionId)}/audio`;
        const outputPath = `${audioDir}/extracted.mp3`;
        const tempVideoPath = `${audioDir}/temp_video.mp4`;
        try {
            // Ensure audio directory exists
            await fileService.createSession(sessionId);
            let command;
            if (needsYtdlp(videoUrl)) {
                // Step 1: Use yt-dlp to download video to temp file
                // No format selection - yt-dlp will automatically select best available
                // -o: output template
                const dlCommand = `yt-dlp -o "${tempVideoPath}" "${videoUrl}"`;
                await execAsync(dlCommand, { timeout: 600000 }); // 10 min timeout
                // Step 2: Use ffmpeg to extract audio from downloaded video
                // -i: input file (local)
                // -vn: disable video
                // -acodec libmp3lame: use mp3 codec
                // -ab 128k: audio bitrate
                // -y: overwrite output file
                command = `ffmpeg -i "${tempVideoPath}" -vn -acodec libmp3lame -ab 128k -y "${outputPath}"`;
            }
            else {
                // Use ffmpeg directly for direct video URLs (YouTube, etc.)
                // -i: input URL
                // -vn: disable video
                // -acodec libmp3lame: use mp3 codec
                // -ab 128k: audio bitrate
                // -y: overwrite output file
                command = `ffmpeg -i "${videoUrl}" -vn -acodec libmp3lame -ab 128k -y "${outputPath}"`;
            }
            await execAsync(command, { timeout: 300000 }); // 5 min timeout for ffmpeg
            return outputPath;
        }
        catch (error) {
            console.error('Failed to extract audio:', error);
            throw new Error('Failed to extract audio from video');
        }
    }
    async extractFrames(videoUrl, sessionId, count = 4) {
        try {
            // Ensure frames directory exists
            await fileService.createSession(sessionId);
            const framesDir = `${fileService.getSessionDir(sessionId)}/frames`;
            const frames = [];
            // Get video duration first
            const duration = await this.getVideoDuration(videoUrl);
            if (duration <= 0) {
                throw new Error('Could not determine video duration');
            }
            // Extract frames at evenly spaced intervals
            const interval = duration / (count + 1);
            for (let i = 1; i <= count; i++) {
                const timestamp = interval * i;
                const framePath = `${framesDir}/frame_${i.toString().padStart(3, '0')}.jpg`;
                // Use ffmpeg to extract single frame at timestamp
                // -ss: seek to timestamp
                // -vframes 1: extract one frame
                // -q:v 2: quality (lower is better, 2-5 is good)
                const command = `ffmpeg -ss ${timestamp} -i "${videoUrl}" -vframes 1 -q:v 2 -y "${framePath}"`;
                try {
                    await execAsync(command, { timeout: 60000 }); // 1 min timeout per frame
                    frames.push(framePath);
                }
                catch (frameError) {
                    console.error(`Failed to extract frame ${i}:`, frameError);
                    // Continue with other frames even if one fails
                }
            }
            if (frames.length === 0) {
                throw new Error('Failed to extract any frames');
            }
            return frames;
        }
        catch (error) {
            console.error('Failed to extract frames:', error);
            throw new Error('Failed to extract frames from video');
        }
    }
    async getVideoDuration(videoUrl) {
        try {
            // Use ffprobe to get video duration
            // -v error: hide error messages
            // -show_entries format=duration: show duration
            // -of default=noprint_wrappers=1:nokey=1: plain output
            const command = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoUrl}"`;
            const { stdout } = await execAsync(command, { timeout: 30000 });
            const duration = parseFloat(stdout.trim());
            return isNaN(duration) ? 0 : Math.floor(duration);
        }
        catch (error) {
            console.error('Failed to get video duration:', error);
            return 0;
        }
    }
}
export const ffmpegService = new FFmpegService();
