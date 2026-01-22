import React from "react"
import { useState } from "react"
import { X } from "lucide-react"
import { Button } from '@/components/ui/Button'

// 메모 입력/수정 모달
export default function MemoInputModal({ isOpen, onClose, onSubmit, initialText = '', isEdit = false }) {
  const [memoText, setMemoText] = useState(initialText)

  React.useEffect(() => {
    setMemoText(initialText)
  }, [initialText, isOpen])

  if (!isOpen) return null

  const handleSubmit = () => {
    if (memoText.trim()) {
      onSubmit(memoText)
      setMemoText('')
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-bold">{isEdit ? '메모 수정' : '메모 추가'}</h2>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4">
          <textarea
            value={memoText}
            onChange={(e) => setMemoText(e.target.value)}
            placeholder="메모 내용을 입력하세요..."
            rows={4}
            className="w-full bg-muted border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            autoFocus
          />
          <div className="flex gap-3 mt-4">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              취소
            </Button>
            <Button variant="neon" className="flex-1" onClick={handleSubmit}>
              {isEdit ? '수정하기' : '추가하기'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}