import React from 'react'
import { useRoute, useLocation } from 'wouter'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { AlertCircle, CheckCircle, ChevronLeft } from 'lucide-react'
import { useSubmit } from '@/features/session/hooks/useSubmit'
import { useBoardSelection } from '@/features/session/hooks/useBoardSelection'
import { createPath } from '@/app/routePaths'
import { alertWarning } from '@/components/ui/AlertModal'

export default function SubmitSession() {
  const [, params] = useRoute('/submit/session/:sessionId')
  const sessionId = params?.sessionId ? parseInt(params.sessionId) : null
  const [, navigate] = useLocation()

  const {
    submitResult,
    isSubmitting,
    error,
    submit,
    reset,
  } = useSubmit(sessionId)

  const {
    selection,
    isComplete: isSelectionComplete,
  } = useBoardSelection(sessionId)

  // Handle submit
  const handleSubmit = async () => {
    // Check if all required fields are selected
    if (!selection.culpritId || !selection.weaponClueId || selection.locationFloor === null) {
      alertWarning('보드에서 범인, 흉기, 장소를 선택해주세요.')
      return
    }

    // Submit (end game) - backend evaluates the board state
    const result = await submit()

    if (result) {
      console.log('Submit result:', result)
    }
  }

  // Show result after submit
  if (submitResult) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 py-12">
          <div className="container max-w-3xl">
            <Card className="p-8">
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold gold-glow mb-4">
                  {submitResult.isSuccess ? '사건 해결!' : '추리 실패'}
                </h1>
                <p className="text-2xl">등급: {submitResult.rankGrade}</p>
                <p className="text-lg text-muted-foreground">점수: {submitResult.finalScore}</p>
              </div>

              <div className="flex gap-4">
                <Button variant="outline" className="flex-1" onClick={() => navigate('/')}>
                  홈으로
                </Button>
                <Button variant="neon" className="flex-1" onClick={() => navigate(createPath.boardSession(sessionId))}>
                  보드 보기
                </Button>
              </div>
            </Card>
          </div>
        </main>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 py-12 flex items-center justify-center">
          <div className="text-center max-w-md">
            <p className="text-red-500 mb-4">{error}</p>
            <div className="flex gap-4 justify-center">
              <Button variant="outline" onClick={() => navigate(createPath.boardSession(sessionId))}>
                보드로 돌아가기
              </Button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  const canSubmit = selection.culpritId &&
    selection.weaponClueId &&
    selection.locationFloor !== null

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 py-12">
        <div className="container max-w-3xl">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              className="mb-4"
              onClick={() => navigate(createPath.boardSession(sessionId))}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              보드로 돌아가기
            </Button>
            <h1 className="text-4xl font-bold gold-glow mb-4">최종 정답 제출</h1>
            <p className="text-muted-foreground">세션 ID: {sessionId}</p>
          </div>

          {/* Warning */}
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-red-400 mb-1">
                [WARNING] 최종 정답은 1회만 제출 가능합니다
              </p>
              <p className="text-sm text-muted-foreground">
                제출 후에는 수정할 수 없으며, 즉시 결과가 확인됩니다.
                추리 보드의 확정(빨간선) 연결 상태를 바탕으로 평가됩니다.
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-6">
            {/* Culprit (from board selection) */}
            <div className="bg-card/50 border border-border rounded-lg p-6">
              <h3 className="font-bold mb-2 bracket-left text-primary">범인</h3>
              <p className="text-sm text-muted-foreground mb-4">
                보드에서 선택한 용의자입니다. 변경하려면 보드로 돌아가세요.
              </p>
              <div className="w-full bg-muted rounded-lg px-4 py-3">
                {selection.culpritName || '미선택 (보드에서 선택해주세요)'}
              </div>
            </div>

            {/* Weapon (from board selection) */}
            <div className="bg-card/50 border border-border rounded-lg p-6">
              <h3 className="font-bold mb-2 bracket-left text-primary">흉기</h3>
              <p className="text-sm text-muted-foreground mb-4">
                보드에서 선택한 증거(흉기)입니다. 변경하려면 보드로 돌아가세요.
              </p>
              <div className="w-full bg-muted rounded-lg px-4 py-3">
                {selection.weaponName || '미선택 (보드에서 선택해주세요)'}
              </div>
            </div>

            {/* Location (from board selection) */}
            <div className="bg-card/50 border border-border rounded-lg p-6">
              <h3 className="font-bold mb-2 bracket-left text-primary">범행 장소</h3>
              <p className="text-sm text-muted-foreground mb-4">
                보드에서 선택한 장소(층)입니다. 변경하려면 보드로 돌아가세요.
              </p>
              <div className="w-full bg-muted rounded-lg px-4 py-3">
                {selection.locationFloor ? `${selection.locationFloor}층` : '미선택 (보드에서 선택해주세요)'}
              </div>
            </div>

            {/* Info message */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <p className="text-sm text-blue-300">
                ℹ️ 제출 시 보드의 현재 상태(노드, 연결선)가 서버로 전송되어 평가됩니다.
                확정(빨간선) 연결을 완성한 후 제출하세요.
              </p>
            </div>
          </div>

          {/* Submit button */}
          <div className="mt-8 flex gap-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => navigate(createPath.boardSession(sessionId))}
            >
              취소
            </Button>
            <Button
              variant="neon"
              className="flex-1"
              onClick={handleSubmit}
              disabled={!canSubmit || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  제출 중...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  최종 제출
                </>
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
