import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'wouter'
import { Button } from '@/components/ui/Button'
import {
  Heart, Clock, Lightbulb, Send, Users, X, FileText, Search,
  ChevronUp, ChevronDown, Smartphone, ArrowRight,
  Play, Home, Sparkles, DoorOpen, Plus, Link2, StickyNote,
  ArrowLeft, Check, AlertTriangle, Trophy, Target, Gamepad2
} from 'lucide-react'
import AgitRoom from '@/features/game/engine/AgitRoom'
import { useGameSession } from '@/features/game/session'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/Card'
import TypingText from '@/features/tutorial/components/TypingText'
import WatsonDialog from '@/features/tutorial/components/WatsonDialog'
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

// ========================================
// Phase 3: 메인 게임 (상호작용 기반 튜토리얼)
// ========================================
function MainGamePhase({ onComplete }) {
   // 스토리 진행 단계 (더 세분화됨)
   // welcome → movement → firstClue → waitEvidenceClick → evidenceListIntro → logIntro
   // → secondClue → waitSecondClue → secondClueFound → suggestChat2 → waitChat2
   // → thirdClue → waitThirdClue → thirdClueFound → suggestChat3 → waitChat3
   // → phoneChatDone → boardIntro → waitBoardOpen → boardDetail → waitBoardClose → submit
   const [storyStep, setStoryStep] = useState('welcome')
   const [showDialog, setShowDialog] = useState(true)
   const [isDialogActive, setIsDialogActive] = useState(true) // 대화 중 조작 불가

   // 층 이동 관련 상태
   const [currentRoomIndex, setCurrentRoomIndex] = useState(0)

  // 게임 상태
  const [health] = useState(100)
  const [leftPanelOpen, setLeftPanelOpen] = useState(true)
  const [rightPanelOpen, setRightPanelOpen] = useState(true)
  const [boardPanelOpen, setBoardPanelOpen] = useState(false)
  const [phoneOpen, setPhoneOpen] = useState(false)
  const [selectedContact, setSelectedContact] = useState(null)
  const [roomSelectorOpen, setRoomSelectorOpen] = useState(false)
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

  // 추리보드 상태
  const [boardItems, setBoardItems] = useState([])
  const [connections, setConnections] = useState([])
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectStart, setConnectStart] = useState(null)
  const [connectEnd, setConnectEnd] = useState(null) // 두 번째 선택된 카드
  const [selectedConnection, setSelectedConnection] = useState(null) // 선택된 연결선 (제거용)
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

  // 용의자별 대화 내용 (증거별 질문 포함)
  const suspectChats = {
    'suspect-1': { // 김철수 (집사)
      greeting: '탐정님이시군요. 무엇이든 물어보세요.',
      question: '이 구겨진 편지에 대해 아시는 게 있나요? 이영희 씨 필적과 일치한다던데요.',
      response: '그 편지요? 이영희 아가씨가 회장님께 드리려던 거예요. 근데 회장님이 읽기도 전에 찢어버리셨죠. 아가씨가 얼마나 울었는지... 유산 얘기였던 것 같아요.',
    },
    'suspect-2': { // 이영희 (딸) - 범인
      greeting: '...뭐예요? 왜 저한테 자꾸 물어보는 거죠?',
      question: '이 식칼에서 당신 옷의 섬유가 발견됐어요. 설명해주시겠어요?',
      response: '그 식칼은 제가 요리할 때 쓴 거예요! 섬유라고요? 말도 안 돼요! 저는 그날 밤 방에만 있었다고요! 왜 자꾸 의심하는 거예요?!',
    },
    'suspect-3': { // 박민수 (경호원)
      greeting: '탐정님, 협조하겠습니다.',
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

  // 선 타입 선택 상태
  const [lineTypeToAdd, setLineTypeToAdd] = useState('red') // 'red' 또는 'yellow'

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
      // 첫 번째 증거 발견 후 → 사용자가 증거 클릭하길 기다림
      setStoryStep('waitEvidenceClick')
    } else if (storyStep === 'evidenceListIntro') {
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
      // 첫 번째 용의자 대화 유도 → 대화 기다림
      setStoryStep('waitChat1')
    } else if (storyStep === 'secondClue') {
      // 두 번째 증거 탐색 안내 후 → 탐색 기다림
      setStoryStep('waitSecondClue')
    } else if (storyStep === 'secondClueFound') {
      // 두 번째 증거 발견 후 → 집사와 대화 유도
      setTimeout(() => {
        setStoryStep('suggestChat2')
        setShowDialog(true)
        setIsDialogActive(true)
      }, 300)
    } else if (storyStep === 'suggestChat2') {
      // 두 번째 용의자 대화 유도 → 대화 기다림
      setStoryStep('waitChat2')
    } else if (storyStep === 'thirdClue') {
      // 세 번째 증거 탐색 안내 후 → 탐색 기다림
      setStoryStep('waitThirdClue')
    } else if (storyStep === 'thirdClueFound') {
      // 세 번째 증거 발견 후 → 경호원과 대화 유도
      setTimeout(() => {
        setStoryStep('suggestChat3')
        setShowDialog(true)
        setIsDialogActive(true)
      }, 300)
    } else if (storyStep === 'suggestChat3') {
      // 세 번째 용의자 대화 유도 → 대화 기다림
      setStoryStep('waitChat3')
    } else if (storyStep === 'phoneChatDone') {
      // 대화 완료 후 → 추리보드 안내
      setTimeout(() => {
        setStoryStep('boardIntro')
        setShowDialog(true)
        setIsDialogActive(true)
      }, 300)
    } else if (storyStep === 'boardIntro') {
      // 추리보드 설명 후 → 보드 열기 기다림
      setStoryStep('waitBoardOpen')
    } else if (storyStep === 'boardDetail') {
      // 상세 설명 후 → 보드 닫기 기다림
      setStoryStep('waitBoardClose')
    } else if (storyStep === 'submit') {
      // 제출 단계 - 대기
    }
  }

  // 층 이동 처리 (AgitRoom에서 호출됨)
  const handleRoomChanged = useCallback((roomIndex) => {
    // 현재 단계에서 층 이동이 허용되는지 확인
    const allowedFloorChangeSteps = [
      'waitSecondClue',  // 두 번째 증거 찾기 위해 층 이동 가능
      'waitThirdClue',   // 세 번째 증거 찾기 위해 층 이동 가능
    ]

    if (allowedFloorChangeSteps.includes(storyStep)) {
      // 층 이동 허용
      setCurrentRoomIndex(roomIndex)
      addLog('move', `엘리베이터로 ${roomIndex + 1}층으로 이동했습니다.`)
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
          guidanceMessage = '왼쪽 증거 목록에서 첫 번째 증거를 클릭해서 상세 정보를 확인하세요!'
          break
        case 'logIntro':
        case 'suggestChat1':
          guidanceMessage = '오른쪽 수사 로그를 확인한 후, 용의자와 대화하세요!'
          break
        case 'waitChat1':
          guidanceMessage = '오른쪽 하단의 휴대폰으로 용의자와 대화하세요!'
          break
        case 'waitChat2':
          guidanceMessage = '오른쪽 하단의 휴대폰으로 용의자와 대화하세요!'
          break
        case 'waitChat3':
          guidanceMessage = '오른쪽 하단의 휴대폰으로 용의자와 대화하세요!'
          break
        case 'phoneChatDone':
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
      'waitSecondClue': 2,     // 두 번째 증거 (편지)
      'waitThirdClue': 3,      // 세 번째 증거 (열쇠)
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

    // 첫 번째 증거 수집 시 보드 초기화
    if (boardItems.length === 0) {
      setBoardItems([
        { id: 'victim-1', type: 'victim', x: 250, y: 40, data: tutorialVictim },
        { id: 'suspect-1', type: 'suspect', x: 80, y: 120, data: tutorialSuspects[0] },
        { id: 'suspect-2', type: 'suspect', x: 250, y: 200, data: tutorialSuspects[1] },
        { id: 'suspect-3', type: 'suspect', x: 420, y: 120, data: tutorialSuspects[2] },
      ])
    }

    // 증거별 다음 단계 결정
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
    } else if (evidence.id === 3 && storyStep === 'waitThirdClue') {
      setTimeout(() => {
        setStoryStep('thirdClueFound')
        setShowDialog(true)
        setIsDialogActive(true)
      }, 500)
    }
  }, [isDialogActive, storyStep, boardItems.length, collectEvidence])

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
      addLog('chat', `[${selectedContact.name}]와 대화했습니다.`)
    }

    setMessage('')
    setChatResponseShown(true)
    setWaitingForChatConfirm(true)
  }


