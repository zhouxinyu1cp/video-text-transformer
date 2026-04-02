import { describe, it, expect, vi, beforeEach } from 'vitest'
import Fastify from 'fastify'
import { transcribeRoutes } from './transcribe'

// Mock services
vi.mock('../services/FFmpegService.js', () => ({
  ffmpegService: {
    extractAudio: vi.fn().mockResolvedValue('/fake/audio.mp3'),
    extractFrames: vi.fn().mockResolvedValue(['/fake/frame.jpg']),
  },
}))

vi.mock('../services/ASRService.js', () => ({
  asrService: {
    transcribe: vi.fn().mockResolvedValue([
      { id: 'seg_001', startTime: 0, endTime: 5000, text: '测试文本', speakerId: 'spk_001', confidence: 0.9 },
    ]),
    separateSpeakers: vi.fn((segs) => segs),
  },
}))

vi.mock('../services/FileService.js', () => ({
  fileService: {
    write: vi.fn().mockResolvedValue(undefined),
    getSessionDir: vi.fn().mockReturnValue('/tmp/test'),
    exists: vi.fn().mockResolvedValue(false),
  },
}))

describe('POST /api/transcribe', () => {
  let app: ReturnType<typeof Fastify>

  beforeEach(async () => {
    app = Fastify()
    await app.register(transcribeRoutes)
  })

  it('应返回400: 缺少sessionId', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/transcribe',
      payload: { videoUrl: 'https://example.com/video.mp4' },
    })

    expect(response.statusCode).toBe(400)
    const body = JSON.parse(response.body)
    expect(body.success).toBe(false)
    expect(body.error.code).toBe('MISSING_SESSION_ID')
  })

  it('应返回400: 缺少videoUrl', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/transcribe',
      payload: { sessionId: 'test-session' },
    })

    expect(response.statusCode).toBe(400)
  })

  it('应返回SSE流: 有效请求', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/transcribe',
      payload: {
        sessionId: 'test-session',
        videoUrl: 'https://example.com/video.mp4',
        videoMeta: {
          platform: 'youtube',
          videoUrl: 'https://example.com/video.mp4',
          title: '测试视频',
          thumbnail: '',
          duration: 60000,
        },
      },
    })

    expect(response.statusCode).toBe(200)
    expect(response.headers['content-type']).toContain('text/event-stream')
  })
})
