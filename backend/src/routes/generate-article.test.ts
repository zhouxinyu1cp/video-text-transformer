import { describe, it, expect, vi, beforeEach } from 'vitest'
import Fastify from 'fastify'
import { generateArticleRoutes } from './generate-article'

vi.mock('../services/LLMService.js', () => ({
  llmService: {
    generateArticle: vi.fn().mockResolvedValue({
      title: '测试文章',
      content: '文章内容',
      frames: [],
      wordCount: 100,
      createdAt: new Date().toISOString(),
    }),
  },
}))

vi.mock('../services/FFmpegService.js', () => ({
  ffmpegService: {
    extractFrames: vi.fn().mockResolvedValue(['/path/to/frame.jpg']),
  },
}))

describe('POST /api/generate-article', () => {
  let app: ReturnType<typeof Fastify>

  beforeEach(async () => {
    vi.clearAllMocks()
    app = Fastify()
    await app.register(generateArticleRoutes)
  })

  it('应返回SSE流: 有效请求', async () => {
    const mockTranscript = {
      videoMeta: { platform: 'bilibili', videoUrl: '', title: '', thumbnail: '', duration: 0 },
      segments: [],
      speakerMap: {},
      duration: 0,
      language: 'zh-CN',
      createdAt: new Date().toISOString(),
    }

    const response = await app.inject({
      method: 'POST',
      url: '/api/generate-article',
      payload: {
        sessionId: 'test-session',
        transcript: mockTranscript,
      },
    })

    expect(response.statusCode).toBe(200)
    expect(response.headers['content-type']).toContain('text/event-stream')
  })
})
