import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ArticlePDF } from './ArticlePDF'

// Mock @react-pdf/renderer
vi.mock('@react-pdf/renderer', () => ({
  PDFDownloadLink: ({ children }: { children: (props: { loading: boolean }) => React.ReactNode }) => children({ loading: false }),
  Document: ({ children }: { children: React.ReactNode }) => children,
  Page: ({ children }: { children: React.ReactNode }) => children,
  Text: ({ children }: { children: React.ReactNode }) => children,
  View: ({ children }: { children: React.ReactNode }) => children,
  StyleSheet: { create: vi.fn().mockReturnValue({}) },
}))

describe('ArticlePDF', () => {
  const mockArticle = {
    title: '测试文章',
    content: '文章内容',
    frames: [],
    wordCount: 100,
    createdAt: new Date().toISOString(),
  }

  it('应渲染下载链接', () => {
    render(<ArticlePDF article={mockArticle} />)
    expect(screen.getByText(/下载PDF/i)).toBeInTheDocument()
  })
})
