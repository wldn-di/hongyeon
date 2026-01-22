import React from "react"
import { useState, useEffect, useRef } from "react"
import { Search, X, Edit3, StickyNote, DoorOpen } from "lucide-react"
import { cn } from "@/lib/utils"

// 증거 목록 드래그앤드롭 컴포넌트
export default function DroppedItem({ item, onRemove, onEdit, onDrag }) {
  const isEvidence = item.type === 'evidence'
  const isMemo = item.type === 'memo'
  const itemRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  const handleMouseDown = (e) => {
    if (e.target.closest('button')) return
    setIsDragging(true)
    const rect = itemRef.current.getBoundingClientRect()
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })
  }

  const handleMouseMove = (e) => {
    if (!isDragging) return
    const newX = e.clientX - dragOffset.x
    const newY = e.clientY - dragOffset.y
    onDrag(item.id, newX, newY)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, dragOffset])

  return (
    <div
      ref={itemRef}
      onMouseDown={handleMouseDown}
      className={cn(
        "absolute p-2 rounded-lg shadow-lg group select-none",
        isEvidence && "bg-card/90 border border-primary/50 w-32 cursor-move",
        isMemo && "bg-yellow-400 border border-yellow-600 w-44 cursor-move",
        isDragging && "opacity-80 z-50"
      )}
      style={{ left: item.x, top: item.y }}
    >
      <button
        onClick={() => onRemove(item.id)}
        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
      >
        <X className="w-3 h-3 text-white" />
      </button>

      {isEvidence && (
        <>
          <div className="w-full h-16 bg-muted rounded mb-1 flex items-center justify-center overflow-hidden">
            {item.data.image ? (
              <img src={item.data.image} alt={item.data.name} className="w-full h-full object-cover" />
            ) : (
              <Search className="w-6 h-6 text-muted-foreground" />
            )}
          </div>
          <p className="text-xs font-bold text-center truncate">{item.data.name}</p>
        </>
      )}

      {isMemo && (
        <>
          <button
            onClick={() => onEdit(item)}
            className="absolute top-1 right-1 w-5 h-5 bg-yellow-600/50 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Edit3 className="w-3 h-3 text-yellow-900" />
          </button>
          <div className="flex items-start gap-1 pr-5">
            <StickyNote className="w-4 h-4 text-yellow-800 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-yellow-900 line-clamp-4 font-medium">{item.data.text}</p>
          </div>
        </>
      )}
    </div>
  )
}