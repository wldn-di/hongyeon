import React from 'react'
import { Button } from '@/components/ui/Button'
import { AlertTriangle, Play, X, Trophy, FileText, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * 재플레이 확인 모달
 * 완료/실패한 시나리오를 다시 플레이할 때 경고 표시
 */
export function ReplayConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  status, // 'COMPLETED' | 'FAILED'
  scenarioTitle,
  loading = false,
}) {
  if (!isOpen) return null

  const isCompleted = status === 'COMPLETED'
  const statusLabel = isCompleted ? '해결한' : '미제'
  const statusColor = isCompleted ? 'text-green-400' : 'text-red-400'

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center">
      {/* 오버레이 */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 모달 내용 */}
      <div className="relative z-10 bg-card border border-border rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* 헤더 */}
        <div className="bg-amber-500/10 border-b border-amber-500/30 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h3 className="font-bold text-lg">재플레이 확인</h3>
              <p className="text-sm text-muted-foreground">
                이 사건은 이미 <span className={statusColor}>{statusLabel}</span> 사건입니다
              </p>
            </div>
          </div>
        </div>

        {/* 본문 */}
        <div className="px-6 py-5">
          <p className="text-muted-foreground mb-4">
            <span className="text-white font-semibold">"{scenarioTitle}"</span>을(를)
            재플레이하시겠습니까?
          </p>

          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4">
            <p className="text-sm text-red-300 font-medium mb-2">
              재플레이 시 세션이 초기화됩니다
            </p>
            <p className="text-xs text-muted-foreground">
              기존 진행 상황, 발견한 단서, 심문 기록 등이 모두 삭제됩니다.
            </p>
          </div>

          {/* 안내 문구 */}
          <div className="bg-muted/30 rounded-lg p-3 space-y-2">
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              <Trophy className="w-3.5 h-3.5 text-yellow-500" />
              랭킹은 첫 플레이 시점의 기록만 저장됩니다
            </p>
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              수사보고서는 첫 플레이 시점에만 생성됩니다
            </p>
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              <BarChart3 className="w-3.5 h-3.5 text-green-400" />
              플레이어 통계는 첫 플레이 시점에만 반영됩니다
            </p>
          </div>
        </div>

        {/* 버튼 영역 */}
        <div className="px-6 py-4 bg-muted/20 border-t border-border flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
            disabled={loading}
          >
            <X className="w-4 h-4 mr-2" />
            취소
          </Button>
          <Button
            variant="neon"
            className="flex-1"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                처리중...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                재플레이하기
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ReplayConfirmModal