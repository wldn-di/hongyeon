import React, { useState, useMemo } from 'react'
import { Button } from '@/components/ui/Button'
import { Check, Edit3, X } from 'lucide-react'
import { alertWarning } from '@/components/ui/AlertModal'

/**
 * InlineEdit - 인라인 편집 컴포넌트
 * 
 * @param {Object} props
 * @param {string} props.value - 현재 값
 * @param {Function} props.onSave - 저장 콜백
 * @param {string} [props.placeholder=''] - placeholder
 * @param {number} [props.minLength=2] - 최소 길이
 * @param {string} [props.label=''] - 라벨
 */
export function InlineEdit({ value, onSave, placeholder = '', minLength = 2, label = '' }) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  const canSave = useMemo(() => draft.trim().length >= minLength, [draft, minLength])

  const beginEdit = () => {
    setDraft(value)
    setIsEditing(true)
  }

  const cancelEdit = () => {
    setDraft(value)
    setIsEditing(false)
  }

  const save = () => {
    if (!canSave) {
      alertWarning(`${label}은(는) ${minLength}글자 이상이어야 합니다.`)
      return
    }
    onSave(draft.trim())
    setIsEditing(false)
  }

  if (!isEditing) {
    return (
      <div className="flex items-center gap-2">
        <p className="text-2xl font-extrabold truncate">{value}</p>
        <button
          onClick={beginEdit}
          className="h-8 px-2 rounded-xl border border-border bg-black/20 hover:bg-black/30 transition inline-flex items-center gap-2"
          aria-label={`${label} 수정`}
          title={`${label} 수정`}
        >
          <Edit3 className="w-4 h-4 text-primary" />
          <span className="hidden sm:inline text-xs text-muted-foreground">수정</span>
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') save()
          if (e.key === 'Escape') cancelEdit()
        }}
        className="h-10 w-[220px] max-w-[60vw] rounded-xl border border-border bg-black/20 px-3 outline-none focus:border-primary/60"
        placeholder={placeholder}
        autoFocus
      />
      <button
        onClick={save}
        disabled={!canSave}
        className={`h-10 px-3 rounded-xl border border-border transition inline-flex items-center gap-2 ${
          canSave ? 'bg-primary/20 hover:bg-primary/25' : 'bg-black/20 opacity-50 cursor-not-allowed'
        }`}
        aria-label="저장"
        title="저장"
      >
        <Check className="w-4 h-4 text-primary" />
        <span className="hidden sm:inline text-xs">저장</span>
      </button>
      <button
        onClick={cancelEdit}
        className="h-10 px-3 rounded-xl border border-border bg-black/20 hover:bg-black/30 transition inline-flex items-center gap-2"
        aria-label="취소"
        title="취소"
      >
        <X className="w-4 h-4" />
        <span className="hidden sm:inline text-xs">취소</span>
      </button>
    </div>
  )
}
