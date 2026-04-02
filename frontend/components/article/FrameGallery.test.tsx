import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FrameGallery } from './FrameGallery'

describe('FrameGallery', () => {
  const mockFrames = [
    { id: 'frame_001', timestamp: 10, imageUrl: '/frame1.jpg' },
    { id: 'frame_002', timestamp: 30, imageUrl: '/frame2.jpg' },
    { id: 'frame_003', timestamp: 60, imageUrl: '/frame3.jpg' },
  ]

  it('空frames应显示提示', () => {
    render(<FrameGallery frames={[]} />)
    expect(screen.getByText('暂无关键帧')).toBeInTheDocument()
  })

  it('应渲染所有帧', () => {
    render(<FrameGallery frames={mockFrames} />)
    expect(screen.getAllByRole('img')).toHaveLength(3)
  })

  it('应显示时间戳', () => {
    render(<FrameGallery frames={mockFrames} />)
    expect(screen.getByText('0:10')).toBeInTheDocument()
    expect(screen.getByText('0:30')).toBeInTheDocument()
    expect(screen.getByText('1:00')).toBeInTheDocument()
  })
})
