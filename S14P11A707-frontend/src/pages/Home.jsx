import { useEffect, useState } from 'react'
import { Link } from 'wouter'

import { Button } from '@/components/ui/Button'
import { ScenarioCard } from '@/features/game/components/ScenarioCard'
import { PageLayout } from '@/components/layout/PageLayout'
import { useTopScenarios } from '@/features/scenarios/hooks/useTopScenarios'
import { useAuth } from '@/contexts/AuthContext'
import { isVisibleInAll } from '@/features/scenarios/api/scenarioMappers'

function SectionHeader({ title, to = '/scenarios', rightText = '전체 보기 →' }) {
  return (
    <div className="flex items-center justify-between mb-8">
      <h2 className="text-3xl font-bold gold-glow">{title}</h2>
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
 * API 기반으로 시나리오 데이터를 표시합니다
 */
export default function Home() {
  const { state, actions } = useAuth()
  const user = state.user
  const { topByRating, topByPlayCount } = useTopScenarios()

  const popularTop10 = topByPlayCount || []
  const ratingTop10 = topByRating || []

  // 둘 다 null이면(초기/실패) 무한 스피너 방지: 짧게만 로딩 표시 후 안내 문구로 전환
  const [showFallback, setShowFallback] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setShowFallback(true), 1200)
    return () => clearTimeout(t)
  }, [])

  const showPopular = topByPlayCount !== null
  const showRating = topByRating !== null
  const showEmptyState = !showPopular && !showRating && showFallback

  return (
    <PageLayout>
      {/* 히어로 섹션 (그대로 유지) */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent" />
        <div className="container relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h1
              className="text-6xl md:text-8xl font-bold gold-glow glitch"
              data-text="HONG-YEON"
              style={{ color: 'var(--primary)' }}
            >
              HONG-YEON
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
                title="HONG-YEON 소개 영상"
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
              {user ? (
                <Link href="/create-scenario">
                  <Button variant="neon" size="lg" className="text-lg px-8">
                    ▶ 나만의 시나리오 만들러 가기
                  </Button>
                </Link>
              ) : (
                <Button
                  variant="neon"
                  size="lg"
                  className="text-lg px-8"
                  onClick={() => actions.login()}
                >
                  ▶ 나만의 시나리오 만들러 가기
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {!showPopular && !showRating && !showFallback ? (
        <div className="flex justify-center items-center py-20">
          <div className="text-center">
            <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-muted-foreground">데이터를 불러오는 중...</p>
          </div>
        </div>
      ) : (
        <>
          {showEmptyState && (
            <div className="container py-16">
              <div className="rounded-xl border border-border bg-card/40 p-6 text-center">
                <p className="text-muted-foreground">아직 등록된 시나리오가 없습니다.</p>
              </div>
            </div>
          )}

          {/* 1) 인기 TOP10 */}
          {showPopular && (
            <section className="pt-16 pb-8 bg-card/30">
              <div className="container">
                <SectionHeader title="인기 TOP 10" to="/scenarios" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {popularTop10.filter(isVisibleInAll).slice(0, 3).map((scenario) => (
                    <ScenarioCard key={scenario.id} scenario={scenario} />
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* 2) 평점 TOP10 */}
          {showRating && (
            <section className="pt-16 pb-16 bg-card/30">
              <div className="container">
                <SectionHeader title="평점 TOP 10" to="/scenarios" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {ratingTop10.filter(isVisibleInAll).slice(0, 3).map((scenario) => (
                    <ScenarioCard key={scenario.id} scenario={scenario} />
                  ))}
                </div>
              </div>
            </section>
          )}
        </>
      )}
    </PageLayout>
  )
}
