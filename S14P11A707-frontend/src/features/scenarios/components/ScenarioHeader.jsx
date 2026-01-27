import React from 'react'
import { Link } from 'wouter'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'


export function ScenarioHeader({ activeTab = 'all', onChangeTab }) {
  return (
    <div className="mb-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-4xl font-bold gold-glow mb-2">시나리오 목록</h1>
          <p className="text-muted-foreground">당신의 추리력을 시험해보세요</p>
        </div>

        <Link href="/create-scenario">
          <Button variant="neon" className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            시나리오 만들기
          </Button>
        </Link>
      </div>

      {/* 전체시나리오/나만의시나리오 탭 */}
      <div className="flex items-center gap-2">
        <Button variant="tab" className={cn(activeTab === 'all' && 'is-active')}
          onClick={() => onChangeTab?.('all')}> 전체 시나리오
        </Button>

        <Button variant="tab" className={cn(activeTab === 'mine' && 'is-active')}
          onClick={() => onChangeTab?.('mine')}> 내 시나리오
        </Button>
      </div>
    </div>
  )
}