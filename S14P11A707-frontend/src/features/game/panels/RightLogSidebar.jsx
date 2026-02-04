import React from "react"
import { FileText, Search, MessageCircle, MapPin, Save, AlertCircle, Pin, X } from "lucide-react"
import { cn } from "@/lib/utils"

// 로그 타입별 설정
const logTypeConfig = {
  evidence: { label: '증거', color: 'bg-blue-500/20 text-blue-400', icon: Search },
  clue: { label: '단서', color: 'bg-blue-500/20 text-blue-400', icon: Search },
  memo: { label: '메모', color: 'bg-yellow-500/20 text-yellow-400', icon: Pin },
  interrogation: { label: '심문', color: 'bg-purple-500/20 text-purple-400', icon: MessageCircle },
  chat: { label: '대화', color: 'bg-purple-500/20 text-purple-400', icon: MessageCircle },
  system: { label: '시스템', color: 'bg-gray-500/20 text-gray-400', icon: AlertCircle },
  save: { label: '저장', color: 'bg-green-500/20 text-green-400', icon: Save },
  move: { label: '이동', color: 'bg-cyan-500/20 text-cyan-400', icon: MapPin },
  board: { label: '보드', color: 'bg-amber-500/20 text-amber-400', icon: Pin },
}

// 오른쪽 수사 로그 사이드바
export default function RightLogSidebar({ isOpen, onToggle, logs = [] }) {
  return (
    <>
      <div
        data-board-safe-area="true"
        className={cn(
        "fixed top-16 right-0 h-[calc(100%-160px)] bg-card/95 backdrop-blur border-l border-border transition-transform duration-300 z-[100]",
        "w-72 flex flex-col",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="relative p-4 border-b border-border bg-muted/20">
        {/* X 버튼: 레이아웃 폭 안 먹게 absolute로 */}
        <button onClick={onToggle} 
        className="absolute right-3 top-3 p-1 hover:bg-muted rounded" 
        aria-label="닫기">
          <X className="w-5 h-5" />
          </button>
          <div className="min-w-0 pr-10">
            <h3 className="font-bold flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              수사 로그
              <span className="text-xs text-muted-foreground">({logs.length})</span>
              </h3>
              <p className="text-xs text-muted-foreground mt-1">수사 진행 상황이 기록됩니다</p>
              </div>
              </div>
        <div className="flex-1 p-3 overflow-y-auto scrollbar-hide" style={{ scrollbarWidth: 'thin' }}>
          {logs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              아직 수사 기록이 없습니다.<br />
              현장을 탐색해보세요!
            </p>
          ) : (
            <div className="space-y-2">
              {logs.map(log => {
                const config = logTypeConfig[log.type] || logTypeConfig.system
                const IconComponent = config.icon

                return (
                  <div
                    key={log.id}
                    className="flex items-start gap-2 py-2.5 px-2 rounded-lg bg-muted/20 border border-border/30 hover:bg-muted/30 transition-colors"
                  >
                    <span className="text-[10px] font-mono text-muted-foreground whitespace-nowrap mt-0.5">
                      {log.time}
                    </span>
                    <span className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded font-medium whitespace-nowrap flex items-center gap-1",
                      config.color
                    )}>
                      <IconComponent className="w-3 h-3" />
                      {config.label}
                    </span>
                    <span className="text-xs flex-1 text-gray-300 leading-relaxed">{log.message}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {!isOpen && (
        <button
          data-board-safe-area="true"
          onClick={onToggle}
          className="fixed top-1/2 -translate-y-1/2 right-0 z-[80] w-10 h-24 bg-card border border-border border-r-0 rounded-l-lg flex items-center justify-center hover:bg-muted/50 transition-colors"
        >
          <FileText className="w-5 h-5" />
        </button>
      )}
    </>
  )
}
