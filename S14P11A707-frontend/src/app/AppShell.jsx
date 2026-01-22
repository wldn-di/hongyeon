import React from 'react'
import { useLocation } from 'wouter'
import { AppRoutes } from './routes'
import { Header } from "@/components/layout/Header"

/**
 * AppShell - 앱의 최상위 컴포넌트
 * Header를 한 번만 렌더링하고, 페이지 라우팅을 관리합니다.
 */
export function AppShell() {
  const [location] = useLocation()
  
  // 게임 플레이 화면에서는 헤더 숨기기
  const hideHeader = location.startsWith('/room/')
  
  return (
    <div className="dark">
      {!hideHeader && <Header />}
      <AppRoutes />
    </div>
  )
}
