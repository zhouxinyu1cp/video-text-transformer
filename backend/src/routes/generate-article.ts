import type { FastifyInstance } from 'fastify'
import { llmService } from '../services/LLMService.js'
import { ffmpegService } from '../services/FFmpegService.js'
import { fileService } from '../services/FileService.js'
import type { Transcript, Article } from '@video-transcriber/shared'

export async function generateArticleRoutes(app: FastifyInstance) {
  app.post('/api/generate-article', async (request, reply) => {
    const { sessionId, transcript, options } = request.body as {
      sessionId: string
      transcript: Transcript
      options?: { articleStyle?: string; frameCount?: number }
    }

    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': process.env.FRONTEND_URL || 'http://localhost:3000',
      'Access-Control-Allow-Credentials': 'true',
    })

    const sendEvent = (event: string, data: object) => {
      reply.raw.write(`data: ${JSON.stringify({ event, data })}\n\n`)
    }

    try {
      sendEvent('progress', { stage: 'generating', progress: 30, message: '正在生成文章...' })
      await new Promise((r) => setTimeout(r, 500))

      // Use provided transcript or read from file
      const finalTranscript = transcript || JSON.parse(await fileService.read(sessionId, 'output/transcript.json'))
      const article = await llmService.generateArticle(finalTranscript, options)

      sendEvent('progress', { stage: 'extracting_frames', progress: 70, message: '正在提取关键帧...' })
      await new Promise((r) => setTimeout(r, 500))

      // Use local video file if available, otherwise fall back to remote URL
      const localVideoPath = `${fileService.getSessionDir(sessionId)}/audio/temp_video.mp4`
      const videoSource = (await fileService.exists(sessionId, 'audio/temp_video.mp4'))
        ? localVideoPath
        : finalTranscript.videoMeta.videoUrl

      const frameCount = options?.frameCount || 4
      const framePaths = await ffmpegService.extractFrames(videoSource, sessionId, frameCount)

      article.frames = framePaths.map((framePath, idx) => ({
        id: `frame_${idx + 1}`,
        timestamp: Math.floor((finalTranscript.duration / (frameCount + 1)) * (idx + 1)),
        imageUrl: fileService.getFrameUrl(sessionId, framePath),
      }))

      sendEvent('done', { article })
      reply.raw.end()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Article generation failed'
      sendEvent('error', { code: 'ARTICLE_GENERATION_FAILED', message })
      reply.raw.end()
    }
  })
}
