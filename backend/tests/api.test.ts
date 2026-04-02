import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import Fastify, { FastifyInstance } from 'fastify'
import { parseRoutes } from '../src/routes/parse'
import { transcribeRoutes } from '../src/routes/transcribe'
import { generateArticleRoutes } from '../src/routes/generate-article'
import { extractInfoRoutes } from '../src/routes/extract-info'
import { downloadRoutes } from '../src/routes/download'

describe('API Integration Tests', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = Fastify()
    await app.register(parseRoutes)
    await app.register(transcribeRoutes)
    await app.register(generateArticleRoutes)
    await app.register(extractInfoRoutes)
    await app.register(downloadRoutes)
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  describe('POST /api/parse-link', () => {
    it('应解析B站链接并返回视频元数据', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/parse-link',
        payload: {
          url: 'https://www.bilibili.com/video/BV1xx411c7mD',
        },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(true)
      expect(body.data).toHaveProperty('sessionId')
      expect(body.data).toHaveProperty('videoMeta')
      expect(body.data.videoMeta.platform).toBe('bilibili')
    })

    it('应解析抖音链接', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/parse-link',
        payload: {
          url: 'https://www.douyin.com/video/7123456789012345678',
        },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(true)
      expect(body.data.videoMeta.platform).toBe('douyin')
    })

    it('应解析YouTube链接', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/parse-link',
        payload: {
          url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(true)
      expect(body.data.videoMeta.platform).toBe('youtube')
    })

    it('应拒绝无效链接', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/parse-link',
        payload: {
          url: 'https://example.com/invalid',
        },
      })

      expect(response.statusCode).toBe(400)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(false)
      expect(body.error.code).toBe('INVALID_URL')
    })
  })

  describe('POST /api/transcribe', () => {
    it('应返回SSE流式响应', async () => {
      // 先解析链接获取sessionId
      const parseResponse = await app.inject({
        method: 'POST',
        url: '/api/parse-link',
        payload: {
          url: 'https://www.bilibili.com/video/BV1xx411c7mD',
        },
      })

      const { sessionId, videoMeta } = JSON.parse(parseResponse.body).data

      const response = await app.inject({
        method: 'POST',
        url: '/api/transcribe',
        payload: {
          sessionId,
          videoUrl: videoMeta.videoUrl,
        },
      })

      expect(response.statusCode).toBe(200)
      expect(response.headers['content-type']).toContain('text/event-stream')
    })

    it('缺少sessionId应返回400', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/transcribe',
        payload: {
          videoUrl: 'https://bilibili.com/video/BV1xx411c7mD',
        },
      })

      expect(response.statusCode).toBe(400)
    })
  })

  describe('POST /api/generate-article', () => {
    it('应返回SSE流式响应', async () => {
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

      // 路由直接返回 SSE 流，不做 sessionId 校验
      expect(response.statusCode).toBe(200)
      expect(response.headers['content-type']).toContain('text/event-stream')
    })
  })

  describe('POST /api/extract-info', () => {
    it('应提取信息并返回结构化结果', async () => {
      // 先解析链接获取sessionId
      const parseResponse = await app.inject({
        method: 'POST',
        url: '/api/parse-link',
        payload: {
          url: 'https://www.bilibili.com/video/BV1xx411c7mD',
        },
      })

      const { sessionId } = JSON.parse(parseResponse.body).data

      const mockTranscript = {
        videoMeta: {
          platform: 'bilibili' as const,
          videoUrl: 'https://bilibili.com/video/BV1xx411c7mD',
          title: '测试视频',
          thumbnail: '',
          duration: 600,
        },
        segments: [
          {
            id: 'seg_001',
            startTime: 0,
            endTime: 5000,
            text: '这是一个测试内容',
            speakerId: 'spk_001',
          },
        ],
        speakerMap: { spk_001: '说话人1' },
        duration: 5000,
        language: 'zh-CN',
        createdAt: new Date().toISOString(),
      }

      const response = await app.inject({
        method: 'POST',
        url: '/api/extract-info',
        payload: {
          sessionId,
          transcript: mockTranscript,
        },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(true)
      expect(body.data.extraction).toHaveProperty('corePoints')
      expect(body.data.extraction).toHaveProperty('facts')
      expect(body.data.extraction).toHaveProperty('actionItems')
    })

    it('缺少sessionId应返回400', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/extract-info',
        payload: {
          transcript: { segments: [], speakerMap: {} },
        },
      })

      expect(response.statusCode).toBe(400)
    })
  })

  describe('GET /api/download/:type', () => {
    it('缺少sessionId应返回400', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/download/transcript_txt',
      })

      expect(response.statusCode).toBe(400)
      const body = JSON.parse(response.body)
      expect(body.error.code).toBe('MISSING_SESSION_ID')
    })

    it('未知类型应返回400', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/download/invalid_type?sessionId=test',
      })

      expect(response.statusCode).toBe(400)
      const body = JSON.parse(response.body)
      expect(body.error.code).toBe('UNKNOWN_TYPE')
    })

    it('文件不存在应返回404', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/download/transcript_txt?sessionId=nonexistent',
      })

      expect(response.statusCode).toBe(404)
    })
  })
})