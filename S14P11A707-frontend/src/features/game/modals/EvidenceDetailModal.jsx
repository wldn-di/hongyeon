import React from "react"
import { Search, X } from "lucide-react"
import { Button } from '@/components/ui/Button'

// 증거 상세 보기 팝업 (튜토리얼 스타일)
export default function EvidenceDetailModal({ evidence, onClose }) {
  if (!evidence) return null

  // 이미지 URL (detailImageUrl 또는 image 필드 사용)
  const imageUrl = evidence.detailImageUrl || evidence.imageUrl || evidence.image || null

  // 발견 장소 (floorNumber가 있으면 "n층", 없으면 location 또는 기본값)
  const locationText = evidence.floorNumber
    ? `${evidence.floorNumber}층`
    : (evidence.location || '알 수 없음')

  return (
    <div data-board-safe-area="true" className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-gray-900 border border-gray-700 rounded-lg shadow-xl overflow-hidden">
        {/* 헤더 */}
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-xs font-bold text-white bg-blue-500 rounded">
              증거
            </span>
            <h3 className="font-bold text-white">{evidence.name}</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-800 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          {/* 이미지 */}
          <div className="w-full h-36 bg-gray-800 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
            {imageUrl ? (
              <img src={imageUrl} alt={evidence.name} className="w-full h-full object-cover" />
            ) : (
              <Search className="w-12 h-12 text-gray-600" />
            )}
          </div>

          {/* 정보 */}
          <div className="text-sm space-y-2 text-gray-300">
            <p>✔️ 발견장소: {locationText}</p>
            <p className="whitespace-pre-line">{evidence.description || '설명이 없습니다.'}</p>
          </div>

          {/* 조수 코멘트 */}
          {(evidence.assistantComment || evidence.storyHint) && (
            <div className="mt-4 p-3 bg-primary/10 rounded-lg border border-primary/30">
              <p className="text-sm text-primary font-medium">
                💡 {evidence.assistantComment || evidence.storyHint}
              </p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-700">
          <Button variant="outline" className="w-full" onClick={onClose}>
            닫기
          </Button>
        </div>
      </div>
    </div>
  )
}
