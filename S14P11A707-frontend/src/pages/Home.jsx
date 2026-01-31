import { useMemo } from 'react'
import { Link } from 'wouter'

import { Button } from '@/components/ui/Button'
import { ScenarioCard } from '@/features/game/components/ScenarioCard'
import { PageLayout } from '@/components/layout/PageLayout'
import { Card } from '@/components/ui/Card'
import { useScenarios } from '@/features/scenarios/hooks/useScenarios'
import { useScenarioReviews } from '@/features/scenarios/hooks/useScenarioReviews'

function SectionHeader({ title, to = '/scenarios', rightText = '전체 보기 →' }) {
  return (
    <div className="flex items-center justify-between mb-8">
      <h2 className="text-3xl font-bold bracket-both gold-glow">{title}</h2>
      <Link href={to}>
        <Button variant="ghost" className="text-primary hover:text-primary/80">
          {rightText}
        </Button>
      </Link>
    </div>
  )
}

/**
 * 홈 페이지
 * API 기반으로 작동하며 시나리오와 리뷰 데이터를 표시합니다
 */
export default function Home() {
  // 시나리오 데이터 조회 (API)
  const { scenarios, loading: scenariosLoading } = useScenarios()

  // 시나리오 배열이 undefined인 경우 빈 배열로 처리
  const scenariosList = scenarios || []

  // 첫 번째 시나리오의 리뷰 조회 (API) - 예시로 하나만 가져옴
  const firstScenarioId = scenariosList[0]?.id
  const { reviews, loading: reviewsLoading } = useScenarioReviews(firstScenarioId, { size: 10 })

  // 로딩 상태
  const isLoading = scenariosLoading || reviewsLoading

  // 인기 TOP 10 (플레이 횟수 기준)
  const popularTop10 = useMemo(() => {
    return [...scenariosList]
      .sort((a, b) => (b.playCount ?? 0) - (a.playCount ?? 0))
      .slice(0, 10)
  }, [scenariosList])

  // 평점 TOP 10
  const ratingTop10 = useMemo(() => {
    return [...scenariosList]
      .sort((a, b) => (b.rating ?? b.avgRating ?? 0) - (a.rating ?? a.avgRating ?? 0))
      .slice(0, 10)
  }, [scenariosList])

  // 미제사건 TOP 10 (HARD 난이도, 플레이 횟수 적은 순)
  const coldCaseTop10 = useMemo(() => {
    // HARD 난이도 필터링
    const hard = scenariosList.filter((s) => s.difficulty === 'hard')
    const base = hard.length ? hard : scenariosList

    return [...base]
      .sort((a, b) => (a.playCount ?? 0) - (b.playCount ?? 0))
      .slice(0, 10)
  }, [scenariosList])

  // 한 줄 평 (리뷰 데이터)
  const oneLineReviewsTop10 = useMemo(() => {
    return (reviews || []).slice(0, 10)
  }, [reviews])

  return (
    <PageLayout>
      {/* 히어로 섹션 (그대로 유지) */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent" />
        <div className="container relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h1
              className="text-6xl md:text-8xl font-bold gold-glow glitch"
              data-text="DETECTIVE"
              style={{ color: 'var(--primary)' }}
            >
              DETECTIVE
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground font-mono">[SYSTEM_DETECTED]</p>
            <p className="text-lg text-foreground/80 max-w-2xl mx-auto">
              영화 속 수사반장의 화이트보드를 디지털로 구현한 추리 게임<br />
              증거를 수집하고, 용의자를 심문하며, 진실을 밝혀내라!
            </p>

            {/* 소개 영상 */}
            <div className="w-full max-w-4xl mx-auto aspect-video rounded-xl overflow-hidden border border-border shadow-2xl">
              <iframe
                className="w-full h-full"
                src="https://www.youtube.com/embed/5hQzvXJod8s"
                title="DETECTIVE 소개 영상"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>

            <div className="flex gap-4 justify-center">
              <Link href="/tutorial">
                <Button variant="neon" size="lg" className="text-lg px-8">
                  ▶ 튜토리얼 하러 가기
                </Button>
              </Link>
              <Link href="/create-scenario">
                <Button variant="neon" size="lg" className="text-lg px-8">
                  ▶ 나만의 시나리오 만들러 가기
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 로딩 스켈레톤 */}
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="text-center">
            <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-muted-foreground">데이터를 불러오는 중...</p>
          </div>
        </div>
      ) : (
        <>
          {/* 1) 최신 인기 TOP10 */}
          <section className="pt-16 pb-8 bg-card/30">
            <div className="container">
              <SectionHeader title="최신 인기 TOP 10" to="/scenarios" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {popularTop10.slice(0, 3).map((scenario) => (
                  <ScenarioCard key={scenario.id} scenario={scenario} />
                ))}
              </div>
            </div>
          </section>

          {/* 2) 평점 TOP10 */}
          <section className="pt-16 pb-8 bg-card/30">
            <div className="container">
              <SectionHeader title="평점 TOP 10" to="/scenarios" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ratingTop10.slice(0, 3).map((scenario) => (
                  <ScenarioCard key={scenario.id} scenario={scenario} />
                ))}
              </div>
            </div>
          </section>

          {/* 3) 해결을 기다리고 있는 최고난이도의 미제사건들 */}
          <section className="pt-16 pb-8 bg-card/30">
            <div className="container">
              <SectionHeader title="해결을 기다리고 있는 최고난이도의 미제사건들" to="/scenarios" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {coldCaseTop10.slice(0, 3).map((scenario) => (
                  <ScenarioCard key={scenario.id} scenario={scenario} />
                ))}
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                * HARD 난이도 중심으로 "아직 정복되지 않은 사건"을 우선 노출합니다.
              </p>
            </div>
          </section>

          {/* 4) 유저들의 한 줄 평 */}
          <section className="pt-16 pb-16 bg-card/30">
            <div className="container">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold bracket-both gold-glow">유저들의 한 줄 평</h2>
                <Link href="/scenarios">
                  <Button variant="ghost" className="text-primary hover:text-primary/80">
                    더 보기 →
                  </Button>
                </Link>
              </div>

              {/* 와이어프레임 느낌: 가로 스크롤 */}
              {oneLineReviewsTop10.length > 0 ? (
                <div className="flex gap-4 overflow-x-auto pb-2 pr-2">
                  {oneLineReviewsTop10.map((r) => (
                    <Card
                      key={r.id}
                      className="min-w-[260px] md:min-w-[320px] bg-card/50 border-border p-4 hover:bg-card/70 transition"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-bold">{r.nickname || '익명'}</p>
                        {typeof r.rating === 'number' && (
                          <p className="text-xs text-muted-foreground">★ {r.rating}</p>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                        {r.content || '아직 한 줄 평이 없습니다.'}
                      </p>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">아직 리뷰가 없습니다.</p>
              )}
            </div>
          </section>
        </>
      )}
    </PageLayout>
  )
}
