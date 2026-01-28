import React, { useCallback, useEffect, useLayoutEffect, useState, useMemo } from 'react'
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
// 오프닝 페이즈 (시나리오 도입 나레이션)
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
                text={scenario.synopsisDetail || scenario.synopsis || '사건이 발생했습니다. 진실을 밝혀내세요.'}
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
// 피해자 소개 페이즈
// ========================================
function VictimIntroPhase({ victim, onComplete }) {
  // 피해자 정보 없으면 바로 완료
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
                <p className="text-muted-foreground">{victim.age}세, {victim.gender}</p>
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

  // /game/:scenarioId 경로 (새 게임)
  const [matchGame, paramsGame] = useRoute('/game/:scenarioId')
  // /room/:scenarioId/solo 경로 (새 게임)
  const [matchSolo, paramsSolo] = useRoute('/room/:scenarioId/solo')
  // /room/:sessionId/resume 경로 (이어하기)
  const [matchResume, paramsResume] = useRoute('/room/:sessionId/resume')

  const initialScenarioId = paramsGame?.scenarioId
    ? parseInt(paramsGame.scenarioId)
    : paramsSolo?.scenarioId
      ? parseInt(paramsSolo.scenarioId)
      : null
  const resumeSessionId = paramsResume?.sessionId ? parseInt(paramsResume.sessionId) : null

  // 이어하기 시 resume API에서 scenarioId를 가져와서 상태로 관리
  const [activeScenarioId, setActiveScenarioId] = useState(initialScenarioId)

  // scenarioId가 변경되면 activeScenarioId도 업데이트
  useEffect(() => {
    if (initialScenarioId) {
      setActiveScenarioId(initialScenarioId)
    }
  }, [initialScenarioId])

  // 시나리오 정보 조회 (API) - 이어하기가 아닐 때만 조회
  const { scenario, loading: scenarioLoading, error: scenarioError } = useScenarioById(activeScenarioId)

  // 방 데이터 조회 (API) - activeScenarioId 사용
  const { rooms, loading: roomsLoading } = useGameRooms(activeScenarioId)

  // 게임 세션 ID (API 호출용)
  const [sessionId, setSessionId] = useState(null)

  // 게임 페이즈: 'opening' -> 'victim' -> 'main'
  // 이어하기면 바로 'main'
  const [gamePhase, setGamePhase] = useState(resumeSessionId ? 'main' : 'opening')

  // API 단서 데이터
  const [apiClues, setApiClues] = useState([])

  // 게임 로그 조회 (API) - sessionId 전달하여 백엔드 로그 가져오기
  const { logs, addLog, resetLogs, refetch: refetchLogs } = useGameLogs(sessionId)

  // 게임 제출 Hook
  const { submitGame, loading: submitLoading, result: submitResult } = useGameSubmission()

  // 수사보고서 Hook
  const { report, loading: reportLoading, fetchReport, submitReview } = useGameReport()

  // 세션 상태 (sessionId는 위에서 선언됨)
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

  // 휴대폰 관련 상태
  const [phoneOpen, setPhoneOpen] = useState(false)
  const [chatHistories, setChatHistories] = useState({})
  const [currentChat, setCurrentChat] = useState(null)
  const [phoneNotification, setPhoneNotification] = useState(null)

  const [submitAnswerOpen, setSubmitAnswerOpen] = useState(false)
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [reportModalOpen, setReportModalOpen] = useState(false)

  // 방문한 층 (첫 방문 여부 체크용)
  const [visitedFloors, setVisitedFloors] = useState(new Set([0]))

  const SIDE_PANEL_WIDTH_PX = 288

  // 용의자 데이터 (시나리오에서 가져옴)
  const suspects = scenario?.suspects || []

  // 증거 목록 = 발견된 증거

  // 현재 방
  const currentRoom = rooms?.[currentRoomIndex] || rooms?.[0] || null

  // 세션 시작 후 단서 목록 가져오기
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

  // 단서 데이터 (Phaser용) - API에서 가져온 데이터 사용
  const clues = useMemo(() => {
    if (roomsLoading) return []
    if (!apiClues || apiClues.length === 0) return []

    // 방 내 단서 위치 (방마다 최대 3개 단서 배치용)
    const positionsPerRoom = [
      { localX: 90, localY: 200 },
      { localX: 235, localY: 220 },
      { localX: 150, localY: 260 },
    ]

    const undiscoveredClues = apiClues.filter(clue => !clue.discovered)

    // 방별로 단서를 그룹화하여 인덱스 관리
    const clueCountByRoom = {}

    return undiscoveredClues.map((clue) => {
      // rooms가 비어있으면 floorNumber를 roomIndex로 사용
      let roomIndex = 0
      if (rooms && rooms.length > 0) {
        const foundIndex = rooms.findIndex(r => r.floorNumber === clue.floorNumber)
        roomIndex = foundIndex >= 0 ? foundIndex : (clue.floorNumber || 0)
      } else {
        roomIndex = clue.floorNumber || 0
      }

      // 해당 방에서 몇 번째 단서인지 계산
      const countInRoom = clueCountByRoom[roomIndex] || 0
      clueCountByRoom[roomIndex] = countInRoom + 1

      // 방 내에서의 위치 (최대 3개까지, 그 이후는 순환)
      const pos = positionsPerRoom[countInRoom % positionsPerRoom.length]

      return {
        clueId: clue.id,
        evidenceId: clue.id,
        title: clue.name || '알 수 없는 단서',
        body: clue.description || `단서를 조사해보세요.`,
        roomIndex,
        localX: pos.localX,
        localY: pos.localY,
        importance: clue.importance,
      }
    })
  }, [apiClues, rooms, roomsLoading])

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
      setCurrentRoomIndex(0)

      // 초기 로그 추가
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
  }, [activeScenarioId, addLog])

  // 게임 이어하기
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
      setCurrentRoomIndex(normalized.currentFloor || 0)

      // 이어하기 시 scenarioId 설정
      if (normalized.scenarioId) {
        setActiveScenarioId(normalized.scenarioId)
      }

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
      console.error('[GameRoom] resumeGame 에러:', err)
      setGameInitError(err.message || '이어하기에 실패했습니다.')
      toast.error(err.message || '이어하기에 실패했습니다.')
    } finally {
      setGameInitializing(false)
    }
  }, [addLog, collectEvidence])

  // 컴포넌트 마운트 시 게임 초기화
  useEffect(() => {
    // 이미 세션이 있거나 초기화 중이거나 에러 상태면 스킵
    if (sessionId || gameInitializing || gameInitError) return

    if (resumeSessionId) {
      // 이어하기 모드
      resumeGame(resumeSessionId)
    } else if (activeScenarioId && scenario && !scenarioLoading) {
      // 새 게임 시작 (시나리오 로딩 완료 후)
      initializeNewGame()
    }
  }, [resumeSessionId, activeScenarioId, scenario?.id, scenarioLoading, sessionId, gameInitializing, gameInitError, initializeNewGame, resumeGame])

  useLayoutEffect(() => {
    if (activeScenarioId) {
      localStorage.removeItem(`board-items-${activeScenarioId}`)
      localStorage.removeItem(`board-connections-${activeScenarioId}`)
    }
  }, [activeScenarioId])

  // 시나리오 시작/변경 시 세션 초기화 (로그 추가는 initializeNewGame/resumeGame에서만)
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

    // 시스템 로그는 initializeNewGame/resumeGame에서 추가하므로 여기서 중복 제거

    const initialMsg = getHelperInitialMessage(scenario?.title || '사건')
    setChatHistories({ helper: [initialMsg] })

    setPhoneNotification(initialMsg.text)
    const timer = setTimeout(() => setPhoneNotification(null), 3000)
    return () => clearTimeout(timer)
  }, [activeScenarioId, scenario?.title, resetSession])

  // 플레이 시간 타이머
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
      // 백엔드에 단서 발견 요청
      const response = await discoverClue(sessionId, clueId)

      // 응답 정규화
      const normalized = normalizeDiscoveredClueResponse(response)
      const clueData = normalized.clue

      if (!clueData) {
        console.error('단서 데이터가 없습니다:', response)
        return
      }

      // 증거 객체 생성 (API 응답 데이터만 사용)
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

      // 로그 추가
      addLog('evidence', `${evidence.name} 단서를 발견했습니다.`)

      // 단서 목록 새로고침
      const cluesResponse = await fetchClues(sessionId)
      const cluesNormalized = normalizeClueListResponse(cluesResponse)
      setApiClues(cluesNormalized.clues || [])

      // 백엔드 로그도 새로고침
      refetchLogs?.()
    } catch (err) {
      // 이미 발견된 단서면 에러 무시
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
    setCurrentRoomIndex(validIndex)

    // 첫 방문 체크
    const isFirstVisit = !visitedFloors.has(validIndex)
    if (isFirstVisit) {
      setVisitedFloors(prev => new Set([...prev, validIndex]))

      const room = rooms[validIndex]
      if (room) {
        // 로그 추가
        addLog('system', `${room.name}에 도착했습니다.`)

        // 백엔드에 층 이동 알림 (첫 방문 시)
        if (sessionId) {
          try {
            await moveFloor(sessionId)
            refetchLogs?.()
          } catch (err) {
            console.error('층 이동 API 오류:', err)
          }
        }
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
      // 조력자는 더미 응답
      setTimeout(() => {
        const responseMessage = {
          id: Date.now(),
          sender: contactId,
          text: "네, 알겠습니다. 그 부분에 대해 조사해볼게요.",
          time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
        }
        setChatHistories(prev => ({
          ...prev,
          [contactId]: [...(prev[contactId] || []), responseMessage]
        }))
      }, 500)
    } else {
      // 용의자 심문 - 임시 로컬 응답 (API 연결 전)
      setTimeout(() => {
        const responseMessage = {
          id: Date.now(),
          sender: contactId,
          text: "그 부분에 대해서는 제가 알고 있는 바가 없습니다...",
          time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
        }
        setChatHistories(prev => ({
          ...prev,
          [contactId]: [...(prev[contactId] || []), responseMessage]
        }))
        addLog('interrogation', `용의자 심문을 진행했습니다.`)
      }, 500)
    }
  }

  // 연락처 선택 시 (API 연결 전이라 별도 처리 없음)
  const handleContactSelect = useCallback((contact) => {
    // 채팅 기록은 로컬 상태로 관리
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

  const handleAnswerSubmit = async ({ submissionItems, confirmedConnections, motive }) => {
    if (!sessionId) return

    try {
      // 추리보드에서 범인, 흉기, 장소 추출
      const suspects = submissionItems.filter(item => item.type === 'suspect')
      const evidences = submissionItems.filter(item => item.type === 'evidence')
      const locations = submissionItems.filter(item => item.type === 'location')

      // 가장 많이 연결된 용의자를 범인으로 지목
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

      // 범인과 연결된 증거 중 하나를 흉기로
      const culpritConnectedEvidence = evidences.find(e =>
        confirmedConnections.some(conn =>
          (conn.from === culpritItem?.id && conn.to === e.id) ||
          (conn.to === culpritItem?.id && conn.from === e.id)
        )
      )

      // 첫 번째 장소의 floorNumber 사용
      const locationFloor = locations[0]?.floorNumber || rooms?.[0]?.floorNumber || 1

      const submitData = {
        culpritId: culpritItem?.suspectId || culpritItem?.targetId || parseInt(String(culpritItem?.id).replace('suspect-', '')) || 1,
        weaponClueId: culpritConnectedEvidence?.evidenceId || culpritConnectedEvidence?.targetId || parseInt(String(culpritConnectedEvidence?.id).replace('evidence-', '')) || 1,
        locationFloor,
        motive: motive || '범행 동기 추리',
        causeOfDeath: '사인 추리', // 추후 입력 폼 추가 가능
      }

      setSubmitAnswerOpen(false)

      // 최종 제출 API 호출
      const result = await submitAnswer(sessionId, submitData)

      if (result.status === 'COMPLETED') {
        toast.success(`사건 해결! 랭크: ${result.rankGrade}, 점수: ${result.finalScore}`)
        setReviewModalOpen(true)
      } else if (result.status === 'WRONG_ANSWER') {
        toast.error(`틀렸습니다. 남은 기회: ${result.remainingAttempts}회`)
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

      // 리뷰 작성
      await submitReview(activeScenarioId, {
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

  // 오프닝 페이즈 핸들러
  const handleOpeningComplete = useCallback(() => {
    setGamePhase('victim')
  }, [])

  const handleOpeningSkip = useCallback(() => {
    setGamePhase('main')
  }, [])

  const handleVictimComplete = useCallback(() => {
    setGamePhase('main')
  }, [])

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

  // 오프닝 페이즈 (새 게임 시작 시)
  if (gamePhase === 'opening' && scenario && !resumeSessionId) {
    return (
      <OpeningPhase
        scenario={scenario}
        onComplete={handleOpeningComplete}
        onSkip={handleOpeningSkip}
      />
    )
  }

  // 피해자 소개 페이즈
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
	            {/* sessionId가 있으면 AgitRoom 렌더링 */}
	            {sessionId ? (
	              <AgitRoom
	                key={`${activeScenarioId}-${sessionId}`}
	                clues={clues}
	                onClueInspected={handleClueInspected}
	                onRoomChanged={handleRoomChanged}
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
	                  <p className="text-muted-foreground text-sm">게임을 준비하는 중...</p>
	                </div>
	              </div>
	            )}
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
	        scenarioId={activeScenarioId}
	        victim={scenario?.victim || null}
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
        onContactSelect={handleContactSelect}
      />

      {/* 모달들 */}
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
