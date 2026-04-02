'use client'

import React from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { TranscriptSegment } from './TranscriptSegment'
import { SpeakerTag } from './SpeakerTag'
import { TranscriptToolbar } from './TranscriptToolbar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

export function TranscriptView() {
  const { transcript, updateSpeakerName } = useAppStore()

  if (!transcript) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-gray-500">
          暂无转写结果
        </CardContent>
      </Card>
    )
  }

  const handleSpeakerRename = (speakerId: string, newName: string) => {
    updateSpeakerName(speakerId, newName)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>逐字稿</CardTitle>
          <div className="flex items-center gap-2">
            {Object.entries(transcript.speakerMap).map(([speakerId, name]) => (
              <SpeakerTag
                key={speakerId}
                speakerId={speakerId}
                name={name}
                onRename={handleSpeakerRename}
              />
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <TranscriptToolbar />
        <div className="max-h-[500px] overflow-y-auto">
          {transcript.segments.map((segment) => (
            <TranscriptSegment
              key={segment.id}
              segment={segment}
              speakerName={transcript.speakerMap[segment.speakerId] || segment.speakerId}
              onSpeakerClick={(speakerId) => {
                // Could open a rename dialog
              }}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
