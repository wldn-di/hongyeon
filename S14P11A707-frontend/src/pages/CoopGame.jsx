import React, { useState } from 'react'
import { useRoute, Link } from 'wouter'
import { Button } from '@/components/ui/Button'
import { InvestigationBoard } from "@/features/game/components/InvestigationBoard";
import { scenarios } from '@/data/dummyData'
import { 
  Heart, Clock, Lightbulb, Send, MessageCircle, Users, 
  X, Lock, ChevronLeft, ChevronRight, Eye, FileText, Crown, UserCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

// 더미 용의자 데이터
const suspects = [
  { id: 1, name: "김철수", role: "피해자의 동업자", mbti: "ENTJ", image: "/images/evidence/suspect-mugshot-01.png" },
  { id: 2, name: "이영희", role: "피해자의 아내", mbti: "ISFJ", image: "/images/suspect2.png" },
  { id: 3, name: "박민수", role: "경비원", mbti: "ISTP", image: "/images/suspect3.png" },
  { id: 4, name: "최지연", role: "비서", mbti: "ENFP", image: "/images/suspect4.png" },
]

// 더미 장소 데이터
const locations = [
  { id: 1, name: "범행 현장", unlocked: true, progress: 100, description: "피해자가 발견된 창고", evidence: [] },
  { id: 2, name: "피해자 사무실", unlocked: true, progress: 65, description: "피해자의 개인 사무실", evidence: [] },
  { id: 3, name: "주차장", unlocked: false, progress: 25, description: "", evidence: [] },
  { id: 4, name: "CCTV 관제실", unlocked: false, progress: 10, description: "", evidence: [] },
]

// 더미 파티원 데이터
const partyMembers = [
  { id: 1, name: '나 (호스트)', isHost: true, location: '범행 현장' },
  { id: 2, name: '탐정A', isHost: false, location: '피해자 사무실' },
  { id: 3, name: '탐정B', isHost: false, location: '범행 현장' },
]

// 더미 로그
const gameLogs = [
  { id: 1, time: "00:05:23", type: "evidence", message: "[탐정A] 피해자 사무실에서 [협박 편지] 발견", player: "탐정A" },
  { id: 2, time: "00:08:45", type: "memo", message: "[나] 메모 추가: 범행 시각 추정 22:00~23:00", player: "나" },
  { id: 3, time: "00:12:30", type: "interrogation", message: "[탐정B] 김철수 심문 완료", player: "탐정B" },
  { id: 4, time: "00:15:10", type: "save", message: "[시스템] 공용 추리보드 동기화됨", player: "시스템" },
]

// 사이드바 컴포넌트
function ChatSidebar({ isOpen, onClose, type, suspect = null }) {
  const [message, setMessage] = useState('')
  
  return (
    <div className={cn(
      "fixed top-0 right-0 h-full bg-card border-l border-border z-50 transition-transform duration-300",
      "w-full md:w-1/4 min-w-[320px]",
      isOpen ? "translate-x-0" : "translate-x-full"
    )}>
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="font-bold">{type === 'helper' ? '조력자' : `${suspect?.name} 심문`}</h3>
        <button onClick={onClose} className="p-1 hover:bg-muted rounded">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 border-b border-border">
        <div className="w-full h-32 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
          {type === 'interrogate' && suspect?.image ? (
            <img src={suspect.image} alt={suspect.name} className="w-full h-full object-cover" />
          ) : "[조력자 이미지]"}
        </div>
      </div>

      <div className="flex-1 p-4 h-[calc(100%-240px)] overflow-y-auto">
        <div className="space-y-3">
          <div className="bg-muted/50 rounded-lg p-3 max-w-[80%]">
            <p className="text-sm">무엇이 궁금하신가요?</p>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-card">
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="메시지 입력..."
            className="flex-1 bg-muted rounded-lg px-4 py-2 text-sm focus:outline-none"
          />
          <Button variant="neon" size="sm"><Send className="w-4 h-4" /></Button>
        </div>
      </div>
    </div>
  )
}

// 추리보드 모달
function BoardModal({ isOpen, onClose, scenarioId, title, readOnly = false }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl max-h-[90vh] overflow-auto">
        <InvestigationBoard 
          scenarioId={scenarioId}
          isModal={true}
          onClose={onClose}
          readOnly={readOnly}
          title={title}
        />
        {readOnly && (
          <div className="bg-card border-t border-border p-4 flex justify-end gap-4 rounded-b-lg">
            <Button variant="ghost" onClick={onClose}>취소</Button>
            <Link href={`/submit/${scenarioId}`}>
              <Button variant="neon">이대로 제출하기</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default function CoopGame() {
  const [, params] = useRoute('/coop-game/:scenarioId/:roomCode')
  const scenarioId = params?.scenarioId ? parseInt(params.scenarioId) : 1
  const roomCode = params?.roomCode || 'ROOM-XXXX'
  const scenario = scenarios.find(s => s.id === scenarioId) || scenarios[0]

  const [health, setHealth] = useState(80)
  const [playTime, setPlayTime] = useState("00:32:15")
  const [hintsUsed, setHintsUsed] = useState(1)
  const [helperOpen, setHelperOpen] = useState(false)
  const [interrogateOpen, setInterrogateOpen] = useState(false)
  const [selectedSuspect, setSelectedSuspect] = useState(null)
  const [locationIndex, setLocationIndex] = useState(0)
  const [personalBoardOpen, setPersonalBoardOpen] = useState(false)
  const [publicBoardOpen, setPublicBoardOpen] = useState(false)
  const [submitModalOpen, setSubmitModalOpen] = useState(false)

  const visibleLocations = locations.slice(locationIndex, locationIndex + 3)

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* 상단 바 */}
      <div className="sticky top-0 z-40 bg-card/95 backdrop-blur border-b border-border">
        <div className="container py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                <div className="w-32 h-3 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-red-500 rounded-full" style={{ width: `${health}%` }} />
                </div>
                <span className="text-sm text-muted-foreground">{health}%</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                <span className="font-mono text-lg">{playTime}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-muted/50 rounded">
                <Users className="w-4 h-4" />
                <span className="text-sm font-mono">{roomCode}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm">
                <Lightbulb className="w-4 h-4 mr-2" />
                힌트 ({hintsUsed}/3)
              </Button>
              <Button variant="neon" size="sm" onClick={() => setSubmitModalOpen(true)}>
                <Send className="w-4 h-4 mr-2" />
                최종 정답 제출
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="container py-6">
        <div className="flex gap-6">
          {/* 왼쪽: 메인 콘텐츠 */}
          <div className="flex-1 space-y-6">
            {/* 시나리오 정보 */}
            <div className="bg-card/50 border border-border rounded-lg p-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded">협동 모드</span>
              </div>
              <h1 className="text-2xl font-bold gold-glow mb-3">{scenario.title}</h1>
              <p className="text-muted-foreground text-sm">{scenario.synopsis}</p>
            </div>

            {/* 파티원 현황 */}
            <div className="bg-card/50 border border-border rounded-lg p-4">
              <h3 className="font-bold mb-3 bracket-left">파티원 현황</h3>
              <div className="flex gap-4">
                {partyMembers.map(member => (
                  <div key={member.id} className="flex items-center gap-3 px-4 py-2 bg-muted/30 rounded-lg">
                    {member.isHost ? (
                      <Crown className="w-4 h-4 text-primary" />
                    ) : (
                      <UserCircle className="w-4 h-4 text-muted-foreground" />
                    )}
                    <div>
                      <p className="text-sm font-bold">{member.name}</p>
                      <p className="text-xs text-muted-foreground">{member.location}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 용의자 목록 */}
            <div>
              <h2 className="text-lg font-bold mb-3 bracket-left">용의자 목록</h2>
              <div className="flex gap-4 overflow-x-auto pb-2">
                {suspects.map(suspect => (
                  <div 
                    key={suspect.id} 
                    className="flex-shrink-0 w-32 cursor-pointer"
                    onClick={() => { setSelectedSuspect(suspect); setInterrogateOpen(true); }}
                  >
                    <div className="bg-white p-2 pb-4 shadow-md" style={{ transform: `rotate(${suspect.id % 2 ? 2 : -2}deg)` }}>
                      <div className="w-full h-24 bg-gray-200 flex items-center justify-center overflow-hidden">
                        {suspect.image ? (
                          <img src={suspect.image} alt={suspect.name} className="w-full h-full object-cover" />
                        ) : <span className="text-gray-400 text-xs">[사진]</span>}
                      </div>
                      <p className="text-center mt-1 text-xs text-gray-800 font-bold">{suspect.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 수사 현장 */}
            <div>
              <h2 className="text-lg font-bold mb-3 bracket-left">수사 현장</h2>
              <div className="relative">
                {locationIndex > 0 && (
                  <button onClick={() => setLocationIndex(prev => prev - 1)} className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center hover:bg-primary/20">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                )}
                {locationIndex < locations.length - 3 && (
                  <button onClick={() => setLocationIndex(prev => prev + 1)} className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center hover:bg-primary/20">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
                <div className="flex gap-3">
                  {visibleLocations.map(loc => (
                    <div key={loc.id} className={cn("bg-card border border-border rounded-lg p-3 w-[180px]", !loc.unlocked && "opacity-50")}>
                      <h4 className="font-bold text-sm mb-2">{loc.name}</h4>
                      <div className="h-16 bg-muted/30 rounded flex items-center justify-center">
                        {loc.unlocked ? <Eye className="w-4 h-4 text-primary" /> : <Lock className="w-4 h-4" />}
                      </div>
                      <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${loc.progress}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 수사 로그 */}
            <div>
              <h2 className="text-lg font-bold mb-3 bracket-left">수사 로그</h2>
              <div className="bg-card/50 border border-border rounded-lg p-4 max-h-40 overflow-y-auto">
                {gameLogs.map(log => (
                  <div key={log.id} className="flex items-start gap-3 py-2 border-b border-border/30 last:border-0">
                    <span className="text-xs font-mono text-muted-foreground">{log.time}</span>
                    <span className={cn("text-xs px-2 py-0.5 rounded",
                      log.type === 'evidence' && "bg-primary/20 text-primary",
                      log.type === 'memo' && "bg-blue-500/20 text-blue-400",
                      log.type === 'interrogation' && "bg-purple-500/20 text-purple-400",
                      log.type === 'save' && "bg-green-500/20 text-green-400"
                    )}>
                      {log.type === 'evidence' ? '증거' : log.type === 'memo' ? '메모' : log.type === 'interrogation' ? '심문' : '동기화'}
                    </span>
                    <span className="text-sm">{log.message}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 오른쪽: 추리보드 */}
          <div className="w-64 space-y-4">
            <div className="bg-card border border-border rounded-lg p-4">
              <h3 className="font-bold text-sm mb-3">개인 추리보드</h3>
              <div 
                className="h-32 bg-white rounded cursor-pointer hover:shadow-md transition-shadow flex items-center justify-center"
                onClick={() => setPersonalBoardOpen(true)}
              >
                <FileText className="w-8 h-8 text-gray-300" />
              </div>
            </div>
            
            <div className="bg-card border border-primary/30 rounded-lg p-4">
              <h3 className="font-bold text-sm mb-3 text-primary">공용 추리보드</h3>
              <div 
                className="h-32 bg-white rounded cursor-pointer hover:shadow-md transition-shadow flex items-center justify-center"
                onClick={() => setPublicBoardOpen(true)}
              >
                <Users className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">파티원과 공유됨</p>
            </div>
          </div>
        </div>
      </div>

      {/* 하단 버튼 */}
      <div className="fixed bottom-6 left-6 flex gap-3 z-30">
        <Button variant="neon" onClick={() => setHelperOpen(true)}>
          <MessageCircle className="w-4 h-4 mr-2" />조력자
        </Button>
        <Button variant="outline" className="neon-border-magenta" onClick={() => { setSelectedSuspect(suspects[0]); setInterrogateOpen(true); }}>
          <Users className="w-4 h-4 mr-2" />심문
        </Button>
      </div>

      {/* 모달 */}
      <ChatSidebar isOpen={helperOpen} onClose={() => setHelperOpen(false)} type="helper" />
      <ChatSidebar isOpen={interrogateOpen} onClose={() => setInterrogateOpen(false)} type="interrogate" suspect={selectedSuspect} />
      <BoardModal isOpen={personalBoardOpen} onClose={() => setPersonalBoardOpen(false)} scenarioId={scenarioId} title="개인 추리보드" />
      <BoardModal isOpen={publicBoardOpen} onClose={() => setPublicBoardOpen(false)} scenarioId={scenarioId} title="공용 추리보드" />
      <BoardModal isOpen={submitModalOpen} onClose={() => setSubmitModalOpen(false)} scenarioId={scenarioId} title="최종 정답 제출" readOnly={true} />

      {(helperOpen || interrogateOpen) && (
        <div className="fixed inset-0 bg-black/30 z-40" onClick={() => { setHelperOpen(false); setInterrogateOpen(false); }} />
      )}
    </div>
  )
}