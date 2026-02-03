import React, { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/common/Modal'

// 전역 상태 관리 (AlertModal 패턴과 동일)
let confirmQueue = []
let setConfirmState = null

export function ConfirmModal() {
  const [confirm, setConfirm] = useState(null)
  const [isOpen, setIsOpen] = useState(false)

  const processQueue = useCallback(() => {
    if (isOpen) return
    if (confirmQueue.length === 0) return

    const next = confirmQueue.shift()
    setConfirm(next)
    setIsOpen(true)
  }, [isOpen])

  useEffect(() => {
    setConfirmState = (nextConfirm) => {
      if (!nextConfirm) return
      confirmQueue.push(nextConfirm)
      processQueue()
    }

    return () => {
      setConfirmState = null
    }
  }, [processQueue])

  useEffect(() => {
    processQueue()
  }, [processQueue])

  const resolve = useCallback(
    (result) => {
      if (!confirm) {
        setIsOpen(false)
        setConfirm(null)
        return
      }

      try {
        confirm.resolve(Boolean(result))
      } finally {
        setIsOpen(false)
        setConfirm(null)
        window.setTimeout(processQueue, 0)
      }
    },
    [confirm, processQueue],
  )

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') resolve(false)
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, resolve])

  if (!isOpen || !confirm) return null

  const title = confirm.title ?? '확인'
  const message = confirm.message ?? ''
  const confirmText = confirm.confirmText ?? '확인'
  const cancelText = confirm.cancelText ?? '취소'
  const confirmVariant = confirm.confirmVariant ?? 'neon'
  const cancelVariant = confirm.cancelVariant ?? 'outline'
  const closeOnBackdrop = confirm.closeOnBackdrop ?? true

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => resolve(false)}
      title={title}
      closeOnBackdrop={closeOnBackdrop}
      footer={
        <>
          <Button variant={cancelVariant} onClick={() => resolve(false)}>
            {cancelText}
          </Button>
          <Button variant={confirmVariant} onClick={() => resolve(true)}>
            {confirmText}
          </Button>
        </>
      }
    >
      <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
        {message}
      </p>
    </Modal>
  )
}

/**
 * Promise 기반 confirm 유틸
 * @returns {Promise<boolean>}
 */
export const confirmDialog = (options) => {
  const normalized = typeof options === 'string' ? { message: options } : (options || {})

  return new Promise((resolve) => {
    if (!setConfirmState) {
      console.warn('[ConfirmModal] ConfirmModal is not mounted; auto-cancel.', normalized)
      resolve(false)
      return
    }
    setConfirmState({ ...normalized, resolve })
  })
}

export default ConfirmModal
