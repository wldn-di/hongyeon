import React, { useCallback, useEffect, useLayoutEffect, useState, useMemo, useRef } from 'react'
import { useLocation, useRoute } from 'wouter'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { DoorOpen, Heart, Clock, Lightbulb, Send, MessageCircle, MapPin, Smartphone, Loader2, ArrowRight, Users } from 'lucide-react'
import LeftEvidencePanel from "@/features/game/panels/LeftEvidencePanel"
import RightLogSidebar from "@/features/game/panels/RightLogSidebar"
import BottomBoardPanel from "@/features/game/panels/BottomBoardPanel"
import { ReportModal, EvidenceDetailModal, SubmitAnswerModal, ReviewModal } from '@/features/game/modals'
import PhoneUI from '@/features/game/components/PhoneUI'
import AgitRoom from '@/features/game/engine/AgitRoom'
import TypingText from '@/features/tutorial/components/TypingText'
import { useGameSession } from '@/features/game/session'
import { useScenarioById } from '@/features/scenarios/hooks/useScenarioById'
import { useGameRooms } from '@/features/game/hooks/useGameRooms'
import { useGameLogs } from '@/features/game/hooks/useGameLogs'
import { useGameSubmission } from '@/features/game/hooks/useGameSubmission'
import { useGameReport } from '@/features/game/hooks/useGameReport'
import { startGame, endGame, saveGame, fetchResume, moveFloor, submitAnswer } from '@/features/session/api/sessionApi'
import { fetchClues, discoverClue } from '@/features/session/api/cluesApi'
import { normalizeGameStartResponse, normalizeResumeResponse, normalizeGameEndResponse, normalizeClueListResponse, normalizeDiscoveredClueResponse } from '@/features/session/api/sessionMappers'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// ========================================
// ========================================
function OpeningPhase({ scenario, onComplete, onSkip }) {
  const [stage, setStage] = useState('title')

  if (!scenario) return null

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-20"
        style={{ backgroundImage: `url(${scenario.thumbnail})`, filter: 'blur(4px) grayscale(60%)' }}
      />
      <div className="absolute inset-0" style={{ background: 'radial-gradient(circle, transparent 0%, rgba(0,0,0,0.8) 100%)' }} />

      <div className="relative z-10 text-center max-w-2xl px-8">
        {stage === 'title' && (
          <div className="animate-in fade-in duration-1000">
            <p className="text-sm text-primary tracking-widest mb-4">CASE FILE</p>
            <h1 className="text-4xl md:text-5xl font-bold gold-glow mb-8">
              <TypingText text={scenario.title} speed={80} onComplete={() => setTimeout(() => setStage('synopsis'), 500)} />
            </h1>
          </div>
        )}

        {stage === 'synopsis' && (
          <div className="animate-in fade-in duration-700">
            <p className="text-sm text-primary tracking-widest mb-4">CASE FILE</p>
            <h1 className="text-3xl font-bold gold-glow mb-6">{scenario.title}</h1>
            <p className="text-lg text-amber-100/80 leading-relaxed whitespace-pre-line">
              <TypingText
                text={scenario.synopsisDetail || scenario.synopsis || '사건이 발생했습니다. 진실을 밝혀주세요.'}
                speed={30}
                onComplete={() => setTimeout(() => setStage('ready'), 500)}
              />
            </p>
          </div>
        )}

        {stage === 'ready' && (
          <div className="animate-in fade-in duration-700">
            <p className="text-sm text-primary tracking-widest mb-4">CASE FILE</p>
            <h1 className="text-3xl font-bold gold-glow mb-6">{scenario.title}</h1>
            <p className="text-lg text-amber-100/80 leading-relaxed whitespace-pre-line mb-8">
              {scenario.synopsisDetail || scenario.synopsis}
            </p>
            <Button variant="neon" size="lg" onClick={onComplete}>
              수사 시작하기 <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        )}
      </div>

      <button
        onClick={onSkip}
        className="absolute top-6 right-6 text-muted-foreground hover:text-white flex items-center gap-2"
      >
        <span className="text-sm">스킵</span>
      </button>
    </div>
  )
}

