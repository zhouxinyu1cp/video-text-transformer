import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ExtractionPanel } from './ExtractionPanel'
import { useAppStore } from '@/stores/useAppStore'

vi.mock('@/lib/api', () => ({
  extractInfo: vi.fn().mockResolvedValue({
    corePoints: ['观点1'],
    facts: [],
    actionItems: [],
  }),
}))

vi.mock('@/stores/useAppStore', () => ({
  useAppStore: vi.fn(() => ({
    transcript: null,
    sessionId: null,
    extraction: null,
    setExtraction: vi.fn(),
    setError: vi.fn(),
  })),
}))

describe('ExtractionPanel', () => {
  it('无transcript时应禁用按钮', () => {
    render(<ExtractionPanel />)
    const button = screen.getByText('开始提取')
    expect(button).toBeDisabled()
  })

  it('有extraction时应显示结果', () => {
    vi.mocked(useAppStore).mockImplementation(() => ({
      transcript: { segments: [] } as any,
      sessionId: 'test',
      extraction: {
        corePoints: ['观点1'],
        facts: [],
        actionItems: [],
      },
      setExtraction: vi.fn(),
      setError: vi.fn(),
    }))

    render(<ExtractionPanel />)
    expect(screen.getByText('观点1')).toBeInTheDocument()
  })
})
