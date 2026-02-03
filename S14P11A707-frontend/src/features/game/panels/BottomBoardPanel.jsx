import React, { useEffect, useRef } from "react"
import { InvestigationBoard } from "@/features/game/components/InvestigationBoard";
import { FileText, ChevronUp, ChevronDown } from 'lucide-react'
import { cn } from "@/lib/utils"

// 하단 추리보드 패널
export default function BottomBoardPanel({
  isOpen,
  onOpenChange,
  sessionId,    //  추가
  scenarioId,
  leftOffsetPx = 0,
  rightOffsetPx = 0,
  pendingAddItem = null,
  onConsumePendingAddItem = null,
  victim = null,
  clues = [],
  suspects = [],
  rooms = [],
}) {
  const containerRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return

    const handleMouseDown = (event) => {
      const el = containerRef.current
      if (!el) return
      if (el.contains(event.target)) return
      onOpenChange?.(false)
    }

    document.addEventListener('mousedown', handleMouseDown)
    return () => {
      document.removeEventListener('mousedown', handleMouseDown)
    }
  }, [isOpen, onOpenChange])

  const handleToggle = () => {
    onOpenChange?.(!isOpen)
  }

  return (
    <>
      {/* 하단 토글 패널 */}
      <div
        ref={containerRef}
        className="fixed bottom-0 z-20"
        style={{
          left: `${leftOffsetPx}px`,
          right: `${rightOffsetPx}px`,
        }}
      >
        {/* 토글 버튼 */}
        <button
          onClick={handleToggle}
          className="absolute -top-10 left-1/2 -translate-x-1/2 px-6 py-2 bg-card border border-border border-b-0 rounded-t-lg flex items-center gap-2 hover:bg-muted/50 transition-colors"
        >
          <FileText className="w-4 h-4 text-primary" />
          <span className="text-sm font-bold">개인 추리보드</span>
          {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>

        {/* 보드 패널 - 화면 전체 높이로 */}
        <div className={cn(
          "bg-card/95 backdrop-blur border-t border-l border-r border-border rounded-t-lg transition-all duration-300",
          isOpen ? "opacity-100 h-[calc(100vh-120px)]" : "h-0 opacity-0 overflow-hidden"
        )}>
          <div className="p-4 h-full">
            <InvestigationBoard
              sessionId={sessionId}
              scenarioId={scenarioId}
              title="개인 추리보드"
              victim={victim}
              isModal={false}
              isActive={isOpen}
              onClose={() => onOpenChange?.(false)}
              acceptExternalDrop={true}
              pendingAddItem={pendingAddItem}
              onConsumePendingAddItem={onConsumePendingAddItem}
              fullHeight={true}
              clues={clues}
              suspects={suspects}
              rooms={rooms}
            />
          </div>
        </div>
      </div>
    </>
  )
}
