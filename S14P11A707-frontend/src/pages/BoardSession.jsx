import React, { useRef, useEffect, useCallback, useState } from 'react'
import { useRoute, useLocation } from 'wouter'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { X, Pin, Save, Check, Send } from 'lucide-react'
import { useBoard } from '@/features/session/hooks/useBoard'
import { useBoardSelection } from '@/features/session/hooks/useBoardSelection'
import { fetchResume } from '@/features/session/api/sessionApi'
import { normalizeResumeResponse } from '@/features/session/api/sessionMappers'
import { createPath } from '@/app/routePaths'

export default function BoardSession() {
  const [, params] = useRoute('/board/session/:sessionId')
  const sessionId = params?.sessionId ? parseInt(params.sessionId) : null
  const [, navigate] = useLocation()

  const [filter, setFilter] = useState('all')
  const [selectedItem, setSelectedItem] = useState(null)
  const [scenarioId, setScenarioId] = useState(null)

  // Fetch scenarioId from resume endpoint
  useEffect(() => {
    const fetchScenarioId = async () => {
      if (!sessionId) return
      try {
        const resumeData = await fetchResume(sessionId)
        const normalized = normalizeResumeResponse(resumeData)
        setScenarioId(normalized.scenarioId)
      } catch (err) {
        console.error('Failed to fetch scenarioId:', err)
      }
    }
    fetchScenarioId()
  }, [sessionId])

  const {
    boardData,
    clues,
    suspects,
    boardItems,
    setBoardItems,
    isLoading,
    isSaving,
    error,
    refetch,
    updateNodePosition,
  } = useBoard(sessionId, scenarioId)

  const {
    selection,
    setCulprit,
    setWeapon,
    setLocation,
    isComplete: isSelectionComplete,
  } = useBoardSelection(sessionId)

  const canvasRef = useRef(null)
  const boardRef = useRef(null)
  const dragRef = useRef({
    isDragging: false,
    itemId: null,
    startX: 0,
    startY: 0,
    offsetX: 0,
    offsetY: 0,
  })

  // Extract connections from boardData
  const connections = boardData?.connections || []

  // Draw connections on canvas
  const drawConnections = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = boardRef.current?.getBoundingClientRect()
    if (rect) {
      canvas.width = rect.width
      canvas.height = rect.height
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    connections.forEach((conn) => {
      const fromItem = boardItems.find((item) => item.id === conn.from)
      const toItem = boardItems.find((item) => item.id === conn.to)

      if (!fromItem || !toItem) return

      // Shadow effect
      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)'
      ctx.shadowBlur = 6
      ctx.shadowOffsetX = 3
      ctx.shadowOffsetY = 3

      ctx.beginPath()
      ctx.moveTo(fromItem.x + 88, fromItem.y + 100)

      // Bezier curve
      const midX = (fromItem.x + toItem.x) / 2 + 88
      const midY = (fromItem.y + toItem.y) / 2 + 100
      const controlX = midX + (conn.from * 10 - 30)
      const controlY = midY - 50 + (conn.to * 5 - 15)
      ctx.quadraticCurveTo(controlX, controlY, toItem.x + 88, toItem.y + 100)

      // Style based on connection type
      if (conn.type === 'confirmed') {
        ctx.strokeStyle = '#dc2626'
        ctx.lineWidth = 4
        ctx.setLineDash([])
      } else if (conn.type === 'suspected') {
        ctx.strokeStyle = '#f59e0b'
        ctx.lineWidth = 3
        ctx.setLineDash([8, 8])
      } else if (conn.type === 'contradiction') {
        ctx.strokeStyle = '#7c2d12'
        ctx.lineWidth = 4
        ctx.setLineDash([])
      }

      ctx.stroke()

      // Reset shadow
      ctx.shadowColor = 'transparent'
      ctx.shadowBlur = 0
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 0
    })
  }, [boardItems, connections])

  useEffect(() => {
    drawConnections()
  }, [drawConnections])

  // Drag start
  const handleMouseDown = (e, itemId) => {
    e.preventDefault()
    const item = boardItems.find(i => i.id === itemId)
    if (!item) return

    dragRef.current = {
      isDragging: true,
      itemId,
      startX: e.clientX,
      startY: e.clientY,
      offsetX: item.x,
      offsetY: item.y,
    }
    setSelectedItem(itemId)
    document.body.style.cursor = 'grabbing'
  }

  // Drag move
  const handleMouseMove = useCallback((e) => {
    if (!dragRef.current.isDragging) return

    const deltaX = e.clientX - dragRef.current.startX
    const deltaY = e.clientY - dragRef.current.startY

    setBoardItems(prev => prev.map(item => {
      if (item.id === dragRef.current.itemId) {
        const newX = Math.max(0, Math.min(750, dragRef.current.offsetX + deltaX))
        const newY = Math.max(0, Math.min(600, dragRef.current.offsetY + deltaY))
        return { ...item, x: newX, y: newY }
      }
      return item
    }))
  }, [setBoardItems])

  // Drag end - save to backend
  const handleMouseUp = useCallback(() => {
    if (!dragRef.current.isDragging) return

    const itemId = dragRef.current.itemId
    const item = boardItems.find(i => i.id === itemId)

    if (item) {
      // Save position to backend
      updateNodePosition(itemId, item.x, item.y)
    }

    dragRef.current.isDragging = false
    dragRef.current.itemId = null
    document.body.style.cursor = ''
  }, [boardItems, updateNodePosition])

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [handleMouseMove, handleMouseUp])

  // Handle item click for selection
  const handleItemClick = (item) => {
    setSelectedItem(item.id)

    // Allow selecting culprit, weapon, location based on item type
    if (item.type === 'suspect') {
      setCulprit(item.targetId, item.name)
    } else if (item.type === 'evidence') {
      const clue = clues.find(c => c.id === item.targetId)
      if (clue) {
        setWeapon(item.targetId, item.name)
        setLocation(clue.floorNumber)
      }
    }
  }

  // Filter board items
  const filteredItems = boardItems.filter((item) => {
    if (filter === 'all') return true
    return item.type === filter
  })

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">보드를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center max-w-md">
          <p className="text-red-500 mb-4">{error}</p>
          <div className="flex gap-4 justify-center">
            <Button variant="outline" onClick={() => window.history.back()}>
              뒤로 가기
            </Button>
            <Button onClick={refetch}>
              다시 시도
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="p-6">
        {/* Header */}
        <div className="max-w-7xl mx-auto mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold gold-glow">추리 보드</h1>
              <p className="text-muted-foreground mt-1">
                세션 ID: {sessionId}
              </p>
            </div>

            <div className="flex gap-4 items-center">
              {/* Save status indicator */}
              {isSaving && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <div className="w-4 h-4 mr-2 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  저장 중...
                </div>
              )}

              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="필터" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 보기</SelectItem>
                  <SelectItem value="suspect">용의자</SelectItem>
                  <SelectItem value="evidence">증거</SelectItem>
                  <SelectItem value="note">메모</SelectItem>
                </SelectContent>
              </Select>

              {/* Go to Submit button */}
              <Button
                variant="neon"
                onClick={() => navigate(createPath.submitSession(sessionId))}
                disabled={!isSelectionComplete}
              >
                <Send className="w-4 h-4 mr-2" />
                제출하러 가기
              </Button>

              <Button variant="outline" onClick={() => window.history.back()}>
                <X className="w-4 h-4 mr-2" />
                닫기
              </Button>
            </div>
          </div>

          {/* Selection status */}
          <div className="mt-4 flex gap-4 text-sm">
            <div className={`px-3 py-1 rounded ${selection.culpritId ? 'bg-green-500/20 text-green-500' : 'bg-muted text-muted-foreground'}`}>
              범인: {selection.culpritName || '미선택'}
            </div>
            <div className={`px-3 py-1 rounded ${selection.weaponClueId ? 'bg-green-500/20 text-green-500' : 'bg-muted text-muted-foreground'}`}>
              흉기: {selection.weaponName || '미선택'}
            </div>
            <div className={`px-3 py-1 rounded ${selection.locationFloor ? 'bg-green-500/20 text-green-500' : 'bg-muted text-muted-foreground'}`}>
              장소: {selection.locationFloor ? `${selection.locationFloor}층` : '미선택'}
            </div>
          </div>
        </div>

        {/* Classic Whiteboard */}
        <div className="max-w-7xl mx-auto">
          <Card
            ref={boardRef}
            className="relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #f8f8f8 100%)',
              boxShadow: 'inset 0 0 30px rgba(0,0,0,0.08), 0 15px 40px rgba(0,0,0,0.3)',
            }}
          >
            <div className="relative w-full h-[800px]">
              {/* Grid pattern */}
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage: `
                    linear-gradient(rgba(0,0,0,0.015) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(0,0,0,0.015) 1px, transparent 1px)
                  `,
                  backgroundSize: '30px 30px',
                }}
              />

              {/* Red thread canvas */}
              <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 pointer-events-none"
                style={{ zIndex: 1 }}
              />

              {/* Board items */}
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className={`absolute cursor-pointer group select-none ${
                    selectedItem === item.id ? 'z-10' : 'z-2'
                  }`}
                  style={{
                    left: `${item.x}px`,
                    top: `${item.y}px`,
                  }}
                  onMouseDown={(e) => handleMouseDown(e, item.id)}
                  onClick={() => handleItemClick(item)}
                >
                  {/* Push pin */}
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <Pin
                      className="w-6 h-6 text-red-600 fill-red-600"
                      style={{
                        filter: 'drop-shadow(0 3px 4px rgba(0,0,0,0.5))',
                      }}
                    />
                  </div>

                  {/* Polaroid style card */}
                  <div
                    className="w-44 relative transition-transform duration-300"
                    style={{
                      transform:
                        selectedItem === item.id
                          ? 'scale(1.08) rotate(0deg)'
                          : `rotate(${(item.id % 2 === 0 ? 1 : -1) * 3}deg)`,
                    }}
                  >
                    {item.type === 'evidence' ? (
                      <div
                        className="bg-white p-3 pb-12"
                        style={{
                          boxShadow:
                            '4px 4px 12px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.8)',
                        }}
                      >
                        <div
                          className="w-full h-40 bg-gray-200 flex items-center justify-center text-gray-400"
                          style={{
                            boxShadow: 'inset 0 0 10px rgba(0,0,0,0.1)',
                          }}
                        >
                          [증거 이미지]
                        </div>
                        <p className="text-center mt-3 text-sm font-handwriting text-gray-800">
                          {item.name}
                        </p>
                        {item.note && (
                          <p className="text-center text-xs text-gray-500 mt-1 whitespace-pre-line">
                            {item.note}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div
                        className="p-4 min-h-[200px]"
                        style={{
                          background:
                            'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                          boxShadow:
                            '4px 4px 10px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.5)',
                        }}
                      >
                        <h3 className="text-base font-bold mb-3 text-gray-900">
                          {item.name}
                        </h3>
                        <p className="text-sm text-gray-700 whitespace-pre-line font-handwriting leading-relaxed">
                          {item.note}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Legend */}
          <div className="mt-6 flex gap-8 justify-center items-center text-sm">
            <div className="flex items-center gap-2">
              <div
                className="w-10 h-1 bg-red-600 rounded"
                style={{ boxShadow: '0 2px 4px rgba(220, 38, 38, 0.4)' }}
              />
              <span>확정 연결</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-10 h-1 bg-orange-500 rounded"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(90deg, #f59e0b 0, #f59e0b 8px, transparent 8px, transparent 16px)',
                  boxShadow: '0 2px 4px rgba(245, 158, 11, 0.4)',
                }}
              />
              <span>추정 연결</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-10 h-1 bg-red-900 rounded"
                style={{ boxShadow: '0 2px 4px rgba(124, 45, 18, 0.4)' }}
              />
              <span>모순</span>
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-6 text-center text-muted-foreground text-sm">
            <p>
              증거 카드를 드래그하여 이동할 수 있습니다. 위치 변경은 자동으로 저장됩니다.
              범인, 흉기, 장소를 선택하려면 카드를 클릭하세요.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
