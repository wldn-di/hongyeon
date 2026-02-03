import React, { useCallback, useEffect, useRef, useState } from 'react'
import { HelpCircle, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

/**
 * 전역 Confirm 모달
 * - window.confirm 대체용 (Promise 기반)
 * - 여러 호출 시 큐로 순차 처리
 */

let confirmQueue = []
let setConfirmState = null

export function ConfirmModal() {
  const [request, setRequest] = useState(null)
  const [isOpen, setIsOpen] = useState(false)

  const isOpenRef = useRef(isOpen)
  const requestRef = useRef(request)

  useEffect(() => {
    isOpenRef.current = isOpen
  }, [isOpen])

  useEffect(() => {
    requestRef.current = request
  }, [request])

  const processQueue = useCallback(() => {
    if (confirmQueue.length === 0) return
    if (isOpenRef.current) return
    const next = confirmQueue.shift()
    setRequest(next)
    setIsOpen(true)
  }, [])

  const closeWith = useCallback(
    (value) => {
      const current = requestRef.current
      if (!current) return
      setIsOpen(false)
      current.resolve?.(value)
      setTimeout(() => {
        setRequest(null)
        processQueue()
      }, 150)
    },
    [processQueue]
  )

  useEffect(() => {
    setConfirmState = () => processQueue()
    processQueue()
    return () => {
      setConfirmState = null
    }
  }, [processQueue])

  useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (e) => {
      if (e.key === 'Escape') closeWith(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen, closeWith])

  if (!request) return null

  const tone = request.tone || 'default' // 'default' | 'destructive'
  const title = request.title || '확인'
  const message = request.message || ''
  const description = request.description || ''
  const confirmText = request.confirmText || '확인'
  const cancelText = request.cancelText || '취소'
  const closeOnOverlayClick = request.closeOnOverlayClick !== false

  const headerClassName =
    tone === 'destructive'
      ? 'bg-red-500/10 border-red-500/30'
      : 'bg-primary/10 border-primary/30'

  const icon =
    tone === 'destructive' ? (
      <AlertTriangle className="w-5 h-5 text-red-400" />
    ) : (
      <HelpCircle className="w-5 h-5 text-primary" />
    )

  return (
    <div
      className={cn(
        'fixed inset-0 z-[210] flex items-center justify-center transition-opacity duration-200',
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      )}
    >
      {/* 오버레이 */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={() => {
          if (closeOnOverlayClick) closeWith(false)
        }}
      />

      {/* 모달 */}
      <div className="relative z-10 bg-card border border-border rounded-xl shadow-2xl max-w-sm w-full mx-4 overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className={cn('px-6 py-4 border-b', headerClassName)}>
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center',
                tone === 'destructive' ? 'bg-red-500/15' : 'bg-primary/15'
              )}
            >
              {icon}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-lg truncate">{title}</h3>
              {description ? (
                <p className="text-sm text-muted-foreground truncate">{description}</p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="px-6 py-5">
          <p className="text-muted-foreground whitespace-pre-line">{message}</p>
        </div>

        <div className="px-6 py-4 bg-muted/20 border-t border-border flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => closeWith(false)}>
            {cancelText}
          </Button>
          <Button
            variant={tone === 'destructive' ? 'destructive' : 'neon'}
            className="flex-1"
            onClick={() => closeWith(true)}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  )
}

/**
 * confirm 표시 함수 (Promise<boolean>)
 * @param {string|Object} options - message 또는 옵션 객체
 */
export const showConfirm = (options) => {
  const normalized = typeof options === 'string' ? { message: options } : (options ?? {})

  if (typeof window === 'undefined') return Promise.resolve(false)

  return new Promise((resolve) => {
    confirmQueue.push({ ...normalized, resolve })
    setConfirmState?.()
  })
}

export default ConfirmModal
