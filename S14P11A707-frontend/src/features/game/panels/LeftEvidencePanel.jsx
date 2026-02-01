import React, { useMemo, useState, useRef } from "react"
import { Search, Plus, Users, MapPin, X } from "lucide-react"
import { cn } from "@/lib/utils"

// 호버 툴팁 컴포넌트 (튜토리얼 스타일 그대로)
function HoverTooltip({ item, type, position = "right" }) {
  if (!item) return null

  const typeConfig = {
    evidence: { label: "증거", color: "bg-blue-500" },
    suspect: { label: "용의자", color: "bg-amber-500" },
    location: { label: "장소", color: "bg-green-500" },
  }
  const config = typeConfig[type] || typeConfig.evidence

  return (
    <div
      className={cn(
        "absolute w-64 bg-gray-900 border border-gray-700 rounded-lg shadow-xl p-3 pointer-events-none animate-in fade-in duration-150",
        position === "right" ? "left-full ml-3 top-0" : "right-full mr-3 top-0"
      )}
      style={{ zIndex: 100 }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className={cn("px-2 py-0.5 text-xs font-bold text-white rounded", config.color)}>
          {config.label}
        </span>
        <span className="font-bold text-sm text-white">{item.name}</span>
      </div>

      {type === "evidence" && (
        <div className="text-xs text-gray-300">
          <p className="mb-1">발견장소: {item.floorNumber ? `${item.floorNumber}층` : item.location}</p>
          {item.description && <p className="whitespace-pre-line">{item.description}</p>}
        </div>
      )}

      {type === "suspect" && (
        <div className="text-xs space-y-1 text-gray-300">
          <p>역할: {item.role || item.occupation}</p>
          {item.age && <p>나이: {item.age}세</p>}
          {item.oneLiner && <p className="italic">"{item.oneLiner}"</p>}
        </div>
      )}

      {type === "location" && (
        <div className="text-xs text-gray-300">
          <p>층: {item.floorNumber || item.floor}층</p>
          <p>장소명: {item.name}</p>
          {item.description && <p className="mt-1">{item.description}</p>}
        </div>
      )}
    </div>
  )
}

// 왼쪽 패널 (증거 목록)
export default function LeftEvidencePanel({
  isOpen,
  onToggle,
  evidence = [],
  suspects = [],
  rooms = [],
  onItemClick,
  onDragStart,
  onAddToBoard,
}) {
  const [activeTab, setActiveTab] = useState("evidence") // 'evidence' | 'suspect' | 'location'
  const [hoveredItem, setHoveredItem] = useState(null) // 호버된 아이템 ID
  const hoverTimeoutRef = useRef(null)

  const tabs = useMemo(() => ([
    { key: "evidence", label: "증거", icon: Search },
    { key: "suspect", label: "용의자", icon: Users },
    { key: "location", label: "장소", icon: MapPin },
  ]), [])

  const itemsByTab = useMemo(() => ({
    evidence: evidence ?? [],
    suspect: suspects ?? [],
    location: rooms ?? [],
  }), [evidence, suspects, rooms])

  const currentItems = itemsByTab[activeTab] ?? []

  const handleItemClick = (item, type) => {
    onItemClick?.(item, type)
  }

  const handleAddToBoard = (item, type) => {
    onAddToBoard?.(item, type)
  }

  return (
    <>
      <div
        className={cn(
          "fixed top-16 left-0 h-[calc(100%-64px)] bg-card/95 backdrop-blur border-r border-border transition-all duration-300 z-40 w-72 flex flex-col",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-4 border-b border-border flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-bold flex items-center gap-2">
              <Search className="w-5 h-5 text-primary" />
              조사 팔레트
              <span className="text-xs text-muted-foreground">({currentItems.length})</span>
            </h3>
            <div className="mt-3 flex gap-2">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.key
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold border transition-colors",
                      isActive
                        ? "bg-primary/20 border-primary/40 text-primary"
                        : "bg-muted/30 border-border text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                )
              })}
            </div>
          </div>
          <button onClick={onToggle} className="p-1 hover:bg-muted rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 p-3 space-y-2 overflow-y-auto">
          {currentItems.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {activeTab === "evidence" && (
                <>
                  아직 발견한 증거가 없습니다.<br />
                  현장을 탐색해보세요!
                </>
              )}
              {activeTab === "suspect" && "표시할 용의자가 없습니다."}
              {activeTab === "location" && "표시할 장소가 없습니다."}
            </p>
          ) : (
            currentItems.map((item) => (
              <div
                key={item.id}
                draggable
                onDragStart={(e) => onDragStart?.(e, item, activeTab)}
                className="bg-muted/30 border border-border rounded-lg p-3 transition-all relative cursor-grab active:cursor-grabbing group"
                onMouseEnter={() => {
                  if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
                  hoverTimeoutRef.current = setTimeout(() => {
                    setHoveredItem(item.id)
                  }, 1000) // 1초 딜레이
                }}
                onMouseLeave={() => {
                  if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
                  setHoveredItem(null)
                }}
              >
                {/* 호버 툴팁 (1초 딜레이 후 표시) */}
                {hoveredItem === item.id && (
                  <HoverTooltip item={item} type={activeTab} position="right" />
                )}

                <div
                  onClick={() => handleItemClick(item, activeTab)}
                  className="flex items-start gap-3 cursor-pointer hover:opacity-80"
                >
                  <div className="w-12 h-12 rounded bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : activeTab === "suspect" ? (
                      <Users className="w-5 h-5 text-muted-foreground" />
                    ) : activeTab === "location" ? (
                      <MapPin className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <Search className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm">{item.name}</p>
                    {activeTab === "evidence" && (
                      <p className="text-xs text-muted-foreground">
                        {item.floorNumber ? `${item.floorNumber}층` : item.location}
                      </p>
                    )}
                    {activeTab === "suspect" && (item.role || item.occupation) && (
                      <p className="text-xs text-muted-foreground">{item.role || item.occupation}</p>
                    )}
                    {activeTab === "location" && (
                      <p className="text-xs text-muted-foreground">
                        {item.floorNumber ? `${item.floorNumber}층` : "사건 장소"}
                      </p>
                    )}
                    {activeTab === "evidence" && item.storyHint && (
                      <p className="text-xs text-primary mt-1 italic line-clamp-1">💡 {item.storyHint}</p>
                    )}
                    {activeTab === "suspect" && item.oneLiner && (
                      <p className="text-xs text-amber-400/80 mt-1 italic line-clamp-1">"{item.oneLiner}"</p>
                    )}
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t border-border/50">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleAddToBoard(item, activeTab) }}
                    className="text-xs bg-primary/20 text-primary px-2 py-1 rounded hover:bg-primary/30 transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> 보드에 추가
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {!isOpen && (
        <button
          onClick={onToggle}
          className="fixed top-1/2 -translate-y-1/2 left-0 z-40 w-10 h-24 bg-card border border-border border-l-0 rounded-r-lg flex items-center justify-center hover:bg-muted/50"
        >
          <Search className="w-5 h-5" />
        </button>
      )}
    </>
  )
}
