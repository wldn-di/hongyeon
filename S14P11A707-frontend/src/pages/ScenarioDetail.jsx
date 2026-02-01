import React, { useState, useCallback } from 'react'
import { useRoute, useLocation } from 'wouter'
import { useScenarioById } from '@/features/scenarios/hooks/useScenarioById'
import { useScenarioPlayStatus } from '@/features/scenarios/hooks/useScenarioPlayStatus'
import ScenarioDetailCard from '@/features/scenarios/components/ScenarioDetailCard'
import { ReplayConfirmModal } from '@/components/ui/ReplayConfirmModal'
import { restartGame } from '@/features/session/api/sessionApi'
import { toast } from 'sonner'

export default function ScenarioDetail() {
  const [, params] = useRoute('/scenario/:id')
  const [, setLocation] = useLocation()
  const scenarioId = params?.id ? parseInt(params.id, 10) : 0

  const { scenario, loading, error } = useScenarioById(scenarioId)
  const { status, hasPlayed, isPlaying, session, loading: statusLoading } = useScenarioPlayStatus(scenarioId)

  // 재플레이 확인 모달 상태
  const [replayModalOpen, setReplayModalOpen] = useState(false)
  const [replayLoading, setReplayLoading] = useState(false)

  // 게임하기 버튼 클릭 핸들러
  const handlePlayClick = useCallback(() => {
    // 이미 플레이 중인 세션이 있으면 이어하기로 이동
    if (isPlaying && session?.sessionId) {
      setLocation(`/room/${session.sessionId}/resume`)
      return
    }

    // 완료/실패한 시나리오면 확인 모달 표시
    if (hasPlayed) {
      setReplayModalOpen(true)
      return
    }

    // 새 게임 시작
    setLocation(`/game/${scenarioId}`)
  }, [scenarioId, hasPlayed, isPlaying, session, setLocation])

  // 재플레이 확인 핸들러
  const handleReplayConfirm = useCallback(async () => {
    try {
      setReplayLoading(true)

      // 재시작 API 호출
      const response = await restartGame(scenarioId)

      setReplayModalOpen(false)

      // 새 세션으로 이동
      if (response?.sessionId) {
        setLocation(`/room/${response.sessionId}/resume`)
      } else {
        // sessionId가 없으면 기본 게임 경로로
        setLocation(`/game/${scenarioId}`)
      }
    } catch (err) {
      console.error('Restart game error:', err)
      toast.error(err.message || '재플레이 시작에 실패했습니다.')
    } finally {
      setReplayLoading(false)
    }
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
        loading={replayLoading}
      />
    </div>
  )
}