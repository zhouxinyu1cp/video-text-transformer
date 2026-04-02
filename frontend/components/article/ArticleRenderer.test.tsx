import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ArticleRenderer } from './ArticleRenderer'

describe('ArticleRenderer', () => {
  const mockArticle = {
    title: '测试文章标题',
    content: '这是文章的第一段内容。\n这是第二段内容。',
    frames: [],
    wordCount: 25,
    createdAt: new Date().toISOString(),
  }

  it('应渲染文章标题', () => {
    render(<ArticleRenderer article={mockArticle} />)
    expect(screen.getByText('测试文章标题')).toBeInTheDocument()
  })

  it('应渲染文章内容', () => {
    render(<ArticleRenderer article={mockArticle} />)
    expect(screen.getByText(/这是文章的第一段内容/)).toBeInTheDocument()
  })

  it('应显示字数统计', () => {
    render(<ArticleRenderer article={mockArticle} />)
    expect(screen.getByText(/字数：25/)).toBeInTheDocument()
  })

  it('应有frames时渲染关键帧区域', () => {
    const articleWithFrames = {
      ...mockArticle,
      frames: [
        { id: 'frame_001', timestamp: 10, imageUrl: '/frame1.jpg' },
        { id: 'frame_002', timestamp: 30, imageUrl: '/frame2.jpg' },
      ],
    }
    render(<ArticleRenderer article={articleWithFrames} />)
    expect(screen.getByText('关键帧')).toBeInTheDocument()
  })
})
