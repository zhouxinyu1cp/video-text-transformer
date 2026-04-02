import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SpeakerTag } from './SpeakerTag'

describe('SpeakerTag', () => {
  const mockOnRename = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('应显示说话人名称', () => {
    render(<SpeakerTag speakerId="spk_001" name="主持人" onRename={mockOnRename} />)
    expect(screen.getByText('主持人')).toBeInTheDocument()
  })

  it('点击应打开对话框', () => {
    render(<SpeakerTag speakerId="spk_001" name="主持人" onRename={mockOnRename} />)
    fireEvent.click(screen.getByText('主持人'))
    expect(screen.getByText('重命名说话人')).toBeInTheDocument()
  })
})
