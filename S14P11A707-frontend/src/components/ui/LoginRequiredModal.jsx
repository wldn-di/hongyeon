import React, { useEffect, useState } from 'react'
import { useLocation } from 'wouter'
import { Button } from '@/components/ui/Button'
import { LogIn, User } from 'lucide-react'

/**
 * 로그인 필요 안내 모달
 * 인증이 필요한 API 호출 시 자동으로 표시됨
 */

// 전역 상태 관리
let setModalVisible = null

export function LoginRequiredModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [, setLocation] = useLocation()

  useEffect(() => {
    setModalVisible = (visible) => {
      setIsOpen(visible)
    }
    return () => {
      setModalVisible = null
    }
  }, [])

  const handleClose = () => {
    setIsOpen(false)
  }

  const handleGoToProfile = () => {
    setIsOpen(false)
    setLocation('/profile')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      {/* 오버레이 - 클릭 차단 */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={handleClose} />

      {/* 모달 내용 */}
      <div className="relative z-10 bg-card border-2 border-primary/50 rounded-xl shadow-2xl p-8 max-w-sm mx-4 text-center animate-in fade-in zoom-in duration-200">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
          <LogIn className="w-8 h-8 text-primary" />
        </div>

        <h3 className="text-xl font-bold mb-2">로그인이 필요합니다</h3>
        <p className="text-muted-foreground mb-6">
          이 기능을 사용하려면 로그인이 필요합니다.<br />
          <span className="text-sm">내 페이지에서 간편하게 로그인하세요.</span>
        </p>

        <div className="flex flex-col gap-3">
          <Button
            variant="neon"
            size="lg"
            className="w-full"
            onClick={handleGoToProfile}
          >
            <User className="w-4 h-4 mr-2" />
            로그인하러 가기
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

/**
 * 로그인 필요 모달 표시 함수
 */
export const showLoginRequired = () => {
  if (setModalVisible) {
    setModalVisible(true)
  }
}

export default LoginRequiredModal