import React, { useState, useRef, useMemo, useEffect } from 'react'
import { useLocation } from 'wouter'
import { Button } from '@/components/ui/Button'
import { InlineEdit } from './InlineEdit'
import { Camera, Check, X, ChevronDown, ChevronUp, LogOut } from 'lucide-react'
import { alertSuccess } from '@/components/ui/AlertModal'

/**
 * ProfileCard - 프로필 정보 카드
 * 
 * @param {Object} props
 * @param {Object} props.user - 사용자 정보
 * @param {Function} props.onUpdateProfile - 프로필 업데이트 콜백
 * @param {Function} props.onLogout - 로그아웃 콜백
 */
export function ProfileCard({ user, onUpdateProfile, onLogout }) {
  const [, setLocation] = useLocation()
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false)
  const [draftUrl, setDraftUrl] = useState('')
  
  // avatar
  const fileRef = useRef(null)
  const [localPreview, setLocalPreview] = useState('')

  useEffect(() => {
    if (!user) return
    setDraftUrl(user.picture ?? '')
    setLocalPreview('')
  }, [user])

  const displayPicture = useMemo(() => {
    return localPreview || user?.picture || '/images/suspects/suspect1.png'
  }, [localPreview, user])

  const onPickAvatar = () => fileRef.current?.click()

  const onAvatarChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setLocalPreview(url)
  }

  const saveUrlFromAdvanced = () => {
    const url = draftUrl.trim()
    onUpdateProfile({ picture: url })
    alertSuccess('프로필 이미지가 변경되었습니다. (고급 옵션)')
  }

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
        <div className="hidden md:block text-xs text-muted-foreground mono">
          [UPDATED] {user.updated_at ?? '-'}
        </div>
      </div>

      {/* Profile Card */}
      <div className="rounded-2xl border border-border bg-card/40 p-6 relative overflow-hidden">
        <div className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full bg-primary/15 blur-3xl" />

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          {/* Left: Avatar + name */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                onClick={onPickAvatar}
                className="rounded-full focus:outline-none focus:ring-2 focus:ring-primary/50"
                aria-label="프로필 사진 변경"
                title="프로필 사진 변경"
              >
                <img
                  src={displayPicture}
                  alt="profile"
                  className="w-16 h-16 rounded-full object-cover border border-border bg-black/20"
                  referrerPolicy="no-referrer"
                />
              </button>

              <button
                onClick={onPickAvatar}
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full border border-border bg-black/50 hover:bg-black/70 transition flex items-center justify-center"
                aria-label="프로필 사진 선택"
                title="사진 선택"
              >
                <Camera className="w-4 h-4 text-primary" />
              </button>

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onAvatarChange}
              />
            </div>

            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">NICKNAME</p>
              
              <InlineEdit 
                value={user.nickname}
                onSave={handleSaveName}
                placeholder="2글자 이상"
                minLength={2}
                label="닉네임"
              />

              <p className="mt-1 text-sm text-muted-foreground truncate">{user.email ?? '-'}</p>
              <p className="mt-2 text-xs text-muted-foreground mono">UID: {user.user_id ?? '-'}</p>

              {localPreview && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    새 사진 미리보기 상태입니다. 저장해야 적용됩니다.
                  </span>
                  <button
                    onClick={() => {
                      onUpdateProfile({ picture: localPreview })
                      setLocalPreview('')
                      alertSuccess('프로필 사진이 저장되었습니다.')
                    }}
                    className="h-9 px-3 rounded-xl border border-border bg-primary/20 hover:bg-primary/25 transition text-xs font-semibold inline-flex items-center gap-2"
                  >
                    <Check className="w-4 h-4 text-primary" />
                    사진 저장
                  </button>
                  <button
                    onClick={() => {
                      setLocalPreview('')
                      if (fileRef.current) fileRef.current.value = ''
                    }}
                    className="h-9 px-3 rounded-xl border border-border bg-black/20 hover:bg-black/30 transition text-xs inline-flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    취소
                  </button>
                </div>
              )}
            </div>
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
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <InfoItem label="가입일" value={user.created_at ?? '-'} />
          <InfoItem label="최근 수정" value={user.updated_at ?? '-'} />
          <InfoItem label="계정 상태" value="ACTIVE" />
        </div>

        {/* Advanced toggle (dev-only UI) */}
        <div className="mt-6">
          <button
            onClick={() => setIsAdvancedOpen((v) => !v)}
            className="w-full rounded-2xl border border-border bg-black/20 hover:bg-black/25 transition px-4 py-3 flex items-center justify-between"
          >
            <div className="text-left">
              <p className="text-sm font-bold">고급 옵션</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                (개발용) 이미지 URL 직접 지정
              </p>
            </div>
            {isAdvancedOpen ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            )}
          </button>

          {isAdvancedOpen && (
            <div className="mt-3 rounded-2xl border border-border bg-black/15 p-4">
              <label className="grid gap-1">
                <span className="text-xs text-muted-foreground">프로필 이미지 URL</span>
                <input
                  value={draftUrl}
                  onChange={(e) => setDraftUrl(e.target.value)}
                  className="h-11 rounded-xl border border-border bg-black/20 px-3 outline-none focus:border-primary/60"
                  placeholder="https://... 또는 /images/..."
                />
                <span className="text-xs text-muted-foreground">
                  실제 서비스에서는 "사진 업로드"로 대체될 예정입니다.
                </span>
              </label>

              <div className="mt-3 flex justify-end">
                <Button variant="outline" onClick={saveUrlFromAdvanced}>
                  URL로 적용
                </Button>
              </div>
            </div>
          )}
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
