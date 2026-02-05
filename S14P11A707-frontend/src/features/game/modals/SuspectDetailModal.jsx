import React, { useEffect } from "react"
import { Users, X } from "lucide-react"
import { Button } from "@/components/ui/Button"

export default function SuspectDetailModal({ suspect, onClose }) {
  useEffect(() => {
    if (!suspect) return

    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [suspect, onClose])

  if (!suspect) return null

  const imageUrl = suspect.image || suspect.portraitUrl || null
  const roleText = suspect.role || suspect.occupation || ""
  const noteText = suspect.note || suspect.oneLiner || ""

  return (
    <div data-board-safe-area="true" className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-gray-900 border border-gray-700 rounded-lg shadow-xl overflow-hidden">
        {/* 헤더 */}
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-xs font-bold text-white bg-amber-500 rounded">
              용의자
            </span>
            <h3 className="font-bold text-white">{suspect.name}</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-800 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          {/* 이미지 */}
        <div className="w-full aspect-[4/3] bg-gray-800 rounded-lg mb-4 overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl} alt={suspect.name} className="w-full h-full object-cover object-top"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Users className="w-12 h-12 text-gray-600" />
          </div>
        )}
      </div>


          {/* 정보 (보드 hover 툴팁과 동일 필드) */}
          <div className="text-sm space-y-2 text-gray-300">
            {roleText && <p>👤 정보: {roleText}</p>}
            {noteText ? (
              <p className="whitespace-pre-line italic">"{noteText}"</p>
            ) : (
              <p className="text-gray-500">설명이 없습니다.</p>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-gray-700">
          <Button variant="outline" className="w-full" onClick={onClose}>
            닫기
          </Button>
        </div>
      </div>
    </div>
  )
}
