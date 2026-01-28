import { useState, useMemo } from 'react'
import { Link } from 'wouter'

import { GENRES, DIFFICULTIES, SORT_OPTIONS } from '@/features/scenarios/constants/scenarioOptions'
import { useScenarioFilters } from '@/features/scenarios/hooks/useScenarioFilters'
import { useFilteredScenarios } from '@/features/scenarios/hooks/useFilteredScenarios'
import { useScenarios } from '@/features/scenarios/hooks/useScenarios'
import { useMyScenarios } from '@/features/scenarios/hooks/useMyScenarios'

import { ScenarioHeader } from '@/features/scenarios/components/ScenarioHeader'
import { ScenarioFilters } from '@/features/scenarios/components/ScenarioFilters'
import { ScenarioGrid } from '@/features/scenarios/components/ScenarioGrid'
import { ScenarioFooter } from '@/features/scenarios/components/ScenarioFooter'
import { Button } from '@/components/ui/Button'

/**
 * 시나리오 목록 페이지
 * API 기반으로 작동하며, 서버 사이드 페이지네이션을 지원합니다
 */
export default function Scenarios() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('all') // 'all' | 'mine'

  const {
    genreFilter,
    difficultyFilter,
    sortBy,
    setGenreFilter,
    setDifficultyFilter,
    setSortBy,
  } = useScenarioFilters()

  // 전체 시나리오 조회 (API)
  const { scenarios, loading: allLoading, error: allError } = useScenarios()

  // 내 시나리오 조회 (API)
  const { scenarios: myScenarios, loading: myLoading, error: myError } = useMyScenarios()

  // 탭에 따라 로딩 상태 결정
  const loading = activeTab === 'mine' ? myLoading : allLoading
  const error = activeTab === 'mine' ? myError : allError

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

    const haystack = `${scenario.title ?? ''} ${scenario.synopsis ?? ''} ${scenario.description ?? ''}`.toLowerCase()
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

          {/* 로딩 상태 */}
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="text-center">
                <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-muted-foreground">시나리오를 불러오는 중...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex justify-center items-center py-20">
              <div className="text-center">
                <p className="text-red-400 mb-4">시나리오를 불러오는데 실패했습니다.</p>
                <Button onClick={() => window.location.reload()}>다시 시도</Button>
              </div>
            </div>
          ) : activeTab === 'mine' && myScenarios.length === 0 ? (
            <div className="bg-card/40 border border-border rounded-xl p-10 text-center">
              <p className="text-xl font-bold mb-2">내 시나리오가 아직 없어요</p>
              <p className="text-muted-foreground mb-6">첫 번째 사건을 만들어 볼까요?</p>
              <Link href="/create-scenario">
                <Button variant="neon">+ 시나리오 만들기</Button>
              </Link>
            </div>
          ) : visibleScenarios.length === 0 ? (
            <div className="bg-card/40 border border-border rounded-xl p-10 text-center">
              <p className="text-muted-foreground">검색 결과가 없습니다.</p>
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
