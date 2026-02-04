import React from 'react'
import { useLocation } from 'wouter'
import { Button } from '@/components/ui/Button'
import { PageLayout } from '@/components/layout/PageLayout'
import { useAuth } from '@/contexts/AuthContext'
import { ProfileCard } from '@/features/auth/components/ProfileCard'

/**
 * Profile - 프로필 페이지 (리팩토링 버전)
 * ProfileCard와 DangerZone 컴포넌트를 조립만 함(DangerZone은 회원탈퇴를 위한 페이지라 현재는 조립X)
 */
export default function Profile() {
  const { state, actions } = useAuth()
  const [, setLocation] = useLocation() 
  const user = state.user // 로그인 정보

  // 로그인 정보가 없으면 로그인 페이지로 이동
  if (!user) {
    return (
      <PageLayout>
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-xl">
            <h1 className="text-3xl font-extrabold tracking-tight">내 페이지</h1>
            <p className="mt-2 text-muted-foreground">로그인이 필요합니다.</p>
            <div className="mt-6">
              <Button variant="outline" className="neon-border-cyan" onClick={() => actions.login()}>
                구글 로그인
              </Button>
            </div>
          </div>
        </div>
      </PageLayout>
    )
  }

  //로그인 정보가 있으면 삭제 처리 함수 만들고, 정상 프로필 보여주기
  const handleDeleteAccount = async () => {
    const success = await actions.deleteAccount()
    if (success) setLocation('/')
    return success
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
