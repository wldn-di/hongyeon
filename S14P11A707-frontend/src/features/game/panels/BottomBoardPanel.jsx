import React, { useEffect, useRef } from "react"
import { InvestigationBoard } from "@/features/game/components/InvestigationBoard"
import { FileText, ChevronUp, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

export default function BottomBoardPanel({
  isOpen,
  onOpenChange,
  sessionId,
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
      if (event.target?.closest?.('[data-board-safe-area="true"]')) return
      onOpenChange?.(false)
    }
    document.addEventListener("mousedown", handleMouseDown)
    return () => document.removeEventListener("mousedown", handleMouseDown)
  }, [isOpen, onOpenChange])

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onOpenChange?.(false)
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onOpenChange])

  const handleToggle = () => onOpenChange?.(!isOpen)

  return (
  <div
    ref={containerRef}
    className="fixed bottom-0 z-20 h-0"
    style={{ left: `${leftOffsetPx}px`, right: `${rightOffsetPx}px` }}
  >
    {/* 토글 버튼 */}
    <button
      onClick={handleToggle}
      className="absolute -top-10 left-1/2 -translate-x-1/2 px-6 py-2 bg-card border border-border border-b-0 rounded-t-lg flex items-center gap-2 hover:bg-muted/50 transition-colors z-[80]"
    >
      <FileText className="w-4 h-4 text-primary" />
      <span className="text-sm font-bold">개인 추리보드</span>
      {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
    </button>

    {/* 패널: 부모 높이와 분리 (absolute) */}
    <div
      className={cn(
        "absolute bottom-0 left-0 right-0",
        "bg-card/95 border-t border-l border-r border-border rounded-t-lg",
        "h-[calc(100vh-160px)]",
        "transform-gpu will-change-transform",
        "transition-transform duration-300 ease-out",
        isOpen ? "translate-y-0" : "translate-y-full pointer-events-none"
      )}
      style={{
        backdropFilter: isOpen ? "blur(8px)" : "none",
      }}
    >
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
)

}
