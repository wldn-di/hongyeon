import React from 'react'
import { cn } from '@/lib/utils'

/**
 * PageLayout - 페이지 기본 레이아웃
 * Header와 Footer를 포함한 공통 페이지 구조 제공
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - 페이지 컨텐츠
 * @param {boolean} [props.showFooter=true] - 푸터 표시 여부
 * @param {string} [props.className] - 추가 클래스명
 */
export function PageLayout({ children, showFooter = true, className }) {
  return (
    <div className={cn("min-h-screen flex flex-col bg-background", className)}>
      <main className="flex-1">
        {children}
      </main>
      
      {showFooter && (
        <footer className="border-t border-border py-8 bg-card/30">
          <div className="container text-center">
            <p className="error-code">
             | HONG-YEON | COPYRIGHT_2026 |
            </p>
          </div>
        </footer>
      )}
    </div>
  )
}
