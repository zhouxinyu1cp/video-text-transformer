import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import Fastify from 'fastify'
import { downloadRoutes } from './download'
import { fileService } from '../services/FileService.js'
import fs from 'fs/promises'
import path from 'path'

// Mock fileService
vi.mock('../services/FileService.js', () => ({
  fileService: {
    read: vi.fn(),
    exists: vi.fn(),
    getSessionDir: vi.fn(),
    getFrameUrl: vi.fn().mockImplementation((sessionId, framePath) => {
      const relativePath = framePath.split('/frames/').pop() || framePath
      return `http://localhost:3001/api/files/${sessionId}/frames/${relativePath}`
    }),
  },
}))

describe('GET /api/download/:type', () => {
  let app: ReturnType<typeof Fastify>
  const testSessionId = `test_session_${Date.now()}`
  const baseDir = process.env.STORAGE_BASE_DIR || '/tmp/video-transcriber'

  beforeEach(async () => {
    vi.clearAllMocks()
    app = Fastify()
    await app.register(downloadRoutes)
  })

  afterEach(async () => {
    await app.close()
    // Cleanup test frames directory
    try {
      await fs.rm(path.join(baseDir, testSessionId, 'frames'), { recursive: true, force: true })
    } catch {}
  })

  it('应返回400: 缺少sessionId', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/download/transcript_txt',
    })

    expect(response.statusCode).toBe(400)
    const body = JSON.parse(response.body)
    expect(body.error.code).toBe('MISSING_SESSION_ID')
  })

  it('应返回400: 未知类型', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/download/invalid_type?sessionId=test',
    })

    expect(response.statusCode).toBe(400)
    const body = JSON.parse(response.body)
    expect(body.error.code).toBe('UNKNOWN_TYPE')
  })

  it('应返回transcript_txt文件', async () => {
    const mockTranscript = {
      segments: [
        { startTime: 0, endTime: 1, text: '测试', speakerId: 'spk_001' },
      ],
      speakerMap: { spk_001: '说话人1' },
    }

    vi.mocked(fileService.exists).mockResolvedValue(true)
    vi.mocked(fileService.read).mockResolvedValue(JSON.stringify(mockTranscript))

    const response = await app.inject({
      method: 'GET',
      url: '/api/download/transcript_txt?sessionId=test-session',
    })

    expect(response.statusCode).toBe(200)
    expect(response.headers['content-type']).toContain('text/plain')
    expect(response.body).toContain('[00:00:00]')
  })

  it('应返回transcript_word文件（真正的Word文档）', async () => {
    const mockTranscript = {
      duration: 120,
      segments: [
        { startTime: 0, endTime: 1, text: '测试文本', speakerId: 'spk_001' },
        { startTime: 1, endTime: 2, text: '第二句', speakerId: 'spk_002' },
      ],
      speakerMap: { spk_001: '说话人1', spk_002: '说话人2' },
    }

    vi.mocked(fileService.exists).mockResolvedValue(true)
    vi.mocked(fileService.read).mockResolvedValue(JSON.stringify(mockTranscript))

    const response = await app.inject({
      method: 'GET',
      url: '/api/download/transcript_word?sessionId=test-session',
    })

    expect(response.statusCode).toBe(200)
    // Word文档的MIME类型
    expect(response.headers['content-type']).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    expect(response.headers['content-disposition']).toContain('.docx')
    // 返回的应该是二进制内容（docx是zip格式），不是JSON
    expect(response.body).not.toBe(JSON.stringify(mockTranscript))
  })

  it('应返回404: 文件不存在', async () => {
    vi.mocked(fileService.read).mockRejectedValue(new Error('File not found'))

    const response = await app.inject({
      method: 'GET',
      url: '/api/download/transcript_txt?sessionId=nonexistent',
    })

    expect(response.statusCode).toBe(404)
    const body = JSON.parse(response.body)
    expect(body.error.code).toBe('FILE_NOT_READY')
  })
})

describe('GET /api/files/:sessionId/frames/:filename', () => {
  let app: ReturnType<typeof Fastify>
  const testSessionId = `test_session_frames_${Date.now()}`
  const baseDir = process.env.STORAGE_BASE_DIR || '/tmp/video-transcriber'

  beforeEach(async () => {
    vi.clearAllMocks()
    app = Fastify()
    await app.register(downloadRoutes)

    // Create test frames directory and file
    const framesDir = path.join(baseDir, testSessionId, 'frames')
    await fs.mkdir(framesDir, { recursive: true })
    await fs.writeFile(path.join(framesDir, 'frame_001.jpg'), 'fake-image-data')
  })

  afterEach(async () => {
    await app.close()
    try {
      await fs.rm(path.join(baseDir, testSessionId), { recursive: true, force: true })
    } catch {}
  })

  it('应返回帧图片文件', async () => {
    vi.mocked(fileService.getSessionDir).mockReturnValue(path.join(baseDir, testSessionId))

    const response = await app.inject({
      method: 'GET',
      url: `/api/files/${testSessionId}/frames/frame_001.jpg`,
    })

    expect(response.statusCode).toBe(200)
    expect(response.headers['content-type']).toBe('image/jpeg')
  })

  it('应返回404: 文件不存在', async () => {
    vi.mocked(fileService.getSessionDir).mockReturnValue(path.join(baseDir, testSessionId))

    const response = await app.inject({
      method: 'GET',
      url: `/api/files/${testSessionId}/frames/nonexistent.jpg`,
    })

    expect(response.statusCode).toBe(404)
    const body = JSON.parse(response.body)
    expect(body.error.code).toBe('FILE_NOT_FOUND')
  })
})

describe('GET /api/proxy/image', () => {
  let app: ReturnType<typeof Fastify>

  beforeEach(async () => {
    vi.clearAllMocks()
    app = Fastify()
    await app.register(downloadRoutes)
  })

  afterEach(async () => {
    await app.close()
  })

  it('应返回400: 缺少url参数', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/proxy/image',
    })

    expect(response.statusCode).toBe(400)
    const body = JSON.parse(response.body)
    expect(body.error.code).toBe('MISSING_URL')
  })

  it('应返回400: 非法的协议', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/proxy/image?url=file:///etc/passwd',
    })

    expect(response.statusCode).toBe(400)
    const body = JSON.parse(response.body)
    expect(body.error.code).toBe('INVALID_PROTOCOL')
  })

  it('应返回502: 非法的URL格式（fetch失败）', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/proxy/image?url=not-a-valid-url',
    })

    // URL解析失败会被catch捕获返回502
    expect(response.statusCode).toBe(502)
    const body = JSON.parse(response.body)
    expect(body.error.code).toBe('PROXY_ERROR')
  })
})
