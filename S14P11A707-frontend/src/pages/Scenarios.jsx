import { useEffect, useMemo, useState } from 'react'
import { Link } from 'wouter'

import { GENRES, DIFFICULTIES, SORT_OPTIONS } from '@/features/scenarios/constants/scenarioOptions'
import { useScenarioFilters } from '@/features/scenarios/hooks/useScenarioFilters'
import { useFilteredScenarios } from '@/features/scenarios/hooks/useFilteredScenarios'
import { useScenarios } from '@/features/scenarios/hooks/useScenarios'
import { useMyScenarios } from '@/features/scenarios/hooks/useMyScenarios'
import { useTopScenarios } from '@/features/scenarios/hooks/useTopScenarios'

import { ScenarioHeader } from '@/features/scenarios/components/ScenarioHeader'
import { ScenarioFilters } from '@/features/scenarios/components/ScenarioFilters'
import { ScenarioGrid } from '@/features/scenarios/components/ScenarioGrid'
import { ScenarioFooter } from '@/features/scenarios/components/ScenarioFooter'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'

/**
 * 시나리오 목록 페이지
 * API 기반으로 작동하며, 서버 사이드 페이지네이션을 지원합니다
 */
export default function Scenarios() {
  const { state, actions } = useAuth()
  const user = state.user

  const {
    tab,
    keyword,
    genres,
    difficulties,
    sortBy,
    page,
    size,
    setTab,
    applyKeyword,
    toggleGenre,
    toggleDifficulty,
    clearGenres,
    clearDifficulties,
    setSortBy,
    setPage,
    setSize,
    resetFilters,
  } = useScenarioFilters()

  const [keywordDraft, setKeywordDraft] = useState(keyword)

  useEffect(() => {
    setKeywordDraft(keyword)
  }, [keyword])

  const isScenarioCompleted = (scenario) => !scenario?.status || scenario.status === 'COMPLETED'

  // 전체 시나리오 조회 (API)
  const {
    scenarios: allScenariosRaw,
    totalPages: allTotalPages,
    currentPage: allCurrentPage,
    loading: allLoading,
    error: allError,
  } = useScenarios(
    { keyword, genres, difficulties, sortBy, page, size },
    { enabled: tab === 'all' },
  )

  // 내 시나리오 조회 (API)
  const { scenarios: myScenariosRaw, loading: myLoading, error: myError } = useMyScenarios({
    enabled: tab === 'mine' && !!user,
  })

  // TOP 10 섹션 (실패 시 섹션만 숨김)
  const { topByRating, topByPlayCount } = useTopScenarios({ enabled: tab === 'all' })

  const allScenarios = useMemo(
    () => (allScenariosRaw || []).filter(isScenarioCompleted),
    [allScenariosRaw],
  )

  const myFilteredScenarios = useFilteredScenarios(myScenariosRaw || [], {
    keyword,
    genres,
    difficulties,
    sortBy,
  })

  const myScenariosCompleted = useMemo(
    () => myFilteredScenarios.filter(isScenarioCompleted),
    [myFilteredScenarios],
  )

  const myTotalPages = useMemo(() => {
    if (!myScenariosCompleted.length) return 0
    return Math.ceil(myScenariosCompleted.length / Math.max(1, size))
  }, [myScenariosCompleted, size])

  const myCurrentPage = useMemo(() => {
    if (myTotalPages === 0) return 0
    return Math.min(page, myTotalPages - 1)
  }, [page, myTotalPages])

  const myVisibleScenarios = useMemo(() => {
    const start = myCurrentPage * size
    const end = start + size
    return myScenariosCompleted.slice(start, end)
  }, [myScenariosCompleted, myCurrentPage, size])

  const loading = tab === 'mine' ? myLoading : allLoading
  const error = tab === 'mine' ? myError : allError

  const visibleScenarios = tab === 'mine' ? myVisibleScenarios : allScenarios
  const totalPages = tab === 'mine' ? myTotalPages : allTotalPages
  const currentPage = tab === 'mine' ? myCurrentPage : allCurrentPage

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 py-12">
        <div className="container">
          {/* 전체시나리오/나만의 시나리오 탭 props 전달 */}
          <ScenarioHeader activeTab={tab} onChangeTab={setTab} />

          {/* 키워드 검색 */}
          <form
            className="mb-6 flex flex-col sm:flex-row gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              applyKeyword(keywordDraft)
            }}
          >
            <input
              value={keywordDraft}
              onChange={(e) => setKeywordDraft(e.target.value)}
              placeholder="시나리오 검색..."
              className="flex-1 bg-card/50 border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <div className="flex gap-2">
              <Button type="submit" variant="neon">
                검색
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setKeywordDraft('')
                  resetFilters()
                }}
              >
                초기화
              </Button>
            </div>
          </form>

          <ScenarioFilters
            selectedGenres={genres}
            selectedDifficulties={difficulties}
            sortBy={sortBy}
            onToggleGenre={toggleGenre}
            onToggleDifficulty={toggleDifficulty}
            onClearGenres={clearGenres}
            onClearDifficulties={clearDifficulties}
            onSortChange={setSortBy}
            genres={GENRES}
            difficulties={DIFFICULTIES}
            sortOptions={SORT_OPTIONS}
          />

          {/* 페이지 크기 / 페이지네이션 */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div className="text-sm text-muted-foreground">
              {totalPages > 0 ? `페이지 ${currentPage + 1} / ${totalPages}` : '페이지 1 / 1'}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">페이지 크기</span>
              <select
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
                className="bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {[10, 20, 40].map((n) => (
                  <option key={n} value={n}>
                    {n}개
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 탭=mine && 비로그인 */}
          {tab === 'mine' && !user && !state.loading && (
            <div className="bg-card/40 border border-border rounded-xl p-10 text-center mb-6">
              <p className="text-xl font-bold mb-2">로그인이 필요합니다</p>
              <p className="text-muted-foreground mb-6">내 시나리오를 보려면 로그인이 필요해요.</p>
              <Link href="/profile">
                <Button variant="neon">
                  로그인하러 가기
                </Button>
              </Link>
            </div>
          )}

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
          ) : tab === 'mine' && !user ? null : tab === 'mine' && myScenariosCompleted.length === 0 ? (
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
            <>
              <ScenarioGrid scenarios={visibleScenarios} />

              {/* 페이지네이션 */}
              {totalPages > 1 && (
                <div className="mt-10 flex items-center justify-center gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(Math.max(0, currentPage - 1))}
                    disabled={currentPage <= 0}
                  >
                    이전
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {currentPage + 1} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(Math.min(totalPages - 1, currentPage + 1))}
                    disabled={currentPage >= totalPages - 1}
                  >
                    다음
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <ScenarioFooter />
    </div>
  )
}

function TopScenarioSection({ title, scenarios, emptyText }) {
  const list = Array.isArray(scenarios) ? scenarios.slice(0, 10) : []

  return (
    <div className="bg-card/50 border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold gold-glow">{title}</h2>
        <span className="text-xs text-muted-foreground">{list.length}개</span>
      </div>

      {list.length === 0 ? (
        <div className="text-sm text-muted-foreground py-6 text-center">
          {emptyText}
        </div>
      ) : (
        <ol className="space-y-2">
          {list.map((scenario, idx) => (
            <li key={scenario.id}>
              <Link
                href={`/scenario/${scenario.id}`}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2',
                  'bg-muted/30 hover:bg-muted/50 transition-colors',
                )}
              >
                <span className="w-5 text-center font-bold text-primary">
                  {idx + 1}
                </span>
                <span className="flex-1 text-sm font-medium truncate">
                  {scenario.title}
                </span>
                {title.includes('평점') ? (
                  <span className="text-xs text-muted-foreground">
                    {(Number(scenario.avgRating ?? scenario.rating / 100) || 0).toFixed(1)}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    {(Number(scenario.playCount) || 0).toLocaleString()}회
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
