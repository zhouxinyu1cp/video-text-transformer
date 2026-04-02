import { describe, it, expect, beforeEach, vi } from 'vitest'
import { asrService, WhisperNodeJSService } from './ASRService'

// Create mock functions with vi.hoisted so they're available before hoisting
const mockFsExistsSync = vi.hoisted(() => vi.fn())
const mockFsReadFileSync = vi.hoisted(() => vi.fn())
const mockFsUnlinkSync = vi.hoisted(() => vi.fn())

// Mock nodejs-whisper
vi.mock('nodejs-whisper', () => ({
  nodewhisper: vi.fn(),
}))

// Mock fs module - need to include default export for Node.js built-in modules
vi.mock('fs', () => {
  const mockFs = {
    existsSync: mockFsExistsSync,
    readFileSync: mockFsReadFileSync,
    unlinkSync: mockFsUnlinkSync,
  }
  return {
    ...mockFs,
    default: mockFs,
  }
})

describe('ASRService (nodejs-whisper)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('transcribe', () => {
    it('应返回转写片段数组', async () => {
      const { nodewhisper } = await import('nodejs-whisper')

      // Mock nodejs-whisper to not throw
      vi.mocked(nodewhisper).mockResolvedValue('Transcription complete')

      // Mock fs to return valid JSON
      mockFsExistsSync.mockReturnValue(true)
      mockFsReadFileSync.mockReturnValue(JSON.stringify({
        text: '测试文本',
        transcription: [
          { text: '测试文本', timestamps: { from: '0', to: '1' }, offsets: { from: 0, to: 1000 } },
        ],
      }))

      const segments = await asrService.transcribe('/fake/audio.mp3')
      expect(Array.isArray(segments)).toBe(true)
      expect(segments.length).toBe(1)
      expect(segments[0].text).toBe('测试文本')
    })

    it('每个片段应有必需字段', async () => {
      const { nodewhisper } = await import('nodejs-whisper')

      vi.mocked(nodewhisper).mockResolvedValue('Transcription complete')
      mockFsExistsSync.mockReturnValue(true)
      mockFsReadFileSync.mockReturnValue(JSON.stringify({
        text: '完整文本',
        transcription: [
          { text: '第一句', timestamps: { from: '0', to: '1' }, offsets: { from: 0, to: 1000 } },
          { text: '第二句', timestamps: { from: '1', to: '2' }, offsets: { from: 1000, to: 2000 } },
        ],
      }))

      const segments = await asrService.transcribe('/fake/audio.mp3')
      segments.forEach((seg) => {
        expect(seg).toHaveProperty('id')
        expect(seg).toHaveProperty('startTime')
        expect(seg).toHaveProperty('endTime')
        expect(seg).toHaveProperty('text')
        expect(seg).toHaveProperty('speakerId')
        expect(typeof seg.startTime).toBe('number')
        expect(typeof seg.endTime).toBe('number')
        expect(seg.endTime).toBeGreaterThanOrEqual(seg.startTime)
      })
    })

    it('时间戳应从秒转换为毫秒', async () => {
      const { nodewhisper } = await import('nodejs-whisper')

      vi.mocked(nodewhisper).mockResolvedValue('Transcription complete')
      mockFsExistsSync.mockReturnValue(true)
      mockFsReadFileSync.mockReturnValue(JSON.stringify({
        text: 'Hello',
        transcription: [
          { text: 'Hello', timestamps: { from: '1.5', to: '3.25' }, offsets: { from: 1500, to: 3250 } },
        ],
      }))

      const segments = await asrService.transcribe('/fake/audio.mp3')
      expect(segments[0].startTime).toBe(1500)  // 1.5s → 1500ms
      expect(segments[0].endTime).toBe(3250)    // 3.25s → 3250ms
    })
  })

  describe('separateSpeakers', () => {
    it('应合并相邻的同说话人片段', () => {
      const segments = [
        { id: 'seg_001', startTime: 0, endTime: 1000, text: '第一句', speakerId: 'spk_001' },
        { id: 'seg_002', startTime: 1000, endTime: 2000, text: '第二句', speakerId: 'spk_001' },
        { id: 'seg_003', startTime: 2000, endTime: 3000, text: '换人说了', speakerId: 'spk_001' },
        { id: 'seg_004', startTime: 3000, endTime: 4000, text: '继续说', speakerId: 'spk_001' },
      ]

      const merged = asrService.separateSpeakers(segments)

      // 同 speaker, 无长暂停 → 全部合并
      expect(merged).toHaveLength(1)
      expect(merged[0].text).toBe('第一句第二句换人说了继续说')
      expect(merged[0].speakerId).toBe('spk_001')
    })

    it('暂停超过2秒应切换说话人', () => {
      const segments = [
        { id: 'seg_001', startTime: 0, endTime: 1000, text: '第一句', speakerId: 'spk_001' },
        { id: 'seg_002', startTime: 3500, endTime: 4500, text: '第二句', speakerId: 'spk_001' }, // pause > 2s
      ]

      const merged = asrService.separateSpeakers(segments)

      expect(merged).toHaveLength(2)
      expect(merged[0].speakerId).toBe('spk_001')
      expect(merged[1].speakerId).toBe('spk_002')
    })

    it('不应合并不同说话人的片段', () => {
      const segments = [
        { id: 'seg_001', startTime: 0, endTime: 1000, text: 'A说的', speakerId: 'spk_001' },
        { id: 'seg_002', startTime: 1000, endTime: 2000, text: 'B说的', speakerId: 'spk_002' },
      ]

      const merged = asrService.separateSpeakers(segments)

      expect(merged).toHaveLength(2)
      expect(merged[0].speakerId).toBe('spk_001')
      expect(merged[1].speakerId).toBe('spk_002')
    })
  })
})
