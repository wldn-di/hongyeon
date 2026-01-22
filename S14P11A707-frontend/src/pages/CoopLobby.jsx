import React, { useState } from 'react'
import { Link, useRoute, useLocation } from 'wouter'
import { Button } from '@/components/ui/Button'
import { scenarios } from '@/data/dummyData'
import { Users, Plus, LogIn, Copy, Check, Crown, UserCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

// 더미 방 목록
const dummyRooms = [
  { id: 'ROOM-A1B2', host: '탐정왕', players: 2, maxPlayers: 4, scenarioId: 1, status: 'waiting' },
  { id: 'ROOM-C3D4', host: '셜록홈즈', players: 3, maxPlayers: 4, scenarioId: 2, status: 'waiting' },
  { id: 'ROOM-E5F6', host: '코난', players: 4, maxPlayers: 4, scenarioId: 1, status: 'playing' },
]

export default function CoopLobby() {
  const [, params] = useRoute('/coop/:scenarioId')
  const scenarioId = params?.scenarioId ? parseInt(params.scenarioId) : 1
  const scenario = scenarios.find(s => s.id === scenarioId) || scenarios[0]
  const [, navigate] = useLocation()

  const [view, setView] = useState('select') // 'select' | 'create' | 'join' | 'waiting'
  const [roomCode, setRoomCode] = useState('')
  const [createdRoomCode, setCreatedRoomCode] = useState('')
  const [copied, setCopied] = useState(false)
  const [players, setPlayers] = useState([
    { id: 1, name: '나 (호스트)', isHost: true, ready: true },
  ])

  const handleCreateRoom = () => {
    const code = `ROOM-${Math.random().toString(36).substring(2, 6).toUpperCase()}`
    setCreatedRoomCode(code)
    setView('waiting')
    
    // 더미 플레이어 추가 시뮬레이션
    setTimeout(() => {
      setPlayers(prev => [...prev, { id: 2, name: '탐정A', isHost: false, ready: false }])
    }, 2000)
  }

  const handleJoinRoom = () => {
    if (roomCode.length >= 4) {
      setCreatedRoomCode(roomCode)
      setView('waiting')
      setPlayers([
        { id: 1, name: '호스트', isHost: true, ready: true },
        { id: 2, name: '나', isHost: false, ready: false },
      ])
    }
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(createdRoomCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleStartGame = () => {
    navigate(`/coop-game/${scenarioId}/${createdRoomCode}`)
  }

  const filteredRooms = dummyRooms.filter(r => r.scenarioId === scenarioId && r.status === 'waiting')

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 py-12">
        <div className="container max-w-4xl">
          {/* 시나리오 정보 */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold gold-glow mb-2">협동 모드</h1>
            <p className="text-muted-foreground">{scenario.title}</p>
          </div>

          {view === 'select' && (
            <div className="space-y-6">
              {/* 방 생성/참가 선택 */}
              <div className="grid grid-cols-2 gap-6">
                <button
                  onClick={() => setView('create')}
                  className="bg-card/50 border border-border rounded-xl p-8 text-center hover:border-primary/50 transition-all group"
                >
                  <Plus className="w-12 h-12 mx-auto mb-4 text-primary group-hover:scale-110 transition-transform" />
                  <h3 className="text-xl font-bold mb-2">방 생성</h3>
                  <p className="text-sm text-muted-foreground">새로운 방을 만들어 친구를 초대하세요</p>
                </button>

                <button
                  onClick={() => setView('join')}
                  className="bg-card/50 border border-border rounded-xl p-8 text-center hover:border-primary/50 transition-all group"
                >
                  <LogIn className="w-12 h-12 mx-auto mb-4 text-primary group-hover:scale-110 transition-transform" />
                  <h3 className="text-xl font-bold mb-2">방 참가</h3>
                  <p className="text-sm text-muted-foreground">코드를 입력하여 방에 참가하세요</p>
                </button>
              </div>

              {/* 공개 방 목록 */}
              <div className="bg-card/50 border border-border rounded-xl p-6">
                <h3 className="text-lg font-bold mb-4 bracket-left">공개 방 목록</h3>
                {filteredRooms.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    현재 참가 가능한 방이 없습니다
                  </p>
                ) : (
                  <div className="space-y-3">
                    {filteredRooms.map(room => (
                      <div 
                        key={room.id}
                        className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <Users className="w-5 h-5 text-muted-foreground" />
                          <div>
                            <p className="font-bold">{room.host}의 방</p>
                            <p className="text-xs text-muted-foreground">{room.id}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-muted-foreground">
                            {room.players}/{room.maxPlayers}명
                          </span>
                          <Button 
                            variant="neon" 
                            size="sm"
                            onClick={() => {
                              setRoomCode(room.id)
                              handleJoinRoom()
                            }}
                          >
                            참가
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {view === 'create' && (
            <div className="bg-card/50 border border-border rounded-xl p-8 text-center">
              <h2 className="text-2xl font-bold mb-6">방 설정</h2>
              
              <div className="max-w-md mx-auto space-y-6">
                <div className="text-left">
                  <label className="block text-sm font-bold mb-2">최대 인원</label>
                  <select className="w-full bg-muted rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="2">2명</option>
                    <option value="3">3명</option>
                    <option value="4" selected>4명</option>
                  </select>
                </div>

                <div className="text-left">
                  <label className="block text-sm font-bold mb-2">공개 설정</label>
                  <select className="w-full bg-muted rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="private">비공개 (코드로만 참가)</option>
                    <option value="public">공개 (목록에 표시)</option>
                  </select>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button variant="ghost" onClick={() => setView('select')} className="flex-1">
                    취소
                  </Button>
                  <Button variant="neon" onClick={handleCreateRoom} className="flex-1">
                    방 생성
                  </Button>
                </div>
              </div>
            </div>
          )}

          {view === 'join' && (
            <div className="bg-card/50 border border-border rounded-xl p-8 text-center">
              <h2 className="text-2xl font-bold mb-6">방 코드 입력</h2>
              
              <div className="max-w-md mx-auto space-y-6">
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="ROOM-XXXX"
                  className="w-full bg-muted rounded-lg px-4 py-4 text-center text-2xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-primary"
                  maxLength={9}
                />

                <div className="flex gap-4">
                  <Button variant="ghost" onClick={() => setView('select')} className="flex-1">
                    취소
                  </Button>
                  <Button 
                    variant="neon" 
                    onClick={handleJoinRoom} 
                    className="flex-1"
                    disabled={roomCode.length < 4}
                  >
                    참가
                  </Button>
                </div>
              </div>
            </div>
          )}

          {view === 'waiting' && (
            <div className="bg-card/50 border border-border rounded-xl p-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-4">대기실</h2>
                
                {/* 방 코드 */}
                <div className="inline-flex items-center gap-3 bg-muted rounded-lg px-6 py-3">
                  <span className="font-mono text-xl tracking-widest">{createdRoomCode}</span>
                  <button 
                    onClick={handleCopyCode}
                    className="p-2 hover:bg-primary/20 rounded transition-colors"
                  >
                    {copied ? (
                      <Check className="w-5 h-5 text-green-500" />
                    ) : (
                      <Copy className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  이 코드를 친구에게 공유하세요
                </p>
              </div>

              {/* 플레이어 목록 */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                {players.map(player => (
                  <div 
                    key={player.id}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-lg border",
                      player.ready ? "bg-green-500/10 border-green-500/30" : "bg-muted/30 border-border"
                    )}
                  >
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                      {player.isHost ? (
                        <Crown className="w-6 h-6 text-primary" />
                      ) : (
                        <UserCircle className="w-6 h-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold">{player.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {player.isHost ? '호스트' : player.ready ? '준비 완료' : '대기 중'}
                      </p>
                    </div>
                  </div>
                ))}

                {/* 빈 슬롯 */}
                {Array(4 - players.length).fill(null).map((_, i) => (
                  <div 
                    key={`empty-${i}`}
                    className="flex items-center justify-center p-4 rounded-lg border border-dashed border-border/50 text-muted-foreground"
                  >
                    <span className="text-sm">대기 중...</span>
                  </div>
                ))}
              </div>

              {/* 액션 버튼 */}
              <div className="flex gap-4 justify-center">
                <Button variant="ghost" onClick={() => setView('select')}>
                  나가기
                </Button>
                {players[0]?.isHost && players[0]?.name.includes('나') ? (
                  <Button 
                    variant="neon" 
                    onClick={handleStartGame}
                    disabled={players.length < 2}
                  >
                    게임 시작 ({players.length}/4)
                  </Button>
                ) : (
                  <Button 
                    variant="neon"
                    onClick={() => {
                      setPlayers(prev => prev.map(p => 
                        p.name === '나' ? { ...p, ready: !p.ready } : p
                      ))
                    }}
                  >
                    {players.find(p => p.name === '나')?.ready ? '준비 취소' : '준비 완료'}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}