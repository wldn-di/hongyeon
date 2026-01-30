// GameRoom.jsx 수정 사항
// 아래 부분만 변경하면 됩니다

// ============================================
// 1. useRef 추가 (파일 상단 import 근처)
// ============================================
// 기존 import는 그대로 두고, 컴포넌트 내부에 추가:

const isInitializedRef = useRef(false)  // 초기화 여부 추적

// ============================================
// 2. 컴포넌트 마운트 시 게임 초기화 useEffect 수정
// (기존 라인 552-563 대체)
// ============================================

// 컴포넌트 마운트 시 게임 초기화
useEffect(() => {
  // 이미 초기화됐거나 진행 중이면 스킵
  if (isInitializedRef.current) {
    console.log('[GameRoom] 이미 초기화됨 - 스킵')
    return
  }
  
  if (sessionId || gameInitializing || gameInitError) {
    console.log('[GameRoom] 세션 있거나 초기화 중 - 스킵')
    return
  }

  if (resumeSessionId) {
    console.log('[GameRoom] resume 시작 - sessionId:', resumeSessionId)
    isInitializedRef.current = true
    resumeGame(resumeSessionId)
  } else if (activeScenarioId && scenario && !scenarioLoading) {
    console.log('[GameRoom] 새 게임 시작 - scenarioId:', activeScenarioId)
    isInitializedRef.current = true
    initializeNewGame()
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [resumeSessionId, activeScenarioId, scenario?.id, scenarioLoading, sessionId, gameInitializing, gameInitError])
// ↑ initializeNewGame, resumeGame 제거 (함수 재생성 시 재실행 방지)

// ============================================
// 3. 시나리오 변경 시 초기화 플래그 리셋
// (기존 useLayoutEffect 아래에 추가)
// ============================================

// 시나리오/세션 변경 시 초기화 플래그 리셋
useEffect(() => {
  return () => {
    isInitializedRef.current = false
  }
}, [activeScenarioId, resumeSessionId])

// ============================================
// 4. InvestigationBoard.jsx도 수정 필요
// (라인 296-310 대체)
// ============================================

// InvestigationBoard.jsx의 초기 데이터 로드 useEffect 수정:
const isLoadedRef = useRef(false)

useEffect(() => {
  if (Array.isArray(initialBoardItems) || Array.isArray(initialConnections)) {
    setBoardItems(Array.isArray(initialBoardItems) ? initialBoardItems : [])
    setConnections(Array.isArray(initialConnections) ? initialConnections : [])
    return
  }

  // 이미 로드했으면 스킵
  if (isLoadedRef.current) return

  if (sessionId) {
    isLoadedRef.current = true
    loadBoardFromApi()
  } else {
    const local = loadFromLocalStorage()
    setBoardItems(local.items)
    setConnections(local.connections)
  }
}, [sessionId, initialBoardItems, initialConnections])

// sessionId 변경 시 플래그 리셋
useEffect(() => {
  isLoadedRef.current = false
}, [sessionId])
