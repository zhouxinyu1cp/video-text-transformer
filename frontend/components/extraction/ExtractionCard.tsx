'use client'

import React from 'react'
import type { ExtractionResult } from '@video-transcriber/shared'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

interface ExtractionCardProps {
  extraction: ExtractionResult
}

export function ExtractionCard({ extraction }: ExtractionCardProps) {
  return (
    <div className="space-y-6">
      {/* Core Points */}
      <Card>
        <CardHeader>
          <CardTitle>核心观点</CardTitle>
        </CardHeader>
        <CardContent>
          {extraction.corePoints.length > 0 ? (
            <ul className="space-y-3">
              {extraction.corePoints.map((point, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium">
                    {idx + 1}
                  </span>
                  <span className="text-gray-700">{point}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">暂无核心观点</p>
          )}
        </CardContent>
      </Card>

      {/* Facts */}
      <Card>
        <CardHeader>
          <CardTitle>数据与事实</CardTitle>
        </CardHeader>
        <CardContent>
          {extraction.facts.length > 0 ? (
            <ul className="space-y-2">
              {extraction.facts.map((fact) => (
                <li key={fact.id} className="flex items-start gap-3">
                  <span className={`flex-shrink-0 px-2 py-0.5 rounded text-xs ${
                    fact.type === 'data' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {fact.type === 'data' ? '数据' : '事实'}
                  </span>
                  <span className="text-gray-700">{fact.content}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">暂无数据事实</p>
          )}
        </CardContent>
      </Card>

      {/* Action Items */}
      <Card>
        <CardHeader>
          <CardTitle>行动项</CardTitle>
        </CardHeader>
        <CardContent>
          {extraction.actionItems.length > 0 ? (
            <ul className="space-y-3">
              {extraction.actionItems.map((item) => (
                <li key={item.id} className="border rounded-lg p-3">
                  <p className="text-gray-700">{item.content}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    {item.assignee && <span>负责人：{item.assignee}</span>}
                    {item.deadline && <span>截止：{item.deadline}</span>}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">暂无行动项</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