// ========================================
// ========================================
function VictimIntroPhase({ victim, onComplete }) {
  useEffect(() => {
    if (!victim) {
      onComplete?.()
    }
  }, [victim, onComplete])

  if (!victim) return null

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-gray-900 to-black z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-cover bg-center opacity-30" style={{ filter: 'grayscale(70%)' }} />
      <div className="relative z-10 w-full max-w-lg px-4">
        <Card className="bg-card/95 backdrop-blur border border-border shadow-2xl">
          <div className="p-6">
            <div className="text-center mb-6">
              <span className="text-xs text-red-500 font-bold tracking-widest">VICTIM PROFILE</span>
              <h2 className="text-2xl font-bold gold-glow mt-2">피해자 정보</h2>
            </div>

            <div className="flex gap-4 items-center mb-6">
              <div className="w-24 h-24 bg-muted rounded-xl flex items-center justify-center overflow-hidden">
                {victim.portraitUrl || victim.image ? (
                  <img src={victim.portraitUrl || victim.image} alt={victim.name} className="w-full h-full object-cover" />
                ) : (
                  <Users className="w-12 h-12 text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="text-2xl font-bold">{victim.name}</p>
                <p className="text-muted-foreground">{victim.age}세 {victim.gender}</p>
                <p className="text-sm text-primary">{victim.occupation}</p>
              </div>
            </div>

            {victim.background && (
              <p className="text-sm text-muted-foreground mb-6 p-3 bg-muted/30 rounded-lg">
                {victim.background}
              </p>
            )}

            <div className="space-y-3 border-t border-border pt-4">
              <h3 className="text-sm font-bold text-primary">초기 단서</h3>
              <div className="grid gap-2 text-sm">
                {[
                  ['발견 장소', victim.discoveryLocation],
                  ['사망 추정 시각', victim.estimatedDeathTime],
                  ['사인', victim.causeOfDeath]
                ].filter(([, v]) => v).map(([k, v], i) => (
                  <div key={i} className="flex justify-between p-2 bg-muted/20 rounded">
                    <span className="text-muted-foreground">{k}</span>
                    <span className={cn("font-bold", i === 2 && "text-red-400")}>{v}</span>
              </div>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <Button variant="neon" size="lg" className="w-full" onClick={onComplete}>
                현장으로 이동 <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
const helperInfo = {
  id: "helper",
  name: "조수 왓슨",
  image: "/images/helper.png",
  isHelper: true,
}

// 조력??초기 메시지
const getHelperInitialMessage = (scenarioTitle) => ({
  id: Date.now(),
  sender: "helper",
  text: `안녕하세요, 형사님. "${scenarioTitle}" 사건 수사를 도와드리겠습니다. 궁금한 점이 있으면 언제든 물어보세요.`,
  time: new Date().toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  }),
})


export default function GameRoom() {
  const [, setLocation] = useLocation()

  // /game/:scenarioId 경로 (??게임)
  const [matchGame, paramsGame] = useRoute('/game/:scenarioId')
  // /room/:scenarioId/solo 경로 (??게임)
  const [matchSolo, paramsSolo] = useRoute('/room/:scenarioId/solo')
  const [matchResume, paramsResume] = useRoute('/room/:sessionId/resume')

  const initialScenarioId = paramsGame?.scenarioId
    ? parseInt(paramsGame.scenarioId)
    : paramsSolo?.scenarioId
      ? parseInt(paramsSolo.scenarioId)
      : null
  const resumeSessionId = paramsResume?.sessionId ? parseInt(paramsResume.sessionId) : null
  const [activeScenarioId, setActiveScenarioId] = useState(initialScenarioId)
  useEffect(() => {
    if (initialScenarioId) {
      setActiveScenarioId(initialScenarioId)
    }
  }, [initialScenarioId])
  const { scenario, loading: scenarioLoading, error: scenarioError } = useScenarioById(activeScenarioId)
  const { rooms, loading: roomsLoading } = useGameRooms(activeScenarioId)
  const [sessionId, setSessionId] = useState(null)
  const [gamePhase, setGamePhase] = useState(resumeSessionId ? 'main' : 'opening')
  const [apiClues, setApiClues] = useState([])
  const { logs, addLog, resetLogs, refetch: refetchLogs } = useGameLogs(sessionId)
  const { submitGame, loading: submitLoading, result: submitResult } = useGameSubmission()
  const { report, loading: reportLoading, fetchReport, submitReview } = useGameReport()
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
  const [gameInitError, setGameInitError] = useState(null)

  const { discoveredEvidence, collectEvidence, resetSession } = useGameSession()

  const currentRoomIndexRef = useRef(currentRoomIndex)
  currentRoomIndexRef.current = currentRoomIndex
  const [phoneOpen, setPhoneOpen] = useState(false)
  const [chatHistories, setChatHistories] = useState({})
  const [currentChat, setCurrentChat] = useState(null)
  const [phoneNotification, setPhoneNotification] = useState(null)

  const [submitAnswerOpen, setSubmitAnswerOpen] = useState(false)
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [visitedFloors, setVisitedFloors] = useState(new Set([0]))

  const SIDE_PANEL_WIDTH_PX = 288
  const suspects = scenario?.suspects || []

  // 증거 목록 = 발견??증거
  const currentRoom = rooms?.[currentRoomIndex] || rooms?.[0] || null

  const currentFloorNumber = Number.isFinite(currentRoom?.floorNumber) ? currentRoom.floorNumber : (currentRoomIndex + 1)

  const getRoomIndexFromFloor = useCallback((floorNumber) => {
    if (!Number.isFinite(floorNumber)) return 0

    if (rooms && rooms.length > 0) {
      const foundIndex = rooms.findIndex(r => r.floorNumber === floorNumber)
      if (foundIndex >= 0) return foundIndex
      const fallbackIndex = floorNumber - 1
      return Math.max(0, Math.min(fallbackIndex, rooms.length - 1))
    }

    return Math.max(0, floorNumber - 1)
  }, [rooms])
  useEffect(() => {
    if (!sessionId) return

    const loadClues = async () => {
      try {
        const response = await fetchClues(sessionId)
        const normalized = normalizeClueListResponse(response)
        setApiClues(normalized.clues || [])
      } catch (err) {
        console.error('Failed to fetch clues:', err)
      }
    }

    loadClues()
  }, [sessionId])
  const clues = useMemo(() => {
    if (roomsLoading) return []
    if (!apiClues || apiClues.length === 0) return []
    const positionsPerRoom = [
      { localX: 90, localY: 200 },
      { localX: 235, localY: 220 },
      { localX: 150, localY: 260 },
    ]

    const undiscoveredClues = apiClues.filter(clue => !clue.discovered)
    const clueCountByRoom = {}

    return undiscoveredClues.map((clue) => {
      let roomIndex = 0
      if (rooms && rooms.length > 0) {
        const foundIndex = rooms.findIndex(r => r.floorNumber === clue.floorNumber)
        roomIndex = foundIndex >= 0 ? foundIndex : (clue.floorNumber || 0)
      } else {
        roomIndex = clue.floorNumber || 0
      }
      const countInRoom = clueCountByRoom[roomIndex] || 0
      clueCountByRoom[roomIndex] = countInRoom + 1
      const pos = positionsPerRoom[countInRoom % positionsPerRoom.length]

      return {
        clueId: clue.id,
        evidenceId: clue.id,
        title: clue.name || '이름 없는 단서',
        body: clue.description || `단서를 조사해보세요.`,
        roomIndex,
        localX: pos.localX,
        localY: pos.localY,
        importance: clue.importance,
      }
    })
  }, [apiClues, rooms, roomsLoading])
  const isLoading = scenarioLoading || roomsLoading || gameInitializing
  const hasError = scenarioError || (!scenario && !scenarioLoading)
  const formatPlayTime = (seconds) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  const playTime = formatPlayTime(playTimeSeconds)
  const initializeNewGame = useCallback(async () => {
    if (!activeScenarioId) {
      console.log('[GameRoom] initializeNewGame: activeScenarioId 없음')
      return
    }

    console.log('[GameRoom] initializeNewGame 시작:', activeScenarioId)

    try {
      setGameInitializing(true)
      setGameInitError(null)
      const response = await startGame(activeScenarioId)
      console.log('[GameRoom] startGame 응답:', response)

      const normalized = normalizeGameStartResponse(response)
      console.log('[GameRoom] normalized:', normalized)

      if (!normalized.sessionId) {
        throw new Error('세션 ID를 받지 못했습니다.')
      }

      setSessionId(normalized.sessionId)
      setHealth(100)
      setPlayTimeSeconds(0)
      setHintsUsed(0)
      const startFloorNumber = Number.isFinite(normalized.currentFloor)
        ? normalized.currentFloor
        : (normalized.currentRoom?.floorNumber ?? 1)
      const startIndex = getRoomIndexFromFloor(startFloorNumber)
      setCurrentRoomIndex(startIndex)
      setVisitedFloors(new Set([startIndex]))
      if (normalized.eventLog) {
        addLog('system', '수사가 시작되었습니다.')
      }

      return normalized
    } catch (err) {
      console.error('[GameRoom] initializeNewGame 에러:', err)
      setGameInitError(err.message || '게임 시작에 실패했습니다.')
      toast.error(err.message || '게임 시작에 실패했습니다.')
    } finally {
      setGameInitializing(false)
    }
  }, [activeScenarioId, addLog, getRoomIndexFromFloor])
  const resumeGame = useCallback(async (resumeId) => {
    try {
      setGameInitializing(true)
      setGameInitError(null)
      const response = await fetchResume(resumeId)
      const normalized = normalizeResumeResponse(response)

      if (!normalized.sessionId) {
        throw new Error('세션 ID를 받지 못했습니다.')
      }

      setSessionId(normalized.sessionId)
      setHealth(normalized.health || 100)
      setPlayTimeSeconds(normalized.playTime || 0)
      setHintsUsed(0)
      const resumeFloorNumber = Number.isFinite(normalized.currentFloor)
        ? normalized.currentFloor
        : (normalized.currentRoom?.floorNumber ?? 1)
      const resumeIndex = getRoomIndexFromFloor(resumeFloorNumber)
      setCurrentRoomIndex(resumeIndex)
      setVisitedFloors(new Set([resumeIndex]))
      if (normalized.scenarioId) {
        setActiveScenarioId(normalized.scenarioId)
      }

      // 로그 복원
      if (Array.isArray(normalized.board?.nodes)) {
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
      console.error('[GameRoom] resumeGame 에러:', err)
      setGameInitError(err.message || '이어하기에 실패했습니다.')
      toast.error(err.message || '이어하기에 실패했습니다.')
    } finally {
      setGameInitializing(false)
    }
  }, [addLog, collectEvidence, getRoomIndexFromFloor])

  // 컴포힌트 마운????게임 초기??
  useEffect(() => {
    if (sessionId || gameInitializing || gameInitError) return

    if (resumeSessionId) {
      resumeGame(resumeSessionId)
    } else if (activeScenarioId && scenario && !scenarioLoading) {
      initializeNewGame()
    }
  }, [resumeSessionId, activeScenarioId, scenario?.id, scenarioLoading, sessionId, gameInitializing, gameInitError, initializeNewGame, resumeGame])

  useLayoutEffect(() => {
    if (activeScenarioId) {
      localStorage.removeItem(`board-items-${activeScenarioId}`)
      localStorage.removeItem(`board-connections-${activeScenarioId}`)
    }
  }, [activeScenarioId])
  useEffect(() => {
    if (!activeScenarioId) return

    resetSession()
    setCurrentRoomIndex(0)
    setSelectedEvidence(null)

    setPhoneOpen(false)
    setCurrentChat(null)

    setSubmitAnswerOpen(false)
    setReviewModalOpen(false)
    setReportModalOpen(false)

    const initialMsg = getHelperInitialMessage(scenario?.title || '사건')
    setChatHistories({ helper: [initialMsg] })

    setPhoneNotification(initialMsg.text)
    const timer = setTimeout(() => setPhoneNotification(null), 3000)
    return () => clearTimeout(timer)
  }, [activeScenarioId, scenario?.title, resetSession])
  useEffect(() => {
    if (!sessionId) return

    const timer = setInterval(() => {
      setPlayTimeSeconds(prev => prev + 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [sessionId])

  const handleClueInspected = useCallback(async (clue) => {
    if (!clue || !sessionId) return

    const clueId = clue.clueId || clue.evidenceId
    if (!clueId) return

    try {
      const response = await discoverClue(sessionId, clueId)
      const normalized = normalizeDiscoveredClueResponse(response)
      const clueData = normalized.clue

      if (!clueData) {
        console.error('단서 데이터가 없습니다:', response)
        return
      }
      const evidence = {
        id: clueData.id,
        name: clueData.name,
        description: clueData.description,
        importance: clueData.importance,
        detailImageUrl: clueData.detailImageUrl,
        assistantComment: clueData.assistantComment,
        location: currentRoom?.name || '현장',
        discoveredAt: normalized.discoveredAt,
      }
      collectEvidence(evidence)
      addLog('evidence', `${evidence.name} 단서를 발견했습니다.`)
      const cluesResponse = await fetchClues(sessionId)
      const cluesNormalized = normalizeClueListResponse(cluesResponse)
      setApiClues(cluesNormalized.clues || [])
      refetchLogs?.()
    } catch (err) {
      if (err.message?.includes('이미') || err.message?.includes('already')) {
        console.log('이미 발견된 단서입니다.')
      } else {
        console.error('단서 발견 실패:', err)
        toast.error('단서 발견에 실패했습니다.')
      }
    }
  }, [sessionId, collectEvidence, currentRoom, addLog, refetchLogs])

  const handleRoomChanged = useCallback(async (roomIndex) => {
    if (!Number.isFinite(roomIndex)) return
    if (!rooms || rooms.length === 0) return

    const validIndex = Math.max(0, Math.min(roomIndex, rooms.length - 1))
    const prevIndex = currentRoomIndexRef.current
    const hasChanged = validIndex !== prevIndex
    if (hasChanged) {
      setCurrentRoomIndex(validIndex)
    }

    const room = rooms[validIndex]
    const targetFloor = Number.isFinite(room?.floorNumber) ? room.floorNumber : (validIndex + 1)

    if (sessionId && hasChanged) {
      try {
        await moveFloor(sessionId, targetFloor)
        refetchLogs?.()
      } catch (err) {
        console.error('층 이동 API 오류:', err)
      }
    }
    const isFirstVisit = !visitedFloors.has(validIndex)
    if (isFirstVisit) {
      setVisitedFloors(prev => new Set([...prev, validIndex]))

      const room = rooms[validIndex]
      if (room) {
        // 濡쒓렇 異붽?
        addLog('system', `${room.name}에 도착했습니다.`)
      }
    }
  }, [rooms, visitedFloors, addLog, sessionId, refetchLogs])

  const handleSendMessage = async (contactId, text) => {
    const timeStr = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })

    const newMessage = {
      id: Date.now(),
      sender: 'user',
      text,
      time: timeStr
    }

    setChatHistories(prev => ({
      ...prev,
      [contactId]: [...(prev[contactId] || []), newMessage]
    }))

    const isHelper = contactId === 'helper'

    if (isHelper) {
      setTimeout(() => {
        const responseMessage = {
          id: Date.now(),
          sender: contactId,
          text: "네, 알겠습니다. 그 부분은 제가 조사해볼게요.",
          time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
        }
        setChatHistories(prev => ({
          ...prev,
          [contactId]: [...(prev[contactId] || []), responseMessage]
        }))
      }, 500)
    } else {
      setTimeout(() => {
        const responseMessage = {
          id: Date.now(),
          sender: contactId,
          text: "그 부분에 대해서는 아직 알고 있는 바가 없습니다...",
          time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
        }
        setChatHistories(prev => ({
          ...prev,
          [contactId]: [...(prev[contactId] || []), responseMessage]
        }))
        addLog('interrogation', `용의자 신문을 진행했습니다.`)
      }, 500)
    }
  }
  const handleContactSelect = useCallback((contact) => {
  }, [])

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
    if (!window.confirm('정말 종료하시겠습니까?')) return
    setLocation('/scenarios')
  }, [setLocation])

  const handleSubmitClick = () => {
    if (!sessionId) {
      toast.error('게임 세션이 초기화되지 않았습니다.')
      return
    }
    setSubmitAnswerOpen(true)
  }

  const handleAnswerSubmit = async ({ submissionItems, confirmedConnections, motive }) => {
    if (!sessionId) return

    try {
      const suspects = submissionItems.filter(item => item.type === 'suspect')
      const evidences = submissionItems.filter(item => item.type === 'evidence')
      const locations = submissionItems.filter(item => item.type === 'location')
      const suspectConnectionCounts = {}
      confirmedConnections.forEach(conn => {
        suspects.forEach(s => {
          if (conn.from === s.id || conn.to === s.id) {
            suspectConnectionCounts[s.id] = (suspectConnectionCounts[s.id] || 0) + 1
          }
        })
      })

      const culpritItem = suspects.reduce((max, s) =>
        (suspectConnectionCounts[s.id] || 0) > (suspectConnectionCounts[max?.id] || 0) ? s : max
      , suspects[0])
      const culpritConnectedEvidence = evidences.find(e =>
        confirmedConnections.some(conn =>
          (conn.from === culpritItem?.id && conn.to === e.id) ||
          (conn.to === culpritItem?.id && conn.from === e.id)
        )
      )
      const locationFloor = locations[0]?.floorNumber || rooms?.[0]?.floorNumber || 1

      const submitData = {
        culpritId: culpritItem?.suspectId || culpritItem?.targetId || parseInt(String(culpritItem?.id).replace('suspect-', '')) || 1,
        weaponClueId: culpritConnectedEvidence?.evidenceId || culpritConnectedEvidence?.targetId || parseInt(String(culpritConnectedEvidence?.id).replace('evidence-', '')) || 1,
        locationFloor,
        motive: motive || '범행 동기 추리',
        causeOfDeath: '사인 추리', // 추후 입력 값으로 변경 가능
      }

      setSubmitAnswerOpen(false)
      const result = await submitAnswer(sessionId, submitData)

      if (result.status === 'COMPLETED') {
        toast.success(`사건 해결! 등급: ${result.rankGrade}, 점수: ${result.finalScore}`)
        setReviewModalOpen(true)
      } else if (result.status === 'WRONG_ANSWER') {
        toast.error('오답입니다. 남은 기회: ' + result.remainingAttempts + '회')
        if (result.remainingAttempts > 0) {
          setSubmitAnswerOpen(true)
        }
      } else if (result.status === 'FAILED') {
        toast.error('게임 오버! 기회를 모두 소진했습니다.')
      } else if (result.status === 'BOARD_INVALID') {
        toast.error(result.errorMessage || '추리보드가 유효하지 않습니다.')
        setSubmitAnswerOpen(true)
      }
    } catch (err) {
      toast.error(err.message || '제출에 실패했습니다.')
      setSubmitAnswerOpen(true)
    }
  }

  const handleReviewSubmit = async (difficulty, rating, review) => {
    if (!activeScenarioId) return

    try {
      setReviewModalOpen(false)
      await submitReview(activeScenarioId, {
        rating,
        difficulty: difficulty.toUpperCase(),
        content: review,
        isSpoiler: false,
      })
      const reportData = await fetchReport(sessionId)
      if (reportData) {
        setReportModalOpen(true)
      }
    } catch (err) {
      toast.error('보고서 생성에 실패했습니다.')
    }
  }

  const handleAddToBoard = (item, type) => {
    if (!item) return
    if (type === 'evidence') setSelectedEvidence(null)
    setBoardPanelOpen(true)
    setPendingAddItem({ type, data: item })
  }
  const handleOpeningComplete = useCallback(() => {
    setGamePhase('victim')
  }, [])

  const handleOpeningSkip = useCallback(() => {
    setGamePhase('main')
  }, [])

  const handleVictimComplete = useCallback(() => {
    setGamePhase('main')
  }, [])
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">게임을 불러오는 중..</p>
        </div>
      </div>
    )
  }
  if (hasError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">시나리오를 불러오는 데 실패했습니다.</p>
          <Button onClick={() => window.location.href = '/scenarios'}>시나리오 목록</Button>
        </div>
      </div>
    )
  }
  if (gamePhase === 'opening' && scenario && !resumeSessionId) {
    return (
      <OpeningPhase
        scenario={scenario}
        onComplete={handleOpeningComplete}
        onSkip={handleOpeningSkip}
      />
    )
  }
  if (gamePhase === 'victim' && scenario && !resumeSessionId) {
    return (
      <VictimIntroPhase
        victim={scenario.victim}
        onComplete={handleVictimComplete}
      />
    )
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 pointer-events-none" />
      <div className="absolute inset-0 bg-black/40 pointer-events-none" />

      
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
            <div className="flex items-center gap-2 min-w-0">
              <span className="flex items-center gap-1 text-[11px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/25 to-yellow-300/10 border border-amber-400/40 text-amber-200 shadow-[0_0_8px_rgba(251,191,36,0.25)]">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-300 animate-pulse" />
                FLOOR {currentFloorNumber}
              </span>
              <span className="text-sm font-bold gold-glow truncate">{scenario?.title || '시나리오'}</span>
            </div>
          </div>

	          <div className="w-full h-[calc(100%-40px)] bg-black/40 relative">
	            
	            {sessionId ? (
	              <AgitRoom
	                key={`${activeScenarioId}-${sessionId}`}
	                clues={clues}
	                onClueInspected={handleClueInspected}
	                onRoomChanged={handleRoomChanged}
                initialRoomIndex={currentRoomIndex}
	              />
	            ) : gameInitError ? (
	              <div className="w-full h-full flex items-center justify-center">
	                <div className="text-center">
	                  <p className="text-red-400 mb-4">{gameInitError}</p>
	                  <Button onClick={initializeNewGame} variant="outline">
	                    다시 시도
	                  </Button>
	                </div>
	              </div>
	            ) : (
	              <div className="w-full h-full flex items-center justify-center">
	                <div className="text-center">
	                  <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
	                  <p className="text-muted-foreground text-sm">게임을 준비하고 있습니다..</p>
	                </div>
	              </div>
	            )}
	          </div>
	        </div>
	      </div>

      
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

      
      <RightLogSidebar
        isOpen={rightLogOpen}
        onToggle={() => setRightLogOpen(!rightLogOpen)}
        logs={logs}
      />

      
	      <BottomBoardPanel
	        isOpen={boardPanelOpen}
	        onOpenChange={setBoardPanelOpen}
	        scenarioId={activeScenarioId}
	        victim={scenario?.victim || null}
	        leftOffsetPx={leftPanelOpen ? SIDE_PANEL_WIDTH_PX : 0}
	        rightOffsetPx={rightLogOpen ? SIDE_PANEL_WIDTH_PX : 0}
	        pendingAddItem={pendingAddItem}
	        onConsumePendingAddItem={() => setPendingAddItem(null)}
	      />

      
      <div className="fixed right-6 bottom-6 z-40 flex items-center gap-3">
        
        <div className="relative">
          <button
            onClick={() => setPhoneOpen(!phoneOpen)}
            className="w-14 h-14 bg-card/90 border-2 border-blue-500 rounded-full shadow-lg hover:scale-105 transition-transform flex items-center justify-center"
          >
            <Smartphone className="w-6 h-6 text-blue-500" />
          </button>

          
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

      
      <PhoneUI
        isOpen={phoneOpen}
        onClose={() => setPhoneOpen(false)}
        helper={helperInfo}
        suspects={suspects}
        chatHistories={chatHistories}
        onSendMessage={handleSendMessage}
        currentChat={currentChat}
        setCurrentChat={setCurrentChat}
        onContactSelect={handleContactSelect}
      />

      {/* 모달??*/}
      <EvidenceDetailModal evidence={selectedEvidence} onClose={() => setSelectedEvidence(null)} />
	      <SubmitAnswerModal
	        isOpen={submitAnswerOpen}
	        onClose={() => setSubmitAnswerOpen(false)}
	        onSubmit={handleAnswerSubmit}
	        scenarioId={activeScenarioId}
	        victim={scenario?.victim || null}
	      />
      <ReviewModal isOpen={reviewModalOpen} onSubmit={handleReviewSubmit} />
      <ReportModal isOpen={reportModalOpen} onClose={() => setReportModalOpen(false)} report={report} />
    </div>
  )
}























