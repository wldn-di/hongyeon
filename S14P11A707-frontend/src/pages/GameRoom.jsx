import React, { useCallback, useEffect, useState, useMemo, useRef } from 'react'
import { useLocation, useRoute } from 'wouter'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { DoorOpen, Heart, Clock, Lightbulb, Send, MessageCircle, MapPin, Smartphone, Loader2, ArrowRight, Users } from 'lucide-react'
import LeftEvidencePanel from "@/features/game/panels/LeftEvidencePanel"
import RightLogSidebar from "@/features/game/panels/RightLogSidebar"
import BottomBoardPanel from "@/features/game/panels/BottomBoardPanel"
import { ReportModal, EvidenceDetailModal, SubmitAnswerModal, ReviewModal, GameEndModal } from '@/features/game/modals'
import PhoneUI from '@/features/game/components/PhoneUI'
import AgitRoom from '@/features/game/engine/AgitRoom'
import TypingText from '@/features/tutorial/components/TypingText'
import WatsonDialog from '@/features/tutorial/components/WatsonDialog'
import { useGameSession } from '@/features/game/session'
import { useScenarioById } from '@/features/scenarios/hooks/useScenarioById'
import { useGameRooms } from '@/features/game/hooks/useGameRooms'
import { useGameLogs } from '@/features/game/hooks/useGameLogs'
import { useGameSubmission } from '@/features/game/hooks/useGameSubmission'
import { useGameReport } from '@/features/game/hooks/useGameReport'
import { startGame, endGame, saveGame, fetchResume, moveFloor, submitAnswer } from '@/features/session/api/sessionApi'
import { fetchClues, discoverClue } from '@/features/session/api/cluesApi'
import { normalizeGameStartResponse, normalizeResumeResponse, normalizeGameEndResponse, normalizeClueListResponse, normalizeDiscoveredClueResponse } from '@/features/session/api/sessionMappers'
import { fetchClueDetail } from '@/features/session/api/cluesApi'
import { normalizeClueDetailResponse } from '@/features/session/api/sessionMappers'
import { chatWithSuspect, fetchChatHistory } from '@/features/session/api/sessionApi'

import { toast } from 'sonner'
import { alertError } from '@/components/ui/AlertModal'
import { cn } from '@/lib/utils'

const START_GAME_DEDUP_MS = 5000
const startGameDedupStore = {
  inFlight: new Map(),
  resolved: new Map(),
}

const startGameDedup = async (scenarioId) => {
  const key = String(scenarioId ?? '')
  const cached = startGameDedupStore.resolved.get(key)
  if (cached && Date.now() - cached.at < START_GAME_DEDUP_MS) {
    return cached.value
  }

  const inFlight = startGameDedupStore.inFlight.get(key)
  if (inFlight) return inFlight

  const promise = startGame(scenarioId)
    .then((value) => {
      startGameDedupStore.resolved.set(key, { value, at: Date.now() })
      return value
    })
    .finally(() => {
      startGameDedupStore.inFlight.delete(key)
    })

  startGameDedupStore.inFlight.set(key, promise)
  return promise
}

// ========================================
// 오프닝 페이즈 (시나리오 도입 나레이션)
// ========================================
function OpeningPhase({ scenario, openingNarration, onComplete, onSkip }) {
  const [stage, setStage] = useState('title')

  if (!scenario) return null

  // 오프닝 텍스트: GameStartResponse의 opening 우선, 없으면 시나리오 fallback
  const openingText = openingNarration || scenario.synopsisDetail || scenario.synopsis || '사건이 발생했습니다. 진실을 밝혀주세요.'

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
            <p className="text-lg text-amber-100/80 leading-loose whitespace-pre-line" style={{ letterSpacing: '0.05em', lineHeight: '2' }}>
              <TypingText
                text={openingText}
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
            <p className="text-lg text-amber-100/80 leading-loose whitespace-pre-line mb-8" style={{ letterSpacing: '0.05em', lineHeight: '2' }}>
              {openingText}
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

const clampFloor = (value, fallback = 1) => {
  const num = Number(value)
  if (!Number.isFinite(num)) return fallback
  return Math.min(6, Math.max(1, Math.trunc(num)))
}

const hashString = (value) => {
  const str = String(value ?? "")
  let hash = 5381
  for (let i = 0; i < str.length; i += 1) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i)
  }
  return Math.abs(hash)
}

