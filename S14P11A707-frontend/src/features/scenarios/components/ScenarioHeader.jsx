import React from 'react'
import { Link } from 'wouter'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { FEATURE_FLAGS } from '@/app/featureFlags'


export function ScenarioHeader({ activeTab = 'all', onChangeTab }) {
  const { state, actions } = useAuth()
  const user = state.user

  return (
    <div className="mb-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-4xl font-bold gold-glow mb-2">시나리오 목록</h1>
          <p className="text-muted-foreground">당신의 추리력을 시험해보세요</p>
        </div>

        {FEATURE_FLAGS.disableScenarioCreation ? (
          <Button variant="neon" className="flex items-center gap-2" disabled>
            <Plus className="w-5 h-5" />
            시나리오 생성 점검중
          </Button>
        ) : user ? (
          <Link href="/create-scenario">
            <Button variant="neon" className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              시나리오 만들기
            </Button>
          </Link>
        ) : (
          <Button
            variant="neon"
            className="flex items-center gap-2"
            onClick={() => actions.login()}
          >
            <Plus className="w-5 h-5" />
            시나리오 만들기
          </Button>
        )}
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
