import React from 'react'
import { InvestigationBoard } from "@/features/game/components/InvestigationBoard";
import { Button } from '@/components/ui/Button'

// 추리보드 확인 모달
export default function ConfirmBoardModal({ isOpen, onClose, onConfirm, scenarioId }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl max-h-[90vh] overflow-auto bg-card border border-border rounded-xl">
        <div className="p-4 border-b border-border">
          <h2 className="text-xl font-bold gold-glow">제출 전 확인</h2>
          <p className="text-sm text-muted-foreground mt-1">
            다음 단계에서 <span className="text-red-400 font-bold">확정(빨간선)</span>만 추출해 제출 보드를 구성합니다.
          </p>
        </div>
        <div className="p-4">
          <InvestigationBoard
            scenarioId={scenarioId}
            isModal={false}
            readOnly={true}
            hideFilter={true}
            hideSave={true}
          />
        </div>
        <div className="p-4 border-t border-border flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>닫기</Button>
          <Button variant="neon" onClick={onConfirm}>제출 보드로 이동</Button>
        </div>
      </div>
    </div>
  )
}
