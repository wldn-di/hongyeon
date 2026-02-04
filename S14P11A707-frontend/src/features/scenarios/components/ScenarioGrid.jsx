import React from 'react'
import { ScenarioCard } from '@/features/game/components/ScenarioCard'

export function ScenarioGrid({ scenarios }) {
  if (!scenarios || scenarios.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">조건에 맞는 시나리오가 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {scenarios.map((scenario, index) => (
        <ScenarioCard key={scenario.id} scenario={scenario} index={index} />
      ))}
    </div>
  )
}