import { describe, it, expect, vi, beforeEach } from 'vitest'
import Fastify from 'fastify'
import { extractInfoRoutes } from './extract-info'

vi.mock('../services/LLMService.js', () => ({
  llmService: {
    extractInfo: vi.fn().mockResolvedValue({
      corePoints: ['观点1', '观点2'],
      facts: [],
      actionItems: [],
    }),
  },
}))

describe('POST /api/extract-info', () => {
  let app: ReturnType<typeof Fastify>

  beforeEach(async () => {
    vi.clearAllMocks()
    app = Fastify()
    await app.register(extractInfoRoutes)
  })

  it('应返回400: 缺少sessionId', async () => {
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
      url: '/api/extract-info',
      payload: { transcript: mockTranscript },
    })

    expect(response.statusCode).toBe(400)
    const body = JSON.parse(response.body)
    expect(body.error.code).toBe('MISSING_SESSION_ID')
  })

  it('应返回extraction结果', async () => {
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
      url: '/api/extract-info',
      payload: { sessionId: 'test-session', transcript: mockTranscript },
    })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(body.success).toBe(true)
    expect(body.data.extraction).toHaveProperty('corePoints')
  })
})
