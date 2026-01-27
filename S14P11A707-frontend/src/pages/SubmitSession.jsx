import React, { useState, useEffect } from 'react'
import { useRoute, useLocation } from 'wouter'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { AlertCircle, CheckCircle, ChevronLeft } from 'lucide-react'
import { useSubmit } from '@/features/session/hooks/useSubmit'
import { useBoardSelection } from '@/features/session/hooks/useBoardSelection'
import { createPath } from '@/app/routePaths'

export default function SubmitSession() {
  const [, params] = useRoute('/submit/session/:sessionId')
  const sessionId = params?.sessionId ? parseInt(params.sessionId) : null
  const [, navigate] = useLocation()

  const [motive, setMotive] = useState('')
  const [causeOfDeath, setCauseOfDeath] = useState('')

  const {
    validation,
    submitResult,
    isValidating,
    isSubmitting,
    error,
    validate,
    submit,
    reset,
  } = useSubmit(sessionId)

  const {
    selection,
    clear,
    isComplete: isSelectionComplete,
  } = useBoardSelection(sessionId)

  // Validate when selection or text changes
  useEffect(() => {
    if (validation?.submittable === false) {
      validate()
    }
  }, [selection, motive, causeOfDeath, validate])

  // Handle submit
  const handleSubmit = async () => {
    // Check if all fields are filled
    if (!selection.culpritId || !selection.weaponClueId || selection.locationFloor === null) {
      alert('보드에서 범인, 흉기, 장소를 선택해주세요.')
      return
    }

    if (!motive.trim() || !causeOfDeath.trim()) {
      alert('동기와 사인을 모두 입력해주세요.')
      return
    }

    // Validate first
    const validationResult = await validate()
    if (!validationResult?.submittable) {
      const missing = validationResult?.missing || []
      if (missing.length > 0) {
        alert(`제출할 수 없습니다:\n${missing.join('\n')}`)
      }
      return
    }

    // Submit
    const result = await submit({
      culpritId: selection.culpritId,
      weaponClueId: selection.weaponClueId,
      locationFloor: selection.locationFloor,
      motive: motive.trim(),
      causeOfDeath: causeOfDeath.trim(),
    })

    if (result) {
      // Show result
      console.log('Submit result:', result)
    }
  }

  // Loading state
  if (isValidating && !validation) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 py-12 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">제출 가능 여부를 확인하는 중...</p>
          </div>
        </main>
      </div>
    )
  }

  // Show result after submit
  if (submitResult) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 py-12">
          <div className="container max-w-3xl">
            <Card className="p-8">
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold gold-glow mb-4">제출 완료</h1>
                <p className="text-2xl">등급: {submitResult.rankGrade}</p>
                <p className="text-lg text-muted-foreground">점수: {submitResult.finalScore}</p>
              </div>

              {submitResult.evaluation && (
                <div className="space-y-4 mb-8">
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <span>범인</span>
                    <span className={submitResult.evaluation.culpritCorrect ? 'text-green-500' : 'text-red-500'}>
                      {submitResult.evaluation.culpritCorrect ? '정답' : '오답'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <span>흉기</span>
                    <span className={submitResult.evaluation.weaponCorrect ? 'text-green-500' : 'text-red-500'}>
                      {submitResult.evaluation.weaponCorrect ? '정답' : '오답'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <span>장소</span>
                    <span className={submitResult.evaluation.locationCorrect ? 'text-green-500' : 'text-red-500'}>
                      {submitResult.evaluation.locationCorrect ? '정답' : '오답'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <span>동기 유사도</span>
                    <span>{Math.round(submitResult.evaluation.motiveSimilarity * 100)}%</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <span>사인 유사도</span>
                    <span>{Math.round(submitResult.evaluation.causeOfDeathSimilarity * 100)}%</span>
                  </div>
                </div>
              )}

              {submitResult.evaluation?.aiComment && (
                <div className="bg-muted/30 rounded-lg p-6 mb-8">
                  <h3 className="font-bold mb-2 bracket-left">AI 평가</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {submitResult.evaluation.aiComment}
                  </p>
                </div>
              )}

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
  if (error && !validation) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 py-12 flex items-center justify-center">
          <div className="text-center max-w-md">
            <p className="text-red-500 mb-4">{error}</p>
            <div className="flex gap-4 justify-center">
              <Button variant="outline" onClick={() => navigate(createPath.boardSession(sessionId))}>
                보드로 돌아가기
              </Button>
              <Button onClick={validate}>
                다시 시도
              </Button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  const canSubmit = validation?.submittable &&
    selection.culpritId &&
    selection.weaponClueId &&
    selection.locationFloor !== null &&
    motive.trim() &&
    causeOfDeath.trim()

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
                제출 후에는 수정할 수 없으며, 즉시 결과가 확인됩니다. 신중하게 작성해주세요.
              </p>
            </div>
          </div>

          {/* Validation errors */}
          {validation && !validation.submittable && (
            <div className="mb-8 p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
              <p className="font-bold text-orange-400 mb-2">제출할 수 없습니다:</p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                {validation.missing?.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}

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

            {/* Motive */}
            <div className="bg-card/50 border border-border rounded-lg p-6">
              <h3 className="font-bold mb-2 bracket-left text-primary">범행 동기</h3>
              <p className="text-sm text-muted-foreground mb-4">범인의 동기를 설명하세요</p>
              <textarea
                value={motive}
                onChange={(e) => setMotive(e.target.value)}
                placeholder="범행 동기를 설명해주세요..."
                className="w-full bg-muted rounded-lg px-4 py-3 min-h-[120px] focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>

            {/* Cause of death */}
            <div className="bg-card/50 border border-border rounded-lg p-6">
              <h3 className="font-bold mb-2 bracket-left text-primary">범행 방법 (사인)</h3>
              <p className="text-sm text-muted-foreground mb-4">범행이 어떻게 이루어졌는지 설명하세요</p>
              <textarea
                value={causeOfDeath}
                onChange={(e) => setCauseOfDeath(e.target.value)}
                placeholder="범행 방법을 상세히 설명해주세요..."
                className="w-full bg-muted rounded-lg px-4 py-3 min-h-[120px] focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
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
