import React from 'react'
import { useLocation } from 'wouter'
import { Button } from '@/components/ui/Button'
import { InlineEdit } from './InlineEdit'
import { LogOut } from 'lucide-react'

/**
 * ProfileCard - 프로필 정보 카드 (사진 기능 제거 버전)
 *
 * @param {Object} props
 * @param {Object} props.user - 사용자 정보
 * @param {Function} props.onUpdateProfile - 프로필 업데이트 콜백
 * @param {Function} props.onLogout - 로그아웃 콜백
 */
export function ProfileCard({ user, onUpdateProfile, onLogout }) {
  const [, setLocation] = useLocation()

  const handleSaveName = (newName) => {
    onUpdateProfile({ nickname: newName })
  }

  return (
    <div>
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">내 페이지</h1>
          <p className="mt-1 text-sm text-muted-foreground">프로필과 계정 정보를 관리합니다.</p>
        </div>
      </div>

      {/* Profile Card */}
      <div className="rounded-2xl border border-border bg-card/40 p-6 relative overflow-hidden">
        <div className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full bg-primary/15 blur-3xl" />

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          {/* Left: Name + account */}
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">NICKNAME</p>

            <InlineEdit
              value={user?.nickname}
              onSave={handleSaveName}
              placeholder="2글자 이상"
              minLength={2}
              label="닉네임"
            />

            <p className="mt-1 text-sm text-muted-foreground truncate">{user?.email ?? '-'}</p>
            <p className="mt-2 text-xs text-muted-foreground mono">UID: {user?.user_id ?? '-'}</p>
          </div>

          {/* Right: actions */}
          <div className="flex flex-wrap gap-2 justify-end">
            <Button variant="outline" onClick={() => setLocation('/')}>
              홈으로
            </Button>
            <Button variant="ghost" onClick={onLogout} title="로그아웃">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Info Grid */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <InfoItem label="최근 수정" value={user?.updated_at ?? '-'} />
          <InfoItem label="계정 상태" value="ACTIVE" />
        </div>
      </div>
    </div>
  )
}

function InfoItem({ label, value }) {
  return (
    <div className="rounded-xl border border-border bg-black/20 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  )
}
