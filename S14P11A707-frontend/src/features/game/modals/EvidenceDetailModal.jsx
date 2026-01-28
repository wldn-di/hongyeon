import React from "react"
import { Search, X, AlertCircle, Info, HelpCircle } from "lucide-react"
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

// 중요도 배지 컴포넌트
const ImportanceBadge = ({ importance }) => {
  const config = {
    CRITICAL: { label: '핵심', color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: AlertCircle },
    SUPPORTING: { label: '보조', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: Info },
    RED_HERRING: { label: '미끼', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', icon: HelpCircle },
  }
  const { label, color, icon: Icon } = config[importance] || config.SUPPORTING
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded border", color)}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  )
}

// 증거 상세 보기 팝업(발견 장소, 설명)
export default function EvidenceDetailModal({ evidence, onClose }) {
  if (!evidence) return null

  // 이미지 URL (detailImageUrl 또는 image 필드 사용)
  const imageUrl = evidence.detailImageUrl || evidence.image || null

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="font-bold flex items-center gap-2">
            <Search className="w-5 h-5 text-primary" />
            증거 상세
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="w-full h-36 bg-muted rounded-xl mb-4 flex items-center justify-center overflow-hidden">
            {imageUrl ? (
              <img src={imageUrl} alt={evidence.name} className="w-full h-full object-cover" />
            ) : (
              <Search className="w-12 h-12 text-muted-foreground" />
            )}
          </div>

          <div className="flex items-center gap-2 mb-2">
            <h4 className="text-xl font-bold">{evidence.name}</h4>
            {evidence.importance && <ImportanceBadge importance={evidence.importance} />}
          </div>

          <p className="text-sm text-primary mb-4">📍 {evidence.location || '알 수 없음'}</p>

          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
            {evidence.description || '설명이 없습니다.'}
          </p>

          {/* 조수 코멘트 */}
          {(evidence.assistantComment || evidence.storyHint) && (
            <div className="mt-4 p-3 bg-primary/10 rounded-lg border border-primary/30">
              <p className="text-sm text-primary font-medium">
                💡 {evidence.assistantComment || evidence.storyHint}
              </p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-border flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            닫기
          </Button>
        </div>
      </div>
    </div>
  )
}
