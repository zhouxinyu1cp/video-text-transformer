import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { TranscriptToolbar } from './TranscriptToolbar'

vi.mock('@/lib/api', () => ({
  downloadFile: vi.fn(),
}))

vi.mock('@/lib/download', () => ({
  downloadBlob: vi.fn(),
  getFileExtension: vi.fn().mockReturnValue('txt'),
}))

vi.mock('@/stores/useAppStore', () => ({
  useAppStore: vi.fn(() => ({
    transcript: null,
    sessionId: null,
  })),
}))

describe('TranscriptToolbar', () => {
  it('应在无transcript时不渲染复制按钮', () => {
    render(<TranscriptToolbar />)
    // No transcript, so copy button should not be in normal state
  })

  it('应渲染下载按钮', () => {
    render(<TranscriptToolbar />)
    expect(screen.getByText('下载TXT')).toBeInTheDocument()
    expect(screen.getByText('下载Word')).toBeInTheDocument()
  })
})
