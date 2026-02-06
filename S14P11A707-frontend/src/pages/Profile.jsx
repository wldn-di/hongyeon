import React from 'react'
import { PageLayout } from '@/components/layout/PageLayout'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/contexts/AuthContext'
import { ProfileCard } from '@/features/auth/components/ProfileCard'

/**
 * Profile - 프로필 페이지 (리팩토링 버전)
 * ProfileCard와 DangerZone 컴포넌트를 조립만 함(DangerZone은 회원탈퇴를 위한 페이지라 현재는 조립X)
 */
export default function Profile() {
  const { state, actions } = useAuth()
  const user = state.user // 로그인 정보
  const authLoading = state.loading

  if (authLoading) {
    return (
      <PageLayout>
        <div className="container mx-auto px-4 py-12">
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-muted-foreground">로그인 상태를 확인하는 중...</p>
            </div>
          </div>
        </div>
      </PageLayout>
    )
  }

  if (!user) {
    return (
      <PageLayout>
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-xl">
            <h1 className="text-3xl font-extrabold tracking-tight">내 페이지</h1>
            <p className="mt-2 text-muted-foreground">로그인이 필요합니다.</p>
            <div className="mt-6">
              <Button
                variant="outline"
                className="neon-border-cyan"
                onClick={() => actions.openLoginGate(null, { redirectTo: '/me' })}
              >
                구글 로그인
              </Button>
            </div>
          </div>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-10">
        <ProfileCard 
          user={user} //표시
          onUpdateProfile={actions.updateProfile} //수정
          onLogout={actions.logout} //로그아웃
        />
      </div>
    </PageLayout>
  )
}
