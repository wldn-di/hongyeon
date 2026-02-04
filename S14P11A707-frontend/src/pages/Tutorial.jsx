import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'wouter'
import { Button } from '@/components/ui/Button'
import {
  Heart, Clock, Lightbulb, Send, Users, X, FileText, Search,
  ChevronUp, ChevronDown, Smartphone, ArrowRight, MapPin,
  Play, Home, Sparkles, DoorOpen, Plus, Minus, Link2, StickyNote,
  ArrowLeft, Check, AlertTriangle, Trophy, Target, Gamepad2, Pin, Save
} from 'lucide-react'

import AgitRoom from '@/features/game/engine/AgitRoom'
import { useGameSession } from '@/features/game/session'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/Card'
import TypingText from '@/features/tutorial/components/TypingText'
import WatsonDialog from '@/features/tutorial/components/WatsonDialog'
import BottomBoardPanel from '@/features/game/panels/BottomBoardPanel'
import { ReviewModal, ReportModal } from '@/features/game/modals'
import { InvestigationBoard } from '@/features/game/components/InvestigationBoard'
import {
  tutorialStory,
  tutorialVictim,
  tutorialSuspects,
  tutorialEvidence,
  tutorialRooms,
  tutorialClues,
  watsonDialogs,
} from '@/features/tutorial/data/tutorialCase'

// ========================================
// Phase 1: 오프닝 (스토리 도입)
// ========================================
function OpeningPhase({ onComplete, onSkip }) {
  const [stage, setStage] = useState('title')

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-20"
        style={{ backgroundImage: 'url(/images/img1.png)', filter: 'blur(4px) grayscale(60%)' }}
      />
      <div className="absolute inset-0" style={{ background: 'radial-gradient(circle, transparent 0%, rgba(0,0,0,0.8) 100%)' }} />

      <div className="relative z-10 text-center max-w-2xl px-8">
        {stage === 'title' && (
          <div className="animate-in fade-in duration-1000">
            <p className="text-sm text-primary tracking-widest mb-4">TUTORIAL CASE</p>
            <h1 className="text-4xl md:text-5xl font-bold gold-glow mb-8">
              <TypingText text={tutorialStory.title} speed={80} onComplete={() => setTimeout(() => setStage('synopsis'), 500)} />
            </h1>
          </div>
        )}

        {stage === 'synopsis' && (
          <div className="animate-in fade-in duration-700">
            <p className="text-sm text-primary tracking-widest mb-4">TUTORIAL CASE</p>
            <h1 className="text-3xl font-bold gold-glow mb-6">{tutorialStory.title}</h1>
            <p className="text-lg text-amber-100/80 leading-relaxed whitespace-pre-line">
              <TypingText text={tutorialStory.synopsis} speed={30} onComplete={() => setTimeout(() => setStage('ready'), 500)} />
            </p>
          </div>
        )}

        {stage === 'ready' && (
          <div className="animate-in fade-in duration-700">
            <p className="text-sm text-primary tracking-widest mb-4">TUTORIAL CASE</p>
            <h1 className="text-3xl font-bold gold-glow mb-6">{tutorialStory.title}</h1>
            <p className="text-lg text-amber-100/80 leading-relaxed whitespace-pre-line mb-8">
              {tutorialStory.synopsis}
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

      <div className="absolute top-6 left-6 px-4 py-2 bg-primary/20 rounded-full border border-primary/50">
        <span className="text-sm text-primary font-bold">🎮 튜토리얼</span>
      </div>
    </div>
  )
}

// ========================================
// Phase 2: 피해자 소개
// ========================================
function VictimIntroPhase({ onComplete }) {
  return (
    <div className="fixed inset-0 bg-gradient-to-b from-gray-900 to-black z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-cover bg-center opacity-30" style={{ backgroundImage: 'url(/images/img2.png)', filter: 'grayscale(70%)' }} />
      <div className="relative z-10 w-full max-w-lg px-4">
        <Card className="bg-card/95 backdrop-blur border border-border shadow-2xl">
          <div className="p-6">
            <div className="text-center mb-6">
              <span className="text-xs text-red-500 font-bold tracking-widest">VICTIM PROFILE</span>
              <h2 className="text-2xl font-bold gold-glow mt-2">피해자 정보</h2>
            </div>

            <div className="flex gap-4 items-center mb-6">
              <div className="w-24 h-24 bg-muted rounded-xl flex items-center justify-center">
                <Users className="w-12 h-12 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{tutorialVictim.name}</p>
                <p className="text-muted-foreground">{tutorialVictim.age}세, {tutorialVictim.gender}</p>
                <p className="text-sm text-primary">{tutorialVictim.role}</p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground mb-6 p-3 bg-muted/30 rounded-lg">
              {tutorialVictim.background}
            </p>

            <div className="space-y-3 border-t border-border pt-4">
              <h3 className="text-sm font-bold text-primary">초기 단서</h3>
              <div className="grid gap-2 text-sm">
                {[
                  ['발견 장소', tutorialVictim.discoveryLocation],
                  ['사망 추정 시각', tutorialVictim.estimatedDeathTime],
                  ['사인', tutorialVictim.causeOfDeath]
                ].map(([k, v], i) => (
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
    
// ====================     ====================
// Phase 3: 메인 게임 (상호작용 기반 튜토리얼)
// ========================================
function MainGamePhase({ onComplete }) {
   // 스토리 진행 단계 (대폭 축소: 1개 증거 + 1명 대화 + 엘베이동)
   // welcome → movement → firstClue → waitEvidenceClick → evidenceListIntro → logIntro
   // → suggestChat1 → clueTagIntro1 (첫 멘트) → highlightClueBtn (+ 버튼 강조)
   // → waitClueSelect (단서 선택 대기) → clueTagIntro2 (나머지 멘트) → waitChat1 (이영희 대화)
   // → secondClue → waitElevator (2층 이동하면 바로 추리보드로)
   // → boardIntro → waitBoardOpen → boardDetail
   // → boardPractice → waitBoardPractice → boardConnect → waitBoardConnect → boardSave → waitBoardSave
   // → waitBoardClose → submit
   const [storyStep, setStoryStep] = useState('welcome')
   const [showDialog, setShowDialog] = useState(true)
   const [isDialogActive, setIsDialogActive] = useState(true) // 대화 중 조작 불가

   // 층 이동 관련 상태
   const [currentRoomIndex, setCurrentRoomIndex] = useState(0)

  // 게임 상태
  const [health] = useState(100)
  const [leftPanelOpen, setLeftPanelOpen] = useState(true)
  const [leftPanelTab, setLeftPanelTab] = useState('evidence') // 'evidence' | 'suspect' | 'location'
  const [rightPanelOpen, setRightPanelOpen] = useState(true)
  const [boardPanelOpen, setBoardPanelOpen] = useState(false)
  const [phoneOpen, setPhoneOpen] = useState(false)
  const [selectedContact, setSelectedContact] = useState(null)
  const [currentRoom, setCurrentRoom] = useState(tutorialRooms[0])
  const [selectedEvidence, setSelectedEvidence] = useState(null)
  const [message, setMessage] = useState('')

  const { logs, addLog, discoveredEvidence, collectEvidence } = useGameSession({
    initialLogs: [{ id: 1, time: '00:00', type: 'system', message: '수사가 시작되었습니다.' }],
    getLogTime: () => {
      const now = new Date()
      return `00:${String(now.getMinutes()).padStart(2, '0')}`
    },
  })

  // 추리보드 상태 - 피해자 카드로 초기화 (GameRoom과 동일)
  const [boardItems, setBoardItems] = useState([
    {
      id: 'victim-1',
      type: 'victim',
      x: 400,
      y: 50,
      data: tutorialVictim,
    }
  ])
  const [connections, setConnections] = useState([])
  const [connectStart, setConnectStart] = useState(null)
  const [connectEnd, setConnectEnd] = useState(null) // 두 번째 선택된 카드
  const [selectedConnection, setSelectedConnection] = useState(null) // 선택된 연결선 (제거용)
  const [selectedBoardItem, setSelectedBoardItem] = useState(null) // 선택된 카드 (삭제용)
  const [memoModalOpen, setMemoModalOpen] = useState(false)
  const [memoText, setMemoText] = useState('')

  // 최종 제출 관련 상태
  const [confirmBoardOpen, setConfirmBoardOpen] = useState(false)
  const [submitFormOpen, setSubmitFormOpen] = useState(false)
  const [selectedCulprit, setSelectedCulprit] = useState(null)
  const [submitForm, setSubmitForm] = useState({ location: '', tool: '', motive: '', method: '' })

  // 추적용 상태
  const [chattedSuspects, setChattedSuspects] = useState([]) // 대화한 용의자 목록
  const [hasOpenedBoard, setHasOpenedBoard] = useState(false)
  const [hasSavedBoard, setHasSavedBoard] = useState(false) // 보드 저장 여부
  const [hoveredBoardItem, setHoveredBoardItem] = useState(null) // 호버된 보드 카드
  const hoverTimeoutRef = useRef(null) // 호버 툴팁 1초 딜레이용

  // 추리보드 줌 상태 (GameRoom과 동일)
  const [boardZoom, setBoardZoom] = useState(1)
  const boardZoomRef = useRef(1)
  const BOARD_WIDTH = 1600
  const BOARD_HEIGHT = 1200
  const MIN_ZOOM = 0.6
  const MAX_ZOOM = 1.8

  // 추리보드 팬(이동) 상태
  const [isPanning, setIsPanning] = useState(false)
  const panStartRef = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 })
  const ZOOM_STEP = 0.1

  // 추리보드 필터 상태 (InvestigationBoard와 동일)
  const [boardFilter, setBoardFilter] = useState('all')

  // 왼쪽 패널 호버링 상태 (증거/용의자/장소)
  const [hoveredPanelItem, setHoveredPanelItem] = useState(null)
  const [hoveredPanelType, setHoveredPanelType] = useState(null) // 'evidence' | 'suspect' | 'location'
  const [hoveredPanelData, setHoveredPanelData] = useState(null) // 호버된 아이템 데이터
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0 }) // 툴팁 위치
  const panelHoverTimeoutRef = useRef(null)

  // 단서 태그 관련 상태 (PhoneUI와 동일)
  const [selectedClue, setSelectedClue] = useState(null) // 선택된 단서
  const [clueModalOpen, setClueModalOpen] = useState(false) // 단서 선택 모달

  // 용의자별 대화 내용 (증거별 질문 포함 + 단서 태그 정보)
  const suspectChats = {
    'suspect-1': { // 김철수 (집사)
      greeting: '탐정님이시군요. 무엇이든 물어보세요.',
      clueId: 2, // 구겨진 편지
      clueName: '구겨진 편지',
      question: '이 구겨진 편지에 대해 아시는 게 있나요? 이영희 씨 필적과 일치한다던데요.',
      response: '그 편지요? 이영희 아가씨가 회장님께 드리려던 거예요. 근데 회장님이 읽기도 전에 찢어버리셨죠. 아가씨가 얼마나 울었는지... 유산 얘기였던 것 같아요.',
    },
    'suspect-2': { // 이영희 (딸) - 범인
      greeting: '...뭐예요? 왜 저한테 자꾸 물어보는 거죠?',
      clueId: 1, // 혈흔이 묻은 식칼
      clueName: '혈흔이 묻은 식칼',
      question: '이 식칼에서 당신 옷의 섬유가 발견됐어요. 설명해주시겠어요?',
      response: '그 식칼은 제가 요리할 때 쓴 거예요! 섬유라고요? 말도 안 돼요! 저는 그날 밤 방에만 있었다고요! 왜 자꾸 의심하는 거예요?!',
    },
    'suspect-3': { // 박민수 (경호원)
      greeting: '탐정님, 협조하겠습니다.',
      clueId: 3, // 낡은 열쇠
      clueName: '낡은 열쇠',
      question: '이 열쇠에 대해 아시는 게 있나요? 숫자 3이 새겨져 있던데요.',
      response: '그 열쇠... 3번 금고 열쇠 맞습니다. 회장님 유언장이 들어있는 곳이죠. 이영희 씨가 그날 밤 서재 근처를 서성이는 걸 봤어요. CCTV 기록은 왜인지 삭제됐더군요.',
    },
  }

  // 채팅 응답 표시 관련 상태
  const [chatResponseShown, setChatResponseShown] = useState(false)
  const [waitingForChatConfirm, setWaitingForChatConfirm] = useState(false)

  // 튜토리얼 안내 중 WASD 이동 키만 차단 (Space는 WatsonDialog에서 사용)
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (!isDialogActive) return

      // 이동 키(WASD)만 차단, Space는 WatsonDialog에서 다음 단계로 넘어가는 용도로 사용됨
      const movementKeys = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight']
      if (movementKeys.includes(e.code)) {
        e.preventDefault()
        e.stopPropagation()
        e.stopImmediatePropagation()
      }
    }

    window.addEventListener('keydown', handleGlobalKeyDown, { capture: true })
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown, { capture: true })
    }
  }, [isDialogActive])

  // 튜토리얼 보드 연습 진행 추적: 필요한 항목들이 보드에 추가되면 다음 단계로
  useEffect(() => {
    if (storyStep !== 'waitBoardPractice') return

    // 필요한 항목 체크: 이영희(suspect-2), 식칼(evidence-1), 침실(location-1)
    const hasYoungHee = boardItems.some(i => i.id === 'suspect-2')
    const hasKnife = boardItems.some(i => i.id === 'evidence-1')
    const hasBedroom = boardItems.some(i => i.id === 'location-1')

    if (hasYoungHee && hasKnife && hasBedroom) {
      setTimeout(() => {
        setStoryStep('boardConnect')
        setShowDialog(true)
        setIsDialogActive(true)
      }, 500)
    }
  }, [storyStep, boardItems])

  // 튜토리얼 보드 연결 진행 추적: 빨간선 3개 연결되면 다음 단계로
  useEffect(() => {
    if (storyStep !== 'waitBoardConnect') return

    const redConnections = connections.filter(c => c.type === 'red').length
    if (redConnections >= 3) {
      setTimeout(() => {
        setStoryStep('boardSave')
        setShowDialog(true)
        setIsDialogActive(true)
      }, 500)
    }
  }, [storyStep, connections])

  // 선 타입 선택 상태 (GameRoom 스타일: null이면 비활성, 'red'/'yellow'면 연결 모드)
  const [lineMode, setLineMode] = useState(null) // null, 'red', 'yellow'
  const [saveStatus, setSaveStatus] = useState(null) // null, 'saving', 'saved'

  // 연결 모드 토글 (GameRoom 스타일)
  const toggleLineMode = (mode) => {
    if (lineMode === mode) {
      setLineMode(null)
      setConnectStart(null)
      setConnectEnd(null)
    } else {
      setLineMode(mode)
      setConnectStart(null)
      setConnectEnd(null)
    }
  }

  // 보드 저장 (튜토리얼용 - localStorage)
  const handleSaveBoard = () => {
    setSaveStatus('saving')
    try {
      localStorage.setItem('tutorial-board-items', JSON.stringify(boardItems))
      localStorage.setItem('tutorial-board-connections', JSON.stringify(connections))
      setSaveStatus('saved')
      setHasSavedBoard(true)
      addLog('system', '추리보드가 저장되었습니다.')
      setTimeout(() => setSaveStatus(null), 2000)

      // 튜토리얼 진행: waitBoardSave 단계에서 저장하면 다음 단계로
      if (storyStep === 'waitBoardSave') {
        setTimeout(() => {
          setStoryStep('waitBoardClose')
        }, 500)
      }
    } catch (e) {
      console.error('보드 저장 실패:', e)
      setSaveStatus(null)
    }
  }

  // 핸들러들
  const handleDialogComplete = () => {
    setShowDialog(false)
    setIsDialogActive(false)

    // 다음 단계로 자동 진행 (상호작용 기반, 증거→용의자 대화 유도)
    if (storyStep === 'welcome') {
      setTimeout(() => {
        setStoryStep('movement')
        setShowDialog(true)
        setIsDialogActive(true)
      }, 300)
    } else if (storyStep === 'firstClue') {
      // 첫 번째 증거 발견 후 → 자동으로 호버 툴팁 표시 (2초 유지)
      const firstEvidence = discoveredEvidence.find(e => e.id === 1) || tutorialEvidence[0]
      setHoveredPanelItem(firstEvidence.id)
      setHoveredPanelType('evidence')
      setHoveredPanelData(firstEvidence)
      setTooltipPosition({ top: 150 }) // 적절한 위치에 표시
      setTimeout(() => {
        setStoryStep('evidenceListIntro')
        setShowDialog(true)
        setIsDialogActive(true)
      }, 2000) // 2초 동안 호버 툴팁 보여주기
    } else if (storyStep === 'evidenceListIntro') {
      // 호버 툴팁 닫고 다음 단계
      setHoveredPanelItem(null)
      setHoveredPanelType(null)
      setHoveredPanelData(null)
      setTimeout(() => {
        setStoryStep('logIntro')
        setShowDialog(true)
        setIsDialogActive(true)
      }, 300)
    } else if (storyStep === 'logIntro') {
      // 수사 로그 설명 후 → 이영희와 대화 유도
      setTimeout(() => {
        setStoryStep('suggestChat1')
        setShowDialog(true)
        setIsDialogActive(true)
      }, 300)
    } else if (storyStep === 'suggestChat1') {
      // 자동으로 휴대폰 열고 단서 태그 설명 시작
      setTimeout(() => {
        setPhoneOpen(true)
        addLog('system', '휴대폰을 열었습니다.')
        // 이영희 선택 후 첫 번째 멘트 표시
        setTimeout(() => {
          const youngHee = tutorialSuspects.find(s => s.id === 'suspect-2')
          setSelectedContact(youngHee)
          // 첫 번째 멘트 (대화해볼게요!)
          setTimeout(() => {
            setStoryStep('clueTagIntro1')
            setShowDialog(true)
            setIsDialogActive(true)
          }, 500)
        }, 800)
      }, 500)
    } else if (storyStep === 'clueTagIntro1') {
      // 첫 멘트 후 → + 버튼 강조 (0.5초) → 단서 목록 자동 오픈
      setStoryStep('highlightClueBtn')
      setTimeout(() => {
        // 단서 선택 모달 자동 오픈
        setClueModalOpen(true)
        setStoryStep('waitClueSelect')
      }, 500)
    } else if (storyStep === 'clueTagIntro2') {
      // 나머지 멘트 후 → 대화 대기
      setStoryStep('waitChat1')
    } else if (storyStep === 'secondClue') {
      // 엘리베이터 이동 안내 후 → 이동 기다림
      setStoryStep('waitElevator')
    } else if (storyStep === 'boardIntro') {
      // 추리보드 설명 후 → 보드 열기 기다림
      setStoryStep('waitBoardOpen')
    } else if (storyStep === 'boardDetail') {
      // 상세 설명 후 → 보드 연습 시작
      setTimeout(() => {
        setStoryStep('boardPractice')
        setShowDialog(true)
        setIsDialogActive(true)
      }, 300)
    } else if (storyStep === 'boardPractice') {
      // 연습 안내 후 → 드래그 기다림
      setStoryStep('waitBoardPractice')
    } else if (storyStep === 'boardConnect') {
      // 연결 안내 후 → 연결 기다림
      setStoryStep('waitBoardConnect')
    } else if (storyStep === 'boardSave') {
      // 저장 안내 후 → 저장 기다림
      setStoryStep('waitBoardSave')
    } else if (storyStep === 'submit') {
      // 제출 단계 - 대기
    }
  }

  // 층 이동 처리 (AgitRoom에서 호출됨)
  const handleRoomChanged = useCallback((roomIndex) => {
    // 현재 단계에서 층 이동이 허용되는지 확인
    const allowedFloorChangeSteps = [
      'waitElevator',  // 엘리베이터 이동 대기 (이동하면 추리보드로)
    ]

    if (allowedFloorChangeSteps.includes(storyStep)) {
      // 층 이동 허용
      setCurrentRoomIndex(roomIndex)
      addLog('move', `엘리베이터로 ${roomIndex + 1}층으로 이동했습니다.`)

      // waitElevator 단계에서 이동하면 바로 추리보드 안내로
      if (storyStep === 'waitElevator') {
        setTimeout(() => {
          setStoryStep('boardIntro')
          setShowDialog(true)
          setIsDialogActive(true)
        }, 500)
      }
    } else {
      // 층 이동 금지 - 안내 메시지
      let guidanceMessage = ''
      switch (storyStep) {
        case 'welcome':
        case 'movement':
          guidanceMessage = '먼저 현장을 탐색해서 첫 번째 증거를 찾아보세요!'
          break
        case 'firstClue':
        case 'waitEvidenceClick':
        case 'evidenceListIntro':
          guidanceMessage = '왼쪽 증거 목록에서 첫 번째 증거에 마우스를 올려 상세 정보를 확인하세요!'
          break
        case 'logIntro':
        case 'suggestChat1':
          guidanceMessage = '오른쪽 수사 로그를 확인한 후, 용의자와 대화하세요!'
          break
        case 'clueTagIntro1':
        case 'highlightClueBtn':
          guidanceMessage = '단서 태그 기능을 확인하세요! + 버튼으로 단서를 선택할 수 있어요.'
          break
        case 'waitClueSelect':
          guidanceMessage = '단서를 클릭해서 선택하세요!'
          break
        case 'clueTagIntro2':
          guidanceMessage = '단서 태그 설명을 확인하세요!'
          break
        case 'waitChat1':
          guidanceMessage = '오른쪽 하단의 휴대폰으로 용의자와 대화하세요!'
          break
        case 'boardIntro':
        case 'waitBoardOpen':
        case 'boardDetail':
        case 'waitBoardClose':
          guidanceMessage = '먼저 추리보드를 사용해 보세요!'
          break
        case 'submit':
          guidanceMessage = '최종 정답을 제출하세요!'
          break
        default:
          guidanceMessage = '현재 진행 중인 튜토리얼 단계를 완료하세요!'
      }
      addLog('system', guidanceMessage)
    }
  }, [storyStep, addLog])

  // 증거 수집 처리 (AgitRoom에서 호출됨)
  const handleClueInspected = useCallback((clue) => {
    if (isDialogActive) return

    const evidence =
      tutorialEvidence.find((e) => e.id === clue?.evidenceId) ||
      tutorialEvidence.find((e) => e.name === clue?.title)

    if (!evidence) return

    const allowedEvidenceByStep = {
      'movement': 1,           // 첫 번째 증거 (식칼)
      'waitEvidenceClick': 1,  // 첫 번째 증거 상세 확인 대기 중 (증거 수집 불가)
      'waitSecondClue': 2,     // 두 번째 증거 (편지) - 단축된 튜토리얼에서는 여기까지만
    }
  
    const allowedEvidenceId = allowedEvidenceByStep[storyStep]

    // waitEvidenceClick 단계에서는 증거 수집 불가 (상세 확인을 먼저 해야 함)
    if (storyStep === 'waitEvidenceClick') {
      addLog('system', '먼저 왼쪽 증거 목록에서 첫 번째 증거를 클릭해서 상세 정보를 확인하세요!')
      return
    }

    // 현재 단계에서 허용된 증거가 아니면 무시
    if (allowedEvidenceId !== undefined && evidence.id !== allowedEvidenceId) {
      addLog('system', '현재 단계에서는 이 증거를 수집할 수 없습니다.')
      return
    }

    collectEvidence(evidence)

    // 증거별 다음 단계 결정 (단축된 튜토리얼: 2개 증거만)
    if (evidence.id === 1 && storyStep === 'movement') {
      setTimeout(() => {
        setStoryStep('firstClue')
        setShowDialog(true)
        setIsDialogActive(true)
      }, 500)
    } else if (evidence.id === 2 && storyStep === 'waitSecondClue') {
      setTimeout(() => {
        setStoryStep('secondClueFound')
        setShowDialog(true)
        setIsDialogActive(true)
      }, 500)
    }
  }, [isDialogActive, storyStep, collectEvidence])

  const handlePhoneClick = () => {
    if (isDialogActive) return
    setPhoneOpen(true)
    addLog('system', '휴대폰을 열었습니다.')
  }

  // 휴대폰에서 용의자와 대화
  const handleSendMessage = () => {
    if (!selectedContact || selectedContact.isHelper || !message.trim()) return

    // 대화 기록 추가
    if (!chattedSuspects.includes(selectedContact.id)) {
      setChattedSuspects(prev => [...prev, selectedContact.id])
      // 단서를 태그해서 대화했는지 로그에 표시
      if (selectedClue) {
        addLog('chat', `[${selectedContact.name}]에게 @${selectedClue.name} 단서로 심문했습니다.`)
      } else {
        addLog('chat', `[${selectedContact.name}]와 대화했습니다.`)
      }
    }

    setMessage('')
    setSelectedClue(null) // 전송 후 단서 선택 초기화
    setChatResponseShown(true)
    setWaitingForChatConfirm(true)
  }


