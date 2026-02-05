import React, { useEffect } from "react"
import { MapPin, X } from "lucide-react"
import { Button } from "@/components/ui/Button"

export default function LocationDetailModal({ location, onClose }) {
  useEffect(() => {
    if (!location) return

    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [location, onClose])

  if (!location) return null

  const imageUrl = location.image || null
  const floor = location.floorNumber ?? location.floor ?? location.id
  const noteText = location.note || location.description || ""

  return (
    <div
      data-board-safe-area="true"
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-gray-900 border border-gray-700 rounded-lg shadow-xl overflow-hidden">
        {/* 헤더 */}
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-xs font-bold text-white bg-green-500 rounded">
              장소
            </span>
            <h3 className="font-bold text-white">{location.name}</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-800 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          {/* 이미지 */}
          <div className="w-full aspect-[16/10] bg-gray-800 rounded-lg mb-4 overflow-hidden">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={location.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <MapPin className="w-12 h-12 text-gray-600" />
              </div>
            )}
          </div>

          {/* 정보 */}
          <div className="text-sm space-y-2 text-gray-300">
            {floor && <p>✔️ 위치: {floor}층</p>}

            {noteText ? (
              <div className="rounded-lg border border-white/10 bg-black/25 p-3">
                <div
                  className="
                    max-h-[28vh] md:max-h-[32vh]
                    overflow-y-auto pr-2
                    whitespace-pre-line break-words
                    text-[15px] text-gray-200 leading-6
                    scrollbar-dark
                  "
                >
                  {noteText}
                </div>
              </div>
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
