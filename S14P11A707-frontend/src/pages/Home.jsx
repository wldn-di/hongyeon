import React from 'react'
import { Link } from 'wouter'
import { Button } from '@/components/ui/Button'
import { ScenarioCard } from '@/features/game/components/ScenarioCard'
import { PageLayout } from '@/components/layout/PageLayout'
import { scenarios } from '@/data/dummyData'

export default function Home() {
  return (
    <PageLayout>
      {/* 히어로 섹션 */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent"></div>
        <div className="container relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h1 className="text-6xl md:text-8xl font-bold gold-glow glitch" data-text="DETECTIVE" style={{ color: 'var(--primary)' }}>
              DETECTIVE
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground font-mono">
              [SYSTEM_DETECTED]
            </p>
            <p className="text-lg text-foreground/80 max-w-2xl mx-auto">
              영화 속 수사반장의 화이트보드를 디지털로 구현한 추리 게임<br></br>
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

      {/* 시나리오 미리보기 영역 */}
      <section className="pt-16 pb-8 bg-card/30">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold bracket-both gold-glow">
              추천 시나리오
            </h2>
            <Link href="/scenarios">
              <Button variant="ghost" className="text-primary hover:text-primary/80">
                전체 보기 →
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {scenarios.slice(0, 3).map((scenario) => (
              <ScenarioCard key={scenario.id} scenario={scenario} />
            ))}
          </div>
        </div>
      </section>

      {/* 특징 섹션 */}
      <section className="py-16">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center space-y-4">
              <h3 className="text-xl font-bold">증거 기반 추리</h3>
              <p className="text-muted-foreground">
                장소를 탐색하고 증거를 수집하여 논리적으로 사건을 해결하세요.
              </p>
            </div>
            <div className="text-center space-y-4">
              <h3 className="text-xl font-bold">AI 용의자 심문</h3>
              <p className="text-muted-foreground">
                AI 기반 용의자와 대화하며 진실을 파헤치세요.
              </p>
            </div>
            <div className="text-center space-y-4">
              <h3 className="text-xl font-bold">실시간 협동</h3>
              <p className="text-muted-foreground">
                친구와 함께 추리보드를 공유하며 사건을 해결하세요.
              </p>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  )
}