const getCluePosition = (roomIndex, clueId) => {
  // Stable positions per clue id so removing one clue doesn't move others
  const seed = hashString(`${roomIndex}-${clueId}`)
  const slots = [
    { localX: 62, localY: 176 },
    { localX: 228, localY: 188 },
    { localX: 132, localY: 238 },
    { localX: 86, localY: 262 },
    { localX: 206, localY: 248 },
    { localX: 168, localY: 172 },
    { localX: 112, localY: 210 },
    { localX: 246, localY: 226 },
  ]
  const slot = slots[seed % slots.length]
  // Small per-room drift to avoid identical placement across floors
  const driftX = ((roomIndex * 23) % 19) - 9
  const driftY = ((roomIndex * 17) % 21) - 10
  return {
    localX: Math.max(40, Math.min(250, slot.localX + driftX)),
    localY: Math.max(140, Math.min(280, slot.localY + driftY)),
  }
}


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
  const [remainingAttempts, setRemainingAttempts] = useState(3)  // ✅ 제출 횟수
  const [leftPanelOpen, setLeftPanelOpen] = useState(true)
  const [rightLogOpen, setRightLogOpen] = useState(true)
  const [boardPanelOpen, setBoardPanelOpen] = useState(false)
  const [pendingAddItem, setPendingAddItem] = useState(null)
  const [selectedEvidence, setSelectedEvidence] = useState(null)
  const [currentRoomIndex, setCurrentRoomIndex] = useState(0)
  const [gameInitializing, setGameInitializing] = useState(false)
  const [gameInitError, setGameInitError] = useState(null)
  const gameInitInFlightRef = useRef(false)

  const { discoveredEvidence, collectEvidence, resetSession } = useGameSession()

  const currentRoomIndexRef = useRef(currentRoomIndex)
  currentRoomIndexRef.current = currentRoomIndex

  // 초기화 중복 방지용 ref
  const isInitializedRef = useRef(false)

  // 함수 ref (useEffect에서 최신 함수 참조용)
  const resumeGameRef = useRef(null)
  const initializeNewGameRef = useRef(null)

  const [phoneOpen, setPhoneOpen] = useState(false)
  const [chatHistories, setChatHistories] = useState({})
  const [currentChat, setCurrentChat] = useState(null)
  const [phoneNotification, setPhoneNotification] = useState(null)

  const [submitAnswerOpen, setSubmitAnswerOpen] = useState(false)
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [reportModalOpen, setReportModalOpen] = useState(false)

  // 게임 종료 모달 상태
  const [gameEndModalOpen, setGameEndModalOpen] = useState(false)
  const [gameEndType, setGameEndType] = useState('fail') // 'success' | 'fail'
  const [gameEndResult, setGameEndResult] = useState(null)

  // 제출 결과 알림 모달 (광클 방지)
  const [submitResultModal, setSubmitResultModal] = useState({ open: false, message: '', type: 'error' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 채점 중 모달 상태
  const [gradingModal, setGradingModal] = useState({ open: false })

  // 채점 결과 발표 모달 상태 (정답/오답)
  const [resultAnnounceModal, setResultAnnounceModal] = useState({ open: false, isCorrect: false })

  // 방문한 층 (첫 방문 여부 체크용)
  const [visitedFloors, setVisitedFloors] = useState(new Set([1]))

  // 조수 다이얼로그 상태 (Watson 스타일)
  const [assistantDialog, setAssistantDialog] = useState(null)
  // 대기 중인 조수 코멘트 (게임 팝업 닫힌 후 표시)
  const [pendingAssistantComment, setPendingAssistantComment] = useState(null)

  // 오프닝 나레이션 (GameStartResponse에서 받음)
  const [openingNarration, setOpeningNarration] = useState(null)

  const SIDE_PANEL_WIDTH_PX = 288

  // 보드 로컬스토리지 초기화 함수
  const clearBoardLocalStorage = useCallback((scenarioId, sessId) => {
    // InvestigationBoard에서 사용하는 키 형식에 맞춰서 삭제
    // 시나리오 기반 키 (sessionId 없을 때 사용)
    if (scenarioId) {
      localStorage.removeItem(`board-scenario-${scenarioId}-items`)
      localStorage.removeItem(`board-scenario-${scenarioId}-connections`)
    }
    // 세션 기반 키 (sessionId 있을 때 사용)
    if (sessId) {
      localStorage.removeItem(`board-${sessId}-items`)
      localStorage.removeItem(`board-${sessId}-connections`)
    }
  }, [])

  // 용의자 데이터 (시나리오에서 가져옴)
  const suspects = scenario?.suspects || []

  // 증거 목록 = 발견된 증거

  // 현재 방
  const currentRoom = rooms?.[currentRoomIndex] || rooms?.[0] || null

  const currentFloorNumber = clampFloor(
    Number.isFinite(currentRoom?.floorNumber) ? currentRoom.floorNumber : (currentRoomIndex + 1),
    1,
  )

  const getRoomIndexFromFloor = useCallback((floorNumber) => {
    const safeFloor = clampFloor(floorNumber, 1)

    if (rooms && rooms.length > 0) {
      const foundIndex = rooms.findIndex(r => r.floorNumber === safeFloor)
      if (foundIndex >= 0) return foundIndex
      const fallbackIndex = safeFloor - 1
      return Math.max(0, Math.min(fallbackIndex, rooms.length - 1))
    }

    return Math.max(0, safeFloor - 1)
  }, [rooms])

  const loadCluesForSession = useCallback(async (nextSessionId) => {
    if (!nextSessionId) return null

    try {
      const response = await fetchClues(nextSessionId)
      const normalized = normalizeClueListResponse(response)
      setApiClues(normalized.clues || [])
      return normalized
    } catch (err) {
      console.error('Failed to fetch clues:', err)
      return null
    }
  }, [])

  // 조수 다이얼로그 표시 헬퍼
  const showAssistantDialog = useCallback((comment) => {
    if (!comment) return
    setAssistantDialog({
      speaker: "조수 왓슨",
      avatar: "🔍",
      messages: [comment]
    })
  }, [])

  // 조수 다이얼로그 닫기
  const handleAssistantDialogComplete = useCallback(() => {
    setAssistantDialog(null)
  }, [])

  // 단서 데이터 (Phaser용) - API에서 가져온 데이터 사용
  const clues = useMemo(() => {
    if (roomsLoading) return []
    if (!apiClues || apiClues.length === 0) return []

    const undiscoveredClues = apiClues.filter(clue => !clue.discovered)

    return undiscoveredClues.map((clue) => {
      // rooms가 비어있으면 floorNumber를 roomIndex로 사용
      let roomIndex = 0
      if (rooms && rooms.length > 0) {
        const clueFloor = clampFloor(clue.floorNumber, 1)
        const foundIndex = rooms.findIndex(r => r.floorNumber === clueFloor)
        roomIndex = foundIndex >= 0 ? foundIndex : (clueFloor - 1)
      } else {
        roomIndex = clampFloor(clue.floorNumber, 1) - 1
      }
      // Prefer backend-provided transform (stable + collision-free per scenario).
      const backendX = clue?.transform?.x
      const backendY = clue?.transform?.y
      const pos = (Number.isFinite(backendX) && Number.isFinite(backendY))
        ? { localX: backendX, localY: backendY }
        : getCluePosition(roomIndex, clue.id)

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

  // 로딩 상태
  const isLoading = scenarioLoading || roomsLoading || gameInitializing

  // 에러 상태
  const hasError = scenarioError || (!scenario && !scenarioLoading && !resumeSessionId && !gameInitializing)

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
    // 이미 초기화 중이면 스킵 (ref로 동기 체크)
    if (isInitializedRef.current) {
      console.log('[GameRoom] initializeNewGame: 이미 초기화 중 - 스킵')
      return
    }

    if (!activeScenarioId) {
      console.log('[GameRoom] initializeNewGame: activeScenarioId 없음')
      return
    }

    if (gameInitInFlightRef.current) {
      console.log('[GameRoom] initializeNewGame: already initializing')
      return
    }
    gameInitInFlightRef.current = true

    // 초기화 시작 표시
    isInitializedRef.current = true
    console.log('[GameRoom] initializeNewGame 시작:', activeScenarioId)

    // ✅ 새 게임 시작 전 시나리오 기반 보드 로컬스토리지 초기화 (이전 데이터 방지)
    clearBoardLocalStorage(activeScenarioId, null)

    try {
      setGameInitializing(true)
      setGameInitError(null)
      const response = await startGameDedup(activeScenarioId)
      console.log('[GameRoom] startGame 응답:', response)

      if (response?.alreadyPlaying) {
        const existingSessionId = response.sessionId
        if (existingSessionId) {
          setLocation(`/room/${existingSessionId}/resume`)
          return
        }
        throw new Error('진행중인 세션 정보를 찾을 수 없습니다.')
      }

      const normalized = normalizeGameStartResponse(response)
      console.log('[GameRoom] normalized:', normalized)

      if (!normalized.sessionId) {
        throw new Error('세션 ID를 받지 못했습니다.')
      }

      // ✅ 새 게임 시작 시 이전 보드 로컬스토리지 초기화
      clearBoardLocalStorage(activeScenarioId, normalized.sessionId)

      // 오프닝 나레이션 저장 (GameStartResponse에서)
      if (normalized.scenario?.opening) {
        setOpeningNarration(normalized.scenario.opening)
      }

      setSessionId(normalized.sessionId)
      setApiClues([])
      await loadCluesForSession(normalized.sessionId)
      setHealth(100)
      setPlayTimeSeconds(0)
      setRemainingAttempts(3)
      const startFloorNumber = clampFloor(
        Number.isFinite(normalized.currentFloor)
          ? normalized.currentFloor
          : (normalized.currentRoom?.floorNumber ?? 1),
        1,
      )
      const startIndex = getRoomIndexFromFloor(startFloorNumber)
      setCurrentRoomIndex(startIndex)
      setVisitedFloors(new Set([startFloorNumber]))
      if (normalized.eventLog) {
        addLog('system', '수사가 시작되었습니다.')
      }

      return normalized
    } catch (err) {
      console.error('[GameRoom] initializeNewGame 에러:', err)
      setGameInitError(err.message || '게임 시작에 실패했습니다.')
      toast.error(err.message || '게임 시작에 실패했습니다.')
    } finally {
      gameInitInFlightRef.current = false
      setGameInitializing(false)
    }
  }, [activeScenarioId, addLog, clearBoardLocalStorage, getRoomIndexFromFloor, loadCluesForSession, setLocation])

  const resumeGame = useCallback(async (resumeId) => {
    if (!resumeId) return

    if (gameInitInFlightRef.current) {
      console.log('[GameRoom] resumeGame: already initializing')
      return
    }
    gameInitInFlightRef.current = true

    // 이미 초기화 중이면 스킵 (ref로 동기 체크)
    if (isInitializedRef.current) {
      console.log('[GameRoom] resumeGame: 이미 초기화 중 - 스킵')
      return
    }

    // 초기화 시작 표시
    isInitializedRef.current = true

    // ✅ 이어하기 전 이전 보드 로컬스토리지 초기화 (깨진 데이터 방지)
    clearBoardLocalStorage(activeScenarioId, resumeId)

    try {
      setGameInitializing(true)
      setGameInitError(null)

      // 1. Resume API 호출
      const response = await fetchResume(resumeId)
      const normalized = normalizeResumeResponse(response)

      if (!normalized.sessionId) {
        throw new Error('세션 ID를 받지 못했습니다.')
      }

      // ✅ 세션 ID로도 보드 로컬스토리지 초기화
      clearBoardLocalStorage(null, normalized.sessionId)

      setSessionId(normalized.sessionId)
      setApiClues([])

      // 2. ✅ 단서 목록 API 호출 (발견 여부 포함)
      const cluesData = await loadCluesForSession(normalized.sessionId)

      // 3. ✅ 발견된 단서를 인벤토리에 추가
      if (cluesData?.clues && cluesData.clues.length > 0) {
        const discoveredClues = cluesData.clues.filter(clue => clue.discovered)

        discoveredClues.forEach(clue => {
          collectEvidence({
            id: clue.id,
            name: clue.name,
            description: clue.description,
            importance: clue.importance,
            detailImageUrl: clue.detailImageUrl,
            assistantComment: clue.assistantComment,
            location: `${clue.floorNumber}층`,
            discoveredAt: clue.discoveredAt,
          }, { log: false })  // 로그는 남기지 않음 (복원이므로)
        })

        console.log(`[Resume] ${discoveredClues.length}개의 발견된 단서를 인벤토리에 복원했습니다.`)
      }

      // 4. 기타 상태 복원
      setHealth(normalized.health || 100)
      setPlayTimeSeconds(normalized.playTime || 0)
      setRemainingAttempts(normalized.remainingAttempts ?? 3)

      const resumeFloorNumber = clampFloor(
        Number.isFinite(normalized.currentFloor)
          ? normalized.currentFloor
          : (normalized.currentRoom?.floorNumber ?? 1),
        1,
      )
      const resumeIndex = getRoomIndexFromFloor(resumeFloorNumber)
      setCurrentRoomIndex(resumeIndex)
      setVisitedFloors(new Set([resumeFloorNumber]))

      if (normalized.scenarioId) {
        setActiveScenarioId(normalized.scenarioId)
      }

      // 5. 보드 데이터 복원 (있는 경우)
      if (Array.isArray(normalized.board?.nodes)) {
        // 보드 노드 복원 로직 (필요 시 추가)
      }

      // 6. 용의자 채팅 기록 복원
      if (scenario?.suspects && scenario.suspects.length > 0) {
        const chatHistoriesFromApi = {}

        for (const suspect of scenario.suspects) {
          try {
            const history = await fetchChatHistory(normalized.sessionId, suspect.id)
            if (history?.messages && history.messages.length > 0) {
              chatHistoriesFromApi[suspect.id] = history.messages.map(msg => ({
                id: msg.messageId || Date.now(),
                sender: String(msg.role).toLowerCase() === 'user' ? 'user' : suspect.id,
                text: msg.content,
                time: new Date(msg.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
              }))
            }
          } catch (err) {
            console.error(`[Resume] 용의자 ${suspect.id} 채팅 기록 복원 실패:`, err)
          }
        }

        setChatHistories(prev => ({
          ...prev,
          ...chatHistoriesFromApi
        }))
      }
      addLog('system', '수사를 이어서 진행합니다.')

      return normalized

    } catch (err) {
      console.error('[GameRoom] resumeGame 에러:', err)
      setGameInitError(err.message || '이어하기에 실패했습니다.')
      toast.error(err.message || '이어하기에 실패했습니다.')
    } finally {
      gameInitInFlightRef.current = false
      setGameInitializing(false)
    }
  }, [activeScenarioId, addLog, clearBoardLocalStorage, collectEvidence, getRoomIndexFromFloor, loadCluesForSession, scenario?.suspects])

  // 함수 ref 업데이트 (useEffect에서 최신 함수 사용)
  resumeGameRef.current = resumeGame
  initializeNewGameRef.current = initializeNewGame

  // 컴포넌트 마운트 시 게임 초기화
  useEffect(() => {
    // 이미 세션이 있거나 초기화 중이거나 에러 상태면 스킵
    if (sessionId || gameInitializing || gameInitError) {
      return
    }

    if (resumeSessionId) {
      console.log('[GameRoom] useEffect - resume 호출')
      resumeGameRef.current?.(resumeSessionId)
    } else if (activeScenarioId && scenario && !scenarioLoading) {
      console.log('[GameRoom] useEffect - 새 게임 호출')
      initializeNewGameRef.current?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeSessionId, activeScenarioId, scenario?.id, scenarioLoading, sessionId, gameInitializing, gameInitError])

  // 시나리오 시작/변경 시 세션 초기화 (로그 추가는 initializeNewGame/resumeGame에서만)
  useEffect(() => {
    if (!activeScenarioId) return

    isInitializedRef.current = false
    setSessionId(null)
    setGameInitError(null)
    setGameInitializing(false)

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

  // 대기 중인 조수 코멘트 표시 (게임 팝업 닫힌 후 Space/ESC 감지)
  useEffect(() => {
    if (!pendingAssistantComment) return

    const handleKeyDown = (e) => {
      if (e.code === 'Space' || e.code === 'Escape') {
        // 약간의 딜레이 후 Watson 다이얼로그 표시 (게임 팝업이 완전히 닫힌 후)
        setTimeout(() => {
          showAssistantDialog(pendingAssistantComment)
          setPendingAssistantComment(null)
        }, 100)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [pendingAssistantComment, showAssistantDialog])

    //처음ㅁ&이어하기
    const handleEvidenceClick = useCallback(async (item) => {
      if (!sessionId || !item?.id) {
        setSelectedEvidence(item)
        return
      }
      try {
        const response = await fetchClueDetail(sessionId, item.id)
        const detail = normalizeClueDetailResponse(response)
        setSelectedEvidence(detail)
      } catch (err) {
        console.error('Failed to fetch clue detail:', err)
        setSelectedEvidence(item)
      }
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

      // 조수 코멘트가 있으면 대기 상태로 저장 (게임 팝업 닫힌 후 표시)
      if (clueData.assistantComment) {
        setPendingAssistantComment(clueData.assistantComment)
      }

      // 로컬 상태에서 즉시 discovered 처리 (재요청 레이스로 인한 "잠깐 다시 보임" 방지)
      setApiClues((prev) => {
        if (!Array.isArray(prev) || prev.length === 0) return prev
        const next = prev.map((item) => {
          if (item?.id !== clueId) return item
          return {
            ...item,
            discovered: true,
            discoveredAt: normalized.discoveredAt || item.discoveredAt || new Date().toISOString(),
          }
        })
        return next
      })

      // 백엔드 로그도 새로고침
      refetchLogs?.()
    } catch (err) {
      // 이미 발견된 단서면 에러 무시
      if (err.message?.includes('이미') || err.message?.includes('already')) {
        console.log('이미 발견된 단서입니다.')
      } else {
        console.error('단서 발견 실패:', err)
        toast.error('단서 발견에 실패했습니다.')
        // Phaser에서는 단서를 먼저 제거하므로, 실패 시 서버 기준으로 다시 동기화
        await loadCluesForSession(sessionId)
      }
    }
  }, [sessionId, collectEvidence, currentRoom, addLog, refetchLogs, loadCluesForSession])

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
    const targetFloor = clampFloor(
      Number.isFinite(room?.floorNumber) ? room.floorNumber : (validIndex + 1),
      validIndex + 1,
    )

    if (sessionId && hasChanged) {
      try {
        await moveFloor(sessionId, targetFloor)
        refetchLogs?.()
      } catch (err) {
        console.error('층 이동 API 오류:', err)
      }
    }
    const isFirstVisit = !visitedFloors.has(targetFloor)
    if (isFirstVisit) {
      setVisitedFloors(prev => new Set([...prev, targetFloor]))

      const room = rooms[validIndex]
      if (room) {
        // 로그 추가
        addLog('system', `${room.name}에 도착했습니다.`)

        // 조수 코멘트가 있으면 Watson 다이얼로그 표시 (첫 방문 시에만)
        if (room.assistantComment) {
          showAssistantDialog(room.assistantComment)
        }
      }
    }
  }, [rooms, visitedFloors, addLog, sessionId, refetchLogs, showAssistantDialog])

    const handleSendMessage = async (contactId, text) => {
      const timeStr = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })

      const randomInt = (min, max) => Math.floor(min + Math.random() * (max - min + 1))
      const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

      // 유저 메시지 즉시 추가
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

      const showTyping = () => {
        const typingMessage = {
          id: `typing-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          sender: contactId,
          text: '',
          time: '',
          isTyping: true
        }

        setChatHistories(prev => ({
          ...prev,
          [contactId]: [...(prev[contactId] || []).filter(m => !m?.isTyping), typingMessage]
        }))
      }

      const clearTyping = () => {
        setChatHistories(prev => ({
          ...prev,
          [contactId]: (prev[contactId] || []).filter(m => !m?.isTyping)
        }))
      }

      const isHelper = contactId === 'helper'

      if (isHelper) {
        showTyping()
        const delayMs = randomInt(800, 1400)

        setTimeout(() => {
          clearTyping()

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
        }, delayMs)
        return
      }

      // ✅ 용의자 심문 - 실제 API 연동
      if (!sessionId) {
        toast.error('세션 정보가 없습니다.')
        return
      }

      const suspectId = contactId
      const typingStartedAt = Date.now()
      const minTypingMs = randomInt(900, 1700)

      showTyping()

      try {
        const response = await chatWithSuspect(sessionId, suspectId, {
          message: text,
          usedClueId: null  // 단서 사용 시 해당 clueId 전달
        })

        const elapsed = Date.now() - typingStartedAt
        const waitMs = Math.max(0, minTypingMs - elapsed)
        if (waitMs > 0) await sleep(waitMs)

        clearTyping()

        const responseMessage = {
          id: response.messageId || Date.now(),
          sender: contactId,
          text: response.response || response.content || response.message || "...",
          time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
          isKeyTalk: response.isKeyTalk || false,
          responseLevel: response.responseLevel || 0
        }

        setChatHistories(prev => ({
          ...prev,
          [contactId]: [...(prev[contactId] || []), responseMessage]
        }))

        // 핵심 대화인 경우 로그 추가
        if (response.isKeyTalk) {
          addLog('interrogation', `[핵심 정보] 용의자로부터 중요한 정보를 얻었습니다!`)
        } else {
          addLog('interrogation', `용의자 심문을 진행했습니다.`)
        }

        refetchLogs?.()

      } catch (err) {
        console.error('심문 실패:', err)
        toast.error(err.message || '심문에 실패했습니다.')

        clearTyping()

        const errorMessage = {
          id: Date.now(),
          sender: 'system',
          text: "⚠️ 응답을 받지 못했습니다. 다시 시도해주세요.",
          time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
        }
        setChatHistories(prev => ({
          ...prev,
          [contactId]: [...(prev[contactId] || []), errorMessage]
        }))
      }
    }
    const handleContactSelect = useCallback(async (contact) => {
      // 조력자는 로컬 히스토리 사용
      if (contact.id === 'helper' || contact.isHelper) {
        return
      }

      // ✅ 용의자 선택 시 기존 대화 기록 조회
      if (!sessionId) return

      const suspectId = contact.id

      // 이미 채팅 기록이 있으면 다시 조회하지 않음 (중복 호출 방지)
      if (chatHistories[suspectId] && chatHistories[suspectId].length > 0) {
        return
      }

      try {
        const response = await fetchChatHistory(sessionId, suspectId)

        if (response?.messages && response.messages.length > 0) {
          // API 응답을 채팅 히스토리 형식으로 변환
          const formattedMessages = response.messages.map(msg => ({
            id: msg.messageId,
            sender: String(msg.role).toLowerCase() === 'user' ? 'user' : suspectId,
            text: msg.content,
            time: msg.createdAt
              ? new Date(msg.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
              : '',
            isKeyTalk: msg.isKeyTalk || false,
            responseLevel: msg.responseLevel || 0
          }))

          setChatHistories(prev => ({
            ...prev,
            [suspectId]: formattedMessages
          }))
        }
      } catch (err) {
        console.error('심문 기록 조회 실패:', err)
        // 실패해도 빈 히스토리로 시작 가능
      }
    }, [sessionId, chatHistories])

  // 메시지 읽음 처리
  const handleMarkAsRead = useCallback((contactId) => {
    setChatHistories(prev => ({
      ...prev,
      [contactId]: (prev[contactId] || []).map(msg => ({
        ...msg,
        read: true
      }))
    }))
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

  // 제출 결과 모달 표시 헬퍼 (0.8초 후 자동 닫힘)
  const showSubmitResultModal = useCallback((message, type = 'error') => {
    setSubmitResultModal({ open: true, message, type })
    setTimeout(() => {
      setSubmitResultModal({ open: false, message: '', type: 'error' })
    }, 800)
  }, [])

  const handleAnswerSubmit = async ({ submissionItems, confirmedConnections, motive }) => {
    if (!sessionId) return
    if (isSubmitting) return // 광클 방지

    setIsSubmitting(true)
    setSubmitAnswerOpen(false)
    setGradingModal({ open: true }) // 채점 중 모달 표시

    const minWaitTime = 3000 // 최소 3초 대기
    const startTime = Date.now()

    try {
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
      ) || evidences[0]

      const locationItem = locations[0]
      const locationFloor = locationItem?.floorNumber
        || locationItem?.locationId
        || parseInt(String(locationItem?.id || '1').replace('location-', ''))
        || 1

      // ✅ 괄호로 감싸서 연산자 우선순위 명확히!
      const submitData = {
        culpritId: (culpritItem?.suspectId
          ?? parseInt(String(culpritItem?.id || '0').replace('suspect-', '')))
          || 0,
        weaponClueId: (culpritConnectedEvidence?.evidenceId
          ?? parseInt(String(culpritConnectedEvidence?.id || '0').replace('evidence-', '')))
          || 0,
        locationFloor: Number(locationFloor) || 1,
        motive: motive?.trim() || '',
      }

      const result = await submitAnswer(sessionId, submitData)

      // 최소 3초 대기 (API가 빨리 응답해도 채점 중 화면 유지)
      const elapsed = Date.now() - startTime
      if (elapsed < minWaitTime) {
        await new Promise(resolve => setTimeout(resolve, minWaitTime - elapsed))
      }

      setGradingModal({ open: false }) // 채점 중 모달 닫기

      if (result.status === 'COMPLETED') {
        // 성공 - 정답 발표 후 에필로그로 이동
        setResultAnnounceModal({ open: true, isCorrect: true })
        setGameEndResult(result)
        setGameEndType('success')
        // 2초 후 결과 발표 닫고 에필로그로
        await new Promise(resolve => setTimeout(resolve, 2000))
        setResultAnnounceModal({ open: false, isCorrect: false })
        setGameEndModalOpen(true)
      } else if (result.status === 'WRONG_ANSWER') {
        setRemainingAttempts(result.remainingAttempts)
        // 남은 기회가 0이면 게임오버 (바로 GAME OVER 화면으로)
        if (result.remainingAttempts <= 0) {
          setGameEndResult(result)
          setGameEndType('fail')
          setGameEndModalOpen(true)
        } else {
          // 오답 모달 표시 (1.5초) - 남은 기회 있음
          setResultAnnounceModal({ open: true, isCorrect: false, remainingAttempts: result.remainingAttempts })
          await new Promise(resolve => setTimeout(resolve, 1500))
          setResultAnnounceModal({ open: false, isCorrect: false })
        }
      } else if (result.status === 'FAILED') {
        setRemainingAttempts(0)
        // 바로 게임오버 화면으로
        setGameEndResult(result)
        setGameEndType('fail')
        setGameEndModalOpen(true)
      } else if (result.status === 'BOARD_INVALID') {
        showSubmitResultModal(result.errorMessage || '추리보드가 유효하지 않습니다.', 'error')
      }
    } catch (err) {
      console.error('[Submit] 제출 실패:', err)
      // 에러 시에도 최소 대기 시간 후 닫기
      const elapsed = Date.now() - startTime
      if (elapsed < minWaitTime) {
        await new Promise(resolve => setTimeout(resolve, minWaitTime - elapsed))
      }
      setGradingModal({ open: false })
      showSubmitResultModal(err.message || '제출에 실패했습니다.', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }
  const handleReviewSubmit = async (difficulty, rating, review) => {
    if (!activeScenarioId) return

    try {
      setReviewModalOpen(false)

      // 리뷰 작성
      await submitReview(activeScenarioId, {
        rating,
        difficulty,
        content: review,
        isSpoiler: false,
      })

      // 수사보고서 조회
      const reportData = await fetchReport(sessionId)
      if (reportData) {
        setReportModalOpen(true)
      }
    } catch (err) {
      toast.error('보고서 생성에 실패했습니다.')
    }
  }

  // 게임 종료 모달 핸들러
  const handleGameEndGoHome = useCallback(() => {
    setGameEndModalOpen(false)
    setLocation('/')
  }, [setLocation])

  const handleGameEndProceedToReview = useCallback(() => {
    setGameEndModalOpen(false)
    setReviewModalOpen(true)
  }, [])

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
          <p className="text-muted-foreground">게임을 불러오는 중..</p>
        </div>
      </div>
    )
  }

  // 에러 상태 렌더링
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

  // 오프닝 페이즈 (새 게임 시작 시)
  if (gamePhase === 'opening' && scenario && !resumeSessionId) {
    return (
      <OpeningPhase
        scenario={scenario}
        openingNarration={openingNarration}
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
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 pointer-events-none" />
      <div className="absolute inset-0 bg-black/40 pointer-events-none" />

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
              <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 border border-border rounded-lg">
                <Send className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-semibold">
                  제출 <span className={cn(
                    "font-mono",
                    remainingAttempts <= 1 ? "text-red-400" : "text-amber-400"
                  )}>{3 - remainingAttempts}/3</span>
                </span>
              </div>
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

      {/* 왼쪽 패널 (증거 목록) */}
	      <LeftEvidencePanel
            isOpen={leftPanelOpen}
            onToggle={() => setLeftPanelOpen(!leftPanelOpen)}
            evidence={discoveredEvidence}
            suspects={suspects}
            rooms={rooms}
            onItemClick={(item, type) => {
              if (type === 'evidence') handleEvidenceClick(item)  // ← 여기만 바꿈
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
	        sessionId={sessionId}
	        victim={scenario?.victim || null}
	        leftOffsetPx={leftPanelOpen ? SIDE_PANEL_WIDTH_PX : 0}
	        rightOffsetPx={rightLogOpen ? SIDE_PANEL_WIDTH_PX : 0}
	        pendingAddItem={pendingAddItem}
	        onConsumePendingAddItem={() => setPendingAddItem(null)}
	      />

      {/* 오른쪽 하단: 방 이동 + 휴대폰 */}
      <div className="fixed right-28 bottom-6 z-40 flex items-center gap-3">
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
        onMarkAsRead={handleMarkAsRead}
      />

      {/* 모달들 */}
      <EvidenceDetailModal evidence={selectedEvidence} onClose={() => setSelectedEvidence(null)} />
	      <SubmitAnswerModal
	        isOpen={submitAnswerOpen}
	        onClose={() => setSubmitAnswerOpen(false)}
	        onSubmit={handleAnswerSubmit}
	        scenarioId={activeScenarioId}
	        sessionId={sessionId}
	        victim={scenario?.victim || null}
	      />
      <ReviewModal isOpen={reviewModalOpen} onSubmit={handleReviewSubmit} />
      <ReportModal isOpen={reportModalOpen} onClose={() => setReportModalOpen(false)} report={report} />

      {/* 게임 종료 모달 (성공/실패) */}
      <GameEndModal
        isOpen={gameEndModalOpen}
        type={gameEndType}
        scenario={scenario}
        result={gameEndResult}
        onGoHome={handleGameEndGoHome}
        onProceedToReview={handleGameEndProceedToReview}
      />

      {/* 채점 중 모달 */}
      {gradingModal.open && (
        <div className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center">
          <div className="bg-card border border-border rounded-2xl px-12 py-10 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
            <div className="flex flex-col items-center gap-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl">🔍</span>
                </div>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold gold-glow mb-2">채점 중입니다</p>
                <p className="text-sm text-muted-foreground">잠시만 기다려주세요...</p>
              </div>
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 채점 결과 발표 모달 (정답/오답) */}
      {resultAnnounceModal.open && (
        <div className="fixed inset-0 bg-black/85 z-[70] flex items-center justify-center">
          <div className="animate-in fade-in zoom-in-95 duration-500 text-center">
            {resultAnnounceModal.isCorrect ? (
              <>
                <div className="text-8xl mb-6 animate-bounce">🎉</div>
                <p className="text-4xl font-bold gold-glow tracking-wider">정답입니다!</p>
                <p className="text-lg text-primary/80 mt-4">사건의 진실을 밝혀냈습니다</p>
              </>
            ) : (
              <>
                <div className="text-8xl mb-6">❌</div>
                <p className="text-4xl font-bold text-red-500 tracking-wider">오답입니다</p>
                {resultAnnounceModal.remainingAttempts > 0 ? (
                  <p className="text-lg text-red-400/80 mt-4">
                    남은 기회: <span className="font-bold">{resultAnnounceModal.remainingAttempts}회</span>
                  </p>
                ) : (
                  <p className="text-lg text-red-400/80 mt-4">더 이상 기회가 없습니다...</p>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* 제출 결과 알림 모달 (광클 방지, 0.8초 표시) */}
      {submitResultModal.open && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center">
          <div className={cn(
            "bg-card border-2 rounded-xl px-8 py-6 shadow-2xl animate-in zoom-in-95 duration-200",
            submitResultModal.type === 'error' ? "border-red-500/50" : "border-primary/50"
          )}>
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center",
                submitResultModal.type === 'error' ? "bg-red-500/20" : "bg-primary/20"
              )}>
                {submitResultModal.type === 'error' ? (
                  <span className="text-2xl">❌</span>
                ) : (
                  <span className="text-2xl">✓</span>
                )}
              </div>
              <p className={cn(
                "text-lg font-bold",
                submitResultModal.type === 'error' ? "text-red-400" : "text-primary"
              )}>
                {submitResultModal.message}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 조수 왓슨 다이얼로그 (단서 발견, 층 첫 방문 시) */}
      {assistantDialog && (
        <WatsonDialog
          dialog={assistantDialog}
          onComplete={handleAssistantDialogComplete}
        />
      )}
    </div>
  )
}
