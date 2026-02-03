// src/features/game/panels/LeftEvidencePanel.jsx
import React, { useMemo, useState } from "react"
import { Search, Plus, Users, MapPin, X } from "lucide-react"
import { cn } from "@/lib/utils"

// 왼쪽 패널 (조사 팔레트)
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

  const getCardImageUrl = (item, type) => {
    if (!item) return null

    const candidates = [
      item.image,
      item.portraitUrl,
      item.imageUrl,
      item.detailImageUrl,
      item.thumbnail,
      item.thumbnailUrl,
    ].filter((v) => typeof v === "string" && v.trim().length > 0)

    if (candidates.length > 0) return candidates[0]

    // evidence는 이미지가 없을 때만 placeholder 이미지 사용
    if (type === "evidence") return "/images/evidence/fingerprint-card.png"

    return null
  }

  const tabs = useMemo(
    () => [
      { key: "evidence", label: "증거", icon: Search },
      { key: "suspect", label: "용의자", icon: Users },
      { key: "location", label: "장소", icon: MapPin },
    ],
    []
  )

  const itemsByTab = useMemo(
    () => ({
      evidence: evidence ?? [],
      suspect: suspects ?? [],
      location: rooms ?? [],
    }),
    [evidence, suspects, rooms]
  )

  const currentItems = itemsByTab[activeTab] ?? []

  const handleItemClick = (item) => {
    // 클릭 책임은 부모인 GameRoom이 총괄하도록 수정.
    onItemClick?.(item, activeTab)
  }

  const handleAddToBoard = (item) => {
    onAddToBoard?.(item, activeTab)
  }

  return (
    <>
      <div
        data-board-safe-area="true"
        className={cn(
          "fixed top-16 left-0 h-[calc(100%-64px)] bg-card/95 backdrop-blur border-r border-border transition-all duration-300 z-[90] w-72 flex flex-col",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
       <div className="relative p-4 border-b border-border">
  {/* X 버튼: 탭 레이아웃 밖으로 분리 (폭 안 뺏음) */}
  <button
    onClick={onToggle}
    className="absolute right-3 top-3 p-1 hover:bg-muted rounded"
    aria-label="닫기"
  >
    <X className="w-5 h-5" />
  </button>

  {/* 제목 */}
  <h3 className="font-bold flex items-center gap-2 pr-10">
    <Search className="w-5 h-5 text-primary" />
    조사 팔레트
    <span className="text-xs text-muted-foreground">({currentItems.length})</span>
  </h3>

  {/* 탭들 */}
  <div className="mt-3 flex gap-2 pr-10">
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
          <span className="whitespace-nowrap">{tab.label}</span>
        </button>
        )
        })}
        </div>
        </div>


        <div className="flex-1 p-3 space-y-2 overflow-y-auto">
          {currentItems.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {activeTab === "evidence" && (
                <>
                  아직 발견한 증거가 없습니다.
                  <br />
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
                className="relative select-none"
              >
                <div
                  onClick={() => handleItemClick(item)}
                  className={cn(
                    "flex min-h-[72px] items-center gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2.5",
                    "cursor-grab active:cursor-grabbing transition-colors hover:bg-muted/40"
                  )}
                >
                  {/* 썸네일 (LEFT) */}
                  <div className="w-12 h-12 rounded bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden border border-border/50">
                    {(() => {
                      const imageUrl = getCardImageUrl(item, activeTab)
                      if (imageUrl) {
                        return (
                          <img
                            src={imageUrl}
                            alt={item.name}
                            className="w-full h-full object-cover pointer-events-none select-none"
                            draggable={false}
                            onDragStart={(e) => e.preventDefault()}
                          />
                        )
                      }

                      const FallbackIcon =
                        activeTab === "suspect"
                          ? Users
                          : activeTab === "location"
                          ? MapPin
                          : Search

                      return <FallbackIcon className="w-5 h-5 text-muted-foreground" />
                    })()}
                  </div>

                  {/* 텍스트 (RIGHT) */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{item.name}</p>

                    {activeTab === "evidence" && (
                      <p className="text-xs text-muted-foreground truncate">
                        {item.floorNumber ? `${item.floorNumber}층` : item.location}
                      </p>
                    )}

                    {activeTab === "suspect" && (
                      <p className="text-xs text-muted-foreground truncate">
                        {item.role || item.occupation || "용의자"}
                      </p>
                    )}

                    {activeTab === "location" && (
                      <p className="text-xs text-muted-foreground truncate">
                        {item.floorNumber ? `${item.floorNumber}층` : "사건 장소"}
                      </p>
                    )}
                  </div>

                  {/* 보드 추가 버튼 (컴팩트) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleAddToBoard(item)
                    }}
                    className="text-xs bg-primary/20 text-primary px-2 py-1 rounded hover:bg-primary/30 transition-colors flex items-center gap-1 shrink-0"
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
          data-board-safe-area="true"
          onClick={onToggle}
          className="fixed top-1/2 -translate-y-1/2 left-0 z-40 w-10 h-24 bg-card border border-border border-l-0 rounded-r-lg flex items-center justify-center hover:bg-muted/50"
        >
          <Search className="w-5 h-5" />
        </button>
      )}
    </>
  )
}
