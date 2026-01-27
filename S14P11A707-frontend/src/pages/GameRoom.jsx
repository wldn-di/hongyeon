import React, { useCallback, useEffect, useLayoutEffect, useState, useMemo } from 'react'
import { useLocation, useRoute } from 'wouter'
import { Button } from '@/components/ui/Button'
import { DoorOpen, Heart, Clock, Lightbulb, Send, MessageCircle, MapPin, Smartphone, Loader2 } from 'lucide-react'
import LeftEvidencePanel from "@/features/game/panels/LeftEvidencePanel"
import RightLogSidebar from "@/features/game/panels/RightLogSidebar"
import BottomBoardPanel from "@/features/game/panels/BottomBoardPanel"
import { ReportModal, EvidenceDetailModal, SubmitAnswerModal, ReviewModal } from '@/features/game/modals'
import PhoneUI from '@/features/game/components/PhoneUI'
import AgitRoom from '@/features/game/engine/AgitRoom'
import { useGameSession } from '@/features/game/session'
import { useScenarioById } from '@/features/scenarios/hooks/useScenarioById'
import { useGameRooms } from '@/features/game/hooks/useGameRooms'
import { useGameLogs } from '@/features/game/hooks/useGameLogs'
import { useGameSubmission } from '@/features/game/hooks/useGameSubmission'
import { useGameReport } from '@/features/game/hooks/useGameReport'
import { startGame, endGame, saveGame, fetchResume } from '@/features/session/api/sessionApi'
import { normalizeGameStartResponse, normalizeResumeResponse, normalizeGameEndResponse } from '@/features/session/api/sessionMappers'
import { toast } from 'sonner'

// 조력자 정보
const helperInfo = {
  id: "helper",
  name: "조수 왓슨",
  image: "/images/helper.png",
  isHelper: true,
}

// 조력자 초기 메시지
const getHelperInitialMessage = (scenarioTitle) => ({
  id: Date.now(),
  sender: "helper",
  text: `안녕하세요, 탐정님. "${scenarioTitle}" 사건 수사를 도와드리겠습니다. 궁금한 점이 있으시면 언제든 물어보세요!`,
  time: new Date().toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  }),
})


