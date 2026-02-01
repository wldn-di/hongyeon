import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { LogIn, X } from 'lucide-react'

/**
 * 로그인 필요 모달
 * 인증이 필요한 API 호출 시 자동으로 표시됨
 */

// 전역 상태 관리
let setModalVisible = null
let redirectUrl = null

export function LoginRequiredModal() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    setModalVisible = (visible, url = null) => {
      setIsOpen(visible)
      redirectUrl = url
    }
    return () => {
      setModalVisible = null
    }
  }, [])

  const handleLogin = () => {
    // 현재 URL을 저장하고 로그인 페이지로 이동
    const currentPath = window.location.pathname + window.location.search
    sessionStorage.setItem('redirectAfterLogin', currentPath)
    window.location.href = '/login'
  }

  const handleClose = () => {
    setIsOpen(false)
    // 홈으로 이동
    window.location.href = '/'
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      {/* 오버레이 - 클릭 차단 */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      {/* 모달 내용 */}
      <div className="relative z-10 bg-card border-2 border-primary/50 rounded-xl shadow-2xl p-8 max-w-sm mx-4 text-center animate-in fade-in zoom-in duration-200">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
          <LogIn className="w-8 h-8 text-primary" />
        </div>

        <h3 className="text-xl font-bold mb-2">로그인이 필요합니다</h3>
        <p className="text-muted-foreground mb-6">
          이 기능을 사용하려면 로그인이 필요합니다.
        </p>

        <div className="space-y-3">
          <Button
            variant="neon"
            size="lg"
            className="w-full"
            onClick={handleLogin}
          >
            <LogIn className="w-5 h-5 mr-2" />
            로그인하러 가기
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={handleClose}
          >
            홈으로 돌아가기
          </Button>
        </div>
      </div>
    </div>
  )
}

/**
 * 로그인 필요 모달 표시 함수
 */
export const showLoginRequired = () => {
  if (setModalVisible) {
    setModalVisible(true)
  } else {
    // fallback: 직접 리다이렉트
    window.location.href = '/login'
  }
}

export default LoginRequiredModal