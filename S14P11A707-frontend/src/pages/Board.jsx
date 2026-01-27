import { useState, useRef, useEffect, useCallback } from 'react'
import { useRoute } from 'wouter'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { useScenarioById } from '@/features/scenarios/hooks/useScenarioById'
import { X, Pin, Save, Check, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

// 임시 보드 아이템 (실제로는 게임 시작 후 API에서 가져옴니다)
const createTempBoardItems = (suspects, victim) => {
  const items = []

  // 용의자 추가
  if (suspects && suspects.length > 0) {
    suspects.forEach((suspect, index) => {
      items.push({
        id: `suspect-${suspect.id}`,
        type: 'suspect',
        name: suspect.name,
        x: 100 + (index % 3) * 200,
        y: 100 + Math.floor(index / 3) * 150,
        image: suspect.portraitUrl || '',
        note: suspect.oneLiner || '',
      })
    })
  }

  // 피해자 추가
  if (victim) {
    items.push({
      id: 'victim',
      type: 'victim',
      name: victim.name,
      x: 500,
      y: 100,
      image: victim.portraitUrl || '',
      note: `${victim.occupation} | 발견: ${victim.discoveryLocation}`,
    })
  }

  return items
}

export default function Board() {
  const [, params] = useRoute('/board/:scenarioId')
  const scenarioId = params?.scenarioId ? parseInt(params.scenarioId) : null

  // 시나리오 정보 조회 (API)
  const { scenario, loading, error, refetch } = useScenarioById(scenarioId)

  const [filter, setFilter] = useState('all')
  const [selectedItem, setSelectedItem] = useState(null)
  const [boardItems, setBoardItems] = useState([])
  const [connections, setConnections] = useState([])
  const [saveStatus, setSaveStatus] = useState(null) // 'saving' | 'saved' | null

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

  // 시나리오 로딩 완료 후 초기 보드 아이템 생성
  useEffect(() => {
    if (!loading && scenario) {
      // 로컬스토리지에서 저장된 위치 불러오기
      const saved = localStorage.getItem(`board-items-${scenarioId}`)
      if (saved) {
        try {
          setBoardItems(JSON.parse(saved))
        } catch (e) {
          console.error('Failed to parse saved board items:', e)
        }
      } else if (scenario.suspects && scenario.suspects.length > 0) {
        // 시나리오 정보로 초기 보드 아이템 생성
        const tempItems = createTempBoardItems(scenario.suspects, scenario.victim)
        setBoardItems(tempItems)
      }
    }
  }, [loading, scenarioId, scenario])

  // 붉은 실 그리기
  const drawConnections = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 캔버스 크기 설정
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

      // 그림자 효과
      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)'
      ctx.shadowBlur = 6
      ctx.shadowOffsetX = 3
      ctx.shadowOffsetY = 3

      ctx.beginPath()
      ctx.moveTo(fromItem.x + 88, fromItem.y + 100)

      // 베지어 곡선
      const midX = (fromItem.x + toItem.x) / 2 + 88
      const midY = (fromItem.y + toItem.y) / 2 + 100
      const controlX = midX + (conn.from * 10 - 30)
      const controlY = midY - 50 + (conn.to * 5 - 15)
      ctx.quadraticCurveTo(controlX, controlY, toItem.x + 88, toItem.y + 100)

      // 연결 타입에 따른 스타일
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

      // 그림자 리셋
      ctx.shadowColor = 'transparent'
      ctx.shadowBlur = 0
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 0

      // 라벨
      if (conn.label) {
        ctx.fillStyle = '#fef3c7'
        ctx.strokeStyle = '#f59e0b'
        ctx.lineWidth = 2
        const labelX = controlX - 25
        const labelY = controlY - 15

        ctx.shadowColor = 'rgba(0, 0, 0, 0.2)'
        ctx.shadowBlur = 4
        ctx.shadowOffsetX = 2
        ctx.shadowOffsetY = 2

        ctx.fillRect(labelX, labelY, 50, 20)
        ctx.strokeRect(labelX, labelY, 50, 20)

        ctx.shadowColor = 'transparent'
        ctx.shadowBlur = 0
        ctx.shadowOffsetX = 0
        ctx.shadowOffsetY = 0

        ctx.fillStyle = '#000'
        ctx.font = 'bold 11px Arial'
        ctx.textAlign = 'center'
        ctx.fillText(conn.label, controlX, controlY)
      }
    })
  }, [boardItems, connections])

  useEffect(() => {
    drawConnections()
  }, [drawConnections])

  // 드래그 시작
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

  // 드래그 중
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
  }, [])

  // 드래그 종료
  const handleMouseUp = useCallback(() => {
    dragRef.current.isDragging = false
    dragRef.current.itemId = null
    document.body.style.cursor = ''
  }, [])

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [handleMouseMove, handleMouseUp])

  // 저장 기능 (로컬스토리지)
  const handleSave = () => {
    setSaveStatus('saving')

    // 로컬스토리지에 저장
    localStorage.setItem(`board-items-${scenarioId}`, JSON.stringify(boardItems))

    setTimeout(() => {
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus(null), 2000)
    }, 500)
  }

  // 필터링
  const filteredItems = boardItems.filter((item) => {
    if (filter === 'all') return true
    return item.type === filter
  })

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="p-6">
        {/* Header */}
        <div className="max-w-7xl mx-auto mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold gold-glow">추리 보드</h1>
              <p className="text-muted-foreground mt-1">
                {scenario?.title || '시나리오를 선택해주세요'}
              </p>
            </div>

            <div className="flex gap-4 items-center">
              {/* 저장 버튼 */}
              <Button
                variant="outline"
                onClick={handleSave}
                className="neon-border-cyan"
                disabled={saveStatus === 'saving'}
              >
                {saveStatus === 'saving' ? (
                  <>
                    <div className="w-4 h-4 mr-2 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    저장 중...
                  </>
                ) : saveStatus === 'saved' ? (
                  <>
                    <Check className="w-4 h-4 mr-2 text-green-500" />
                    저장됨
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    저장
                  </>
                )}
              </Button>

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

              <Button variant="outline" onClick={() => window.history.back()}>
                <X className="w-4 h-4 mr-2" />
                닫기
              </Button>
            </div>
          </div>
        </div>

        {/* 로딩 상태 */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">시나리오 정보를 불러오는 중...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <p className="text-red-400 mb-4">시나리오 정보를 불러오는데 실패했습니다.</p>
              <Button onClick={() => window.location.reload()}>다시 시도</Button>
            </div>
          </div>
        ) : !scenario ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <p className="text-muted-foreground">시나리오를 찾을 수 없습니다.</p>
              <Button onClick={() => window.location.href = '/scenarios'}>시나리오 목록</Button>
            </div>
          </div>
        ) : (
          <>
            {/* 시나리오 정보 요약 */}
            <div className="max-w-7xl mx-auto mb-6 p-4 bg-card/30 border border-border rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">장르</p>
                  <p className="font-medium">{scenario.genre || '미정'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">난이도</p>
                  <p className="font-medium">{scenario.difficulty || '미정'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">예상 플레이 시간</p>
                  <p className="font-medium">{scenario.estimatedTime || '-'}분</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">평점</p>
                  <p className="font-medium">{scenario.avgRating?.toFixed(1) || '-'}</p>
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
                  {/* 화이트보드 그리드 */}
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

                  {/* 붉은 실 캔버스 (상단) */}
                  <canvas
                    ref={canvasRef}
                    className="absolute top-0 left-0 pointer-events-none"
                    style={{ zIndex: 1 }}
                  />

                  {/* 보드 아이템 (하단에 배치) */}
                  {filteredItems.map((item) => (
                    <div
                      key={item.id}
                      className="absolute cursor-move group select-none"
                      style={{
                        left: `${item.x}px`,
                        top: `${item.y}px`,
                        zIndex: selectedItem === item.id ? 10 : 2,
                      }}
                      onMouseDown={(e) => handleMouseDown(e, item.id)}
                    >
                      {/* 압정 */}
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                        <Pin
                          className="w-6 h-6 text-red-600 fill-red-600"
                          style={{
                            filter: 'drop-shadow(0 3px 4px rgba(0,0,0,0.5))',
                          }}
                        />
                      </div>

                      {/* 폴라오이드 스타일 카드 */}
                      <div
                        className="w-44 relative transition-transform duration-300"
                        style={{
                          transform:
                            selectedItem === item.id
                              ? 'scale(1.08) rotate(0deg)'
                              : `rotate(${(item.id % 2 === 0 ? 1 : -1) * 3}deg)`,
                        }}
                      >
                        {item.image ? (
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
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none'
                                  e.target.innerHTML = '[이미지 없음]'
                                }}
                              />
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

              {/* 범례 */}
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

              {/* 설명 */}
              <div className="mt-6 text-center text-muted-foreground text-sm">
                <p>
                  증거 카드를 드래그하여 이동할 수 있습니다. 저장 버튼을 눌러 배치를 저장하세요.
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
