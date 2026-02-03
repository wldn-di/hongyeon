import React from 'react'
import { cn } from '@/lib/utils'

/**
 * BoardItemHoverDetail
 * - 개인추리보드/팔레트 hover 상세정보 UI 공용 컴포넌트
 * - 스타일은 InvestigationBoard의 기존 툴팁 UI를 그대로 재사용
 */
export function BoardItemHoverDetail({ item, type, position = 'right' }) {
  if (!item) return null

  const resolvedType = type || item.type || 'note'

  // InvestigationBoard 타입별 색상 및 라벨 그대로
  const typeConfig = {
    victim: { label: '피해자', color: 'bg-red-500' },
    suspect: { label: '용의자', color: 'bg-amber-500' },
    evidence: { label: '증거', color: 'bg-blue-500' },
    location: { label: '장소', color: 'bg-green-500' },
    note: { label: '메모', color: 'bg-gray-500' },
  }

  const config = typeConfig[resolvedType] || typeConfig.note

  return (
    <div
      className={cn(
        'absolute w-64 bg-gray-900 border border-gray-700 rounded-lg shadow-xl p-3 pointer-events-none animate-in fade-in duration-150',
        position === 'right' ? 'left-full ml-3 top-0' : 'right-full mr-3 top-0',
      )}
      style={{ zIndex: 100 }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className={cn('px-2 py-0.5 text-xs font-bold text-white rounded', config.color)}>
          {config.label}
        </span>
        <span className="font-bold text-sm text-white">{item.name}</span>
      </div>

      {resolvedType === 'victim' && (
        <div className="text-xs space-y-1 text-gray-300">
          {item.occupation && <p>직업: {item.occupation}</p>}
          {item.note && <p>특징: {item.note}</p>}
        </div>
      )}

      {resolvedType === 'suspect' && (
        <div className="text-xs space-y-1 text-gray-300">
          {item.role && <p>정보: {item.role}</p>}
          {item.note && <p className="italic">"{item.note}"</p>}
        </div>
      )}

      {resolvedType === 'evidence' && (
        <div className="text-xs text-gray-300">
          {item.note && <p className="whitespace-pre-line">{item.note}</p>}
        </div>
      )}

      {resolvedType === 'location' && (
        <div className="text-xs text-gray-300">
          {item.floorNumber && <p>층: {item.floorNumber}층</p>}
          <p>장소명: {item.name}</p>
          {item.note && <p className="mt-1">{item.note}</p>}
        </div>
      )}
    </div>
  )
}

export default BoardItemHoverDetail
