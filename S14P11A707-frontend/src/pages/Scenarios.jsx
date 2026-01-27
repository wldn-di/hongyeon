import React, { useMemo, useState } from 'react'
import { scenarios } from '@/data/dummyData'

import { GENRES, DIFFICULTIES, SORT_OPTIONS } from '@/features/scenarios/constants/scenarioOptions'
import { useScenarioFilters } from '@/features/scenarios/hooks/useScenarioFilters'
import { useFilteredScenarios } from '@/features/scenarios/hooks/useFilteredScenarios'

import { ScenarioHeader } from '@/features/scenarios/components/ScenarioHeader'
import { ScenarioFilters } from '@/features/scenarios/components/ScenarioFilters'
import { ScenarioGrid } from '@/features/scenarios/components/ScenarioGrid'
import { ScenarioFooter } from '@/features/scenarios/components/ScenarioFooter'
import { Button } from '@/components/ui/Button'
import { Link } from 'wouter'

export default function Scenarios() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('all') // 전체 시나리오를 디폴트로

  const {
    genreFilter,
    difficultyFilter,
    sortBy,
    setGenreFilter,
    setDifficultyFilter,
    setSortBy,
  } = useScenarioFilters()

  // "내 시나리오"는 일단 localStorage 기반으로 (백 붙이기 전 Mock)
  const myScenarios = useMemo(() => {
    try {
      const raw = localStorage.getItem('my-scenarios')
      const parsed = raw ? JSON.parse(raw) : []
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }, [])

  // 탭에 따라 source 변경
  const sourceScenarios = activeTab === 'mine' ? myScenarios : scenarios

  const filteredScenarios = useFilteredScenarios(sourceScenarios, {
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
          {/* 전체시나리오/나만의 시나리오 탭 props 전달 */}
          <ScenarioHeader activeTab={activeTab} onChangeTab={setActiveTab} />

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

          {/* 내 시나리오가 없을 때 빈 상태 UI */}
          {activeTab === 'mine' && myScenarios.length === 0 ? (
            <div className="bg-card/40 border border-border rounded-xl p-10 text-center">
              <p className="text-xl font-bold mb-2">내 시나리오가 아직 없어요</p>
              <p className="text-muted-foreground mb-6">첫 번째 사건을 만들어 볼까요?</p>
              <Link href="/create-scenario">
                <Button variant="neon">+ 시나리오 만들기</Button>
              </Link>
            </div>
          ) : (
            <ScenarioGrid scenarios={visibleScenarios} />
          )}
        </div>
      </main>

      <ScenarioFooter />
    </div>
  )
}
