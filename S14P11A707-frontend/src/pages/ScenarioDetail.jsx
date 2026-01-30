import React from 'react'
import { useRoute, useLocation } from 'wouter'
import { useScenarioById } from '@/features/scenarios/hooks/useScenarioById'
import ScenarioDetailCard from '@/features/scenarios/components/ScenarioDetailCard'

export default function ScenarioDetail() {
  const [, params] = useRoute('/scenario/:id')
  const [, setLocation] = useLocation()
  const scenarioId = params?.id ? parseInt(params.id, 10) : 0

  const { scenario, loading, error } = useScenarioById(scenarioId)

  // 게임하기 버튼 클릭 핸들러
  const handlePlayClick = () => {
    setLocation(`/game/${scenarioId}`)
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
    </div>
  )
}
