import React from "react"
import { FileText } from "lucide-react"
import { cn } from "@/lib/utils"

// 오른쪽 수사 로그 사이드바
export default function RightLogSidebar({ isOpen, onToggle, logs }) {
  return (
    <div className={cn(
      "fixed top-16 right-0 h-[calc(100%-140px)] bg-card/95 backdrop-blur border-l border-border transition-transform duration-300 z-30",
      "w-72 flex flex-col",
      isOpen ? "translate-x-0" : "translate-x-full"
    )}>
      <button
        onClick={onToggle}
        className="absolute top-1/2 -translate-y-1/2 -left-10 w-10 h-24 bg-card border border-border border-r-0 rounded-l-lg flex items-center justify-center hover:bg-muted/50 transition-colors"
      >
        <FileText className="w-5 h-5" />
      </button>

      <div className="p-4 border-b border-border">
        <h3 className="font-bold flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          수사 로그
        </h3>
      </div>

      <div className="flex-1 p-3 overflow-y-auto">
        <div className="space-y-2">
          {logs.map(log => (
            <div key={log.id} className="flex items-start gap-2 py-2 border-b border-border/30 last:border-0">
              <span className="text-xs font-mono text-muted-foreground whitespace-nowrap">{log.time}</span>
              <span className={cn(
                "text-xs px-1.5 py-0.5 rounded whitespace-nowrap",
                log.type === 'evidence' && "bg-primary/20 text-primary",
                log.type === 'memo' && "bg-yellow-500/20 text-yellow-400",
                log.type === 'interrogation' && "bg-purple-500/20 text-purple-400",
                log.type === 'system' && "bg-muted/50 text-muted-foreground",
                log.type === 'save' && "bg-green-500/20 text-green-400"
              )}>
                {log.type === 'evidence' && '증거'}
                {log.type === 'memo' && '메모'}
                {log.type === 'interrogation' && '심문'}
                {log.type === 'system' && '시스템'}
                {log.type === 'save' && '저장'}
              </span>
              <span className="text-xs flex-1">{log.message}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
