import React from 'react'
import { Button } from '@/components/ui/Button'
import { ShieldAlert } from 'lucide-react'
import { alertError, alertSuccess } from '@/components/ui/AlertModal'
import { showConfirm } from '@/components/ui/ConfirmModal'

/**
 * DangerZone - 회원탈퇴 등 위험한 작업 섹션
 * 
 * @param {Object} props
 * @param {Function} props.onDeleteAccount - 탈퇴 콜백
 */
export function DangerZone({ onDeleteAccount }) {
  const handleDelete = async () => {
    const ok = await showConfirm({
      title: '회원탈퇴',
      message: '정말 회원탈퇴 하시겠습니까?',
      confirmText: '탈퇴',
      cancelText: '취소',
      tone: 'destructive',
    })
    if (!ok) return
    
    try {
      await onDeleteAccount()
      alertSuccess('탈퇴 처리되었습니다.')
    } catch (error) {
      alertError('회원탈퇴 실패. 서버 상태를 확인해주세요.')
    }
  }

  return (
    <div className="mt-10 rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold inline-flex items-center gap-2">
            <ShieldAlert className="w-5 h-5" /> 회원탈퇴
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            탈퇴 시 계정이 삭제됩니다. (되돌릴 수 없음)
          </p>
        </div>
        <span className="text-xs text-red-200/80 mono">DANGER</span>
      </div>

      <div className="mt-4 flex justify-end">
        <Button className="bg-red-600 hover:bg-red-700" onClick={handleDelete}>
          회원탈퇴
        </Button>
      </div>
    </div>
  )
}
