import { ffmpegService } from '../services/FFmpegService.js';
import { asrService } from '../services/ASRService.js';
import { fileService } from '../services/FileService.js';
export async function transcribeRoutes(app) {
    app.post('/api/transcribe', async (request, reply) => {
        const { sessionId, videoUrl, videoMeta } = request.body;
        if (!sessionId || !videoUrl) {
            return reply.status(400).send({
                success: false,
                error: { code: 'MISSING_SESSION_ID', message: 'Session ID and video URL are required' },
            });
        }
        // Set up SSE headers with CORS
        reply.raw.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': process.env.FRONTEND_URL || 'http://localhost:3000',
            'Access-Control-Allow-Credentials': 'true',
        });
        const sendEvent = (event, data) => {
            reply.raw.write(`data: ${JSON.stringify({ event, data })}\n\n`);
        };
        try {
            // Stage 1: Extract audio
            sendEvent('progress', { stage: 'extracting', progress: 10, message: '正在提取音频...' });
            await new Promise((r) => setTimeout(r, 500));
            const audioPath = await ffmpegService.extractAudio(videoUrl, sessionId);
            // Stage 2: Transcribe
            sendEvent('progress', { stage: 'transcribing', progress: 40, message: '正在转写音频...' });
            await new Promise((r) => setTimeout(r, 500));
            let segments = await asrService.transcribe(audioPath);
            // Stage 3: Separate speakers
            sendEvent('progress', { stage: 'separating', progress: 70, message: '正在分离说话人...' });
            await new Promise((r) => setTimeout(r, 500));
            segments = asrService.separateSpeakers(segments);
            // Build speaker map
            const speakerMap = {};
            const uniqueSpeakers = [...new Set(segments.map((s) => s.speakerId))];
            uniqueSpeakers.forEach((spk, idx) => {
                speakerMap[spk] = `说话人${idx + 1}`;
            });
            // Use provided videoMeta instead of hardcoded values
            const finalVideoMeta = {
                platform: videoMeta?.platform || 'unknown',
                videoUrl: videoMeta?.videoUrl || videoUrl,
                title: videoMeta?.title || 'Unknown',
                thumbnail: videoMeta?.thumbnail || '',
                duration: videoMeta?.duration || segments[segments.length - 1]?.endTime || 0,
            };
            // Create transcript
            const transcript = {
                videoMeta: finalVideoMeta,
                segments,
                speakerMap,
                duration: segments[segments.length - 1]?.endTime || 0,
                language: 'zh-CN',
                createdAt: new Date().toISOString(),
            };
            // Save transcript
            await fileService.write(sessionId, 'output/transcript.json', JSON.stringify(transcript, null, 2));
            sendEvent('done', { transcript });
            reply.raw.end();
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Transcription failed';
            sendEvent('error', { code: 'TRANSCRIPTION_FAILED', message });
            reply.raw.end();
        }
    });
}
