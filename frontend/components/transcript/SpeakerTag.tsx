'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/Button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'

interface SpeakerTagProps {
  speakerId: string
  name: string
  onRename: (speakerId: string, newName: string) => void
}

export function SpeakerTag({ speakerId, name, onRename }: SpeakerTagProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [editName, setEditName] = useState(name)

  const handleSave = () => {
    if (editName.trim() && editName !== name) {
      onRename(speakerId, editName.trim())
    }
    setIsOpen(false)
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
      >
        {name}
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>重命名说话人</DialogTitle>
            <DialogDescription>
              修改说话人标签名称，仅影响当前会话显示
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="输入新的说话人名称"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSave}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
