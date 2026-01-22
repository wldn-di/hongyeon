import React from 'react'
import { Link } from 'wouter'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export function ScenarioHeader() {
  return (
    <div className="flex items-start justify-between mb-8">
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
  )
}