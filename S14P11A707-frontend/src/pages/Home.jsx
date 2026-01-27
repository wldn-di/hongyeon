import React, { useMemo } from 'react'
import { Link } from 'wouter'
import { Button } from '@/components/ui/Button'
import { ScenarioCard } from '@/features/game/components/ScenarioCard'
import { PageLayout } from '@/components/layout/PageLayout'
import { scenarios, scenarioReviews } from '@/data/dummyData'
import { Card } from '@/components/ui/Card'

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

export default function Home() {
  // ✅ 더미데이터 필드가 확실치 않아서 "안전한" 정렬 기준으로 작성
  const popularTop10 = useMemo(() => {
    // playCount 같은 필드가 있으면 그걸 쓰고, 없으면 id 역순(최신 가정)
    return [...scenarios]
      .sort((a, b) => (b.playCount ?? b.plays ?? b.id ?? 0) - (a.playCount ?? a.plays ?? a.id ?? 0))
      .slice(0, 10)
  }, [])

  const ratingTop10 = useMemo(() => {
    return [...scenarios]
      .sort((a, b) => (b.rating ?? b.score ?? 0) - (a.rating ?? a.score ?? 0))
      .slice(0, 10)
  }, [])

  const coldCaseTop10 = useMemo(() => {
    // difficulty가 hard인 것 우선. (없으면 전체에서 뽑힘)
    const hard = scenarios.filter((s) => String(s.difficulty || '').toLowerCase() === 'hard')
    const base = hard.length ? hard : scenarios

    // clearRate/solved 같은 필드가 있으면 활용, 없으면 "플레이수 적은 hard"로 미제 느낌
    return [...base]
      .sort((a, b) => {
        const aSolved = a.solved ?? a.isSolved ?? null
        const bSolved = b.solved ?? b.isSolved ?? null
        if (aSolved !== null && bSolved !== null) return Number(aSolved) - Number(bSolved) // false(0) 먼저
        return (a.playCount ?? a.plays ?? 0) - (b.playCount ?? b.plays ?? 0) // 덜 플레이된 사건 = 미제 느낌
      })
      .slice(0, 10)
  }, [])

  const oneLineReviewsTop10 = useMemo(() => {
    // scenarioReviews가 배열일 수도, { [id]: [] } 형태일 수도 있어서 안전하게 flat
    const flat = []
    if (Array.isArray(scenarioReviews)) {
      flat.push(...scenarioReviews)
    } else if (scenarioReviews && typeof scenarioReviews === 'object') {
      Object.values(scenarioReviews).forEach((arr) => {
        if (Array.isArray(arr)) flat.push(...arr)
      })
    }
    return flat.slice(0, 10)
  }, [])

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

      {/* 1) 최신 인기 TOP10 */}
      <section className="pt-16 pb-8 bg-card/30">
        <div className="container">
          <SectionHeader title="최신 인기 TOP 10" to="/scenarios" />
          {/* 지금 너가 하던 grid 패턴 그대로: 일단 3개만 보여주고 '전체보기'로 유도 */}
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
            * HARD 난이도 중심으로 “아직 정복되지 않은 사건”을 우선 노출합니다.
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
          <div className="flex gap-4 overflow-x-auto pb-2 pr-2">
            {oneLineReviewsTop10.map((r, idx) => (
              <Card
                key={r?.id ?? idx}
                className="min-w-[260px] md:min-w-[320px] bg-card/50 border-border p-4 hover:bg-card/70 transition"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-bold">{r?.user ?? r?.author ?? '익명'}</p>
                  {typeof (r?.rating ?? r?.score) === 'number' && (
                    <p className="text-xs text-muted-foreground">★ {r.rating ?? r.score}</p>
                  )}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                  {r?.comment ?? r?.text ?? r?.content ?? '아직 한 줄 평이 없습니다.'}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </PageLayout>
  )
}
