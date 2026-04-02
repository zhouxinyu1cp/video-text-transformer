import { describe, it, expect } from 'vitest'
import { useAppStore } from './useAppStore'
import type { Transcript, Article, ExtractionResult } from '@video-transcriber/shared'

describe('useAppStore', () => {
  it('应有初始状态', () => {
    const state = useAppStore.getState()
    expect(state.sessionId).toBeNull()
    expect(state.status).toBe('idle')
    expect(state.error).toBeNull()
    expect(state.videoMeta).toBeNull()
    expect(state.transcript).toBeNull()
  })

  it('应能设置sessionId', () => {
    useAppStore.getState().setSessionId('test-123')
    expect(useAppStore.getState().sessionId).toBe('test-123')
  })

  it('应能设置videoMeta', () => {
    const meta = {
      platform: 'bilibili' as const,
      videoUrl: 'https://bilibili.com/video/BV123',
      title: '测试',
      thumbnail: '',
      duration: 120,
    }
    useAppStore.getState().setVideoMeta(meta)
    expect(useAppStore.getState().videoMeta).toEqual(meta)
  })

  it('应能设置status', () => {
    useAppStore.getState().setStatus('transcribing')
    expect(useAppStore.getState().status).toBe('transcribing')
  })

  it('应能reset', () => {
    useAppStore.getState().setSessionId('test')
    useAppStore.getState().setStatus('transcribing')
    useAppStore.getState().reset()
    expect(useAppStore.getState().sessionId).toBeNull()
    expect(useAppStore.getState().status).toBe('idle')
  })

  // Phase 3.2.3: speakerMap 更新测试

  it('应能更新speakerName', () => {
    const initialTranscript: Transcript = {
      videoMeta: { platform: 'bilibili' as const, videoUrl: '', title: '', thumbnail: '', duration: 0 },
      segments: [{ id: 'seg_001', startTime: 0, endTime: 1000, text: 'test', speakerId: 'spk_001', confidence: 0.9 }],
      speakerMap: { spk_001: '说话人1' },
      duration: 1000,
      language: 'zh-CN',
      createdAt: new Date().toISOString(),
    }
    useAppStore.getState().setTranscript(initialTranscript)
    useAppStore.getState().updateSpeakerName('spk_001', '主持人')

    const state = useAppStore.getState()
    expect(state.speakerMap['spk_001']).toBe('主持人')
    expect(state.transcript?.speakerMap['spk_001']).toBe('主持人')
  })

  it('应能设置article', () => {
    const article: Article = {
      title: '测试文章',
      content: '文章内容',
      frames: [],
      wordCount: 100,
      createdAt: new Date().toISOString(),
    }
    useAppStore.getState().setArticle(article)
    expect(useAppStore.getState().article).toEqual(article)
  })

  it('应能设置extraction', () => {
    const extraction: ExtractionResult = {
      corePoints: ['观点1', '观点2'],
      facts: [],
      actionItems: [],
    }
    useAppStore.getState().setExtraction(extraction)
    expect(useAppStore.getState().extraction).toEqual(extraction)
  })
})
