import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { VideoInputForm } from './VideoInputForm'

// Mock the API
vi.mock('@/lib/api', () => ({
  parseLink: vi.fn(),
}))

// Mock the store
vi.mock('@/stores/useAppStore', () => ({
  useAppStore: vi.fn(() => ({
    setVideoMeta: vi.fn(),
    setSessionId: vi.fn(),
    setStatus: vi.fn(),
    setError: vi.fn(),
  })),
}))

describe('VideoInputForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('应渲染输入框和按钮', () => {
    render(<VideoInputForm />)
    expect(screen.getByPlaceholderText(/请粘贴B站/)).toBeInTheDocument()
    expect(screen.getByText('解析')).toBeInTheDocument()
  })

  it('应在URL为空时禁用提交按钮', () => {
    render(<VideoInputForm />)
    expect(screen.getByText('解析')).toBeDisabled()
  })

  it('应支持粘贴B站链接', async () => {
    const mockParseLink = vi.fn().mockResolvedValue({
      success: true,
      data: {
        sessionId: 'test-session',
        videoMeta: {
          platform: 'bilibili',
          videoUrl: 'https://bilibili.com/video/BV123',
          title: '测试视频',
          thumbnail: '',
          duration: 120,
        },
      },
    })

    // Get the mocked module and set the implementation
    const { parseLink } = await import('@/lib/api')
    vi.mocked(parseLink).mockImplementation(mockParseLink)

    render(<VideoInputForm />)
    const input = screen.getByPlaceholderText(/请粘贴B站/)
    fireEvent.change(input, { target: { value: 'https://bilibili.com/video/BV123' } })
    fireEvent.click(screen.getByText('解析'))

    await waitFor(() => {
      expect(mockParseLink).toHaveBeenCalledWith('https://bilibili.com/video/BV123')
    })
  })
})
