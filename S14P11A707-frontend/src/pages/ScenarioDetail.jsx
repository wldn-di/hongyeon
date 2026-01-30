import React, { useState } from 'react'
import { useRoute, useLocation } from 'wouter'
import { useScenarioById } from '@/features/scenarios/hooks/useScenarioById'
import ScenarioDetailCard from '@/features/scenarios/components/ScenarioDetailCard'
import { startGame } from '@/features/session/api/sessionApi'
import { Button } from '@/components/ui/Button'
import { toast } from 'sonner'

export default function ScenarioDetail() {
  const [, params] = useRoute('/scenario/:id')
  const [, setLocation] = useLocation()
  const scenarioId = params?.id ? parseInt(params.id, 10) : 0

  const { scenario, loading, error } = useScenarioById(scenarioId)
  const [showResumeModal, setShowResumeModal] = useState(false)
  const [existingSessionId, setExistingSessionId] = useState(null)

  // 게임하기 버튼 클릭 핸들러
  const handlePlayClick = async () => {
    try {
      const response = await startGame(scenarioId)

      // ✅ 백엔드에서 alreadyPlaying 체크
      if (response.alreadyPlaying) {
        setExistingSessionId(response.sessionId)
        setShowResumeModal(true)
        return
      }

      // 정상 시작 → 게임룸으로 이동
      setLocation(`/game/${scenarioId}`)
    } catch (err) {
      toast.error(err.message || '게임 시작 실패')
    }
  }

  if (loading) {
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
          {/* ✅ handlePlayClick을 props로 전달 */}
          <ScenarioDetailCard scenario={scenario} onPlay={handlePlayClick} />
        </div>
      </main>

      {showResumeModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl p-6 max-w-md">
            <h3 className="text-xl font-bold mb-4">진행중인 게임이 있습니다</h3>
            <p className="text-muted-foreground mb-6">
              이어서 하시겠습니까?
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowResumeModal(false)}
              >
                취소
              </Button>
              <Button
                variant="neon"
                className="flex-1"
                onClick={() => {
                  setShowResumeModal(false)
                  setLocation(`/room/${existingSessionId}/resume`)
                }}
              >
                이어하기
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
)}