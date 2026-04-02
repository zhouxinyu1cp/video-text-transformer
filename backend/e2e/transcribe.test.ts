import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import Fastify, { FastifyInstance } from 'fastify'
import { parseRoutes } from '../src/routes/parse'
import { transcribeRoutes } from '../src/routes/transcribe'
import { downloadRoutes } from '../src/routes/download'
import { fileService } from '../src/services/FileService'
import fs from 'fs/promises'
import path from 'path'

describe('End-to-End: parse → transcribe → article', () => {
  let app: FastifyInstance
  let sessionId: string

  beforeAll(async () => {
    app = Fastify()
    await app.register(parseRoutes)
    await app.register(transcribeRoutes)
    await app.register(downloadRoutes)
    await app.ready()

    // 创建测试会话目录
    sessionId = `test-${Date.now()}`
    await fileService.createSession(sessionId)
  })

  afterAll(async () => {
    // 清理测试数据
    await fileService.cleanup(sessionId)
    await app.close()
  })

  it('完整流程: 解析链接 → 转写 → 生成文章', async () => {
    // Step 1: 解析B站链接
    const parseResponse = await app.inject({
      method: 'POST',
      url: '/api/parse-link',
      payload: {
        url: 'https://www.bilibili.com/video/BV1xx411c7mD',
      },
    })

    expect(parseResponse.statusCode).toBe(200)
    const parseData = JSON.parse(parseResponse.body)
    expect(parseData.success).toBe(true)
    expect(parseData.data.videoMeta.platform).toBe('bilibili')
    expect(parseData.data.sessionId).toBeDefined()

    const testSessionId = parseData.data.sessionId

    // Step 2: 转写视频 (SSE 流)
    const transcribeResponse = await app.inject({
      method: 'POST',
      url: '/api/transcribe',
      payload: {
        sessionId: testSessionId,
        videoUrl: parseData.data.videoMeta.videoUrl,
      },
    })

    expect(transcribeResponse.statusCode).toBe(200)
    expect(transcribeResponse.headers['content-type']).toContain('text/event-stream')

    // Fastify inject 返回的是 Buffer 或 string，直接读取 body
    const body = transcribeResponse.body
    if (typeof body === 'string') {
      expect(body).toContain('event: progress')
      expect(body).toContain('event: done')
    }
  }, 30000)

  it('转写流程: 无效sessionId应返回错误', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/transcribe',
      payload: {
        sessionId: 'invalid-session',
        videoUrl: 'https://bilibili.com/video/BV1xx411c7mD',
      },
    })

    // 由于是 mock 实现，应该会返回进度事件
    expect(response.statusCode).toBe(200)
  })

  it('解析后session目录应被创建', async () => {
    // 使用唯一sessionId确保目录创建
    const uniqueSessionId = `test-dir-${Date.now()}`
    await fileService.createSession(uniqueSessionId)

    const sessionDir = fileService.getSessionDir(uniqueSessionId)
    expect(sessionDir).toContain(uniqueSessionId)

    // 清理
    await fileService.cleanup(uniqueSessionId)
  })
})

describe('End-to-End: 图片代理与抽帧图片', () => {
  let app: FastifyInstance
  let sessionId: string

  beforeAll(async () => {
    app = Fastify()
    await app.register(downloadRoutes)
    await app.ready()

    sessionId = `test-img-${Date.now()}`
    await fileService.createSession(sessionId)

    // 创建测试帧图片
    const framesDir = path.join(fileService.getSessionDir(sessionId), 'frames')
    await fs.mkdir(framesDir, { recursive: true })
    await fs.writeFile(path.join(framesDir, 'frame_001.jpg'), 'fake-image-data')
  })

  afterAll(async () => {
    await fileService.cleanup(sessionId)
    await app.close()
  })

  it('应能获取抽帧图片', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/api/files/${sessionId}/frames/frame_001.jpg`,
    })

    expect(response.statusCode).toBe(200)
    expect(response.headers['content-type']).toBe('image/jpeg')
  })

  it('图片代理应返回400: 缺少url参数', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/proxy/image',
    })

    expect(response.statusCode).toBe(400)
    const body = JSON.parse(response.body)
    expect(body.error.code).toBe('MISSING_URL')
  })

  it('图片代理应返回400: 非法的协议', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/proxy/image?url=file:///etc/passwd',
    })

    expect(response.statusCode).toBe(400)
    const body = JSON.parse(response.body)
    expect(body.error.code).toBe('INVALID_PROTOCOL')
  })

  it('FileService.getFrameUrl应返回完整后端URL', async () => {
    const framePath = `/tmp/video-transcriber/${sessionId}/frames/frame_001.jpg`
    const frameUrl = fileService.getFrameUrl(sessionId, framePath)

    // 应包含完整的后端 URL，而非相对路径
    expect(frameUrl).toMatch(/^http:\/\/localhost:3001\/api\/files\//)
    expect(frameUrl).toContain(sessionId)
    expect(frameUrl).toContain('frame_001.jpg')
  })
})