const handlePhoneClose = () => {
  // 단서 선택 초기화
  setSelectedClue(null)

  // 대화 응답을 봤고 확인 대기 중이었다면 → 대화 완료 처리
  if (waitingForChatConfirm && selectedContact && !selectedContact.isHelper) {
    setWaitingForChatConfirm(false)
    setChatResponseShown(false)

    if (storyStep === 'waitChat1' && selectedContact.id === 'suspect-2') {
      setPhoneOpen(false)
      setSelectedContact(null)
      setTimeout(() => {
        setStoryStep('secondClue')
        setShowDialog(true)
        setIsDialogActive(true)
      }, 300)
      return
    }
    if (storyStep === 'waitChat2' && selectedContact.id === 'suspect-1') {
      setPhoneOpen(false)
      setSelectedContact(null)
      setTimeout(() => {
        setStoryStep('phoneChatDone')
        setShowDialog(true)
        setIsDialogActive(true)
      }, 300)
      return
    }
  }

  // X 버튼으로 닫을 때도 대화 완료 처리
  // 사용자가 이미 대화를 했고(chattedSuspects에 있음), 현재 대화해야 하는 용의자라면 완료로 처리
  if (selectedContact && !selectedContact.isHelper && chattedSuspects.includes(selectedContact.id)) {
    setWaitingForChatConfirm(false)
    setChatResponseShown(false)

    if (storyStep === 'waitChat1' && selectedContact.id === 'suspect-2') {
      setPhoneOpen(false)
      setSelectedContact(null)
      setTimeout(() => {
        setStoryStep('secondClue')
        setShowDialog(true)
        setIsDialogActive(true)
      }, 300)
      return
    }
  }

  // 일반 닫기
  setPhoneOpen(false)
  setSelectedContact(null)
}

  // 채팅 응답 확인 후 다음 단계로 진행
  const handleChatConfirm = () => {
    if (!waitingForChatConfirm) return

    setWaitingForChatConfirm(false)
    setChatResponseShown(false)

    // waitChat1: 이영희(suspect-2)와 대화 → 엘리베이터 이동 안내
    if (storyStep === 'waitChat1' && selectedContact?.id === 'suspect-2') {
      setPhoneOpen(false)
      setSelectedContact(null)
      setTimeout(() => {
        setStoryStep('secondClue')
        setShowDialog(true)
        setIsDialogActive(true)
      }, 300)
    }
  }

  // 채팅창에서 스페이스바로 응답 확인
  useEffect(() => {
    if (!waitingForChatConfirm) return

    const handleChatKeyDown = (e) => {
      if (e.code === 'Space') {
        e.preventDefault()
        handleChatConfirm()
      }
    }
    window.addEventListener('keydown', handleChatKeyDown)
    return () => window.removeEventListener('keydown', handleChatKeyDown)
  }, [waitingForChatConfirm, storyStep, selectedContact])

  // 증거를 보드에 추가
  const handleAddEvidenceToBoard = (evidence) => {
    // 이미 보드에 있는지 확인
    const alreadyOnBoard = boardItems.some(item => item.id === `evidence-${evidence.id}`)
    if (alreadyOnBoard) return

    setBoardItems(prev => [...prev, {
      id: `evidence-${evidence.id}`,
      type: 'evidence',
      x: 350 + Math.random() * 100,
      y: 80 + Math.random() * 150,
      data: evidence
    }])
    addLog('board', `[${evidence.name}] 추리보드에 추가됨`)
  }

  // 용의자를 보드에 추가
  const handleAddSuspectToBoard = (suspect) => {
    const alreadyOnBoard = boardItems.some(item => item.id === suspect.id)
    if (alreadyOnBoard) return

    setBoardItems(prev => [...prev, {
      id: suspect.id,
      type: 'suspect',
      x: 100 + Math.random() * 100,
      y: 150 + Math.random() * 100,
      data: suspect
    }])
    addLog('board', `[${suspect.name}] 추리보드에 추가됨`)
  }

  // 장소를 보드에 추가
  const handleAddLocationToBoard = (room) => {
    const alreadyOnBoard = boardItems.some(item => item.id === `location-${room.id}`)
    if (alreadyOnBoard) return

    setBoardItems(prev => [...prev, {
      id: `location-${room.id}`,
      type: 'location',
      x: 600 + Math.random() * 100,
      y: 150 + Math.random() * 100,
      data: room
    }])
    addLog('board', `[${room.name}] 추리보드에 추가됨`)
  }

  // 보드 카드 삭제 (피해자 제외)
  const handleRemoveBoardItem = (itemId) => {
    // 피해자는 삭제 불가
    const item = boardItems.find(i => i.id === itemId)
    if (item?.type === 'victim') return

    // 연결된 연결선도 함께 삭제
    setConnections(prev => prev.filter(conn => conn.from !== itemId && conn.to !== itemId))
    setBoardItems(prev => prev.filter(i => i.id !== itemId))
    setSelectedBoardItem(null)
    addLog('board', `카드가 추리보드에서 제거됨`)
  }

  const handleBoardClick = () => {
    if (isDialogActive) return
    setBoardPanelOpen(true)

    if (storyStep === 'waitBoardOpen' && !hasOpenedBoard) {
      setHasOpenedBoard(true)
      setTimeout(() => {
        setStoryStep('boardDetail')
        setShowDialog(true)
        setIsDialogActive(true)
      }, 500)
    }
  }

  const handleBoardClose = () => {
    setBoardPanelOpen(false)
    if (storyStep === 'waitBoardClose') {
      setTimeout(() => {
        setStoryStep('submit')
        setShowDialog(true)
        setIsDialogActive(true)
      }, 300)
    }
  }

  const handleSubmitClick = () => {
    if (isDialogActive) return
    // 바로 최종 제출 모달 열기 (확인 모달 건너뛰기)
    setSubmitFormOpen(true)
  }

  const handleSelectCulprit = (suspect) => {
    setSelectedCulprit(suspect)
  }

  const handleFinalSubmit = () => {
    setSubmitFormOpen(false)
    // 튜토리얼은 학습용이므로 동기만 입력하면 성공 처리
    // (실제 게임에서는 범인 연결 + 동기 판정)
    const isCorrect = submitForm.motive.trim().length > 0
    onComplete(isCorrect ? 'success' : 'fail')
  }

  // 드래그
  const [draggedItem, setDraggedItem] = useState(null)
  const boardAreaRef = useRef(null)

  const handleItemMouseDown = (e, item) => {
    if (isDialogActive) return
    e.preventDefault()
    setDraggedItem(item)
  }

  const handleMouseMove = (e) => {
    if (!draggedItem || !boardAreaRef.current || isDialogActive) return
    const boardRect = boardAreaRef.current.getBoundingClientRect()
    const x = e.clientX - boardRect.left - 50
    const y = e.clientY - boardRect.top - 30
    setBoardItems(items => items.map(i =>
      i.id === draggedItem.id ? { ...i, x: Math.max(0, x), y: Math.max(0, y) } : i
    ))
  }

  const handleMouseUp = () => setDraggedItem(null)

  // 카드 선택 (연결을 위한 선택)
  const handleItemClick = (item) => {
    if (isDialogActive) return
    // 선택된 연결선 해제
    setSelectedConnection(null)

    // lineMode가 활성화되어 있을 때만 연결 가능 (GameRoom 스타일)
    if (!lineMode) {
      // 연결 모드가 아니면 카드 선택만
      return
    }

    if (!connectStart) {
      // 첫 번째 카드 선택
      setConnectStart(item)
      setConnectEnd(null)
    } else if (connectStart.id === item.id) {
      // 같은 카드 다시 클릭 → 선택 해제
      setConnectStart(null)
      setConnectEnd(null)
    } else {
      // 두 번째 카드 선택 → 자동으로 연결 (GameRoom 스타일)
      const exists = connections.some(
        c => (c.from === connectStart.id && c.to === item.id) ||
             (c.from === item.id && c.to === connectStart.id)
      )
      if (!exists) {
        setConnections(prev => [...prev, { from: connectStart.id, to: item.id, type: lineMode }])
        addLog('board', `연결: ${connectStart.data?.name || connectStart.type} ↔ ${item.data?.name || item.type}`)
      }
      // 선택 초기화 (연결 모드는 유지)
      setConnectStart(null)
      setConnectEnd(null)
    }
  }

  // 연결하기 버튼 클릭 (수동 연결용 - 백업)
  const handleConnectCards = () => {
    if (connectStart && connectEnd && lineMode) {
      // 이미 같은 연결이 있는지 확인
      const exists = connections.some(
        c => (c.from === connectStart.id && c.to === connectEnd.id) ||
             (c.from === connectEnd.id && c.to === connectStart.id)
      )
      if (!exists) {
        setConnections(prev => [...prev, { from: connectStart.id, to: connectEnd.id, type: lineMode }])
        addLog('board', `연결: ${connectStart.data?.name || connectStart.type} ↔ ${connectEnd.data?.name || connectEnd.type}`)
      }
      // 선택 초기화
      setConnectStart(null)
      setConnectEnd(null)
    }
  }

  // 연결 취소
  const handleCancelConnect = () => {
    setConnectStart(null)
    setConnectEnd(null)
    setLineMode(null)
  }

  // 연결선 클릭 (제거용)
  const handleConnectionClick = (conn, idx) => {
    if (isDialogActive) return
    setSelectedConnection(idx)
    // 카드 선택 해제
    setConnectStart(null)
    setConnectEnd(null)
  }

  // 연결선 제거
  const handleDeleteConnection = () => {
    if (selectedConnection !== null) {
      setConnections(prev => prev.filter((_, idx) => idx !== selectedConnection))
      setSelectedConnection(null)
    }
  }

  // 메모 추가
  const handleAddMemo = () => {
    if (memoText.trim()) {
      setBoardItems(prev => [...prev, {
        id: `memo-${Date.now()}`, type: 'memo',
        x: 450 + Math.random() * 100, y: 100 + Math.random() * 100,
        data: { text: memoText }
      }])
      setMemoText('')
      setMemoModalOpen(false)
    }
  }

  // 증거 클릭 (상호작용 기반 진행)
  const handleEvidenceClick = (item) => {
    if (isDialogActive) return
    setSelectedEvidence(item)

    // 첫 번째 증거 클릭 시 → evidenceListIntro로 진행
    if (storyStep === 'waitEvidenceClick' && item.id === 1) {
      setTimeout(() => {
        setSelectedEvidence(null)
        setStoryStep('evidenceListIntro')
        setShowDialog(true)
        setIsDialogActive(true)
      }, 1500)
    }
  }

  // 모든 연락처 (용의자만)
  const allContacts = [
    ...tutorialSuspects
  ]

  // 현재 대화 가져오기 (storyStep을 dialog key로 매핑)
  const getDialogForStep = (step) => {
    const stepToDialog = {
      'welcome': 'welcome',
      'movement': 'movement',
      'firstClue': 'firstClue',
      'evidenceListIntro': 'evidenceListIntro',
      'logIntro': 'logIntro',
      'suggestChat1': 'suggestChat1',
      'clueTagIntro1': 'clueTagIntro1',
      'clueTagIntro2': 'clueTagIntro2',
      'secondClue': 'secondClue',
      'boardIntro': 'boardIntro',
      'boardDetail': 'boardDetail',
      'boardPractice': 'boardPractice',
      'boardConnect': 'boardConnect',
      'boardSave': 'boardSave',
      'submit': 'submit',
    }
    return watsonDialogs[stepToDialog[step]]
  }
  const currentDialog = getDialogForStep(storyStep)

  return (
    <div
      className="min-h-screen bg-background relative overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* 배경 그라데이션 (GameRoom과 동일) */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 pointer-events-none" />
      <div className="absolute inset-0 bg-black/40 pointer-events-none" />

      {/* ===== 상단 바 (GameRoom과 동일) ===== */}
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
                <span className="font-mono text-lg">00:03:25</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/">
                <Button variant="outline" size="sm" disabled={isDialogActive}>
                  <DoorOpen className="w-4 h-4 mr-2" />
                  나가기
                </Button>
              </Link>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 border border-border rounded-lg">
                <Send className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-semibold">
                  제출 <span className="font-mono text-amber-400">0/3</span>
                </span>
              </div>
              <Button variant="neon" size="sm" onClick={handleSubmitClick} disabled={isDialogActive}>
                <Send className="w-4 h-4 mr-2" />
                최종 정답 제출
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ===== 왼쪽 패널 (조사 팔레트 - GameRoom 스타일) ===== */}
      <div
        className={cn(
          "fixed top-16 left-0 h-[calc(100%-64px)] bg-card/95 backdrop-blur border-r border-border transition-all duration-300 z-40 w-72 flex flex-col",
          leftPanelOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold flex items-center gap-2">
              <Search className="w-5 h-5 text-primary" />
              조사 팔레트
            </h3>
            <button onClick={() => !isDialogActive && setLeftPanelOpen(false)} disabled={isDialogActive}>
              <X className="w-5 h-5" />
            </button>
          </div>
          {/* 탭 버튼 (GameRoom 스타일) */}
          <div className="flex gap-2">
            <button
              onClick={() => setLeftPanelTab('evidence')}
              className={cn(
                "flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-lg text-xs font-bold border transition-colors",
                leftPanelTab === 'evidence'
                  ? "bg-primary/20 border-primary/40 text-primary"
                  : "bg-muted/30 border-border text-muted-foreground hover:text-foreground"
              )}
            >
              <Search className="w-3 h-3" />증거
            </button>
            <button
              onClick={() => setLeftPanelTab('suspect')}
              className={cn(
                "flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-lg text-xs font-bold border transition-colors",
                leftPanelTab === 'suspect'
                  ? "bg-primary/20 border-primary/40 text-primary"
                  : "bg-muted/30 border-border text-muted-foreground hover:text-foreground"
              )}
            >
              <Users className="w-3 h-3" />용의자
            </button>
            <button
              onClick={() => setLeftPanelTab('location')}
              className={cn(
                "flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-lg text-xs font-bold border transition-colors",
                leftPanelTab === 'location'
                  ? "bg-primary/20 border-primary/40 text-primary"
                  : "bg-muted/30 border-border text-muted-foreground hover:text-foreground"
              )}
            >
              <MapPin className="w-3 h-3" />장소
            </button>
          </div>
        </div>
        <div className="flex-1 p-3 space-y-2 overflow-y-auto">
          {/* 증거 탭 */}
          {leftPanelTab === 'evidence' && (
            discoveredEvidence.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                아직 발견한 증거가 없습니다.<br/>현장을 탐색해보세요!
              </p>
            ) : (
              discoveredEvidence.map(item => {
                const isOnBoard = boardItems.some(b => b.id === `evidence-${item.id}`)
                const shouldHighlightForClick = !isDialogActive && storyStep === 'waitEvidenceClick' && item.id === 1
                // 튜토리얼 보드 연습 단계에서 식칼(id=1) 강조
                const shouldHighlightForPractice = storyStep === 'waitBoardPractice' && item.id === 1 && !isOnBoard
                return (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', JSON.stringify({ item, type: 'evidence' }))
                    }}
                    onMouseEnter={(e) => {
                      if (panelHoverTimeoutRef.current) clearTimeout(panelHoverTimeoutRef.current)
                      const rect = e.currentTarget.getBoundingClientRect()
                      panelHoverTimeoutRef.current = setTimeout(() => {
                        setHoveredPanelItem(item.id)
                        setHoveredPanelType('evidence')
                        setHoveredPanelData(item)
                        setTooltipPosition({ top: rect.top })
                      }, 500)
                    }}
                    onMouseLeave={() => {
                      if (panelHoverTimeoutRef.current) clearTimeout(panelHoverTimeoutRef.current)
                      setHoveredPanelItem(null)
                      setHoveredPanelType(null)
                      setHoveredPanelData(null)
                    }}
                    className={cn(
                      "bg-muted/30 border rounded-lg p-3 transition-all relative cursor-grab active:cursor-grabbing",
                      shouldHighlightForClick || shouldHighlightForPractice ? "border-2 border-red-500 ring-4 ring-red-500/60" : "border-border",
                      shouldHighlightForPractice && "animate-pulse",
                      isDialogActive && "pointer-events-none opacity-60"
                    )}
                  >
                    {shouldHighlightForClick && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-red-500 text-white text-xs px-3 py-1 rounded-full font-bold whitespace-nowrap animate-bounce">
                        👆 마우스를 올려보세요!
                      </div>
                    )}
                    {shouldHighlightForPractice && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold whitespace-nowrap z-10">
                        ✨ 드래그하세요!
                      </div>
                    )}
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded bg-muted flex items-center justify-center flex-shrink-0">
                        <Search className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.floor || 1}층에서 발견</p>
                        {item.storyHint && <p className="text-xs text-primary mt-1 italic">💡 {item.storyHint}</p>}
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-border/50">
                      {isOnBoard ? (
                        <span className="text-xs text-green-500 flex items-center gap-1"><Check className="w-3 h-3" /> 보드에 추가됨</span>
                      ) : (
                        <button onClick={() => handleAddEvidenceToBoard(item)} disabled={isDialogActive}
                          className="text-xs bg-primary/20 text-primary px-2 py-1 rounded hover:bg-primary/30 transition-colors flex items-center gap-1">
                          <Plus className="w-3 h-3" /> 보드에 추가
                        </button>
                      )}
                    </div>
                  </div>
                )
              })
            )
          )}
          {/* 용의자 탭 */}
          {leftPanelTab === 'suspect' && (
            tutorialSuspects.map(suspect => {
              const isOnBoard = boardItems.some(b => b.id === suspect.id)
              // 튜토리얼 연습 단계에서 이영희(suspect-2) 강조
              const shouldHighlight = storyStep === 'waitBoardPractice' && suspect.id === 'suspect-2' && !isOnBoard
              return (
                <div
                  key={suspect.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', JSON.stringify({ item: suspect, type: 'suspect' }))
                  }}
                  onMouseEnter={(e) => {
                    if (panelHoverTimeoutRef.current) clearTimeout(panelHoverTimeoutRef.current)
                    const rect = e.currentTarget.getBoundingClientRect()
                    panelHoverTimeoutRef.current = setTimeout(() => {
                      setHoveredPanelItem(suspect.id)
                      setHoveredPanelType('suspect')
                      setHoveredPanelData(suspect)
                      setTooltipPosition({ top: rect.top })
                    }, 500)
                  }}
                  onMouseLeave={() => {
                    if (panelHoverTimeoutRef.current) clearTimeout(panelHoverTimeoutRef.current)
                    setHoveredPanelItem(null)
                    setHoveredPanelType(null)
                    setHoveredPanelData(null)
                  }}
                  className={cn(
                    "bg-muted/30 border rounded-lg p-3 cursor-grab active:cursor-grabbing relative",
                    shouldHighlight ? "border-2 border-red-500 ring-4 ring-red-500/50 animate-pulse" : "border-border"
                  )}
                >
                  {shouldHighlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold whitespace-nowrap z-10">
                      ✨ 드래그하세요!
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded bg-muted flex items-center justify-center flex-shrink-0">
                      <Users className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm">{suspect.name}</p>
                      <p className="text-xs text-muted-foreground">{suspect.role}</p>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-border/50">
                    {isOnBoard ? (
                      <span className="text-xs text-green-500 flex items-center gap-1"><Check className="w-3 h-3" /> 보드에 추가됨</span>
                    ) : (
                      <button onClick={() => handleAddSuspectToBoard(suspect)}
                        className="text-xs bg-primary/20 text-primary px-2 py-1 rounded hover:bg-primary/30 transition-colors flex items-center gap-1">
                        <Plus className="w-3 h-3" /> 보드에 추가
                      </button>
                    )}
                  </div>
                </div>
              )
            })
          )}
          {/* 장소 탭 */}
          {leftPanelTab === 'location' && (
            tutorialRooms.map(room => {
              const isOnBoard = boardItems.some(b => b.id === `location-${room.id}`)
              // 튜토리얼 보드 연습 단계에서 침실(room.id=1) 강조
              const shouldHighlight = storyStep === 'waitBoardPractice' && room.id === 1 && !isOnBoard
              return (
                <div
                  key={room.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', JSON.stringify({ item: room, type: 'location' }))
                  }}
                  onMouseEnter={(e) => {
                    if (panelHoverTimeoutRef.current) clearTimeout(panelHoverTimeoutRef.current)
                    const rect = e.currentTarget.getBoundingClientRect()
                    panelHoverTimeoutRef.current = setTimeout(() => {
                      setHoveredPanelItem(`location-${room.id}`)
                      setHoveredPanelType('location')
                      setHoveredPanelData(room)
                      setTooltipPosition({ top: rect.top })
                    }, 500)
                  }}
                  onMouseLeave={() => {
                    if (panelHoverTimeoutRef.current) clearTimeout(panelHoverTimeoutRef.current)
                    setHoveredPanelItem(null)
                    setHoveredPanelType(null)
                    setHoveredPanelData(null)
                  }}
                  className={cn(
                    "bg-muted/30 border rounded-lg p-3 cursor-grab active:cursor-grabbing relative",
                    shouldHighlight ? "border-2 border-red-500 ring-4 ring-red-500/50 animate-pulse" : "border-border"
                  )}
                >
                  {shouldHighlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold whitespace-nowrap z-10">
                      ✨ 드래그하세요!
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded bg-muted flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm">{room.name}</p>
                      <p className="text-xs text-muted-foreground">{room.floor}층</p>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-border/50">
                    {isOnBoard ? (
                      <span className="text-xs text-green-500 flex items-center gap-1"><Check className="w-3 h-3" /> 보드에 추가됨</span>
                    ) : (
                      <button onClick={() => handleAddLocationToBoard(room)}
                        className="text-xs bg-primary/20 text-primary px-2 py-1 rounded hover:bg-primary/30 transition-colors flex items-center gap-1">
                        <Plus className="w-3 h-3" /> 보드에 추가
                      </button>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* 호버 툴팁 - 조사 팔레트 (overflow 바깥에 렌더링) */}
        {hoveredPanelData && hoveredPanelType && (
          <div
            className="fixed w-64 bg-gray-900 border border-gray-700 rounded-lg shadow-xl p-3 pointer-events-none animate-in fade-in duration-150 z-[100]"
            style={{
              left: '330px',
              top: Math.min(Math.max(tooltipPosition.top, 80), window.innerHeight - 250),
            }}
          >
            {/* 증거 툴팁 */}
            {hoveredPanelType === 'evidence' && (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 text-xs font-bold text-white rounded bg-red-500">증거</span>
                  <span className="font-bold text-sm text-white">{hoveredPanelData.name}</span>
                </div>
                <div className="text-xs space-y-1 text-gray-300">
                  <p>🏢 발견 층: {hoveredPanelData.floor || 1}층</p>
                  {hoveredPanelData.description && (
                    <p className="mt-1">📝 {hoveredPanelData.description}</p>
                  )}
                  {hoveredPanelData.assistantComment && (
                    <div className="mt-2 p-2 bg-red-500/20 rounded border border-red-500/30">
                      <p className="text-red-300 italic">🔍 "{hoveredPanelData.assistantComment}"</p>
                    </div>
                  )}
                </div>
              </>
            )}
            {/* 용의자 툴팁 */}
            {hoveredPanelType === 'suspect' && (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 text-xs font-bold text-white rounded bg-amber-500">용의자</span>
                  <span className="font-bold text-sm text-white">{hoveredPanelData.name}</span>
                </div>
                <div className="text-xs space-y-1 text-gray-300">
                  <p>👤 나이: {hoveredPanelData.age}세</p>
                  <p>⚧ 성별: {hoveredPanelData.gender}</p>
                  <p>💼 직업: {hoveredPanelData.occupation}</p>
                  {hoveredPanelData.oneLiner && (
                    <div className="mt-2 p-2 bg-amber-500/20 rounded border border-amber-500/30">
                      <p className="text-amber-300 italic">💬 "{hoveredPanelData.oneLiner}"</p>
                    </div>
                  )}
                </div>
              </>
            )}
            {/* 장소 툴팁 */}
            {hoveredPanelType === 'location' && (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 text-xs font-bold text-white rounded bg-green-500">장소</span>
                  <span className="font-bold text-sm text-white">{hoveredPanelData.name}</span>
                </div>
                <div className="text-xs space-y-1 text-gray-300">
                  <p>🏢 층: {hoveredPanelData.floor}층</p>
                  {hoveredPanelData.description && (
                    <p className="mt-1">📍 {hoveredPanelData.description}</p>
                  )}
                  {hoveredPanelData.assistantComment && (
                    <div className="mt-2 p-2 bg-green-500/20 rounded border border-green-500/30">
                      <p className="text-green-300 italic">🔍 "{hoveredPanelData.assistantComment}"</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {!leftPanelOpen && (
        <button
          onClick={() => !isDialogActive && setLeftPanelOpen(true)}
          disabled={isDialogActive}
          className="fixed top-1/2 -translate-y-1/2 left-0 z-40 w-10 h-24 bg-card border border-border border-l-0 rounded-r-lg flex items-center justify-center hover:bg-muted/50"
        >
          <Search className="w-5 h-5" />
        </button>
      )}

      {/* ===== 오른쪽 패널 (수사 로그) ===== */}
      <div
        className={cn(
          "fixed top-16 right-0 h-[calc(100%-140px)] bg-card/95 backdrop-blur border-l transition-all duration-300 z-40 w-72 flex flex-col",
          rightPanelOpen ? "translate-x-0" : "translate-x-full",
          // 수사로그 강조: logIntro 단계에서 빨간색 강조
          !isDialogActive && storyStep === 'logIntro'
            ? "border-l-4 border-l-red-500 ring-4 ring-red-500/50 shadow-lg shadow-red-500/30"
            : "border-border"
        )}
      >
        <div className={cn(
          "p-4 border-b border-border flex items-center justify-between relative",
          !isDialogActive && storyStep === 'logIntro' && "bg-red-500/10"
        )}>
          {/* 수사로그 강조 안내 */}
          {!isDialogActive && storyStep === 'logIntro' && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-red-500 text-white text-xs px-3 py-1 rounded-full font-bold animate-bounce whitespace-nowrap">
              👉 수사 로그를 확인하세요!
            </div>
          )}
          <h3 className={cn(
            "font-bold flex items-center gap-2",
            !isDialogActive && storyStep === 'logIntro' && "text-red-400"
          )}>
            <FileText className={cn("w-5 h-5", !isDialogActive && storyStep === 'logIntro' ? "text-red-400" : "text-primary")} />수사 로그
          </h3>
          <button onClick={() => !isDialogActive && setRightPanelOpen(false)} disabled={isDialogActive}>
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 p-3 space-y-2 overflow-y-auto">
          {logs.map(log => (
            <div key={log.id} className={cn(
              "flex items-start gap-2 py-2 border-b border-border/30 transition-all",
              (log.type === 'evidence' || log.type === 'chat' || log.type === 'board') && "animate-in slide-in-from-right duration-300"
            )}>
              <span className="text-xs font-mono text-muted-foreground w-14">{log.time}</span>
              <span className={cn(
                "text-xs px-2 py-0.5 rounded font-bold whitespace-nowrap",
                log.type === 'system' && "bg-blue-500/20 text-blue-400",
                log.type === 'move' && "bg-green-500/20 text-green-400",
                log.type === 'evidence' && "bg-yellow-500/20 text-yellow-400",
                log.type === 'chat' && "bg-purple-500/20 text-purple-400",
              )}>
                {log.type === 'system' && '시스템'}
                {log.type === 'move' && '이동'}
                {log.type === 'evidence' && '증거'}
                {log.type === 'chat' && '대화'}
              </span>
              <span className="text-xs flex-1">{log.message}</span>
            </div>
          ))}
        </div>
      </div>

      {!rightPanelOpen && (
        <button
          onClick={() => !isDialogActive && setRightPanelOpen(true)}
          disabled={isDialogActive}
          className="fixed top-1/2 -translate-y-1/2 right-0 z-40 w-10 h-24 bg-card border border-border border-r-0 rounded-l-lg flex items-center justify-center hover:bg-muted/50"
        >
          <FileText className="w-5 h-5" />
        </button>
      )}

      {/* ===== 중앙 2D 맵 (AgitRoom) - GameRoom과 동일 ===== */}
      <div
        className={cn(
          "fixed z-20 transition-all duration-300",
          isDialogActive && "opacity-40"
        )}
        style={{
          top: '80px',
          left: leftPanelOpen ? '288px' : '0',
          right: rightPanelOpen ? '288px' : '0',
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
                FLOOR {currentRoom?.floor || 1}
              </span>
              <span className="text-sm font-bold gold-glow truncate">{tutorialStory.title}</span>
            </div>
          </div>
          <div className="w-full h-[calc(100%-40px)] bg-black/40 relative">
            <AgitRoom
              clues={tutorialClues}
              onClueInspected={handleClueInspected}
              onRoomChanged={handleRoomChanged}
              isDialogActive={isDialogActive}
              inputFocused={phoneOpen && selectedContact !== null}
              canUseElevator={['waitElevator'].includes(storyStep)}
            />

            {isDialogActive && (
              <div 
                className="absolute inset-0 z-50 cursor-not-allowed" 
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.preventDefault()}
              />
            )}

            {/* 이동 + 스페이스바 통합 안내 (movement 단계) */}
            {storyStep === 'movement' && !isDialogActive && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none">
                <div className="bg-card/95 backdrop-blur px-5 py-4 rounded-xl border-2 border-primary shadow-xl">
                  <div className="flex items-center gap-6">
                    {/* WASD 키 안내 */}
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-8 h-8 bg-muted border-2 border-primary rounded flex items-center justify-center font-bold text-primary text-xs">W</div>
                        <div className="flex gap-1">
                          <div className="w-8 h-8 bg-muted border-2 border-primary rounded flex items-center justify-center font-bold text-primary text-xs">A</div>
                          <div className="w-8 h-8 bg-muted border-2 border-primary rounded flex items-center justify-center font-bold text-primary text-xs">S</div>
                          <div className="w-8 h-8 bg-muted border-2 border-primary rounded flex items-center justify-center font-bold text-primary text-xs">D</div>
                        </div>
                      </div>
                      <span className="text-sm font-bold">이동</span>
                    </div>

                    <div className="w-px h-12 bg-border" />

                    {/* Space 키 안내 */}
                    <div className="flex items-center gap-3">
                      <kbd className="px-4 py-2 bg-primary text-white rounded-lg font-bold text-sm shadow-lg animate-pulse">Space</kbd>
                      <span className="text-sm font-bold">반짝이는 단서 근처에서 수집!</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 엘리베이터 + 스페이스바 안내 (두 번째, 세 번째 단서 탐색 단계) */}
            {(storyStep === 'waitSecondClue' || storyStep === 'waitThirdClue') && !isDialogActive && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none">
                <div className="bg-card/95 backdrop-blur px-5 py-3 rounded-xl border-2 border-primary shadow-xl">
                  <div className="flex items-center gap-3">
                    <kbd className="px-4 py-2 bg-primary text-white rounded-lg font-bold text-sm shadow-lg animate-pulse">Space</kbd>
                    <span className="text-sm font-bold">엘리베이터 앞에서 층 이동 / 단서 근처에서 수집</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===== 하단 추리보드 토글 (GameRoom BottomBoardPanel 스타일 - 게임화면만) ===== */}
      <div
        className="fixed bottom-0 z-40"
        style={{
          left: leftPanelOpen ? '288px' : '0px',
          right: rightPanelOpen ? '288px' : '0px',
        }}
      >
        {/* 추리보드 열기 안내 */}
        {storyStep === 'waitBoardOpen' && !isDialogActive && !boardPanelOpen && (
          <div className="absolute -top-16 left-1/2 -translate-x-1/2 whitespace-nowrap animate-bounce z-50">
            <div className="bg-red-500 text-white text-xs px-3 py-1.5 rounded-full font-bold shadow-lg">
              👇 추리보드를 열어보세요!
            </div>
          </div>
        )}
        {/* 토글 버튼 (BottomBoardPanel 스타일) */}
        <button
          onClick={handleBoardClick}
          disabled={isDialogActive}
          className={cn(
            "absolute -top-10 left-1/2 -translate-x-1/2 px-6 py-2 bg-card border border-border border-b-0 rounded-t-lg flex items-center gap-2 hover:bg-muted/50 transition-colors",
            storyStep === 'waitBoardOpen' && !isDialogActive && !boardPanelOpen
              ? "border-red-500 ring-2 ring-red-500/50"
              : "",
            isDialogActive && "opacity-50 pointer-events-none"
          )}
          style={storyStep === 'waitBoardOpen' && !isDialogActive && !boardPanelOpen ? {
            animation: 'pulse 1s ease-in-out infinite'
          } : {}}
        >
          <FileText className={cn("w-4 h-4", storyStep === 'waitBoardOpen' && !isDialogActive && !boardPanelOpen ? "text-red-500" : "text-primary")} />
          <span className={cn("text-sm font-bold", storyStep === 'waitBoardOpen' && !isDialogActive && !boardPanelOpen && "text-red-400")}>개인 추리보드</span>
          {boardPanelOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
      </div>

      {/* ===== 오른쪽 하단 버튼들 (GameRoom과 동일 - 음악 아이콘과 안겹치게 right-28) ===== */}
      <div className="fixed right-28 bottom-6 z-40 flex items-center gap-3">
        <div className="relative">
          {/* 휴대폰 안내 문구 */}
          {(storyStep === 'waitChat1') && !isDialogActive && !phoneOpen && (
            <div className="absolute bottom-16 right-0 w-44 animate-bounce pointer-events-none">
              <div className="bg-red-500 text-white px-3 py-2 rounded-lg shadow-lg text-center">
                <p className="text-xs font-bold">📱 휴대폰을 열어보세요!</p>
                <p className="text-[10px] opacity-90 mt-0.5">용의자와 대화하기</p>
              </div>
              <div className="absolute -bottom-2 right-5 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-red-500" />
            </div>
          )}
          <button
            onClick={handlePhoneClick}
            disabled={isDialogActive}
            className={cn(
              "w-14 h-14 bg-card/95 border-2 rounded-full shadow-lg hover:scale-105 transition-transform flex items-center justify-center",
              // 휴대폰 강조: 용의자와 대화해야 하는 단계에서 빨간색 강조
              (storyStep === 'waitChat1') && !isDialogActive && !phoneOpen
                ? "border-red-500 ring-4 ring-red-500/60 shadow-red-500/30"
                : "border-blue-500",
              isDialogActive && "opacity-50 pointer-events-none"
            )}
            style={(storyStep === 'waitChat1') && !isDialogActive && !phoneOpen ? {
              animation: 'pulse 1s ease-in-out infinite'
            } : {}}
          >
            <Smartphone className={cn(
              "w-7 h-7",
              (storyStep === 'waitChat1') && !isDialogActive && !phoneOpen
                ? "text-red-500"
                : "text-blue-500"
            )} />
          </button>
        </div>
      </div>

      {/* ===== 추리보드 패널 (GameRoom BottomBoardPanel 스타일 - 게임화면만 가리기) ===== */}
      {boardPanelOpen && (
        <div
          className={cn(
            "fixed bottom-0 bg-card/95 backdrop-blur border-t border-l border-r border-border rounded-t-lg z-[60] animate-in slide-in-from-bottom duration-300",
            isDialogActive && "pointer-events-none opacity-60"
          )}
          style={{
            left: leftPanelOpen ? '288px' : '0px',
            right: rightPanelOpen ? '288px' : '0px',
          }}
        >
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold gold-glow">추리 보드</h2>
              {/* 연결 모드 안내 (GameRoom 스타일) */}
              {lineMode && connectStart && (
                <div className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg border",
                  lineMode === 'red' ? "bg-red-500/10 border-red-500/30" : "bg-amber-500/10 border-amber-500/30"
                )}>
                  <span className={cn("text-xs", lineMode === 'red' ? "text-red-400" : "text-amber-400")}>
                    📌 "{connectStart.data?.name || connectStart.type}" 선택됨 → 연결할 카드 클릭
                  </span>
                  <button
                    onClick={handleCancelConnect}
                    className="text-xs text-muted-foreground hover:text-white px-2"
                  >
                    취소
                  </button>
                </div>
              )}
              {/* 연결선 선택 시 안내 (X 버튼은 연결선 위에 직접 표시) */}
              {selectedConnection !== null && (
                <div className="flex items-center gap-2 bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/30">
                  <span className="text-xs text-red-400">🔗 연결선의 X 버튼을 클릭해 제거하세요</span>
                  <button
                    onClick={() => setSelectedConnection(null)}
                    className="text-xs text-muted-foreground hover:text-white px-2"
                  >
                    취소
                  </button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* 연결 모드 버튼 (+메모 옆으로 이동) */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleLineMode('red')}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-bold border transition-colors",
                    lineMode === 'red'
                      ? "bg-red-500/15 border-red-500/50 text-red-400"
                      : "bg-muted/30 border-border text-muted-foreground hover:text-foreground",
                    // 연결 안내 단계에서 확정 버튼 강조
                    storyStep === 'waitBoardConnect' && !lineMode && "ring-4 ring-red-500 bg-red-500/30 text-red-400 border-red-500"
                  )}
                >
                  확정
                </button>
                <button
                  type="button"
                  onClick={() => toggleLineMode('yellow')}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-bold border transition-colors",
                    lineMode === 'yellow'
                      ? "bg-amber-500/15 border-amber-500/50 text-amber-400"
                      : "bg-muted/30 border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  의심
                </button>
                {lineMode && (
                  <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                    {connectStart ? '1/2 선택' : '2개 클릭'}
                  </span>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={() => setMemoModalOpen(true)}>
                <Plus className="w-4 h-4 mr-1" />메모
              </Button>
              {/* 줌 컨트롤 (GameRoom 스타일) */}
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newZoom = Math.max(MIN_ZOOM, boardZoom - ZOOM_STEP)
                    setBoardZoom(newZoom)
                    boardZoomRef.current = newZoom
                  }}
                  className="h-8 w-8 p-0"
                  title="축소"
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 font-mono text-xs"
                  onClick={() => {
                    setBoardZoom(1)
                    boardZoomRef.current = 1
                  }}
                  title="줌 리셋"
                >
                  {Math.round(boardZoom * 100)}%
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newZoom = Math.min(MAX_ZOOM, boardZoom + ZOOM_STEP)
                    setBoardZoom(newZoom)
                    boardZoomRef.current = newZoom
                  }}
                  className="h-8 w-8 p-0"
                  title="확대"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {/* 저장 버튼 (GameRoom 스타일) */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveBoard}
                disabled={saveStatus === 'saving'}
                className={cn(
                  saveStatus === 'saved' && "border-green-500 text-green-500",
                  // 저장 안내 단계에서 저장 버튼 강조 (빨간 박스)
                  storyStep === 'waitBoardSave' && !saveStatus && "ring-4 ring-red-500 bg-red-500/30 text-red-400 border-red-500"
                )}
              >
                {saveStatus === 'saving' ? (
                  <>저장 중...</>
                ) : saveStatus === 'saved' ? (
                  <><Check className="w-4 h-4 mr-1" />저장됨</>
                ) : (
                  <><Save className="w-4 h-4 mr-1" />저장</>
                )}
              </Button>
              {/* 닫기 버튼 */}
              <div className="relative">
                {/* 닫기 버튼 안내 */}
                {storyStep === 'waitBoardClose' && !isDialogActive && (
                  <div className="absolute -top-10 right-0 whitespace-nowrap animate-bounce">
                    <div className="bg-red-500 text-white text-xs px-3 py-1.5 rounded-full font-bold shadow-lg">
                      👇 닫기 버튼을 눌러주세요!
                    </div>
                  </div>
                )}
                <button
                  onClick={handleBoardClose}
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                    storyStep === 'waitBoardClose' && !isDialogActive
                      ? "border-2 border-red-500 ring-4 ring-red-500/50 bg-red-500/10"
                      : "hover:bg-muted/50"
                  )}
                  style={storyStep === 'waitBoardClose' && !isDialogActive ? {
                    animation: 'pulse 1s ease-in-out infinite'
                  } : {}}
                >
                  <ChevronDown className={cn("w-6 h-6", storyStep === 'waitBoardClose' && !isDialogActive && "text-red-400")} />
                </button>
              </div>
            </div>
          </div>

          {/* 필터 바 (InvestigationBoard와 동일) */}
          <div className="p-3 border-b border-border bg-muted/20 flex gap-2 overflow-x-auto">
            {[
              { value: 'all', label: '전체 보기' },
              { value: 'suspect', label: '용의자' },
              { value: 'evidence', label: '증거' },
              { value: 'location', label: '장소' },
              { value: 'memo', label: '메모' },
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => setBoardFilter(opt.value)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors",
                  boardFilter === opt.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/50 text-muted-foreground hover:text-foreground"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div
            ref={boardAreaRef}
            className={cn(
              "relative h-[calc(100vh-300px)] overflow-auto no-scrollbar",
              isPanning && "cursor-grabbing"
            )}
            style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
            onWheel={(e) => {
              if (!e.ctrlKey && !e.metaKey) {
                // 마우스 휠로 줌 (GameRoom과 동일)
                e.preventDefault()
                const direction = e.deltaY < 0 ? 1 : -1
                const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, boardZoomRef.current + direction * ZOOM_STEP))
                setBoardZoom(newZoom)
                boardZoomRef.current = newZoom
              }
            }}
            onMouseDown={(e) => {
              // 카드나 연결선이 아닌 빈 공간 클릭 시에만 패닝 시작
              // 카드([data-board-card])나 연결선 위에서는 패닝 비활성화
              if (e.target.closest('[data-board-card]') || e.target.closest('[data-connection]')) {
                return // 카드나 연결선 클릭 시 패닝 안함
              }
              if (e.target === e.currentTarget || e.target.closest('[data-board-bg]')) {
                setIsPanning(true)
                panStartRef.current = {
                  x: e.clientX,
                  y: e.clientY,
                  scrollLeft: boardAreaRef.current.scrollLeft,
                  scrollTop: boardAreaRef.current.scrollTop
                }
              }
            }}
            onMouseMove={(e) => {
              if (!isPanning) return
              const dx = e.clientX - panStartRef.current.x
              const dy = e.clientY - panStartRef.current.y
              boardAreaRef.current.scrollLeft = panStartRef.current.scrollLeft - dx
              boardAreaRef.current.scrollTop = panStartRef.current.scrollTop - dy
            }}
            onMouseUp={() => setIsPanning(false)}
            onMouseLeave={() => setIsPanning(false)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              try {
                const data = JSON.parse(e.dataTransfer.getData('text/plain'))
                const rect = boardAreaRef.current.getBoundingClientRect()
                // 줌 적용된 좌표 계산
                const x = (e.clientX - rect.left) / boardZoom - 88
                const y = (e.clientY - rect.top) / boardZoom - 80

                if (data.type === 'evidence') {
                  const itemId = `evidence-${data.item.id}`
                  if (!boardItems.some(b => b.id === itemId)) {
                    setBoardItems(prev => [...prev, { id: itemId, type: 'evidence', x, y, data: data.item }])
                    addLog('board', `[${data.item.name}] 추리보드에 추가됨`)
                  }
                } else if (data.type === 'suspect') {
                  if (!boardItems.some(b => b.id === data.item.id)) {
                    setBoardItems(prev => [...prev, { id: data.item.id, type: 'suspect', x, y, data: data.item }])
                    addLog('board', `[${data.item.name}] 추리보드에 추가됨`)
                  }
                } else if (data.type === 'location') {
                  const itemId = `location-${data.item.id}`
                  if (!boardItems.some(b => b.id === itemId)) {
                    setBoardItems(prev => [...prev, { id: itemId, type: 'location', x, y, data: data.item }])
                    addLog('board', `[${data.item.name}] 추리보드에 추가됨`)
                  }
                }
              } catch (err) {
                console.error('드롭 처리 실패:', err)
              }
            }}
          >
            {/* 줌 가능한 보드 컨텐츠 */}
            <div
              className="relative"
              style={{
                width: `${BOARD_WIDTH * boardZoom}px`,
                height: `${BOARD_HEIGHT * boardZoom}px`,
              }}
            >
              <div
                data-board-bg
                className="relative"
                style={{
                  width: `${BOARD_WIDTH}px`,
                  height: `${BOARD_HEIGHT}px`,
                  transform: `scale(${boardZoom})`,
                  transformOrigin: '0 0',
                  backgroundImage: 'url(/board/board.jpg)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
            {/* 연결선 (실 이미지) - 필터에 맞는 카드끼리만 표시 */}
            {connections.map((conn, idx) => {
              const fromItem = boardItems.find(i => i.id === conn.from)
              const toItem = boardItems.find(i => i.id === conn.to)
              if (!fromItem || !toItem) return null

              // 필터 적용: 양쪽 카드가 모두 보이는 경우에만 연결선 표시
              const isFromVisible = fromItem.type === 'victim' || boardFilter === 'all' || fromItem.type === boardFilter
              const isToVisible = toItem.type === 'victim' || boardFilter === 'all' || toItem.type === boardFilter
              if (!isFromVisible || !isToVisible) return null

              const isSelected = selectedConnection === idx

              // 두 점 사이 계산
              const fromX = fromItem.x + 88, fromY = fromItem.y + 100
              const toX = toItem.x + 88, toY = toItem.y + 100
              const dx = toX - fromX, dy = toY - fromY
              const distance = Math.sqrt(dx * dx + dy * dy)
              const angle = Math.atan2(dy, dx) * 180 / Math.PI
              const midX = (fromX + toX) / 2, midY = (fromY + toY) / 2

              // 처짐 효과 (거리에 비례)
              const sag = Math.min(distance * 0.08, 25)

              // 노란선(의심)은 빨간선의 절반 크기
              const lineHeight = conn.type === 'yellow' ? 20 : 40

              return (
                <div
                  key={idx}
                  data-connection
                  className={cn(
                    "absolute cursor-pointer",
                    isSelected && "z-10"
                  )}
                  style={{
                    left: midX,
                    top: midY,
                    width: distance,
                    height: lineHeight,
                    transform: `translate(-50%, -50%) rotate(${angle}deg)`,
                    transformOrigin: 'center center',
                  }}
                  onClick={() => handleConnectionClick(conn, idx)}
                >
                  {/* 실 이미지 - 빨간색(red)은 thread.png, 노란색(yellow)은 thread2.png */}
                  <div
                    className="w-full h-full relative"
                    style={{
                      backgroundImage: conn.type === 'yellow' ? 'url(/board/thread2.png)' : 'url(/board/thread.png)',
                      backgroundSize: 'auto 100%',
                      backgroundRepeat: 'repeat-x',
                      backgroundPosition: 'center',
                      filter: isSelected ? 'brightness(1.5) drop-shadow(0 0 4px white)' : 'drop-shadow(1px 2px 2px rgba(0,0,0,0.3))',
                      // 처짐 효과를 위한 곡선 (노란선은 처짐 최소화)
                      borderRadius: conn.type === 'yellow' ? `0 0 ${sag/4}px ${sag/4}px` : `0 0 ${sag}px ${sag}px`,
                      transform: conn.type === 'yellow' ? 'none' : `scaleY(${1 + sag/50})`,
                    }}
                  />
                  {/* 선택 시 X 버튼 표시 (연결선 바로 위) */}
                  {isSelected && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteConnection()
                      }}
                      className="absolute left-1/2 -translate-x-1/2 -top-8 w-7 h-7 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 flex items-center justify-center text-sm font-bold border-2 border-white transition-transform hover:scale-110 z-20"
                      style={{ transform: `translateX(-50%) rotate(${-angle}deg)` }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              )
            })}

            {boardItems.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="bg-black/60 backdrop-blur px-6 py-4 rounded-xl">
                  <p className="text-white text-center">
                    증거를 수집하면 자동으로 추가됩니다.<br/>
                    카드를 클릭해 2개를 선택한 후 연결하세요!
                  </p>
                </div>
              </div>
            ) : (
              boardItems
                .filter(item => {
                  // 필터 적용 (InvestigationBoard와 동일)
                  if (item.type === 'victim') return true // 피해자는 항상 표시
                  if (boardFilter === 'all') return true
                  return item.type === boardFilter
                })
                .map(item => {
                const isFirstSelected = connectStart?.id === item.id
                const isCardSelected = selectedBoardItem === item.id
                const hash = Math.abs(item.id.charCodeAt(0) * 31) % 10
                const rotation = (hash % 2 === 0 ? 1 : -1) * 2

                // 타입별 색상 및 라벨 (InvestigationBoard와 동일)
                const typeConfig = {
                  victim: { label: '피해자', color: 'bg-red-500' },
                  suspect: { label: '용의자', color: 'bg-amber-500' },
                  evidence: { label: '증거', color: 'bg-blue-500' },
                  location: { label: '장소', color: 'bg-green-500' },
                  memo: { label: '메모', color: 'bg-gray-500' },
                }
                const config = typeConfig[item.type] || typeConfig.memo

                return (
                  <div
                    key={item.id}
                    data-board-card
                    onMouseDown={(e) => handleItemMouseDown(e, item)}
                    onClick={() => {
                      // 연결 모드면 연결 로직, 아니면 카드 선택
                      if (lineMode) {
                        handleItemClick(item)
                      } else {
                        setSelectedBoardItem(selectedBoardItem === item.id ? null : item.id)
                      }
                    }}
                    className={cn(
                      "absolute cursor-move select-none group",
                      lineMode && "cursor-pointer",
                      isFirstSelected && lineMode === 'red' && "ring-4 ring-red-500 ring-offset-2",
                      isFirstSelected && lineMode === 'yellow' && "ring-4 ring-amber-500 ring-offset-2",
                      isCardSelected && !lineMode && "ring-2 ring-primary"
                    )}
                    style={{
                      left: item.x,
                      top: item.y,
                      zIndex: hoveredBoardItem === item.id ? 50 : (isFirstSelected || isCardSelected ? 10 : 2)
                    }}
                    onMouseEnter={() => {
                      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
                      hoverTimeoutRef.current = setTimeout(() => {
                        setHoveredBoardItem(item.id)
                      }, 1000) // 1초 딜레이
                    }}
                    onMouseLeave={() => {
                      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
                      setHoveredBoardItem(null)
                    }}
                  >
                    {/* 호버 툴팁 - 상세정보 (1초 딜레이, 검정배경 흰글씨) */}
                    {hoveredBoardItem === item.id && item.type !== 'memo' && (
                      <div
                        className="absolute left-full ml-3 top-0 w-64 bg-gray-900 border border-gray-700 rounded-lg shadow-xl p-3 pointer-events-none animate-in fade-in duration-150"
                        style={{ zIndex: 100 }}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className={cn("px-2 py-0.5 text-xs font-bold text-white rounded", config.color)}>
                            {config.label}
                          </span>
                          <span className="font-bold text-sm text-white">{item.data?.name}</span>
                        </div>
                        {item.type === 'victim' && (
                          <div className="text-xs space-y-1 text-gray-300">
                            <p>👤 나이: {item.data?.age}세</p>
                            <p>💼 역할: {item.data?.role}</p>
                            <p>📍 발견장소: {item.data?.discoveryLocation}</p>
                            <p>⚰️ 사인: {item.data?.causeOfDeath}</p>
                          </div>
                        )}
                        {item.type === 'suspect' && (
                          <div className="text-xs space-y-1 text-gray-300">
                            <p>👤 나이: {item.data?.age}세</p>
                            <p>⚧ 성별: {item.data?.gender}</p>
                            <p>💼 직업: {item.data?.occupation || item.data?.role}</p>
                            {item.data?.oneLiner && (
                              <div className="mt-2 p-2 bg-amber-500/20 rounded border border-amber-500/30">
                                <p className="text-amber-300 italic">💬 "{item.data?.oneLiner}"</p>
                              </div>
                            )}
                          </div>
                        )}
                        {item.type === 'evidence' && (
                          <div className="text-xs space-y-1 text-gray-300">
                            <p>🏢 발견 층: {item.data?.floor || 1}층</p>
                            {item.data?.description && (
                              <p className="mt-1">📝 {item.data?.description}</p>
                            )}
                            {item.data?.assistantComment && (
                              <div className="mt-2 p-2 bg-red-500/20 rounded border border-red-500/30">
                                <p className="text-red-300 italic">🔍 "{item.data?.assistantComment}"</p>
                              </div>
                            )}
                          </div>
                        )}
                        {item.type === 'location' && (
                          <div className="text-xs space-y-1 text-gray-300">
                            <p>🏢 층: {item.data?.floor}층</p>
                            {item.data?.description && (
                              <p className="mt-1">📍 {item.data?.description}</p>
                            )}
                            {item.data?.assistantComment && (
                              <div className="mt-2 p-2 bg-green-500/20 rounded border border-green-500/30">
                                <p className="text-green-300 italic">🔍 "{item.data?.assistantComment}"</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* 핀 (InvestigationBoard와 동일) */}
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                      <Pin className="w-6 h-6 text-red-600 fill-red-600" style={{ filter: 'drop-shadow(0 3px 4px rgba(0,0,0,0.5))' }} />
                    </div>

                    {/* 삭제 버튼 - victim 제외 (GameRoom 스타일) */}
                    {isCardSelected && item.type !== 'victim' && (
                      <button
                        type="button"
                        onMouseDown={(e) => { e.preventDefault(); e.stopPropagation() }}
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          handleRemoveBoardItem(item.id)
                        }}
                        className="absolute -top-2 -right-2 w-7 h-7 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 flex items-center justify-center text-sm font-bold border-2 border-white transition-transform hover:scale-110"
                        style={{ zIndex: 20 }}
                      >
                        ✕
                      </button>
                    )}

                    {/* 폴라로이드 카드 (InvestigationBoard와 동일) */}
                    <div
                      className={cn(
                        "w-44 bg-white transition-all duration-300",
                        isCardSelected && "ring-2 ring-primary"
                      )}
                      style={{
                        transform: isCardSelected ? 'scale(1.05) rotate(0deg)' : `rotate(${rotation}deg)`,
                        boxShadow: '4px 4px 12px rgba(0,0,0,0.3), 0 0 0 1px rgba(0,0,0,0.05)'
                      }}
                    >
                      {/* 이미지 영역 */}
                      <div className="p-2 pb-0">
                        <div className={cn(
                          "w-full h-28 flex items-center justify-center relative",
                          item.type === 'memo'
                            ? "bg-gradient-to-br from-amber-100 to-amber-200"
                            : "bg-gradient-to-br from-gray-200 to-gray-300"
                        )}>
                          {item.type === 'memo' ? (
                            <span className="text-4xl">📝</span>
                          ) : item.type === 'evidence' ? (
                            <span className="text-4xl">🔍</span>
                          ) : item.type === 'location' ? (
                            <span className="text-4xl">📍</span>
                          ) : (
                            <span className="text-4xl">👤</span>
                          )}
                          {/* 타입 뱃지 */}
                          <span className={cn(
                            "absolute top-1 right-1 px-2 py-0.5 text-[10px] font-bold text-white rounded",
                            config.color
                          )}>
                            {config.label}
                          </span>
                        </div>
                      </div>

                      {/* 정보 영역 (InvestigationBoard와 동일) */}
                      <div className="p-2 pt-2 pb-3 text-center">
                        {/* 이름 */}
                        <p className="text-sm font-bold text-gray-900 truncate">
                          {item.type === 'memo' ? '메모' : item.data?.name || '이름 없음'}
                        </p>

                        {/* 역할/타입 */}
                        {item.type === 'victim' && item.data?.role && (
                          <p className="text-xs text-gray-500 mt-0.5">{item.data.role}</p>
                        )}
                        {item.type === 'suspect' && item.data?.role && (
                          <p className="text-xs text-gray-500 mt-0.5">{item.data.role}</p>
                        )}

                        {/* 설명 (메모, 장소, 증거) */}
                        {item.type === 'memo' && item.data?.text && (
                          <p className="text-[11px] text-gray-600 mt-1 line-clamp-2 leading-tight px-1">
                            {item.data.text}
                          </p>
                        )}
                        {item.type === 'location' && item.data?.description && (
                          <p className="text-[11px] text-gray-600 mt-1 line-clamp-2 leading-tight px-1">
                            {item.data.description}
                          </p>
                        )}
                        {item.type === 'evidence' && item.data?.description && (
                          <p className="text-[11px] text-gray-600 mt-1 line-clamp-2 leading-tight px-1">
                            {item.data.description}
                          </p>
                        )}

                        {/* 장소: 층 정보 (InvestigationBoard와 동일) */}
                        {item.type === 'location' && item.data?.floor && (
                          <p className="text-[10px] text-green-600 font-semibold mt-1">{item.data.floor}층</p>
                        )}
                      </div>
                    </div>

                    {/* 연결 모드 선택 표시 */}
                    {isFirstSelected && lineMode && (
                      <div className={cn(
                        "absolute -top-2 -right-2 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold z-20",
                        lineMode === 'red' ? "bg-red-500" : "bg-amber-500"
                      )}>1</div>
                    )}
                  </div>
                )
              })
            )}
              </div>
            </div>
          </div>

          {/* 범례 (InvestigationBoard와 동일) */}
          <div className="p-4 flex gap-6 justify-center items-center text-sm border-t border-border">
            <div className="flex items-center gap-2">
              <div className="w-8 h-1 bg-red-600 rounded" />
              <span className="text-muted-foreground">확정</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-1 rounded" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #f59e0b 0, #f59e0b 4px, transparent 4px, transparent 8px)' }} />
              <span className="text-muted-foreground">의심</span>
            </div>
          </div>
        </div>
      )}

      {/* ===== 휴대폰 모달 ===== */}
      {phoneOpen && !isDialogActive && (
        <div className="fixed right-6 w-80 h-[500px] bg-gray-900 rounded-3xl border-4 border-gray-700 shadow-2xl z-[70] overflow-hidden flex flex-col" style={{ bottom: '100px' }}>
          <div className="bg-black h-6 flex items-center justify-center">
            <div className="w-20 h-4 bg-gray-800 rounded-full" />
          </div>

          {selectedContact ? (
            <>
              <div className="bg-gray-800 p-3 flex items-center gap-3">
                <button onClick={() => { setSelectedContact(null); setSelectedClue(null) }} className="p-1 hover:bg-gray-700 rounded">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="w-10 h-10 rounded-full bg-muted overflow-hidden flex items-center justify-center">
                  {selectedContact.isHelper ? (
                    <Lightbulb className="w-5 h-5 text-primary" />
                  ) : (
                    <Users className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <p className="font-bold text-sm">{selectedContact.name}</p>
                  <p className="text-xs text-muted-foreground">{selectedContact.isHelper ? '조력자' : '용의자'}</p>
                </div>
                {!selectedContact.isHelper && chattedSuspects.includes(selectedContact.id) && (
                  <span className="ml-auto text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">대화완료</span>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-950">
                {/* 상대방 인사 */}
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-2xl px-3 py-2 text-sm bg-gray-800 rounded-bl-sm">
                    <p>{selectedContact.isHelper
                      ? '무엇이 궁금하신가요? 도와드릴게요!'
                      : suspectChats[selectedContact.id]?.greeting
                    }</p>
                  </div>
                </div>

                {/* 이미 대화한 용의자면 응답도 표시 (증거별 질문 + 단서 태그) - 현재 대기 중이 아닐 때만 */}
                {!selectedContact.isHelper && chattedSuspects.includes(selectedContact.id) && !waitingForChatConfirm && (
                  <>
                    <div className="flex justify-end">
                      <div className="max-w-[80%] rounded-2xl px-3 py-2 text-sm bg-primary/20 rounded-br-sm">
                        {/* 단서 태그 표시 */}
                        {suspectChats[selectedContact.id]?.clueName && (
                          <span className="inline-block px-1.5 py-0.5 bg-blue-500/30 text-blue-300 text-xs rounded mr-1 mb-1">
                            @{suspectChats[selectedContact.id].clueName}
                          </span>
                        )}
                        <p>{suspectChats[selectedContact.id]?.question}</p>
                      </div>
                    </div>
                    <div className="flex justify-start">
                      <div className="max-w-[80%] rounded-2xl px-3 py-2 text-sm bg-gray-800 rounded-bl-sm">
                        <p>{suspectChats[selectedContact.id]?.response}</p>
                      </div>
                    </div>
                  </>
                )}

                {/* 대화 진행 중 - 응답 확인 대기 */}
                {!selectedContact.isHelper && waitingForChatConfirm && (
                  <>
                    <div className="flex justify-end">
                      <div className="max-w-[80%] rounded-2xl px-3 py-2 text-sm bg-primary/20 rounded-br-sm">
                        {/* 단서 태그 표시 */}
                        {suspectChats[selectedContact.id]?.clueName && (
                          <span className="inline-block px-1.5 py-0.5 bg-blue-500/30 text-blue-300 text-xs rounded mr-1 mb-1">
                            @{suspectChats[selectedContact.id].clueName}
                          </span>
                        )}
                        <p>{suspectChats[selectedContact.id]?.question}</p>
                      </div>
                    </div>
                    <div className="flex justify-start">
                      <div className="max-w-[80%] rounded-2xl px-3 py-2 text-sm bg-gray-800 rounded-bl-sm">
                        <p>{suspectChats[selectedContact.id]?.response}</p>
                      </div>
                    </div>
                    {/* 스페이스바 안내 */}
                    <div className="text-center py-3 animate-pulse">
                      <div className="inline-flex items-center gap-2 bg-primary/20 px-3 py-2 rounded-lg">
                        <kbd className="px-2 py-1 bg-primary text-white rounded text-xs font-bold">Space</kbd>
                        <span className="text-xs text-primary font-medium">눌러서 계속하기</span>
                      </div>
                    </div>
                  </>
                )}

                {/* 힌트: 대화하지 않은 용의자 */}
                {!selectedContact.isHelper && !chattedSuspects.includes(selectedContact.id) && !chatResponseShown && (
                  <div className="text-center py-4">
                    <p className="text-xs text-muted-foreground">💬 메시지를 보내서 대화해보세요</p>
                  </div>
                )}
              </div>

              {/* 선택된 단서 표시 */}
              {selectedClue && (
                <div className="bg-gray-800 px-3 py-2 border-t border-gray-700 flex items-center gap-2">
                  <span className="text-xs text-gray-400">첨부 단서:</span>
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full border border-blue-500/30">
                    <Search className="w-3 h-3" />
                    @{selectedClue.name}
                    <button
                      onClick={() => setSelectedClue(null)}
                      className="ml-1 hover:text-blue-200 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                </div>
              )}

              <div className="bg-gray-800 p-2">
                {/* 튜토리얼 안내 */}
                {!selectedContact.isHelper && (
                  <div className="mb-2 px-3 py-2 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <p className="text-[11px] text-blue-400 text-center">
                      🎮 <strong>튜토리얼</strong>에서는 미리 정해진 대화가 진행됩니다.<br/>
                      <span className="text-blue-300">+ 버튼으로 단서를 태그해서 심문해보세요!</span>
                    </p>
                  </div>
                )}
                <div className="flex gap-2">
                  {/* 단서 태그 버튼 - 실제 작동 */}
                  <div className="relative">
                    {/* highlightClueBtn 단계에서 + 버튼 강조 안내 */}
                    {storyStep === 'highlightClueBtn' && (
                      <div className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap animate-bounce z-20">
                        <div className="bg-red-500 text-white text-[10px] px-2 py-1 rounded-full font-bold shadow-lg">
                          👇 이 버튼!
                        </div>
                      </div>
                    )}
                    <button
                      onClick={() => setClueModalOpen(true)}
                      disabled={selectedContact.isHelper || discoveredEvidence.length === 0}
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                        // highlightClueBtn 단계에서 빨간색 강조
                        storyStep === 'highlightClueBtn'
                          ? "bg-red-500/20 text-red-400 border-2 border-red-500 ring-4 ring-red-500/50"
                          : selectedClue
                            ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                            : discoveredEvidence.length === 0
                              ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                              : "bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-gray-200"
                      )}
                      style={storyStep === 'highlightClueBtn' ? { animation: 'pulse 1s ease-in-out infinite' } : {}}
                      title="단서 첨부"
                    >
                      <Plus className={cn("w-5 h-5", storyStep === 'highlightClueBtn' && "text-red-400")} />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => {
                      // Enter 키로 메시지 전송
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleSendMessage()
                        return
                      }
                      // WASD 등 게임 조작키가 게임으로 전달되지 않도록 차단
                      // 단, 일반 텍스트 입력은 허용
                      e.stopPropagation()
                    }}
                    onFocus={(e) => {
                      // 포커스 시 게임 컨테이너 블러 처리
                      const gameContainer = document.querySelector('[tabindex="0"]')
                      if (gameContainer) gameContainer.blur()
                    }}
                    placeholder={selectedClue ? `@${selectedClue.name} 관련 질문...` : (selectedContact.isHelper ? "힌트 요청..." : "질문하기...")}
                    className="flex-1 bg-gray-700 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    disabled={selectedContact.isHelper}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={selectedContact.isHelper || !message.trim()}
                    className={cn(
                      "w-10 h-10 bg-primary rounded-full flex items-center justify-center",
                      (selectedContact.isHelper || !message.trim()) ? "opacity-50" : "hover:bg-primary/80"
                    )}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* 단서 선택 모달 */}
              {clueModalOpen && (
                <div className="absolute inset-0 bg-black/80 z-10 flex flex-col rounded-3xl overflow-hidden">
                  <div className="bg-gray-800 p-3 flex items-center justify-between border-b border-gray-700">
                    <h3 className="font-bold text-sm">단서 선택</h3>
                    <button
                      onClick={() => setClueModalOpen(false)}
                      className="p-1 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto bg-gray-950 p-2">
                    {discoveredEvidence.length === 0 ? (
                      <div className="text-center text-gray-500 py-8">
                        <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">발견한 단서가 없습니다</p>
                        <p className="text-xs mt-1">현장을 조사하여 단서를 찾아보세요</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {discoveredEvidence.map((clue) => (
                          <button
                            key={clue.id}
                            onClick={() => {
                              setSelectedClue(clue)
                              setClueModalOpen(false)
                              // waitClueSelect 단계에서 단서 선택하면 clueTagIntro2 대화 표시
                              if (storyStep === 'waitClueSelect') {
                                setTimeout(() => {
                                  setStoryStep('clueTagIntro2')
                                  setShowDialog(true)
                                  setIsDialogActive(true)
                                }, 300)
                              }
                            }}
                            className={cn(
                              "w-full p-2 rounded-lg text-left transition-colors flex items-center gap-3",
                              selectedClue?.id === clue.id
                                ? "bg-blue-500/20 border border-blue-500/30"
                                : storyStep === 'waitClueSelect'
                                  ? "bg-red-500/10 border-2 border-red-500 ring-2 ring-red-500/50"
                                  : "bg-gray-800 hover:bg-gray-700"
                            )}
                            style={storyStep === 'waitClueSelect' ? { animation: 'pulse 1.5s ease-in-out infinite' } : {}}
                          >
                            {/* 단서 아이콘 */}
                            <div className="w-12 h-12 rounded-lg bg-gray-700 overflow-hidden flex-shrink-0 flex items-center justify-center">
                              <Search className="w-5 h-5 text-gray-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-sm truncate">{clue.name}</p>
                              {clue.location && (
                                <p className="text-xs text-gray-400 truncate">{clue.location}</p>
                              )}
                            </div>
                            {selectedClue?.id === clue.id && (
                              <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-white text-xs">✓</span>
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {selectedClue && (
                    <div className="bg-gray-800 p-3 border-t border-gray-700">
                      <button
                        onClick={() => setClueModalOpen(false)}
                        className="w-full py-2 bg-blue-500 text-white rounded-lg font-bold text-sm hover:bg-blue-600 transition-colors"
                      >
                        @{selectedClue.name} 첨부하기
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="bg-gray-800 p-4">
                <h3 className="font-bold">연락처</h3>
                {storyStep === 'waitPhoneChat' && (
                  <p className="text-xs text-primary mt-1">
                    💡 용의자 {chattedSuspects.length}/3명과 대화하세요
                  </p>
                )}
              </div>

              <div className="flex-1 bg-gray-950 overflow-y-auto">
                {allContacts.map(contact => {
                  // 현재 단계에서 대화해야 하는 용의자인지 확인 (단축된 튜토리얼: 이영희만)
                  const shouldHighlightContact = !contact.isHelper && (
                    storyStep === 'waitChat1' && contact.id === 'suspect-2'
                  )
                  return (
                    <button
                      key={contact.id}
                      onClick={() => {
                        setSelectedContact(contact)
                        setSelectedClue(null) // 연락처 변경 시 단서 초기화
                      }}
                      className={cn(
                        "w-full p-3 flex items-center gap-3 hover:bg-gray-800 transition-colors border-b border-gray-800 relative",
                        !contact.isHelper && chattedSuspects.includes(contact.id) && "bg-green-500/5",
                        shouldHighlightContact && "bg-red-500/10 border-2 border-red-500 animate-pulse"
                      )}
                    >
                      {/* 대화 대상 강조 표시 */}
                      {shouldHighlightContact && (
                        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                          대화하세요!
                        </div>
                      )}
                      <div className={cn(
                        "w-12 h-12 rounded-full bg-muted overflow-hidden flex items-center justify-center",
                        shouldHighlightContact && "ring-2 ring-red-500"
                      )}>
                        {contact.isHelper ? (
                          <Lightbulb className="w-6 h-6 text-primary" />
                        ) : (
                          <Users className={cn("w-6 h-6", shouldHighlightContact ? "text-red-400" : "text-muted-foreground")} />
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                          <p className={cn("font-bold text-sm", shouldHighlightContact && "text-red-400")}>{contact.name}</p>
                          {contact.isHelper && (
                            <span className="text-xs px-1.5 py-0.5 bg-primary/20 text-primary rounded">조력자</span>
                          )}
                          {!contact.isHelper && chattedSuspects.includes(contact.id) && (
                            <Check className="w-4 h-4 text-green-500" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {contact.isHelper ? '힌트 제공 • 체력 -2%' : `${contact.role} • 체력 -5%`}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </>
          )}

          <div className="bg-black h-4 flex items-center justify-center">
            <div className="w-24 h-1 bg-gray-600 rounded-full" />
          </div>

          <button
            onClick={handlePhoneClose}
            className="absolute top-8 right-2 w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center hover:bg-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ===== 증거 상세 모달 ===== */}
      {selectedEvidence && !isDialogActive && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSelectedEvidence(null)} />
          <div className="relative z-10 w-full max-w-md bg-card border border-border rounded-xl overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-bold flex items-center gap-2"><Search className="w-5 h-5 text-primary" />증거 상세</h3>
              <button onClick={() => setSelectedEvidence(null)}><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6">
              <div className="w-full h-36 bg-muted rounded-xl mb-4 flex items-center justify-center">
                <Search className="w-12 h-12 text-muted-foreground" />
              </div>
              <h4 className="text-xl font-bold mb-1">{selectedEvidence.name}</h4>
              <p className="text-sm text-primary mb-4">📍 {selectedEvidence.location}</p>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{selectedEvidence.description}</p>
              {selectedEvidence.storyHint && (
                <div className="mt-4 p-3 bg-primary/10 rounded-lg border border-primary/30">
                  <p className="text-sm text-primary font-medium">💡 {selectedEvidence.storyHint}</p>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-border flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setSelectedEvidence(null)}>닫기</Button>
            </div>
          </div>
        </div>
      )}


      {/* ===== 메모 추가 모달 ===== */}
      {memoModalOpen && !isDialogActive && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMemoModalOpen(false)} />
          <div className="relative z-10 w-full max-w-md bg-card border border-border rounded-xl overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-bold flex items-center gap-2"><StickyNote className="w-5 h-5 text-yellow-500" />메모 추가</h3>
              <button onClick={() => setMemoModalOpen(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4">
              <textarea value={memoText} onChange={(e) => setMemoText(e.target.value)}
                placeholder="메모 내용을 입력하세요..." rows={4} autoFocus
                className="w-full bg-muted border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
              <div className="flex gap-3 mt-4">
                <Button variant="outline" className="flex-1" onClick={() => setMemoModalOpen(false)}>취소</Button>
                <Button variant="neon" className="flex-1" onClick={handleAddMemo}>추가하기</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== 최종 제출 모달 (SubmitAnswerModal 스타일) ===== */}
      {submitFormOpen && !isDialogActive && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-border">
              <h2 className="text-xl font-bold gold-glow">최종 정답 제출</h2>
              <p className="text-sm text-muted-foreground mt-1">
                확정(빨간선)으로 연결된 카드들만 정답으로 제출됩니다. 제출 단계에서는 노란선/메모 추가가 없습니다.
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
                {/* 왼쪽: 추리보드 미리보기 */}
                <div className="bg-muted/20 border border-border rounded-xl p-3">
                  <p className="text-sm font-bold mb-2 text-primary">📌 제출 보드</p>
                  <div
                    className="relative h-[400px] overflow-hidden rounded-lg"
                    style={{
                      backgroundImage: 'url(/board/board.jpg)',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  >
                    {/* 축소된 보드 영역 */}
                    <div
                      className="absolute inset-0 origin-top-left"
                      style={{ transform: 'scale(0.35)', width: '286%', height: '286%' }}
                    >
                    {/* 빨간선(확정)만 표시 */}
                    {connections.filter(c => c.type === 'red').map((conn, idx) => {
                      const fromItem = boardItems.find(i => i.id === conn.from)
                      const toItem = boardItems.find(i => i.id === conn.to)
                      if (!fromItem || !toItem) return null

                      const fromX = fromItem.x + 88, fromY = fromItem.y + 100
                      const toX = toItem.x + 88, toY = toItem.y + 100
                      const dx = toX - fromX, dy = toY - fromY
                      const distance = Math.sqrt(dx * dx + dy * dy)
                      const angle = Math.atan2(dy, dx) * 180 / Math.PI
                      const midX = (fromX + toX) / 2, midY = (fromY + toY) / 2
                      const sag = Math.min(distance * 0.08, 25)

                      return (
                        <div
                          key={idx}
                          className="absolute pointer-events-none"
                          style={{
                            left: midX,
                            top: midY,
                            width: distance,
                            height: 40,
                            transform: `translate(-50%, -50%) rotate(${angle}deg)`,
                            transformOrigin: 'center center',
                            zIndex: 1,
                          }}
                        >
                          <div
                            className="w-full h-full"
                            style={{
                              backgroundImage: 'url(/board/thread.png)',
                              backgroundSize: 'auto 100%',
                              backgroundRepeat: 'repeat-x',
                              backgroundPosition: 'center',
                              filter: 'drop-shadow(1px 2px 2px rgba(0,0,0,0.3))',
                              borderRadius: `0 0 ${sag}px ${sag}px`,
                              transform: `scaleY(${1 + sag/50})`,
                            }}
                          />
                        </div>
                      )
                    })}
                    {/* 빨간선으로 연결된 카드들만 표시 (메모 제외) */}
                    {(() => {
                      const redConnections = connections.filter(c => c.type === 'red')
                      const connectedIds = new Set(redConnections.flatMap(c => [c.from, c.to]))
                      return boardItems
                        .filter(item => connectedIds.has(item.id) && item.type !== 'memo')
                        .map(item => {
                          const typeConfig = {
                            victim: { label: '피해자', color: 'bg-red-500' },
                            suspect: { label: '용의자', color: 'bg-amber-500' },
                            evidence: { label: '증거', color: 'bg-blue-500' },
                            location: { label: '장소', color: 'bg-green-500' },
                          }
                          const config = typeConfig[item.type] || { label: '기타', color: 'bg-gray-500' }
                          const hash = Math.abs((item.id || '').charCodeAt(0) * 31) % 10
                          const rotation = (hash % 2 === 0 ? 1 : -1) * 2

                          return (
                            <div
                              key={item.id}
                              className="absolute"
                              style={{ left: item.x, top: item.y, zIndex: 2 }}
                            >
                              <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10">
                                <Pin className="w-4 h-4 text-red-600 fill-red-600" />
                              </div>
                              <div
                                className="w-32 bg-white shadow-lg"
                                style={{ transform: `rotate(${rotation}deg)` }}
                              >
                                <div className="p-1.5 pb-0">
                                  <div className="w-full h-20 flex items-center justify-center relative bg-gradient-to-br from-gray-200 to-gray-300">
                                    <span className="text-3xl">
                                      {item.type === 'evidence' ? '🔍' : item.type === 'location' ? '📍' : '👤'}
                                    </span>
                                    <span className={cn("absolute top-1 right-1 px-1.5 py-0.5 text-[9px] font-bold text-white rounded", config.color)}>
                                      {config.label}
                                    </span>
                                  </div>
                                </div>
                                <div className="p-1.5 pt-1 pb-2 text-center">
                                  <p className="text-xs font-bold text-gray-900 truncate">
                                    {item.data?.name || '이름 없음'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )
                        })
                    })()}
                    </div>
                  </div>
                </div>

                {/* 오른쪽: 검증 및 입력 폼 */}
                <div className="space-y-4">
                  {/* 검증 상태 표시 */}
                  {(() => {
                    const redCount = connections.filter(c => c.type === 'red').length
                    const connectedIds = new Set(connections.filter(c => c.type === 'red').flatMap(c => [c.from, c.to]))
                    const connectedTypes = new Set(
                      boardItems.filter(item => connectedIds.has(item.id)).map(item => item.type)
                    )
                    const requiredTypes = ['victim', 'suspect', 'location', 'evidence']
                    const missingTypes = requiredTypes.filter(t => !connectedTypes.has(t))
                    const typeNames = { victim: '피해자', suspect: '용의자', location: '장소', evidence: '증거' }

                    const hasError = redCount !== 3 || missingTypes.length > 0

                    if (hasError) {
                      let errorMsg = ''
                      if (redCount !== 3) {
                        errorMsg = `빨간선 연결이 정확히 3개여야 합니다. (현재: ${redCount}개)`
                      } else if (missingTypes.length > 0) {
                        errorMsg = `모든 타입이 연결되어야 합니다. (미연결: ${missingTypes.map(t => typeNames[t]).join(', ')})`
                      }
                      return (
                        <div className="text-sm text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                          ⚠️ {errorMsg}
                        </div>
                      )
                    }

                    return (
                      <div className="text-sm text-green-300 bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                        ✅ 제출 조건을 모두 충족했습니다!
                      </div>
                    )
                  })()}

                  {/* 제출 조건 안내 */}
                  <div className="text-sm text-muted-foreground bg-muted/20 border border-border rounded-lg p-4">
                    <p className="font-semibold mb-2">제출 조건:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>빨간선(확정) 연결이 정확히 <span className="text-red-300 font-bold">3개</span>여야 합니다</li>
                      <li>피해자, 용의자, 장소, 증거 <span className="text-red-300 font-bold">4가지 타입</span>이 모두 연결되어야 합니다</li>
                    </ul>
                  </div>

                  {/* 범행 동기 입력 폼 */}
                  <div className="bg-muted/20 border border-border rounded-xl p-4">
                    <label className="block text-sm font-semibold mb-2">
                      범행 동기 <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      value={submitForm.motive}
                      onChange={(e) => setSubmitForm(prev => ({ ...prev, motive: e.target.value }))}
                      placeholder="범인의 범행 동기를 추론하여 입력해주세요..."
                      className="w-full min-h-[120px] p-3 bg-background border border-border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                      maxLength={500}
                    />
                    <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                      <span>최종 정답 제출 전에 범행 동기를 입력해주세요</span>
                      <span>{submitForm.motive.length}/500</span>
                    </div>
                  </div>

                  {/* 튜토리얼 힌트 */}
                  <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                    <p className="text-sm text-amber-300">
                      💡 <strong>튜토리얼 힌트:</strong> 이영희가 범인입니다. 동기는 "유산 독차지" 또는 "상속을 위해" 등으로 입력해보세요.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-border flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setSubmitFormOpen(false)}>취소</Button>
              <Button
                variant="neon"
                className="flex-1"
                onClick={handleFinalSubmit}
                disabled={!submitForm.motive.trim() || connections.filter(c => c.type === 'red').length !== 3}
              >
                최종 제출하기
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ===== 왓슨 대화창 ===== */}
      {showDialog && currentDialog && (
        <WatsonDialog
          dialog={currentDialog}
          onComplete={handleDialogComplete}
        />
      )}

      {/* ===== 상호작용 힌트 오버레이 ===== */}
      {!isDialogActive && (
        <>
          {/* 휴대폰 힌트 */}
          {storyStep === 'waitPhoneChat' && !phoneOpen && (
            <div className="fixed bottom-28 right-24 z-[60] animate-bounce">
              <div className="bg-blue-500/90 text-white px-4 py-2 rounded-lg shadow-lg">
                <p className="text-sm font-bold">📱 휴대폰을 열어 대화하세요!</p>
              </div>
            </div>
          )}

          {/* 추리보드 닫기 힌트 */}
          {storyStep === 'waitBoardClose' && boardPanelOpen && (
            <div className="fixed top-20 right-1/4 z-[80] animate-bounce">
              <div className="bg-primary/90 text-white px-4 py-2 rounded-lg shadow-lg">
                <p className="text-sm font-bold">✅ 닫기 버튼을 눌러 다음 단계로!</p>
              </div>
            </div>
          )}

          {/* 보드 연습 힌트: 드래그 안내 */}
          {storyStep === 'waitBoardPractice' && boardPanelOpen && (
            <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[80]">
              <div className="bg-red-500 text-white px-6 py-3 rounded-xl shadow-lg text-center border-2 border-white">
                <p className="text-lg font-bold mb-1">✨ 왼쪽 패널에서 항목을 드래그하세요!</p>
                <p className="text-sm opacity-90">이영희(용의자), 식칼(증거), 침실(장소)를 보드에 추가하세요</p>
              </div>
            </div>
          )}
          {/* 보드 연결 힌트 - 빨간선 강조 */}
          {/* 보드 저장 힌트 - 저장 강조 (빨간색으로 통일) */}
        </>
      )}
    </div>
  )
}

// ========================================
// Phase 4: 성공 엔딩 (줄거리 공개 → 범인 독백 → 실패 시 독백도 표시 → 왓슨 리뷰/보고서/점수 안내)
// ========================================
function SuccessEndingPhase({ onComplete }) {
  // 'truth' -> 'confession' -> 'failPreview' -> 'watsonReview' -> 'reviewModal' -> 'watsonReport' -> 'reportModal' -> 'watsonScore' -> 'complete'
  const [stage, setStage] = useState('truth')
  const [typingDone, setTypingDone] = useState(false)
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [showWatsonDialog, setShowWatsonDialog] = useState(false)
  const [currentWatsonDialog, setCurrentWatsonDialog] = useState(null)

  // 튜토리얼용 더미 수사보고서 데이터
  const dummyReport = {
    scenarioTitle: tutorialStory.title,
    playerName: '신입 탐정',
    rankGrade: 'S',
    finalScore: 95,
    playTimeMinutes: 15,
    stats: {
      cluesCollected: 3,
      totalInterrogations: 3,
    },
    sessionId: 'tutorial-001',
  }

  // 왓슨 다이얼로그 완료 핸들러
  const handleWatsonDialogComplete = () => {
    setShowWatsonDialog(false)
    setCurrentWatsonDialog(null)

    if (stage === 'watsonReview') {
      setStage('reviewModal')
      setReviewModalOpen(true)
    } else if (stage === 'watsonReport') {
      setStage('reportModal')
      setReportModalOpen(true)
    } else if (stage === 'watsonScore') {
      onComplete()
    }
  }

  const handleReviewSubmit = (difficulty, rating, review) => {
    setReviewModalOpen(false)
    // 수사보고서 안내 왓슨 다이얼로그
    setStage('watsonReport')
    setCurrentWatsonDialog(watsonDialogs.report)
    setShowWatsonDialog(true)
  }

  const handleReportClose = () => {
    setReportModalOpen(false)
    // 점수 안내 왓슨 다이얼로그 (마지막 인사)
    setStage('watsonScore')
    setCurrentWatsonDialog(watsonDialogs.score)
    setShowWatsonDialog(true)
  }

  // failPreview에서 다음 버튼 클릭 시 왓슨 리뷰 안내
  const handleGoToReview = () => {
    setStage('watsonReview')
    setCurrentWatsonDialog(watsonDialogs.review)
    setShowWatsonDialog(true)
  }

  return (
    <div className="fixed inset-0 bg-black z-[100] flex items-center justify-center overflow-auto">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-10"
        style={{ backgroundImage: 'url(/images/img1.png)', filter: 'grayscale(100%)' }}
      />
      <div className="relative z-10 text-center max-w-2xl px-8 py-12">
        {stage === 'truth' && (
          <>
            <div className="mb-6">
              <span className="text-xs text-green-400 tracking-widest font-bold">✅ 사건 해결</span>
            </div>
            <div className="mb-4">
              <span className="text-sm text-primary font-bold">📖 사건의 전말</span>
            </div>
            <p className="text-lg text-amber-100/90 font-serif leading-relaxed whitespace-pre-line">
              <TypingText
                text={tutorialStory.truthReveal}
                speed={25}
                onComplete={() => setTypingDone(true)}
              />
            </p>
            {typingDone && (
              <div className="mt-8 animate-in fade-in duration-500">
                <Button variant="neon" size="lg" onClick={() => { setStage('confession'); setTypingDone(false) }}>
                  범인의 독백 <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            )}
          </>
        )}

        {stage === 'confession' && (
          <>
            <div className="mb-6">
              <span className="text-xs text-red-400 tracking-widest font-bold">🎭 범인의 독백 (체포 시)</span>
            </div>
            <div className="mb-4 flex items-center justify-center gap-3">
              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-red-400" />
              </div>
              <span className="text-lg text-red-400 font-bold">이영희</span>
            </div>
            <p className="text-xl text-amber-100/90 font-serif leading-relaxed italic whitespace-pre-line">
              <TypingText
                text={tutorialStory.culpritConfession}
                speed={40}
                onComplete={() => setTypingDone(true)}
              />
            </p>
            {typingDone && (
              <div className="mt-8 animate-in fade-in duration-500">
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-left mb-4">
                  <p className="text-green-400 font-bold mb-2">🎉 축하합니다!</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>✓ 범인을 정확히 지목했습니다</li>
                    <li>✓ 실제 게임에서는 랭킹에 등록됩니다</li>
                    <li>✓ 수사 보고서가 저장됩니다</li>
                  </ul>
                </div>
                <Button variant="neon" size="lg" onClick={() => { setStage('failPreview'); setTypingDone(false) }}>
                  만약 실패했다면? <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            )}
          </>
        )}

        {stage === 'failPreview' && (
          <>
            <div className="mb-6">
              <span className="text-xs text-gray-400 tracking-widest font-bold">❌ 만약 실패했다면...</span>
            </div>
            <div className="mb-4 flex items-center justify-center gap-3">
              <div className="w-12 h-12 bg-gray-500/20 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-gray-400" />
              </div>
              <span className="text-lg text-gray-400 font-bold">???</span>
            </div>
            <p className="text-xl text-amber-100/70 font-serif leading-relaxed italic whitespace-pre-line">
              <TypingText
                text={tutorialStory.culpritEscape}
                speed={40}
                onComplete={() => setTypingDone(true)}
              />
            </p>
            {typingDone && (
              <div className="mt-8 space-y-4 animate-in fade-in duration-500">
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-left">
                  <p className="text-red-400 font-bold mb-2">📁 미제 사건으로 종결</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• 범인을 찾지 못했습니다</li>
                    <li>• 실패 시에는 수사 보고서와 랭킹이 기록되지 않습니다</li>
                    <li>• 처음부터 다시 도전할 수 있습니다</li>
                  </ul>
                </div>
                <p className="text-xs text-muted-foreground">
                  💡 위의 독백은 범인을 놓쳤을 때 표시되는 내용입니다.
                </p>
                <Button variant="neon" size="lg" onClick={handleGoToReview}>
                  다음 <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* 왓슨 다이얼로그 (리뷰/보고서/점수 안내) */}
      {showWatsonDialog && currentWatsonDialog && (
        <WatsonDialog
          key={stage}
          dialog={currentWatsonDialog}
          onComplete={handleWatsonDialogComplete}
        />
      )}

      {/* 리뷰 모달 */}
      <ReviewModal isOpen={reviewModalOpen} onSubmit={handleReviewSubmit} />

      {/* 수사보고서 모달 */}
      <ReportModal isOpen={reportModalOpen} onClose={handleReportClose} report={dummyReport} />
    </div>
  )
}

// ========================================
// Phase 5: 실패 엔딩 (범인 독백)
// ========================================
function FailEndingPhase({ onComplete }) {
  const [typingDone, setTypingDone] = useState(false)

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-10"
        style={{ backgroundImage: 'url(/images/img1.png)', filter: 'grayscale(100%)' }}
      />
      <div className="relative z-10 text-center max-w-2xl px-8">
        <div className="mb-6">
          <span className="text-xs text-red-500 tracking-widest font-bold">❌ 미제 사건</span>
        </div>
        <div className="mb-4 flex items-center justify-center gap-3">
          <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
            <Users className="w-6 h-6 text-red-400" />
          </div>
          <span className="text-lg text-red-400 font-bold">???</span>
        </div>
        <p className="text-xl text-amber-100/90 font-serif leading-relaxed italic whitespace-pre-line">
          <TypingText
            text={tutorialStory.culpritEscape}
            speed={40}
            onComplete={() => setTypingDone(true)}
          />
        </p>
        {typingDone && (
          <div className="mt-8 space-y-4 animate-in fade-in duration-500">
                      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-left">
                        <p className="text-red-400 font-bold mb-2">📁 미제 사건으로 종결</p>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• 범인을 찾지 못했습니다</li>
                          <li>• 실패 시에는 수사 보고서와 랭킹이 기록되지 않습니다</li>
                          <li>• 처음부터 다시 도전할 수 있습니다</li>
                        </ul>
                      </div>
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground">
                💡 <strong>힌트:</strong> 식칼에서 발견된 섬유, 편지의 필적, 열쇠와 금고의 관계를 다시 살펴보세요.
              </p>
            </div>
            <div className="flex gap-3 justify-center">
              <Link href="/">
                <Button variant="outline" size="lg">
                  <Home className="w-5 h-5 mr-2" />홈으로
                </Button>
              </Link>
              <Button variant="neon" size="lg" onClick={onComplete}>
                다시 도전하기 <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ========================================
// Phase 6: 완료 화면
// ========================================
function CompletionPhase() {
  return (
    <div className="fixed inset-0 bg-gradient-to-b from-gray-900 to-black z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <Card className="bg-card border border-border shadow-2xl">
          <div className="p-6">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-10 h-10 text-green-500" />
              </div>
              <h2 className="text-3xl font-bold gold-glow mb-2">튜토리얼 완료!</h2>
              <p className="text-muted-foreground">이제 진짜 사건에 도전할 준비가 됐어요</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-muted/30 rounded-xl p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">학습 완료</p>
                <p className="text-3xl font-bold text-primary">100%</p>
              </div>
              <div className="bg-muted/30 rounded-xl p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">상태</p>
                <p className="text-xl font-bold text-green-500">준비 완료</p>
              </div>
            </div>

            <div className="p-4 bg-primary/10 border border-primary/30 rounded-xl mb-6">
              <p className="text-sm font-bold text-primary mb-3">🎓 학습 완료 항목</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {[
                  '현장 탐색 & 이동',
                  '증거 수집 & 분석',
                  '증거 목록 확인',
                  '수사 로그 확인',
                  '추리보드 사용',
                  '범인 지목 & 제출',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-muted-foreground">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Link href="/" className="flex-1">
                <Button variant="outline" size="lg" className="w-full">
                  <Home className="w-5 h-5 mr-2" />홈으로
                </Button>
              </Link>
              <Link href="/scenarios" className="flex-1">
                <Button variant="neon" size="lg" className="w-full">
                  <Play className="w-5 h-5 mr-2" />게임 시작
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

// ========================================
// 메인
// ========================================
export default function Tutorial() {
  const [phase, setPhase] = useState('opening')

  const handleGameComplete = (result) => {
    if (result === 'success') {
      setPhase('success-ending')
    } else {
      setPhase('fail-ending')
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {phase === 'opening' && <OpeningPhase onComplete={() => setPhase('victim')} onSkip={() => setPhase('game')} />}
      {phase === 'victim' && <VictimIntroPhase onComplete={() => setPhase('game')} />}
      {phase === 'game' && <MainGamePhase onComplete={handleGameComplete} />}
      {phase === 'success-ending' && <SuccessEndingPhase onComplete={() => setPhase('completion')} />}
      {phase === 'fail-ending' && <FailEndingPhase onComplete={() => setPhase('opening')} />}
      {phase === 'completion' && <CompletionPhase />}
    </div>
  )
}