export default function GameRoom() {
  const [, setLocation] = useLocation()

  const [matchSolo, paramsSolo] = useRoute('/room/:scenarioId/solo')
  const scenarioId = paramsSolo?.scenarioId ? parseInt(paramsSolo.scenarioId) : null
  const [matchResume, paramsResume] = useRoute('/room/:sessionId/resume')
  const resumeSessionId = paramsResume?.sessionId ? parseInt(paramsResume.sessionId) : null

  // 시나리오 정보 조회 (API)
  const { scenario, loading: scenarioLoading, error: scenarioError } = useScenarioById(scenarioId || resumeSessionId)

  // 방 데이터 조회 (API)
  const { rooms, loading: roomsLoading } = useGameRooms(scenarioId)

  // 게임 로그 조회 (API)
  const { logs, addLog, resetLogs } = useGameLogs()

  // 게임 제출 Hook
  const { submitGame, loading: submitLoading, result: submitResult } = useGameSubmission()

  // 수사보고서 Hook
  const { report, loading: reportLoading, fetchReport, submitReview } = useGameReport()

  // 세션 상태
  const [sessionId, setSessionId] = useState(null)
  const [health, setHealth] = useState(100)
  const [playTimeSeconds, setPlayTimeSeconds] = useState(0)
  const [hintsUsed, setHintsUsed] = useState(0)
  const [leftPanelOpen, setLeftPanelOpen] = useState(true)
  const [rightLogOpen, setRightLogOpen] = useState(true)
  const [boardPanelOpen, setBoardPanelOpen] = useState(false)
  const [pendingAddItem, setPendingAddItem] = useState(null)
  const [selectedEvidence, setSelectedEvidence] = useState(null)
  const [currentRoomIndex, setCurrentRoomIndex] = useState(0)
  const [gameInitializing, setGameInitializing] = useState(false)

  const { discoveredEvidence, collectEvidence, resetSession } = useGameSession()

  // 휴대폰 관련 상태
  const [phoneOpen, setPhoneOpen] = useState(false)
  const [chatHistories, setChatHistories] = useState({})
  const [currentChat, setCurrentChat] = useState(null)
  const [phoneNotification, setPhoneNotification] = useState(null)

  const [submitAnswerOpen, setSubmitAnswerOpen] = useState(false)
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [reportModalOpen, setReportModalOpen] = useState(false)

  const SIDE_PANEL_WIDTH_PX = 288

  // 용의자 데이터 (시나리오에서 가져옴)
  const suspects = scenario?.suspects || []

  // 증거 목록 (단서에서 변환)
  const evidenceList = discoveredEvidence

  // 현재 방
  const currentRoom = rooms?.[currentRoomIndex] || rooms?.[0] || null

  // 단서 데이터 (Phaser용) - 방 데이터로부터 생성
  // TODO: 백엔드에서 단서 위치 정보를 제공하면 그대로 사용
  const clues = useMemo(() => {
    if (!rooms || rooms.length === 0) return []

    // 각 방에 기본 단서 위치 생성 (임시)
    const defaultPositions = [
      { roomIndex: 0, localX: 90, localY: 200 },
      { roomIndex: 1, localX: 235, localY: 220 },
      { roomIndex: 2, localX: 150, localY: 260 },
      { roomIndex: 3, localX: 210, localY: 190 },
      { roomIndex: 4, localX: 120, localY: 160 },
      { roomIndex: 5, localX: 240, localY: 250 },
    ]

    return rooms.slice(0, 6).map((room, idx) => {
      const pos = defaultPositions[idx] || defaultPositions[0]
      return {
        clueId: `${scenarioId}-${room.id}`,
        evidenceId: room.id,
        title: room.name,
        body: room.description || `${room.name}에서 조사가 필요합니다.`,
        roomIndex: idx,
        localX: pos.localX,
        localY: pos.localY,
      }
    })
  }, [rooms, scenarioId])

  // 로딩 상태
  const isLoading = scenarioLoading || roomsLoading || gameInitializing

  // 에러 상태
  const hasError = scenarioError || (!scenario && !scenarioLoading)

  // 플레이 시간 포맷
  const formatPlayTime = (seconds) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  const playTime = formatPlayTime(playTimeSeconds)

  // 게임 초기화 (새로 시작)
  const initializeNewGame = useCallback(async () => {
    if (!scenarioId) return

    try {
      setGameInitializing(true)
      const response = await startGame(scenarioId)
      const normalized = normalizeGameStartResponse(response)

      setSessionId(normalized.sessionId)
      setHealth(100)
      setPlayTimeSeconds(0)
      setHintsUsed(0)
      setCurrentRoomIndex(0)

      // 초기 로그 추가
      if (normalized.eventLog) {
        addLog('system', '수사가 시작되었습니다.')
      }

      return normalized
    } catch (err) {
      toast.error(err.message || '게임 시작에 실패했습니다.')
      throw err
    } finally {
      setGameInitializing(false)
    }
  }, [scenarioId, addLog])

  // 게임 이어하기
  const resumeGame = useCallback(async (sessionId) => {
    try {
      setGameInitializing(true)
      const response = await fetchResume(sessionId)
      const normalized = normalizeResumeResponse(response)

      setSessionId(normalized.sessionId)
      setHealth(normalized.health || 100)
      setPlayTimeSeconds(normalized.playTime || 0)
      setHintsUsed(0)
      setCurrentRoomIndex(normalized.currentFloor || 0)

      // 로그 복원
      if (Array.isArray(normalized.board?.nodes)) {
        // 보드 데이터로부터 증거 복원
        const inventoryClues = normalized.inventory?.clues || []
        inventoryClues.forEach(clue => {
          collectEvidence({
            id: clue.clueId,
            name: clue.name,
          }, { log: false })
        })
      }

      addLog('system', '수사를 이어서 진행합니다.')

      return normalized
    } catch (err) {
      toast.error(err.message || '이어하기에 실패했습니다.')
      throw err
    } finally {
      setGameInitializing(false)
    }
  }, [addLog, collectEvidence])

  // 컴포넌트 마운트 시 게임 초기화
  useEffect(() => {
    if (resumeSessionId) {
      // 이어하기 모드
      resumeGame(resumeSessionId)
    } else if (scenarioId && scenario) {
      // 새 게임 시작
      initializeNewGame()
    }
  }, [resumeSessionId, scenarioId, scenario?.id, initializeNewGame, resumeGame])

  useLayoutEffect(() => {
    if (scenarioId) {
      localStorage.removeItem(`board-items-${scenarioId}`)
      localStorage.removeItem(`board-connections-${scenarioId}`)
    }
  }, [scenarioId])

  // 시나리오 시작/변경 시 세션 초기화
  useEffect(() => {
    if (!scenarioId) return

    resetSession()
    setCurrentRoomIndex(0)
    setSelectedEvidence(null)

    setPhoneOpen(false)
    setCurrentChat(null)

    setSubmitAnswerOpen(false)
    setReviewModalOpen(false)
    setReportModalOpen(false)

    addLog('system', '수사가 시작되었습니다.')

    const initialMsg = getHelperInitialMessage(scenario?.title || '사건')
    setChatHistories({ helper: [initialMsg] })

    setPhoneNotification(initialMsg.text)
    const timer = setTimeout(() => setPhoneNotification(null), 3000)
    return () => clearTimeout(timer)
  }, [scenarioId, scenario?.title, resetSession, addLog])

  // 플레이 시간 타이머
  useEffect(() => {
    if (!sessionId) return

    const timer = setInterval(() => {
      setPlayTimeSeconds(prev => prev + 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [sessionId])

  const handleClueInspected = useCallback((clue) => {
    const evidence =
      evidenceList.find((e) => e.id === clue?.evidenceId) ||
      evidenceList.find((e) => e.name === clue?.title)

    if (!evidence) return
    collectEvidence(evidence)
  }, [collectEvidence, evidenceList])

  const handleRoomChanged = useCallback((roomIndex) => {
    if (!Number.isFinite(roomIndex)) return
    if (rooms.length === 0) return
    setCurrentRoomIndex(Math.max(0, Math.min(roomIndex, rooms.length - 1)))
  }, [rooms.length])

  const handleSendMessage = (contactId, text) => {
    const newMessage = {
      id: Date.now(),
      sender: 'user',
      text,
      time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    }

    setChatHistories(prev => ({
      ...prev,
      [contactId]: [...(prev[contactId] || []), newMessage]
    }))

    // 더미 응답 (실제로는 AI 호출)
    setTimeout(() => {
      const isHelper = contactId === 'helper'
      const responseText = isHelper
        ? "네, 알겠습니다. 그 부분에 대해 조사해볼게요."
        : "그건... 제가 말씀드리기 어려운 부분이네요."

      const responseMessage = {
        id: Date.now(),
        sender: contactId,
        text: responseText,
        time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
      }

      setChatHistories(prev => ({
        ...prev,
        [contactId]: [...(prev[contactId] || []), responseMessage]
      }))
    }, 1000)
  }

  const handleDragStart = (e, data, type) => {
    const payload = JSON.stringify({ data, type })
    e.dataTransfer.setData('itemData', payload)
    e.dataTransfer.setData('text/plain', payload)
    e.dataTransfer.effectAllowed = 'copy'

    if (type === 'evidence' || type === 'suspect' || type === 'location') {
      setBoardPanelOpen(true)
    }
  }

  const handleExit = useCallback(() => {
    if (!window.confirm('정말 나가시겠습니까?')) return
    setLocation('/scenarios')
  }, [setLocation])

  const handleSubmitClick = () => {
    if (!sessionId) {
      toast.error('게임 세션이 초기화되지 않았습니다.')
      return
    }
    setSubmitAnswerOpen(true)
  }

  const handleAnswerSubmit = async () => {
    if (!sessionId) return

    try {
      setSubmitAnswerOpen(false)

      // 게임 종료 API 호출
      const result = await submitGame(sessionId)

      if (result.isSuccess) {
        setReviewModalOpen(true)
      }
    } catch (err) {
      // 에러는 submitGame hook에서 처리됨
      setSubmitAnswerOpen(true)
    }
  }

  const handleReviewSubmit = async (difficulty, rating, review) => {
    if (!scenarioId) return

    try {
      setReviewModalOpen(false)

      // 리뷰 작성
      await submitReview(scenarioId, {
        rating,
        difficulty: difficulty.toUpperCase(),
        content: review,
        isSpoiler: false,
      })

      // 수사보고서 조회
      const reportData = await fetchReport(sessionId)
      if (reportData) {
        setReportModalOpen(true)
      }
    } catch (err) {
      toast.error('후기 작성에 실패했습니다.')
    }
  }

  const handleAddToBoard = (item, type) => {
    if (!item) return
    if (type === 'evidence') setSelectedEvidence(null)
    setBoardPanelOpen(true)
    setPendingAddItem({ type, data: item })
  }

  // 로딩 상태 렌더링
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">게임을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  // 에러 상태 렌더링
  if (hasError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">시나리오를 불러오는데 실패했습니다.</p>
          <Button onClick={() => window.location.href = '/scenarios'}>시나리오 목록</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" />
      <div className="absolute inset-0 bg-black/40" />

      {/* 상단 바 */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-card/80 backdrop-blur border-b border-border">
        <div className="container h-16">
          <div className="flex items-center justify-between h-full">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                <div className="w-32 h-3 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-red-500 to-red-400 rounded-full transition-all" style={{ width: `${health}%` }} />
                </div>
                <span className="text-sm text-muted-foreground">{health}%</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                <span className="font-mono text-lg">{playTime}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={handleExit}>
                <DoorOpen className="w-4 h-4 mr-2" />
                나가기
              </Button>
              <Button variant="outline" size="sm">
                <Lightbulb className="w-4 h-4 mr-2" />
                힌트 ({hintsUsed}/3)
              </Button>
              <Button variant="neon" size="sm" onClick={handleSubmitClick}>
                <Send className="w-4 h-4 mr-2" />
                최종 정답 제출
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 탐사(AgitRoom) */}
	      <div
	        className="fixed z-20 transition-all duration-300"
	        style={{
	          top: '80px',
          left: leftPanelOpen ? `${SIDE_PANEL_WIDTH_PX}px` : '0px',
          right: rightLogOpen ? `${SIDE_PANEL_WIDTH_PX}px` : '0px',
          bottom: '100px',
        }}
      >
        <div className="w-full h-full bg-card/50 border border-border overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-3 h-10 border-b border-white/10 bg-card/40">
            <div className="flex items-center gap-2 min-w-0">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-gray-300 truncate">
                {currentRoom?.name || "발견 장소"}
              </span>
            </div>
            <span className="text-sm font-bold gold-glow truncate">{scenario?.title || '시나리오'}</span>
	          </div>

	          <div className="w-full h-[calc(100%-40px)] bg-black/40 relative">
	            <AgitRoom
	              key={scenarioId}
	              clues={clues}
	              onClueInspected={handleClueInspected}
	              onRoomChanged={handleRoomChanged}
	            />
	          </div>
	        </div>
	      </div>

      {/* 왼쪽 패널 (증거 목록) */}
	      <LeftEvidencePanel
	        isOpen={leftPanelOpen}
	        onToggle={() => setLeftPanelOpen(!leftPanelOpen)}
	        evidence={discoveredEvidence}
	        suspects={suspects}
	        rooms={rooms}
	        onItemClick={(item, type) => {
	          if (type === 'evidence') setSelectedEvidence(item)
	        }}
	        onDragStart={handleDragStart}
	        onAddToBoard={handleAddToBoard}
	      />

      {/* 오른쪽 수사 로그 사이드바 */}
      <RightLogSidebar
        isOpen={rightLogOpen}
        onToggle={() => setRightLogOpen(!rightLogOpen)}
        logs={logs}
      />

      {/* 하단 추리보드 패널 */}
	      <BottomBoardPanel
	        isOpen={boardPanelOpen}
	        onOpenChange={setBoardPanelOpen}
	        scenarioId={scenarioId}
	        leftOffsetPx={leftPanelOpen ? SIDE_PANEL_WIDTH_PX : 0}
	        rightOffsetPx={rightLogOpen ? SIDE_PANEL_WIDTH_PX : 0}
	        pendingAddItem={pendingAddItem}
	        onConsumePendingAddItem={() => setPendingAddItem(null)}
	      />

      {/* 오른쪽 하단: 방 이동 + 휴대폰 */}
      <div className="fixed right-6 bottom-6 z-40 flex items-center gap-3">
        {/* 휴대폰 아이콘 */}
        <div className="relative">
          <button
            onClick={() => setPhoneOpen(!phoneOpen)}
            className="w-14 h-14 bg-card/90 border-2 border-blue-500 rounded-full shadow-lg hover:scale-105 transition-transform flex items-center justify-center"
          >
            <Smartphone className="w-6 h-6 text-blue-500" />
          </button>

          {/* 알림 말풍선 */}
          {phoneNotification && (
            <div className="absolute bottom-16 right-0 w-64 bg-card border border-border rounded-lg shadow-xl p-3 animate-in slide-in-from-bottom-2">
              <div className="flex items-start gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-bold text-primary">조력자</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">{phoneNotification}</p>
                </div>
              </div>
              <div className="absolute -bottom-2 right-6 w-4 h-4 bg-card border-r border-b border-border transform rotate-45" />
            </div>
          )}
        </div>
      </div>

      {/* 휴대폰 UI */}
      <PhoneUI
        isOpen={phoneOpen}
        onClose={() => setPhoneOpen(false)}
        helper={helperInfo}
        suspects={suspects}
        chatHistories={chatHistories}
        onSendMessage={handleSendMessage}
        currentChat={currentChat}
        setCurrentChat={setCurrentChat}
      />

      {/* 모달들 */}
      <EvidenceDetailModal evidence={selectedEvidence} onClose={() => setSelectedEvidence(null)} />
	      <SubmitAnswerModal
	        isOpen={submitAnswerOpen}
	        onClose={() => setSubmitAnswerOpen(false)}
	        onSubmit={handleAnswerSubmit}
	        scenarioId={scenarioId}
	      />
      <ReviewModal isOpen={reviewModalOpen} onSubmit={handleReviewSubmit} />
      <ReportModal isOpen={reportModalOpen} onClose={() => setReportModalOpen(false)} report={reportData} />
    </div>
  )
}