const handlePhoneClose = () => {
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
        setStoryStep('thirdClue')
        setShowDialog(true)
        setIsDialogActive(true)
      }, 300)
      return
    }
    if (storyStep === 'waitChat3' && selectedContact.id === 'suspect-3') {
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
    if (storyStep === 'waitChat2' && selectedContact.id === 'suspect-1') {
      setPhoneOpen(false)
      setSelectedContact(null)
      setTimeout(() => {
        setStoryStep('thirdClue')
        setShowDialog(true)
        setIsDialogActive(true)
      }, 300)
      return
    }
    if (storyStep === 'waitChat3' && selectedContact.id === 'suspect-3') {
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

  // 일반 닫기
  setPhoneOpen(false)
  setSelectedContact(null)
}

  // 채팅 응답 확인 후 다음 단계로 진행
  const handleChatConfirm = () => {
    if (!waitingForChatConfirm) return

    setWaitingForChatConfirm(false)
    setChatResponseShown(false)

    // waitChat1: 이영희(suspect-2)와 대화 → 두 번째 증거 탐색 안내
    if (storyStep === 'waitChat1' && selectedContact?.id === 'suspect-2') {
      setPhoneOpen(false)
      setSelectedContact(null)
      setTimeout(() => {
        setStoryStep('secondClue')
        setShowDialog(true)
        setIsDialogActive(true)
      }, 300)
    }
    // waitChat2: 김철수(suspect-1)와 대화 → 세 번째 증거 탐색 안내
    else if (storyStep === 'waitChat2' && selectedContact?.id === 'suspect-1') {
      setPhoneOpen(false)
      setSelectedContact(null)
      setTimeout(() => {
        setStoryStep('thirdClue')
        setShowDialog(true)
        setIsDialogActive(true)
      }, 300)
    }
    // waitChat3: 박민수(suspect-3)와 대화 → 추리보드
    else if (storyStep === 'waitChat3' && selectedContact?.id === 'suspect-3') {
      setPhoneOpen(false)
      setSelectedContact(null)
      setTimeout(() => {
        setStoryStep('phoneChatDone')
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

  const handleBoardClick = () => {
    if (isDialogActive) return
    setBoardPanelOpen(true)
    addLog('board', '추리보드를 열었습니다.')

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
    setConfirmBoardOpen(true)
  }

  const handleConfirmSubmit = () => {
    setConfirmBoardOpen(false)
    setSubmitFormOpen(true)
  }

  const handleSelectCulprit = (suspect) => {
    setSelectedCulprit(suspect)
  }

  const handleFinalSubmit = () => {
    setSubmitFormOpen(false)
    // 정답/오답에 따라 다른 결과
    const isCorrect = selectedCulprit?.isCulprit === true
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

    if (!connectStart) {
      // 첫 번째 카드 선택
      setConnectStart(item)
      setConnectEnd(null)
    } else if (connectStart.id === item.id) {
      // 같은 카드 다시 클릭 → 선택 해제
      setConnectStart(null)
      setConnectEnd(null)
    } else if (!connectEnd) {
      // 두 번째 카드 선택
      setConnectEnd(item)
    } else if (connectEnd.id === item.id) {
      // 두 번째 카드 다시 클릭 → 두 번째만 해제
      setConnectEnd(null)
    } else {
      // 새로운 카드 선택 → 두 번째 카드 교체
      setConnectEnd(item)
    }
  }

  // 연결하기 버튼 클릭
  const handleConnectCards = () => {
    if (connectStart && connectEnd) {
      // 이미 같은 연결이 있는지 확인
      const exists = connections.some(
        c => (c.from === connectStart.id && c.to === connectEnd.id) ||
             (c.from === connectEnd.id && c.to === connectStart.id)
      )
      if (!exists) {
        setConnections(prev => [...prev, { from: connectStart.id, to: connectEnd.id, type: lineTypeToAdd }])
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

  // 모든 연락처
  const allContacts = [
    { id: 'helper', name: '조수 왓슨', isHelper: true },
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
      'secondClue': 'secondClue',
      'secondClueFound': 'secondClueFound',
      'suggestChat2': 'suggestChat2',
      'thirdClue': 'thirdClue',
      'thirdClueFound': 'thirdClueFound',
      'suggestChat3': 'suggestChat3',
      'phoneIntro': 'phoneIntro',
      'phoneChatDone': 'phoneChatDone',
      'boardIntro': 'boardIntro',
      'boardDetail': 'boardDetail',
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
      {/* ===== 상단 바 ===== */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur border-b border-border">
        <div className="container py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 bg-muted/30 px-3 py-1.5 rounded-lg">
              <Heart className="w-5 h-5 text-red-500 fill-red-500" />
              <div className="w-28 h-2.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-red-500 to-red-400 rounded-full" style={{ width: `${health}%` }} />
              </div>
              <span className="text-sm font-bold w-12">{health}%</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              <span className="font-mono text-lg">00:03:25</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">튜토리얼</span>
            <h1 className="text-lg font-bold gold-glow hidden md:block">{tutorialStory.title}</h1>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" disabled={isDialogActive}>
              <Lightbulb className="w-4 h-4 mr-2" />힌트 (0/3)
            </Button>
            <Button variant="neon" size="sm" onClick={handleSubmitClick} disabled={isDialogActive}>
              <Send className="w-4 h-4 mr-2" />최종 정답 제출
            </Button>
          </div>
        </div>
      </div>

      {/* ===== 왼쪽 패널 (증거 목록) ===== */}
      <div
        className={cn(
          "fixed top-16 left-0 h-[calc(100%-64px)] bg-card/95 backdrop-blur border-r border-border transition-all duration-300 z-40 w-72 flex flex-col",
          leftPanelOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="font-bold flex items-center gap-2">
            <Search className="w-5 h-5 text-primary" />증거 목록 ({discoveredEvidence.length})
          </h3>
          <button onClick={() => !isDialogActive && setLeftPanelOpen(false)} disabled={isDialogActive}>
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 p-3 space-y-2 overflow-y-auto">
          {discoveredEvidence.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              아직 발견한 증거가 없습니다.<br/>
              현장을 탐색해보세요!
            </p>
          ) : (
            discoveredEvidence.map(item => {
              const isOnBoard = boardItems.some(b => b.id === `evidence-${item.id}`)
              // 증거 클릭 강조: waitEvidenceClick에서 첫 번째 증거
              const shouldHighlightForClick = !isDialogActive && storyStep === 'waitEvidenceClick' && item.id === 1
              return (
                <div
                  key={item.id}
                  className={cn(
                    "bg-muted/30 border rounded-lg p-3 transition-all relative",
                    shouldHighlightForClick
                      ? "border-2 border-red-500 ring-4 ring-red-500/60 shadow-lg shadow-red-500/30"
                      : "border-border",
                    isDialogActive && "pointer-events-none opacity-60"
                  )}
                  style={shouldHighlightForClick ? {
                    animation: 'pulse-border 1s ease-in-out infinite'
                  } : {}}
                >
                  {/* 클릭 안내 문구 */}
                  {shouldHighlightForClick && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-red-500 text-white text-xs px-3 py-1 rounded-full font-bold whitespace-nowrap animate-bounce">
                      👆 클릭해서 상세보기!
                    </div>
                  )}
                  <div
                    onClick={() => handleEvidenceClick(item)}
                    className="flex items-start gap-3 cursor-pointer hover:opacity-80"
                  >
                    <div className={cn(
                      "w-12 h-12 rounded flex items-center justify-center flex-shrink-0",
                      shouldHighlightForClick ? "bg-red-500/20" : "bg-muted"
                    )}>
                      <Search className={cn("w-5 h-5", shouldHighlightForClick ? "text-red-400" : "text-muted-foreground")} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("font-bold text-sm", shouldHighlightForClick && "text-red-400")}>{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.location}</p>
                      {item.storyHint && (
                        <p className="text-xs text-primary mt-1 italic">💡 {item.storyHint}</p>
                      )}
                    </div>
                  </div>
                  {/* 보드에 추가 버튼 */}
                  <div className="mt-2 pt-2 border-t border-border/50">
                    {isOnBoard ? (
                      <span className="text-xs text-green-500 flex items-center gap-1">
                        <Check className="w-3 h-3" /> 보드에 추가됨
                      </span>
                    ) : (
                      <button
                        onClick={() => handleAddEvidenceToBoard(item)}
                        disabled={isDialogActive}
                        className="text-xs bg-primary/20 text-primary px-2 py-1 rounded hover:bg-primary/30 transition-colors flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> 보드에 추가
                      </button>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
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
                log.type === 'board' && "bg-orange-500/20 text-orange-400",
              )}>
                {log.type === 'system' && '시스템'}
                {log.type === 'move' && '이동'}
                {log.type === 'evidence' && '증거'}
                {log.type === 'chat' && '대화'}
                {log.type === 'board' && '보드'}
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

      {/* ===== 중앙 2D 맵 (AgitRoom) ===== */}
      <div
        className={cn(
          "fixed z-30 transition-all duration-300",
          isDialogActive && "opacity-40"
        )}
        style={{
          top: '80px',
          left: leftPanelOpen ? '288px' : '0',
          right: rightPanelOpen ? '288px' : '0',
          bottom: '100px',
        }}
      >
        <Card className="w-full h-full bg-card/50 border-border overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10">
            <Gamepad2 className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-semibold text-gray-300">{currentRoom.name}</span>
          </div>
          <div className="w-full h-[calc(100%-40px)] bg-black/40 relative">
            <AgitRoom
              clues={tutorialClues}
              onClueInspected={handleClueInspected}
              onRoomChanged={handleRoomChanged}
              isDialogActive={isDialogActive}
              inputFocused={phoneOpen && selectedContact !== null}
              canUseElevator={['waitSecondClue', 'waitThirdClue'].includes(storyStep)}
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
        </Card>
      </div>

      {/* ===== 하단 버튼들 ===== */}
      <div className="fixed bottom-0 left-0 right-0 z-40 h-20 bg-gradient-to-t from-background to-transparent pointer-events-none">
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-auto">
          {/* 추리보드 열기 안내 */}
          {storyStep === 'waitBoardOpen' && !isDialogActive && !boardPanelOpen && (
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap animate-bounce">
              <div className="bg-red-500 text-white text-xs px-3 py-1.5 rounded-full font-bold shadow-lg">
                👇 추리보드를 열어보세요!
              </div>
            </div>
          )}
          <button
            onClick={handleBoardClick}
            disabled={isDialogActive}
            className={cn(
              "px-6 py-3 bg-card/95 rounded-xl flex items-center gap-2 hover:bg-primary/10 transition-all shadow-lg",
              boardPanelOpen && "opacity-0 pointer-events-none",
              // waitBoardOpen 단계에서 빨간 테두리 강조
              storyStep === 'waitBoardOpen' && !isDialogActive
                ? "border-2 border-red-500 ring-4 ring-red-500/50 shadow-red-500/30"
                : "border-2 border-primary",
              isDialogActive && "opacity-50 pointer-events-none"
            )}
            style={storyStep === 'waitBoardOpen' && !isDialogActive ? {
              animation: 'pulse 1s ease-in-out infinite'
            } : {}}
          >
            <Link2 className={cn("w-5 h-5", storyStep === 'waitBoardOpen' && !isDialogActive ? "text-red-500" : "text-primary")} />
            <span className={cn("font-bold", storyStep === 'waitBoardOpen' && !isDialogActive && "text-red-400")}>추리보드</span>
            <ChevronUp className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ===== 오른쪽 하단 버튼들 ===== */}
      <div className="fixed right-6 bottom-24 z-40 flex items-center gap-3">
        <div className="relative">
          <button
            onClick={() => !isDialogActive && setRoomSelectorOpen(!roomSelectorOpen)}
            disabled={isDialogActive}
            className={cn(
              "w-14 h-14 bg-card/95 border-2 border-purple-500 rounded-full shadow-lg hover:scale-105 transition-transform flex items-center justify-center text-2xl",
              isDialogActive && "opacity-50 pointer-events-none"
            )}
          >🚪</button>

          {roomSelectorOpen && !isDialogActive && (
            <div className="absolute bottom-16 right-0 w-56 bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
              <div className="p-3 border-b border-border bg-muted/30">
                <p className="text-sm font-bold flex items-center gap-2"><DoorOpen className="w-4 h-4 text-primary" />방 이동</p>
              </div>
              <div className="max-h-48 overflow-y-auto">
                {tutorialRooms.map(room => {
                  // 현재 층에서만 선택 가능 (튜토리얼 제한)
                  const canSelectRoom = room.unlocked && (roomIndex === currentRoomIndex || ['waitSecondClue', 'waitThirdClue'].includes(storyStep))

                  return (
                    <button
                      key={room.id}
                      onClick={() => {
                        if (canSelectRoom) {
                          setCurrentRoom(room)
                          setCurrentRoomIndex(roomIndex)
                          setRoomSelectorOpen(false)
                        }
                      }}
                      disabled={!canSelectRoom}
                      className={cn(
                        "w-full p-3 flex items-center justify-between text-left transition-colors",
                        canSelectRoom ? "hover:bg-muted/50" : "opacity-50 cursor-not-allowed",
                        currentRoom.id === room.id && "bg-primary/10"
                      )}
                    >
                      <span className="text-sm">{room.name}</span>
                      {!room.unlocked && <span className="text-xs">🔒</span>}
                      {!canSelectRoom && room.unlocked && <span className="text-xs text-red-400">잠김</span>}
                      {currentRoom.id === room.id && <span className="text-xs text-primary">현재</span>}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          {/* 휴대폰 안내 문구 */}
          {(storyStep === 'waitChat1' || storyStep === 'waitChat2' || storyStep === 'waitChat3') && !isDialogActive && !phoneOpen && (
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
              (storyStep === 'waitChat1' || storyStep === 'waitChat2' || storyStep === 'waitChat3') && !isDialogActive && !phoneOpen
                ? "border-red-500 ring-4 ring-red-500/60 shadow-red-500/30"
                : "border-blue-500",
              isDialogActive && "opacity-50 pointer-events-none"
            )}
            style={(storyStep === 'waitChat1' || storyStep === 'waitChat2' || storyStep === 'waitChat3') && !isDialogActive && !phoneOpen ? {
              animation: 'pulse 1s ease-in-out infinite'
            } : {}}
          >
            <Smartphone className={cn(
              "w-7 h-7",
              (storyStep === 'waitChat1' || storyStep === 'waitChat2' || storyStep === 'waitChat3') && !isDialogActive && !phoneOpen
                ? "text-red-500"
                : "text-blue-500"
            )} />
          </button>
        </div>
      </div>

      {/* ===== 추리보드 패널 ===== */}
      {boardPanelOpen && (
        <div className={cn(
          "fixed bottom-0 left-0 right-0 h-[60vh] bg-card border-t-2 border-primary z-[60] animate-in slide-in-from-bottom",
          isDialogActive && "pointer-events-none opacity-60"
        )}>
          <div className="flex items-center justify-between p-3 border-b border-border">
            <div className="flex items-center gap-4">
              <h3 className="font-bold flex items-center gap-2">
                <Link2 className="w-5 h-5 text-primary" />추리보드
              </h3>
              {/* 선 타입 선택 버튼 */}
              <div className="flex items-center gap-1 bg-muted/30 rounded-lg p-1">
                <button
                  onClick={() => setLineTypeToAdd('red')}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                    lineTypeToAdd === 'red'
                      ? "bg-red-500/20 text-red-400 ring-1 ring-red-500"
                      : "text-muted-foreground hover:bg-muted/50"
                  )}
                >
                  <div className="w-4 h-0.5 bg-red-500 rounded" />
                  확정
                </button>
                <button
                  onClick={() => setLineTypeToAdd('yellow')}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                    lineTypeToAdd === 'yellow'
                      ? "bg-yellow-500/20 text-yellow-400 ring-1 ring-yellow-500"
                      : "text-muted-foreground hover:bg-muted/50"
                  )}
                >
                  <div className="w-4 h-0.5 bg-yellow-500 rounded" />
                  의심
                </button>
              </div>
              {/* 카드 선택 상태 표시 및 연결 버튼 */}
              {(connectStart || connectEnd) && (
                <div className="flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/30">
                  <span className="text-xs text-primary">
                    {connectStart && !connectEnd && `📌 "${connectStart.data?.name || connectStart.type}" 선택됨 - 연결할 카드를 선택하세요`}
                    {connectStart && connectEnd && `📌 "${connectStart.data?.name || connectStart.type}" ↔ "${connectEnd.data?.name || connectEnd.type}"`}
                  </span>
                  {connectStart && connectEnd && (
                    <Button variant="neon" size="sm" onClick={handleConnectCards} className="h-7 px-3">
                      <Link2 className="w-3 h-3 mr-1" />연결하기
                    </Button>
                  )}
                  <button
                    onClick={handleCancelConnect}
                    className="text-xs text-muted-foreground hover:text-white px-2"
                  >
                    취소
                  </button>
                </div>
              )}
              {/* 선택된 연결선 제거 버튼 */}
              {selectedConnection !== null && (
                <div className="flex items-center gap-2 bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/30">
                  <span className="text-xs text-red-400">🔗 연결선 선택됨</span>
                  <Button variant="outline" size="sm" onClick={handleDeleteConnection} className="h-7 px-3 border-red-500 text-red-400 hover:bg-red-500/20">
                    <X className="w-3 h-3 mr-1" />제거하기
                  </Button>
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
              <Button variant="outline" size="sm" onClick={() => setMemoModalOpen(true)}>
                <Plus className="w-4 h-4 mr-1" />메모 추가
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

          <div
            ref={boardAreaRef}
            className="relative h-[calc(60vh-56px)] bg-[#1a1a2e] overflow-hidden"
            style={{ backgroundImage: 'radial-gradient(circle, #2a2a4e 1px, transparent 1px)', backgroundSize: '20px 20px' }}
          >
            <svg className="absolute inset-0 w-full h-full">
              {connections.map((conn, idx) => {
                const fromItem = boardItems.find(i => i.id === conn.from)
                const toItem = boardItems.find(i => i.id === conn.to)
                if (!fromItem || !toItem) return null
                const isSelected = selectedConnection === idx
                return (
                  <g key={idx}>
                    {/* 투명한 클릭 영역 (더 넓게) */}
                    <line
                      x1={fromItem.x + 50} y1={fromItem.y + 30}
                      x2={toItem.x + 50} y2={toItem.y + 30}
                      stroke="transparent" strokeWidth="15"
                      className="cursor-pointer"
                      onClick={() => handleConnectionClick(conn, idx)}
                    />
                    {/* 실제 표시되는 선 */}
                    <line
                      x1={fromItem.x + 50} y1={fromItem.y + 30}
                      x2={toItem.x + 50} y2={toItem.y + 30}
                      stroke={isSelected ? '#ffffff' : (conn.type === 'red' ? '#ef4444' : '#eab308')}
                      strokeWidth={isSelected ? 5 : 3}
                      strokeDasharray={conn.type === 'yellow' ? '8,4' : 'none'}
                      className={cn("pointer-events-none", isSelected && "animate-pulse")}
                    />
                  </g>
                )
              })}
            </svg>

            {boardItems.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground text-center">
                  증거를 수집하면 자동으로 추가됩니다.<br/>
                  카드를 클릭해 2개를 선택한 후 "연결하기" 버튼을 누르세요!
                </p>
              </div>
            ) : (
              boardItems.map(item => {
                const isFirstSelected = connectStart?.id === item.id
                const isSecondSelected = connectEnd?.id === item.id
                return (
                  <div
                    key={item.id}
                    onMouseDown={(e) => handleItemMouseDown(e, item)}
                    onClick={() => handleItemClick(item)}
                    className={cn(
                      "absolute cursor-move select-none transition-all",
                      item.type === 'victim' && "bg-card border-2 border-red-500/50 rounded-lg p-2 w-28",
                      item.type === 'suspect' && "bg-card border-2 border-blue-500/50 rounded-lg p-2 w-28",
                      item.type === 'evidence' && "bg-card border-2 border-primary/50 rounded-lg p-2 w-28",
                      item.type === 'memo' && "bg-yellow-400 border-2 border-yellow-600 rounded-lg p-2 w-40",
                      isFirstSelected && "ring-4 ring-green-500 shadow-lg shadow-green-500/30",
                      isSecondSelected && "ring-4 ring-blue-500 shadow-lg shadow-blue-500/30",
                      !isFirstSelected && !isSecondSelected && "hover:ring-2 hover:ring-white/50"
                    )}
                    style={{ left: item.x, top: item.y }}
                  >
                  {item.type === 'victim' && (
                    <>
                      <div className="w-full h-14 bg-red-500/20 rounded mb-1 flex items-center justify-center">
                        <Users className="w-6 h-6 text-red-400" />
                      </div>
                      <p className="text-xs font-bold text-center truncate text-red-400">{item.data.name}</p>
                      <p className="text-[10px] text-red-400/70 text-center">피해자</p>
                    </>
                  )}
                  {item.type === 'suspect' && (
                    <>
                      <div className="w-full h-14 bg-muted rounded mb-1 flex items-center justify-center">
                        <Users className="w-6 h-6 text-blue-400" />
                      </div>
                      <p className="text-xs font-bold text-center truncate">{item.data.name}</p>
                      <p className="text-[10px] text-muted-foreground text-center">{item.data.role}</p>
                    </>
                  )}
                  {item.type === 'evidence' && (
                    <>
                      <div className="w-full h-14 bg-muted rounded mb-1 flex items-center justify-center">
                        <Search className="w-6 h-6 text-primary" />
                      </div>
                      <p className="text-xs font-bold text-center truncate">{item.data.name}</p>
                    </>
                  )}
                  {item.type === 'memo' && (
                    <div className="flex items-start gap-1">
                      <StickyNote className="w-4 h-4 text-yellow-800 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-yellow-900 font-medium line-clamp-3">{item.data.text}</p>
                    </div>
                  )}
                  {/* 선택 표시 뱃지 */}
                  {isFirstSelected && (
                    <div className="absolute -top-2 -right-2 bg-green-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">1</div>
                  )}
                  {isSecondSelected && (
                    <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">2</div>
                  )}
                </div>
              )})
            )}
          </div>
        </div>
      )}

      {/* ===== 휴대폰 모달 ===== */}
      {phoneOpen && !isDialogActive && (
        <div className="fixed right-6 bottom-24 w-80 h-[500px] bg-gray-900 rounded-3xl border-4 border-gray-700 shadow-2xl z-[70] overflow-hidden flex flex-col">
          <div className="bg-black h-6 flex items-center justify-center">
            <div className="w-20 h-4 bg-gray-800 rounded-full" />
          </div>

          {selectedContact ? (
            <>
              <div className="bg-gray-800 p-3 flex items-center gap-3">
                <button onClick={() => setSelectedContact(null)} className="p-1 hover:bg-gray-700 rounded">
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

                {/* 이미 대화한 용의자면 응답도 표시 (증거별 질문) - 현재 대기 중이 아닐 때만 */}
                {!selectedContact.isHelper && chattedSuspects.includes(selectedContact.id) && !waitingForChatConfirm && (
                  <>
                    <div className="flex justify-end">
                      <div className="max-w-[80%] rounded-2xl px-3 py-2 text-sm bg-primary/20 rounded-br-sm">
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

              <div className="bg-gray-800 p-2">
                {/* 튜토리얼 안내: 실제 플레이에서는 자유 대화 가능 */}
                {!selectedContact.isHelper && (
                  <div className="mb-2 px-3 py-2 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <p className="text-[11px] text-blue-400 text-center">
                      🎮 <strong>튜토리얼</strong>에서는 미리 정해진 대화가 진행됩니다.<br/>
                      <span className="text-blue-300">실제 게임에서는 AI와 자유롭게 대화할 수 있어요!</span>
                    </p>
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => {
                      // 메시지 입력 중 WASD 등 키 입력이 게임으로 전달되지 않도록 차단
                      e.preventDefault()
                      e.stopPropagation()
                      e.stopImmediatePropagation()
                      if (e.key === 'Enter') handleSendMessage()
                    }}
                    onFocus={(e) => {
                      // 포커스 시 게임 컨테이너 블러 처리
                      const gameContainer = document.querySelector('[tabindex="0"]')
                      if (gameContainer) gameContainer.blur()
                    }}
                    placeholder={selectedContact.isHelper ? "힌트 요청..." : "질문하기..."}
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
                  // 현재 단계에서 대화해야 하는 용의자인지 확인
                  const shouldHighlightContact = !contact.isHelper && (
                    (storyStep === 'waitChat1' && contact.id === 'suspect-2') ||
                    (storyStep === 'waitChat2' && contact.id === 'suspect-1') ||
                    (storyStep === 'waitChat3' && contact.id === 'suspect-3')
                  )
                  return (
                    <button
                      key={contact.id}
                      onClick={() => setSelectedContact(contact)}
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

      {/* ===== 추리보드 확인 모달 ===== */}
      {confirmBoardOpen && !isDialogActive && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80" />
          <div className="relative z-10 w-full max-w-4xl bg-card border border-border rounded-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="text-xl font-bold gold-glow flex items-center gap-2">
                <Target className="w-6 h-6" />최종 제출 - 추리보드 확인
              </h3>
              <button onClick={() => setConfirmBoardOpen(false)}><X className="w-6 h-6" /></button>
            </div>
            <div className="flex-1 p-6 overflow-auto">
              <div className="bg-[#1a1a2e] rounded-xl p-6 min-h-[200px]"
                style={{ backgroundImage: 'radial-gradient(circle, #2a2a4e 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
                <p className="text-center text-muted-foreground mb-4">📌 추리보드 미리보기</p>
                <div className="flex flex-wrap gap-4 justify-center">
                  {boardItems.map(item => (
                    <div key={item.id} className={cn(
                      "p-3 rounded-lg",
                      item.type === 'victim' && "bg-card border-2 border-red-500/50",
                      item.type === 'suspect' && "bg-card border-2 border-blue-500/50",
                      item.type === 'evidence' && "bg-card border-2 border-primary/50",
                      item.type === 'memo' && "bg-yellow-400 border-2 border-yellow-600",
                    )}>
                      {item.type === 'victim' && <p className="text-sm font-bold text-red-400">{item.data.name} (피해자)</p>}
                      {item.type === 'suspect' && <p className="text-sm font-bold">{item.data.name}</p>}
                      {item.type === 'evidence' && <p className="text-sm font-bold">{item.data.name}</p>}
                      {item.type === 'memo' && <p className="text-xs text-yellow-900">{item.data.text}</p>}
                    </div>
                  ))}
                </div>
                {connections.length > 0 && (
                  <p className="text-center text-sm text-primary mt-4">🔗 {connections.length}개의 연결</p>
                )}
              </div>
              <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-yellow-500">주의사항</p>
                    <p className="text-sm text-muted-foreground">제출은 1회만 가능합니다. 신중하게 결정하세요!</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-border flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setConfirmBoardOpen(false)}>돌아가기</Button>
              <Button variant="neon" className="flex-1" onClick={handleConfirmSubmit}>
                <Check className="w-4 h-4 mr-2" />제출하기
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ===== 범인 선택 폼 ===== */}
      {submitFormOpen && !isDialogActive && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80" />
          <div className="relative z-10 w-full max-w-2xl bg-card border border-border rounded-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-border">
              <h3 className="text-xl font-bold gold-glow flex items-center gap-2">
                <Target className="w-6 h-6" />최종 추리 제출
              </h3>
              <p className="text-sm text-muted-foreground mt-1">범인과 범행 정보를 입력하세요</p>
            </div>
            <div className="flex-1 p-6 overflow-auto space-y-6">
              {/* 범인 선택 */}
              <div>
                <p className="font-bold mb-3">🎯 범인 선택</p>
                <div className="grid grid-cols-3 gap-3">
                  {tutorialSuspects.map(suspect => (
                    <button
                      key={suspect.id}
                      onClick={() => handleSelectCulprit(suspect)}
                      className={cn(
                        "p-4 rounded-xl border-2 transition-all",
                        selectedCulprit?.id === suspect.id
                          ? "border-red-500 bg-red-500/10"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center mb-2">
                        <Users className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <p className="font-bold text-center">{suspect.name}</p>
                      <p className="text-xs text-muted-foreground text-center">{suspect.role}</p>
                      {selectedCulprit?.id === suspect.id && (
                        <div className="mt-2 text-center">
                          <span className="text-xs bg-red-500 text-white px-2 py-1 rounded-full">선택됨</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* 범행 정보 입력 */}
              <div className="space-y-4">
                <p className="font-bold">📝 범행 정보</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">범행 장소</label>
                    <input
                      type="text"
                      value={submitForm.location}
                      onChange={(e) => setSubmitForm(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="예: 지하실"
                      className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">범행 도구</label>
                    <input
                      type="text"
                      value={submitForm.tool}
                      onChange={(e) => setSubmitForm(prev => ({ ...prev, tool: e.target.value }))}
                      placeholder="예: 식칼"
                      className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">범행 동기</label>
                    <input
                      type="text"
                      value={submitForm.motive}
                      onChange={(e) => setSubmitForm(prev => ({ ...prev, motive: e.target.value }))}
                      placeholder="예: 유산 독차지"
                      className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">범행 방법</label>
                    <input
                      type="text"
                      value={submitForm.method}
                      onChange={(e) => setSubmitForm(prev => ({ ...prev, method: e.target.value }))}
                      placeholder="예: 자상"
                      className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  💡 <strong>힌트:</strong> 증거들을 다시 살펴보세요. 혈흔이 묻은 식칼에서 발견된 섬유, 이영희 필적의 구겨진 편지, 유언장 금고의 열쇠...
                </p>
              </div>
            </div>
            <div className="p-4 border-t border-border flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setSubmitFormOpen(false)}>취소</Button>
              <Button variant="neon" className="flex-1" onClick={handleFinalSubmit} disabled={!selectedCulprit}>
                <Send className="w-4 h-4 mr-2" />제출하기
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
        </>
      )}
    </div>
  )
}

// ========================================
// Phase 4: 성공 엔딩 (줄거리 공개 → 범인 독백 → 실패 시 독백도 표시)
// ========================================
function SuccessEndingPhase({ onComplete }) {
  const [stage, setStage] = useState('truth') // 'truth' -> 'confession' -> 'failPreview' -> 'complete'
  const [typingDone, setTypingDone] = useState(false)

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center overflow-auto">
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
                  <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-left">
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
                <Button variant="neon" size="lg" onClick={onComplete}>
                  튜토리얼 완료 <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
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
