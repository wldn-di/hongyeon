import { React, useState } from "react"
import { Share2, X } from "lucide-react"
import { Button } from '@/components/ui/Button'
import { cn } from "@/lib/utils"

// 수사보고서 팝업
export default function ReportModal({ isOpen, onClose, report }) {
  const [shareUuid, setShareUuid] = useState(null)
  const [copied, setCopied] = useState(false)

  const generateUuid = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  }

  const handleShare = () => {
    if (!shareUuid) {
      setShareUuid(generateUuid())
    }
  }

  const handleCopyUuid = async () => {
    if (shareUuid) {
      try {
        await navigator.clipboard.writeText(shareUuid)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (err) {
        const textArea = document.createElement('textarea')
        textArea.value = shareUuid
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    }
  }

  const handleClose = () => {
    setShareUuid(null)
    setCopied(false)
    onClose()
  }

  if (!isOpen || !report) return null

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-xl font-bold gold-glow">수사 보고서</h2>
          <button onClick={handleClose} className="p-1 hover:bg-muted rounded"><X className="w-6 h-6" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="text-center mb-6">
            <p className="text-sm text-muted-foreground">탐정</p>
            <p className="text-2xl font-bold">{report.playerName}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-muted/30 rounded-lg p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">등급</p>
              <p className="text-3xl font-bold text-primary">{report.grade}</p>
            </div>
            <div className="bg-muted/30 rounded-lg p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">클리어 시간</p>
              <p className="text-2xl font-bold">{report.playTime}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-muted/30 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">정확도</p>
              <p className="text-lg font-bold">{report.accuracy}%</p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">힌트 사용</p>
              <p className="text-lg font-bold">{report.hintsUsed}회</p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">심문 횟수</p>
              <p className="text-lg font-bold">{report.interrogations}회</p>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-bold mb-2 bracket-left">종합 평가</h3>
            <p className="text-sm text-muted-foreground leading-relaxed bg-muted/30 rounded-lg p-4">{report.summary}</p>
          </div>

          <div>
            <h3 className="font-bold mb-2 bracket-left">수사 타임라인</h3>
            <div className="space-y-2">
              {report.timeline.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 text-sm">
                  <span className="font-mono text-muted-foreground">{item.time}</span>
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span>{item.event}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-border space-y-3">
          {shareUuid && (
            <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-3">
              <span className="text-xs text-muted-foreground">공유 코드:</span>
              <button
                onClick={handleCopyUuid}
                className="flex-1 font-mono text-sm text-primary hover:text-primary/80 truncate text-left"
              >
                {shareUuid}
              </button>
              <span className={cn(
                "text-xs px-2 py-1 rounded transition-all",
                copied ? "bg-green-500/20 text-green-400" : "bg-muted text-muted-foreground"
              )}>
                {copied ? "복사됨!" : "클릭하여 복사"}
              </span>
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={handleClose}>
              닫기
            </Button>
            <Button variant="neon" className="flex-1" onClick={handleShare}>
              <Share2 className="w-4 h-4 mr-2" />
              공유하기
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}