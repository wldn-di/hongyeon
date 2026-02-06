import React from 'react'
import { Button } from '@/components/ui/Button'
import { LogIn } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

/**
 * LoginGate
 * - 라우트 이동 없이 "로그인 필요" UI만 담당
 * - 로그인 성공 후 동작(onSuccess)은 AuthContext의 openLoginGate(callback)로 위임
 */
export function LoginGate() {
  const { state, actions } = useAuth()
  const isOpen = !!state.loginGate?.open
  const redirectTo = state.loginGate?.redirectTo ?? null

  if (!isOpen) return null

  const handleClose = () => {
    actions.closeLoginGate()
  }

  const handleLogin = () => {
    actions.login({ redirectTo })
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      {/* 오버레이 */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={handleClose} />

      {/* 모달 내용 */}
      <div className="relative z-10 bg-card border-2 border-primary/50 rounded-xl shadow-2xl p-8 max-w-sm mx-4 text-center animate-in fade-in zoom-in duration-200">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
          <LogIn className="w-8 h-8 text-primary" />
        </div>

        <h3 className="text-xl font-bold mb-2">로그인이 필요합니다</h3>
        <p className="text-muted-foreground mb-6">
          이 기능을 사용하려면 로그인이 필요합니다.
        </p>

        <div className="flex flex-col gap-3">
          <Button variant="neon" size="lg" className="w-full" onClick={handleLogin}>
            구글 로그인
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground"
            onClick={handleClose}
          >
            닫기
          </Button>
        </div>
      </div>
    </div>
  )
}

export default LoginGate

