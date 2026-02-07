import React from 'react'
import { Button } from '@/components/ui/Button'
import { LogIn } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

/**
 * 전역 로그인 게이트 (모달)
 * 페이지 이동 없이 로그인 UI를 표시하고,
 * 로그인 성공 시 원래 URL을 유지한다.
 */

// axios interceptor 등 React 외부에서 호출하기 위한 전역 함수
let _openGate = null

export function openLoginGateGlobal(redirectTo) {
  if (_openGate) _openGate(redirectTo)
}

export function LoginGate() {
  const { state, actions } = useAuth()
  const { open } = state.loginGate

  // 전역 함수 바인딩
  React.useEffect(() => {
    _openGate = (redirectTo) => actions.openLoginGate(redirectTo)
    return () => { _openGate = null }
  }, [actions])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      {/* 오버레이 */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={() => actions.closeLoginGate()}
      />

      {/* 모달 */}
      <div className="relative z-10 bg-card border-2 border-primary/50 rounded-xl shadow-2xl p-8 max-w-sm mx-4 text-center animate-in fade-in zoom-in duration-200">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
          <LogIn className="w-8 h-8 text-primary" />
        </div>

        <h3 className="text-xl font-bold mb-2">로그인이 필요합니다</h3>
        <p className="text-muted-foreground mb-6">
          이 기능을 사용하려면 로그인이 필요합니다.<br />
          <span className="text-sm">구글 계정으로 간편하게 로그인하세요.</span>
        </p>

        <div className="flex flex-col gap-3">
          <Button
            variant="neon"
            size="lg"
            className="w-full"
            onClick={() => actions.login()}
          >
            <LogIn className="w-4 h-4 mr-2" />
            구글 로그인
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground"
            onClick={() => actions.closeLoginGate()}
          >
            닫기
          </Button>
        </div>
      </div>
    </div>
  )
}

export default LoginGate
