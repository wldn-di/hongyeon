import React from 'react'
import { Link } from 'wouter'
import { Button } from '@/components/ui/Button'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      
      <main className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-6">
          <h1 className="text-8xl font-bold gold-glow">404</h1>
          <p className="text-xl text-muted-foreground font-mono">
            [PAGE_NOT_FOUND]
          </p>
          <p className="text-muted-foreground">
            요청하신 페이지를 찾을 수 없습니다.
          </p>
          <Link href="/">
            <Button className="neon-border-cyan">
              홈으로 돌아가기
            </Button>
          </Link>
        </div>
      </main>
    </div>
  )
}
