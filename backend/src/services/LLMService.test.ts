import { describe, it, expect, vi } from 'vitest'
import { llmService } from './LLMService'

vi.mock('./FileService.js', () => ({
  fileService: {
    write: vi.fn().mockResolvedValue(undefined),
  },
}))

vi.mock('./MiniMaxService.js', () => ({
  miniMaxService: {
    generateArticle: vi.fn().mockResolvedValue({
      title: '测试视频的图文文章',
      content: '# 测试视频的图文文章\n\n这是测试内容，包含第一段文本和第二段文本。',
    }),
    extractInfo: vi.fn().mockResolvedValue({
      corePoints: ['核心观点1', '核心观点2'],
      facts: [],
      actionItems: [],
    }),
  },
}))

describe('LLMService', () => {
  const mockTranscript = {
    videoMeta: {
      platform: 'bilibili' as const,
      videoUrl: 'https://bilibili.com/video/BV123',
      title: '测试视频',
      thumbnail: '',
      duration: 60000,
    },
    segments: [
      { id: 'seg_001', startTime: 0, endTime: 5000, text: '第一段文本', speakerId: 'spk_001' },
      { id: 'seg_002', startTime: 5000, endTime: 10000, text: '第二段文本', speakerId: 'spk_001' },
    ],
    speakerMap: { spk_001: '说话人1' },
    duration: 10000,
    language: 'zh-CN',
    createdAt: new Date().toISOString(),
  }

  describe('generateArticle', () => {
    it('应返回Article对象', async () => {
      const article = await llmService.generateArticle(mockTranscript)

      expect(article).toHaveProperty('title')
      expect(article).toHaveProperty('content')
      expect(article).toHaveProperty('frames')
      expect(article).toHaveProperty('wordCount')
      expect(article).toHaveProperty('createdAt')
    })

    it('title应包含视频标题', async () => {
      const article = await llmService.generateArticle(mockTranscript)
      expect(article.title).toContain('测试视频')
    })

    it('content应包含转写内容', async () => {
      const article = await llmService.generateArticle(mockTranscript)
      expect(article.content).toContain('第一段文本')
      expect(article.content).toContain('第二段文本')
    })

    it('wordCount应正确计算', async () => {
      const article = await llmService.generateArticle(mockTranscript)
      expect(article.wordCount).toBe(article.content.length)
    })

    it('应接受articleStyle选项', async () => {
      const article = await llmService.generateArticle(mockTranscript, { articleStyle: 'professional' })
      expect(article).toHaveProperty('title')
    })
  })

  describe('extractInfo', () => {
    it('应返回ExtractionResult对象', async () => {
      const extraction = await llmService.extractInfo(mockTranscript)

      expect(extraction).toHaveProperty('corePoints')
      expect(extraction).toHaveProperty('facts')
      expect(extraction).toHaveProperty('actionItems')
      expect(Array.isArray(extraction.corePoints)).toBe(true)
      expect(Array.isArray(extraction.facts)).toBe(true)
      expect(Array.isArray(extraction.actionItems)).toBe(true)
    })

    it('corePoints应从转写内容提取', async () => {
      const extraction = await llmService.extractInfo(mockTranscript)
      expect(extraction.corePoints.length).toBeGreaterThan(0)
    })
  })
})
