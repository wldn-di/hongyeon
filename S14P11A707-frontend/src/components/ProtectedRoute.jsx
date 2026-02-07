import React from 'react'
import { Redirect } from 'wouter'
import { useAuth } from '../contexts/AuthContext'
import { ROUTES, POST_LOGIN_REDIRECT_KEY } from '../app/routePaths'

/**
 * 인증이 필요한 라우트를 보호하는 컴포넌트
 *
 * 사용법:
 * <ProtectedRoute component={MyPage} />
 *
 * 동작:
 * - 로딩 중: 로딩 스피너 표시
 * - 미인증: /me (프로필/로그인) 페이지로 리다이렉트
 * - 인증됨: 자식 컴포넌트 렌더링
 */
export default function ProtectedRoute({ component: Component, ...rest }) {
  const { state } = useAuth()
  const { user, loading } = state

  // 인증 상태 로딩 중
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600" />
      </div>
    )
  }

  // 미인증 상태 → 프로필(로그인) 페이지로 리다이렉트
  if (!user) {
    try {
      const currentPath =
        window.location.pathname + window.location.search + window.location.hash

      if (currentPath && currentPath !== ROUTES.PROFILE) {
        window.sessionStorage.setItem(POST_LOGIN_REDIRECT_KEY, currentPath)
      }
    } catch {
      // ignore
    }
    return <Redirect to={ROUTES.PROFILE} />
  }

  // 인증됨 → 컴포넌트 렌더링
  return <Component {...rest} />
}
