import React from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Modal - 모든 모달의 기본 구조
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - 모달 표시 여부
 * @param {Function} props.onClose - 닫기 콜백
 * @param {string} [props.title] - 모달 제목
 * @param {React.ReactNode} props.children - 모달 본문
 * @param {React.ReactNode} [props.footer] - 모달 푸터 (버튼 등)
 * @param {string} [props.size='md'] - 모달 크기 ('sm' | 'md' | 'lg' | 'xl' | 'full')
 * @param {boolean} [props.closeOnBackdrop=true] - 배경 클릭 시 닫기
 */
export function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  footer, 
  size = 'md',
  closeOnBackdrop = true 
}) {
  if (!isOpen) return null

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-7xl'
  }

  const handleBackdropClick = (e) => {
    if (closeOnBackdrop && e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className={cn(
        "bg-card border border-border rounded-xl w-full overflow-hidden flex flex-col",
        sizeClasses[size]
      )}>
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-xl font-bold gold-glow">{title}</h2>
            <button 
              onClick={onClose} 
              className="p-1 hover:bg-muted rounded transition-colors"
              aria-label="닫기"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="p-4 border-t border-border flex justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
