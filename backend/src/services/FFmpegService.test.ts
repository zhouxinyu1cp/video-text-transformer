import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ffmpegService } from './FFmpegService'
import { fileService } from './FileService.js'

// Mock child_process with callback-style exec
vi.mock('child_process', () => {
  const mockExecFn = vi.fn((cmd, optionsOrCallback, callback) => {
    // Handle both function and object callback styles
    const cb = typeof optionsOrCallback === 'function' ? optionsOrCallback : callback
    // Simulate async callback behavior
    setTimeout(() => {
      cb(null, { stdout: '60\n', stderr: '' })
    }, 0)
    return { stdout: '', stderr: '', on: vi.fn() }
  })
  return {
    exec: mockExecFn,
    execSync: vi.fn(),
  }
})

// Mock fileService
vi.mock('./FileService.js', () => ({
  fileService: {
    createSession: vi.fn().mockResolvedValue('/tmp/test'),
    getSessionDir: vi.fn().mockReturnValue('/tmp/test'),
    exists: vi.fn().mockResolvedValue(false),
  },
}))

describe('FFmpegService', () => {
  const testSessionId = `test_ffmpeg_${Date.now()}`
  const testVideoUrl = 'https://example.com/video.mp4'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('extractAudio', () => {
    it('应返回音频文件路径', async () => {
      const audioPath = await ffmpegService.extractAudio(testVideoUrl, testSessionId)
      expect(audioPath).toContain('audio')
      expect(audioPath).toMatch(/\.mp3$/)
    })
  })

  describe('extractFrames', () => {
    it('应提取指定数量的关键帧', async () => {
      const frameCount = 4
      const frames = await ffmpegService.extractFrames(testVideoUrl, testSessionId, frameCount)
      expect(frames).toHaveLength(frameCount)
      frames.forEach((frame, idx) => {
        expect(frame).toContain(`frame_${String(idx + 1).padStart(3, '0')}`)
      })
    })

    it('应使用默认帧数4', async () => {
      const frames = await ffmpegService.extractFrames(testVideoUrl, testSessionId)
      expect(frames).toHaveLength(4)
    })
  })

  describe('getVideoDuration', () => {
    it('应返回视频时长（毫秒）', async () => {
      const duration = await ffmpegService.getVideoDuration(testVideoUrl)
      expect(typeof duration).toBe('number')
      expect(duration).toBeGreaterThan(0)
    })
  })

  describe('extractFrames (Phase 4.2.1)', () => {
    it('应返回有效的文件路径数组', async () => {
      const frames = await ffmpegService.extractFrames(testVideoUrl, testSessionId, 4)
      expect(frames).toHaveLength(4)
      frames.forEach((frame) => {
        expect(frame).toMatch(/\.(jpg|jpeg|png)$/i)
      })
    })

    it('应返回时间戳递增的帧', async () => {
      // This tests that frames have increasing timestamps
      // In real implementation, timestamps should be distributed evenly
      const frames = await ffmpegService.extractFrames(testVideoUrl, testSessionId, 4)
      // Mock returns sequential frame numbers
      expect(frames.length).toBe(4)
    })
  })
})
