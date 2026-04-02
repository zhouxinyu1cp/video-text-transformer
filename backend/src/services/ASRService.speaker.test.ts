import { describe, it, expect } from 'vitest'
import { asrService } from './ASRService'
import type { TranscriptSegment } from '@video-transcriber/shared'

describe('ASRService (nodejs-whisper) - 说话人分离', () => {
  describe('separateSpeakers', () => {
    it('应正确合并相邻同说话人片段，换人时切换', () => {
      const segments: TranscriptSegment[] = [
        { id: 'seg_001', startTime: 0, endTime: 1000, text: '欢迎', speakerId: 'spk_001', confidence: 0.9 },
        { id: 'seg_002', startTime: 1000, endTime: 2000, text: '大家', speakerId: 'spk_001', confidence: 0.9 },
        { id: 'seg_003', startTime: 2000, endTime: 3000, text: '来到', speakerId: 'spk_002', confidence: 0.9 },
      ]

      const result = asrService.separateSpeakers(segments)

      // seg_001 + seg_002 合并 (同 speaker, 无暂停), seg_003 新说话人
      expect(result).toHaveLength(2)
      expect(result[0].text).toBe('欢迎大家')
      expect(result[0].endTime).toBe(2000)
      expect(result[0].speakerId).toBe('spk_001')
      expect(result[1].text).toBe('来到')
      expect(result[1].speakerId).toBe('spk_002')
    })

    it('应保持时间戳连续性', () => {
      const segments: TranscriptSegment[] = [
        { id: 'seg_001', startTime: 0, endTime: 1000, text: '第一句', speakerId: 'spk_001', confidence: 0.9 },
        { id: 'seg_002', startTime: 1000, endTime: 2500, text: '第二句', speakerId: 'spk_001', confidence: 0.9 },
        { id: 'seg_003', startTime: 2500, endTime: 3000, text: '第三句', speakerId: 'spk_001', confidence: 0.9 },
      ]

      const result = asrService.separateSpeakers(segments)

      // 同 speaker, 暂停 < 2s → 全部合并
      expect(result).toHaveLength(1)
      expect(result[0].startTime).toBe(0)
      expect(result[0].endTime).toBe(3000)
      expect(result[0].text).toBe('第一句第二句第三句')
      expect(result[0].speakerId).toBe('spk_001')
    })

    it('暂停超过2秒应切换说话人', () => {
      const segments: TranscriptSegment[] = [
        { id: 'seg_001', startTime: 0, endTime: 1000, text: '第一句', speakerId: 'spk_001', confidence: 0.9 },
        { id: 'seg_002', startTime: 3500, endTime: 4500, text: '第二句', speakerId: 'spk_001', confidence: 0.9 },
      ]

      const result = asrService.separateSpeakers(segments)

      // 暂停 = 2500ms > 2000ms → 分段
      expect(result).toHaveLength(2)
      expect(result[0].speakerId).toBe('spk_001')
      expect(result[1].speakerId).toBe('spk_002')
      expect(result[1].text).toBe('第二句')
    })

    it('应正确处理单个片段', () => {
      const segments: TranscriptSegment[] = [
        { id: 'seg_001', startTime: 0, endTime: 1000, text: '只有一句', speakerId: 'spk_001', confidence: 0.9 },
      ]

      const result = asrService.separateSpeakers(segments)

      expect(result).toHaveLength(1)
      expect(result[0].text).toBe('只有一句')
    })

    it('应正确处理交替说话人', () => {
      const segments: TranscriptSegment[] = [
        { id: 'seg_001', startTime: 0, endTime: 1000, text: 'A1', speakerId: 'spk_001', confidence: 0.9 },
        { id: 'seg_002', startTime: 1000, endTime: 2000, text: 'B1', speakerId: 'spk_002', confidence: 0.9 },
        { id: 'seg_003', startTime: 2000, endTime: 3000, text: 'A2', speakerId: 'spk_001', confidence: 0.9 },
        { id: 'seg_004', startTime: 3000, endTime: 4000, text: 'B2', speakerId: 'spk_002', confidence: 0.9 },
      ]

      const result = asrService.separateSpeakers(segments)

      // 交替说话人，每个都独立
      expect(result).toHaveLength(4)
    })
  })
})
