import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { ExtractionCard } from './ExtractionCard'

describe('ExtractionCard', () => {
  const mockExtraction = {
    corePoints: ['核心观点1', '核心观点2'],
    facts: [
      { id: 'fact_1', content: '事实内容', type: 'fact' as const },
      { id: 'fact_2', content: '数据内容', type: 'data' as const },
    ],
    actionItems: [
      { id: 'action_1', content: '行动项内容', assignee: '张三', deadline: '2024-01-01' },
    ],
  }

  beforeEach(() => {
    cleanup()
  })

  it('应渲染核心观点', () => {
    render(<ExtractionCard extraction={mockExtraction} />)
    expect(screen.getByText('核心观点')).toBeInTheDocument()
    expect(screen.getByText('核心观点1')).toBeInTheDocument()
    expect(screen.getByText('核心观点2')).toBeInTheDocument()
  })

  it('应渲染数据与事实', () => {
    render(<ExtractionCard extraction={mockExtraction} />)
    expect(screen.getByText('数据与事实')).toBeInTheDocument()
    expect(screen.getByText('事实内容')).toBeInTheDocument()
    expect(screen.getByText('数据内容')).toBeInTheDocument()
  })

  it('应渲染行动项', () => {
    render(<ExtractionCard extraction={mockExtraction} />)
    expect(screen.getByText('行动项')).toBeInTheDocument()
    expect(screen.getByText('行动项内容')).toBeInTheDocument()
    expect(screen.getByText('负责人：张三')).toBeInTheDocument()
    expect(screen.getByText('截止：2024-01-01')).toBeInTheDocument()
  })

  it('空数据应显示提示', () => {
    const emptyExtraction = {
      corePoints: [],
      facts: [],
      actionItems: [],
    }
    render(<ExtractionCard extraction={emptyExtraction} />)
    expect(screen.getAllByText(/暂无/).length).toBeGreaterThan(0)
  })
})
