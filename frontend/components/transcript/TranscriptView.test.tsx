import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { TranscriptView } from './TranscriptView'
import { useAppStore } from '@/stores/useAppStore'

// Mock store
vi.mock('@/stores/useAppStore', () => ({
  useAppStore: vi.fn(() => ({
    transcript: null,
    updateSpeakerName: vi.fn(),
  })),
}))

describe('TranscriptView', () => {
  beforeEach(() => {
    cleanup()
  })

  it('应在无transcript时显示提示', () => {
    render(<TranscriptView />)
    expect(screen.getByText('暂无转写结果')).toBeInTheDocument()
  })

  it('应渲染transcript内容', () => {
    vi.mocked(useAppStore).mockImplementation(() => ({
      transcript: {
        videoMeta: {
          platform: 'bilibili',
          videoUrl: 'https://bilibili.com/video/BV123',
          title: '测试视频',
          thumbnail: '',
          duration: 60000,
        },
        segments: [
          {
            id: 'seg_001',
            startTime: 0,
            endTime: 5000,
            text: '这是一段测试文本',
            speakerId: 'spk_001',
          },
        ],
        speakerMap: { spk_001: '说话人1' },
        duration: 5000,
        language: 'zh-CN',
        createdAt: new Date().toISOString(),
      },
      updateSpeakerName: vi.fn(),
    }))

    render(<TranscriptView />)
    expect(screen.getByText('这是一段测试文本')).toBeInTheDocument()
    expect(screen.getAllByText('说话人1').length).toBeGreaterThan(0)
  })
})
