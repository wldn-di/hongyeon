import React from 'react'
import { useRoute } from 'wouter'
import { useScenarioById } from '@/features/scenarios/hooks/useScenarioById'
import ScenarioDetailCard from '@/features/scenarios/components/ScenarioDetailCard'

export default function ScenarioDetail() {
  const [, params] = useRoute('/scenario/:id')
  const scenarioId = params?.id ? parseInt(params.id, 10) : 0

  const scenario = useScenarioById(scenarioId)

  if (!scenario) {
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
        <div className="container max-w-4xl">
          <ScenarioDetailCard scenario={scenario} />
        </div>
      </main>

      <footer className="border-t border-border py-8 bg-card/30">
        <div className="container text-center">
          <p className="error-code">
            [SYSTEM_STATUS: OPERATIONAL] | DETECTIVE v2.0 | [COPYRIGHT_2024]
          </p>
        </div>
      </footer>
    </div>
  )
}
