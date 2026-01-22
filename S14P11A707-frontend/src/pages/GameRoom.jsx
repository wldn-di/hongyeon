import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react'
import { useLocation, useRoute } from 'wouter'
import { Button } from '@/components/ui/Button'
import { scenarios, scenarioSuspects } from '@/data/dummyData'
import { DoorOpen, Heart, Clock, Lightbulb, Send, MessageCircle, Users, MapPin, Smartphone } from 'lucide-react'
import LeftEvidencePanel from "@/features/game/panels/LeftEvidencePanel"
import RightLogSidebar from "@/features/game/panels/RightLogSidebar"
import BottomBoardPanel from "@/features/game/panels/BottomBoardPanel"
import { ReportModal, EvidenceDetailModal, SubmitAnswerModal, ReviewModal } from '@/features/game/modals'
import PhoneUI from '@/features/game/components/PhoneUI'
import AgitRoom from '@/features/game/engine/AgitRoom'
import { useGameSession } from '@/features/game/session'

//TODO: game play 화명 미동작으로 import 추가
import {
  helperInfo,
  getHelperInitialMessage,
  generateDummyReport,
} from '@/features/game/data/gamePlayDummy'
import { getScenarioClues, getScenarioEvidence, getScenarioRooms } from '@/features/game/data/scenarioClues'


export default function GameRoom() {
  const [, setLocation] = useLocation()
  const [matchSolo, paramsSolo] = useRoute('/room/:scenarioId/solo')
  const [matchCoop, paramsCoop] = useRoute('/room/:scenarioId/:roomCode')

  const params = matchSolo ? paramsSolo : paramsCoop
  const scenarioId = params?.scenarioId ? parseInt(params.scenarioId) : 1
  const roomCode = paramsCoop?.roomCode || null
  const isCoop = !!roomCode && roomCode !== 'solo'

  const scenario = scenarios.find(s => s.id === scenarioId) || scenarios[0]
  const suspects = scenarioSuspects[scenarioId] || scenarioSuspects[1]

  const [health, setHealth] = useState(80)
  const [playTime, setPlayTime] = useState("00:32:15")
  const [hintsUsed, setHintsUsed] = useState(1)
  const [leftPanelOpen, setLeftPanelOpen] = useState(true)
  const [rightLogOpen, setRightLogOpen] = useState(true)
  const [boardPanelOpen, setBoardPanelOpen] = useState(false)
  const [pendingAddItem, setPendingAddItem] = useState(null)
  const [selectedEvidence, setSelectedEvidence] = useState(null)
  const [currentRoomIndex, setCurrentRoomIndex] = useState(0)

  const { logs, addLog, discoveredEvidence, collectEvidence, resetSession } = useGameSession()

  // 휴대폰 관련 상태
  const [phoneOpen, setPhoneOpen] = useState(false)
  const [chatHistories, setChatHistories] = useState({})
  const [currentChat, setCurrentChat] = useState(null)
  const [phoneNotification, setPhoneNotification] = useState(null)

  const [submitAnswerOpen, setSubmitAnswerOpen] = useState(false)
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [reportData, setReportData] = useState(null)

  const SIDE_PANEL_WIDTH_PX = 288

  const rooms = getScenarioRooms(scenarioId)
  const currentRoom = rooms[currentRoomIndex] || rooms[0]
  const evidenceList = getScenarioEvidence(scenarioId)
  const clues = getScenarioClues(scenarioId)

  useLayoutEffect(() => {
    localStorage.removeItem(`board-items-${scenarioId}`)
    localStorage.removeItem(`board-connections-${scenarioId}`)
  }, [scenarioId])

  // 시나리오 시작/변경 시 세션 초기화
  useEffect(() => {
    resetSession()
    setCurrentRoomIndex(0)
    setSelectedEvidence(null)

    setPhoneOpen(false)
    setCurrentChat(null)

    setSubmitAnswerOpen(false)
    setReviewModalOpen(false)
    setReportModalOpen(false)
    setReportData(null)

    addLog('system', '수사가 시작되었습니다.')

    const initialMsg = getHelperInitialMessage(scenario.title)
    setChatHistories({ helper: [initialMsg] })

    setPhoneNotification(initialMsg.text)
    const timer = setTimeout(() => setPhoneNotification(null), 3000)
    return () => clearTimeout(timer)
  }, [scenarioId, scenario.title, resetSession, addLog])

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

  const handleSubmitClick = () => { setSubmitAnswerOpen(true) }
  const handleAnswerSubmit = () => { setSubmitAnswerOpen(false); setReviewModalOpen(true) }
  const handleReviewSubmit = () => {
    setReviewModalOpen(false)
    setReportData(generateDummyReport("현재 플레이어"))
    setReportModalOpen(true)
  }
  const handleAddToBoard = (item, type) => {
    if (!item) return
    if (type === 'evidence') setSelectedEvidence(null)
    setBoardPanelOpen(true)
    setPendingAddItem({ type, data: item })
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
              {isCoop && (
                <div className="flex items-center gap-2 px-3 py-1 bg-purple-500/20 rounded-full">
                  <Users className="w-4 h-4 text-purple-400" />
                  <span className="text-sm text-purple-400">협동 모드</span>
                  <span className="text-xs text-muted-foreground">#{roomCode}</span>
                </div>
              )}
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
            <span className="text-sm font-bold gold-glow truncate">{scenario.title}</span>
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
