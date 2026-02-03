import React, { useEffect, useRef, useState, useCallback } from 'react'
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * 전역 알림 모달 - toast 대신 화면 중앙에 표시
 * 다른 곳 클릭 불가능하게 오버레이 포함
 */

// 전역 상태 관리
let alertQueue = []
let setAlertState = null

export function AlertModal() {
  const [alert, setAlert] = useState(null)
  const [isVisible, setIsVisible] = useState(false)
  const isVisibleRef = useRef(isVisible)

  useEffect(() => {
    isVisibleRef.current = isVisible
  }, [isVisible])

  const processQueue = useCallback(() => {
    if (alertQueue.length > 0 && !isVisibleRef.current) {
      const nextAlert = alertQueue.shift()
      setAlert(nextAlert)
      setIsVisible(true)

      // 자동 닫기
      const duration = nextAlert.duration || 1500
      setTimeout(() => {
        setIsVisible(false)
        setTimeout(() => {
          setAlert(null)
          processQueue() // 다음 알림 처리
        }, 300)
      }, duration)
    }
  }, [])

  // 전역 상태 setter 등록
  useEffect(() => {
    setAlertState = processQueue
    return () => {
      setAlertState = null
    }
  }, [processQueue])

  useEffect(() => {
    processQueue()
  }, [processQueue])

  if (!alert) return null

  const iconMap = {
    error: <XCircle className="w-8 h-8 text-red-500" />,
    success: <CheckCircle className="w-8 h-8 text-green-500" />,
    warning: <AlertCircle className="w-8 h-8 text-amber-500" />,
    info: <Info className="w-8 h-8 text-blue-500" />,
  }

  const borderColorMap = {
    error: 'border-red-500/50',
    success: 'border-green-500/50',
    warning: 'border-amber-500/50',
    info: 'border-blue-500/50',
  }

  return (
    <div
      className={cn(
        "fixed inset-0 z-[200] flex items-center justify-center transition-opacity duration-300",
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
    >
      {/* 오버레이 - 클릭 차단 */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* 알림 내용 */}
      <div
        className={cn(
          "relative z-10 bg-card border-2 rounded-xl shadow-2xl p-6 max-w-sm mx-4 text-center",
          "animate-in fade-in zoom-in duration-200",
          borderColorMap[alert.type] || borderColorMap.info
        )}
      >
        <div className="flex flex-col items-center gap-3">
          {iconMap[alert.type] || iconMap.info}
          <p className="text-lg font-medium">{alert.message}</p>
        </div>
      </div>
    </div>
  )
}

/**
 * 알림 표시 함수
 * @param {string} type - 'error' | 'success' | 'warning' | 'info'
 * @param {string} message - 표시할 메시지
 * @param {number} duration - 표시 시간 (ms), 기본 1500ms
 */
export const showAlert = (type, message, duration = 1500) => {
  alertQueue.push({ type, message, duration })
  setAlertState?.()
}

// 편의 함수
export const alertError = (message, duration) => showAlert('error', message, duration)
export const alertSuccess = (message, duration) => showAlert('success', message, duration)
export const alertWarning = (message, duration) => showAlert('warning', message, duration)
export const alertInfo = (message, duration) => showAlert('info', message, duration)

export default AlertModal
