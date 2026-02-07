import React, { useState, useCallback } from 'react'
import { useRoute, useLocation } from 'wouter'
import { useScenarioById } from '@/features/scenarios/hooks/useScenarioById'
import { useScenarioPlayStatus } from '@/features/scenarios/hooks/useScenarioPlayStatus'
import ScenarioDetailCard from '@/features/scenarios/components/ScenarioDetailCard'
import { ReplayConfirmModal } from '@/components/ui/ReplayConfirmModal'
import { useAuth } from '@/contexts/AuthContext'

export default function ScenarioDetail() {
  const [, params] = useRoute('/scenario/:id')
  const [, setLocation] = useLocation()
  const scenarioId = params?.id ? parseInt(params.id, 10) : 0

  const { state, actions } = useAuth()
  const user = state.user

  const { scenario, loading, error } = useScenarioById(scenarioId)
  const { status, hasPlayed, isPlaying, loading: statusLoading } = useScenarioPlayStatus(scenarioId, { enabled: !!user })

  // 재플레이 확인 모달 상태
  const [replayModalOpen, setReplayModalOpen] = useState(false)

  // 게임하기 버튼 클릭 핸들러
  const handlePlayClick = useCallback(() => {
    if (!user) {
      actions.openLoginGate(`/game/${scenarioId}`)
      return
    }

    // 완료/실패한 시나리오면 확인 모달 표시
    if (hasPlayed) {
      setReplayModalOpen(true)
      return
    }

    // 나머지(NONE, PLAYING) → 백엔드 startGame이 알아서 처리
    setLocation(`/game/${scenarioId}`)
  }, [user, scenarioId, hasPlayed, setLocation])

  // 재플레이 확인 핸들러 - 단순히 게임 페이지로 이동 (백엔드가 알아서 처리)
  const handleReplayConfirm = useCallback(() => {
    setReplayModalOpen(false)
    setLocation(`/game/${scenarioId}`)
  }, [scenarioId, setLocation])

  if (loading || statusLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">로딩 중...</p>
        </main>
      </div>
    )
  }

  if (error || !scenario) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">시나리오를 찾을 수 없습니다.</p>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 py-12">
        <div className="container max-w-6xl">
          <ScenarioDetailCard
            scenario={scenario}
            onPlay={handlePlayClick}
            playStatus={status}
            isPlaying={isPlaying}
          />
        </div>
      </main>

      {/* 재플레이 확인 모달 */}
      <ReplayConfirmModal
        isOpen={replayModalOpen}
        onClose={() => setReplayModalOpen(false)}
        onConfirm={handleReplayConfirm}
        status={status}
        scenarioTitle={scenario?.title}
      />
    </div>
  )
}
