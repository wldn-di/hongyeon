import React from "react"
import { Search, X } from "lucide-react"
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

// 증거 상세 보기 팝업(발견 장소, 설명)
export default function EvidenceDetailModal({ evidence, onClose }) {
  if (!evidence) return null

  // 이미지 URL (detailImageUrl 또는 image 필드 사용)
  const imageUrl = evidence.detailImageUrl || evidence.image || null

  // 발견 장소 (floorNumber가 있으면 "n층", 없으면 location 또는 기본값)
  const locationText = evidence.floorNumber
    ? `${evidence.floorNumber}층`
    : (evidence.location || '알 수 없음')

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

          {/* 제목 - importance 배지 제거 */}
          <div className="flex items-center gap-2 mb-2">
            <h4 className="text-xl font-bold">{evidence.name}</h4>
          </div>

          <p className="text-sm text-primary mb-4">📍 {locationText}</p>

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