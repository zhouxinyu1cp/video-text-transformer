import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { fileService } from './FileService'
import fs from 'fs/promises'
import path from 'path'

describe('FileService', () => {
  const testSessionId = `test_session_${Date.now()}`
  const baseDir = process.env.STORAGE_BASE_DIR || '/tmp/video-transcriber'

  afterEach(async () => {
    // Cleanup
    try {
      await fs.rm(path.join(baseDir, testSessionId), { recursive: true, force: true })
    } catch {}
  })

  describe('createSession', () => {
    it('应创建会话目录结构', async () => {
      const sessionDir = await fileService.createSession(testSessionId)
      expect(sessionDir).toContain(testSessionId)

      // Check subdirectories exist
      await expect(fs.access(path.join(sessionDir, 'audio'))).resolves.toBeUndefined()
      await expect(fs.access(path.join(sessionDir, 'frames'))).resolves.toBeUndefined()
      await expect(fs.access(path.join(sessionDir, 'output'))).resolves.toBeUndefined()
    })
  })

  describe('write and read', () => {
    it('应写入并读取文件', async () => {
      const content = 'test content'
      await fileService.write(testSessionId, 'test.txt', content)

      const readContent = await fileService.read(testSessionId, 'test.txt')
      expect(readContent).toBe(content)
    })

    it('应支持嵌套路径', async () => {
      const content = 'nested content'
      await fileService.write(testSessionId, 'output/nested/test.txt', content)

      const readContent = await fileService.read(testSessionId, 'output/nested/test.txt')
      expect(readContent).toBe(content)
    })
  })

  describe('exists', () => {
    it('应正确判断文件是否存在', async () => {
      expect(await fileService.exists(testSessionId, 'nonexistent.txt')).toBe(false)

      await fileService.write(testSessionId, 'exists.txt', 'content')
      expect(await fileService.exists(testSessionId, 'exists.txt')).toBe(true)
    })
  })

  describe('cleanup', () => {
    it('应删除会话目录', async () => {
      await fileService.createSession(testSessionId)
      await fileService.write(testSessionId, 'test.txt', 'content')

      await fileService.cleanup(testSessionId)

      const sessionDir = path.join(baseDir, testSessionId)
      await expect(fs.access(sessionDir)).rejects.toThrow()
    })
  })

  describe('getFrameUrl', () => {
    it('应返回完整的后端URL（包含API_BASE_URL）', () => {
      const sessionId = 'test-session-123'
      const framePath = '/tmp/video-transcriber/test-session-123/frames/frame_001.jpg'
      const result = fileService.getFrameUrl(sessionId, framePath)

      // 应包含完整的后端URL而非相对路径
      expect(result).toMatch(/^http:\/\/localhost:3001\/api\/files\/test-session-123\/frames\/frame_001\.jpg$/)
    })

    it('应正确提取frames子路径', () => {
      const sessionId = 'test-session'
      const framePath = '/any/path/frames/frame_002.jpg'
      const result = fileService.getFrameUrl(sessionId, framePath)

      expect(result).toContain('/api/files/test-session/frames/frame_002.jpg')
    })
  })

  describe('getFileUrl', () => {
    it('应返回完整的文件URL', () => {
      const sessionId = 'test-session'
      const filePath = 'output/transcript.json'
      const result = fileService.getFileUrl(sessionId, filePath)

      expect(result).toContain('/api/files/test-session/output/transcript.json')
    })
  })
})
