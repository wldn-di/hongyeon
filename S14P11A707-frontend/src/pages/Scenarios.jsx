import React, { useState } from 'react'
import { scenarios } from '@/data/dummyData'

import { GENRES, DIFFICULTIES, SORT_OPTIONS } from '@/features/scenarios/constants/scenarioOptions'
import { useScenarioFilters } from '@/features/scenarios/hooks/useScenarioFilters'
import { useFilteredScenarios } from '@/features/scenarios/hooks/useFilteredScenarios'

import { ScenarioHeader } from '@/features/scenarios/components/ScenarioHeader'
import { ScenarioFilters } from '@/features/scenarios/components/ScenarioFilters'
import { ScenarioGrid } from '@/features/scenarios/components/ScenarioGrid'
import { ScenarioFooter } from '@/features/scenarios/components/ScenarioFooter'

export default function Scenarios() {
  const [searchQuery, setSearchQuery] = useState('')

  const {
    genreFilter,
    difficultyFilter,
    sortBy,
    setGenreFilter,
    setDifficultyFilter,
    setSortBy,
  } = useScenarioFilters()

  const filteredScenarios = useFilteredScenarios(scenarios, {
    genreFilter,
    difficultyFilter,
    sortBy,
  })

  const normalizedQuery = searchQuery.trim().toLowerCase()
  const visibleScenarios = filteredScenarios.filter((scenario) => {
    if (!normalizedQuery) return true

    const tags = Array.isArray(scenario.tags) ? scenario.tags.join(' ') : ''
    const haystack = `${scenario.title ?? ''} ${scenario.synopsis ?? ''} ${scenario.description ?? ''} ${tags}`.toLowerCase()
    return haystack.includes(normalizedQuery)
  })

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 py-12">
        <div className="container">
          <ScenarioHeader />

          <div className="mb-6">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="시나리오 검색..."
              className="w-full bg-card/50 border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <ScenarioFilters
            genreFilter={genreFilter}
            difficultyFilter={difficultyFilter}
            sortBy={sortBy}
            onGenreChange={setGenreFilter}
            onDifficultyChange={setDifficultyFilter}
            onSortChange={setSortBy}
            genres={GENRES}
            difficulties={DIFFICULTIES}
            sortOptions={SORT_OPTIONS}
          />

          <ScenarioGrid scenarios={visibleScenarios} />
        </div>
      </main>

      <ScenarioFooter />
    </div>
  )
}
