import React, { useState } from 'react'
import { useRoute, Link } from 'wouter'
import { Button } from '@/components/ui/Button'
import { scenarios, scenarioSuspects, scenarioTop3, scenarioReviews } from '@/data/dummyData'
import {
  Clock, Trophy, X, Users, User, ExternalLink, Star,
  ChevronLeft, ChevronRight, Share2, Download
} from 'lucide-react'
import { cn } from '@/lib/utils'

// 더미 수사보고서 데이터 생성 함수
const generateDummyReport = (playerName, clearTime) => ({
  playerName,
  scenarioTitle: "살인의 추억",
  playTime: clearTime || "42:15",
  grade: ["S", "A", "B"][Math.floor(Math.random() * 3)],
  accuracy: Math.floor(Math.random() * 20) + 80,
  hintsUsed: Math.floor(Math.random() * 3),
  interrogations: Math.floor(Math.random() * 5) + 3,
  evidenceFound: Math.floor(Math.random() * 3) + 6,
  correctDeductions: Math.floor(Math.random() * 2) + 5,
  totalDeductions: 7,
  summary: "훌륭한 추리력을 보여주셨습니다. 대부분의 증거를 정확하게 분석했으며, 범인의 동기를 정확히 파악했습니다.",
  timeline: [
    { time: "00:05", event: "첫 번째 증거 발견" },
    { time: "00:15", event: "용의자 심문 시작" },
    { time: "00:25", event: "핵심 단서 발견" },
    { time: "00:35", event: "범인 특정" },
    { time: clearTime || "00:42", event: "사건 해결" },
  ]
})

// 수사보고서 팝업
function ReportModal({ isOpen, onClose, report }) {
  if (!isOpen || !report) return null

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-xl font-bold gold-glow">수사 보고서</h2>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="text-center mb-6">
            <p className="text-sm text-muted-foreground">탐정</p>
            <p className="text-2xl font-bold">{report.playerName}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-muted/30 rounded-lg p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">등급</p>
              <p className="text-3xl font-bold text-primary">{report.grade}</p>
            </div>
            <div className="bg-muted/30 rounded-lg p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">클리어 시간</p>
              <p className="text-2xl font-bold">{report.playTime}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-muted/30 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">정확도</p>
              <p className="text-lg font-bold">{report.accuracy}%</p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">힌트 사용</p>
              <p className="text-lg font-bold">{report.hintsUsed}회</p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">심문 횟수</p>
              <p className="text-lg font-bold">{report.interrogations}회</p>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-bold mb-2 bracket-left">종합 평가</h3>
            <p className="text-sm text-muted-foreground leading-relaxed bg-muted/30 rounded-lg p-4">
              {report.summary}
            </p>
          </div>

          <div>
            <h3 className="font-bold mb-2 bracket-left">수사 타임라인</h3>
            <div className="space-y-2">
              {report.timeline.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 text-sm">
                  <span className="font-mono text-muted-foreground">{item.time}</span>
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span>{item.event}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-border flex gap-3">
          <Button variant="outline" className="flex-1">
            <Share2 className="w-4 h-4 mr-2" />
            공유하기
          </Button>
          <Button variant="neon" className="flex-1">
            <Download className="w-4 h-4 mr-2" />
            저장하기
          </Button>
        </div>
      </div>
    </div>
  )
}

// 용의자 카드 컴포넌트 (한마디 포함)
function SuspectCard({ suspect }) {
  return (
    <div className="flex-shrink-0 w-44">
      <div
        className="bg-white p-2 pb-4 shadow-lg"
        style={{ transform: `rotate(${(suspect.id % 2 === 0 ? 2 : -2)}deg)` }}
      >
        <div className="w-full h-36 bg-gray-200 flex items-center justify-center overflow-hidden">
          {suspect.image ? (
            <img src={suspect.image} alt={suspect.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-gray-400 text-xs">[사진]</span>
          )}
        </div>
        <p className="text-center mt-2 text-sm text-gray-800 font-bold">{suspect.name}</p>
        <p className="text-center text-xs text-gray-600">{suspect.role}</p>
      </div>
      <p className="text-center text-xs text-muted-foreground mt-2">MBTI: {suspect.mbti}</p>
      <div className="mt-2 bg-card/50 border border-border rounded-lg p-2">
        <p className="text-xs text-muted-foreground italic">"{suspect.quote}"</p>
      </div>
    </div>
  )
}

// 게임 시작 모달 컴포넌트
function GameStartModal({ isOpen, onClose, scenario }) {
  if (!isOpen || !scenario) return null

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-xl font-bold gold-glow">게임 시작</h2>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <h3 className="font-bold text-lg mb-2">{scenario.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {scenario.synopsis}
            </p>
          </div>

          <div className="flex items-center gap-4 mb-6 text-sm text-muted-foreground">
            <span className={cn(
              "px-2 py-1 rounded text-xs font-bold uppercase",
              scenario.difficulty === 'hard' && "bg-red-500/90 text-white",
              scenario.difficulty === 'medium' && "bg-yellow-500/90 text-black",
              scenario.difficulty === 'easy' && "bg-green-500/90 text-white"
            )}>
              {scenario.difficulty}
            </span>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>예상 {scenario.estimatedTime}분</span>
            </div>
          </div>

          <div className="flex gap-3">
            <Link href={`/room/${scenario.id}/solo`} className="flex-1">
              <Button variant="neon" className="w-full py-6 text-lg">
                <User className="w-5 h-5 mr-2" />
                솔로 플레이
              </Button>
            </Link>
            <Link href={`/coop/${scenario.id}`} className="flex-1">
              <Button variant="outline" className="w-full py-6 text-lg neon-border-magenta">
                <Users className="w-5 h-5 mr-2" />
                협동 플레이
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

// Top3 랭킹 아이템
function Top3Item({ player, onViewReport }) {
  const getRankStyle = (rank) => {
    switch(rank) {
      case 1: return "text-yellow-400"
      case 2: return "text-gray-400"
      case 3: return "text-amber-600"
      default: return "text-muted-foreground"
    }
  }

  const getRankIcon = (rank) => {
    if (rank <= 3) return <Trophy className={cn("w-4 h-4", getRankStyle(rank))} />
    return <span className="text-sm">{rank}</span>
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-card/50 border border-border rounded-lg hover:border-primary/30 transition-all">
      <div className="w-8 flex justify-center">
        {getRankIcon(player.rank)}
      </div>
      <div className="flex-1">
        <p className="font-bold text-sm">{player.nickname}</p>
        <p className="text-xs text-muted-foreground">{player.clearTime}</p>
      </div>
      <button
        onClick={() => onViewReport(player)}
        className="flex items-center gap-1 px-2 py-1 bg-muted/50 rounded text-xs text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
        title="수사보고서 보기"
      >
        <span className="font-mono">{player.uuid}</span>
        <ExternalLink className="w-3 h-3" />
      </button>
    </div>
  )
}

export default function GamePlay() {
  const [, params] = useRoute('/game/:scenarioId')
  const scenarioId = params?.scenarioId ? parseInt(params.scenarioId) : 1
  const scenario = scenarios.find(s => s.id === scenarioId) || scenarios[0]

  const suspects = scenarioSuspects[scenarioId] || scenarioSuspects[1]
  const top3 = scenarioTop3[scenarioId] || scenarioTop3[1]
  const reviews = scenarioReviews[scenarioId] || scenarioReviews[1]

  const [gameStartModalOpen, setGameStartModalOpen] = useState(false)
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [reportData, setReportData] = useState(null)
  const [reviewPage, setReviewPage] = useState(0)

  const reviewsPerPage = 2
  const totalReviewPages = Math.ceil(reviews.length / reviewsPerPage)
  const currentReviews = reviews.slice(reviewPage * reviewsPerPage, (reviewPage + 1) * reviewsPerPage)

  const handleViewReport = (player) => {
    const report = generateDummyReport(player.nickname, player.clearTime)
    setReportData(report)
    setReportModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-background">

      <div className="container py-8">
        <div className="flex gap-8">
          {/* 왼쪽: 메인 콘텐츠 (2/3) */}
          <div className="flex-1 space-y-8">
            {/* 시놉시스 상세 */}
            <div className="bg-card/50 border border-border rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold gold-glow mb-2">{scenario.title}</h1>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className={cn(
                      "px-2 py-1 rounded text-xs font-bold uppercase",
                      scenario.difficulty === 'hard' && "bg-red-500/90 text-white",
                      scenario.difficulty === 'medium' && "bg-yellow-500/90 text-black",
                      scenario.difficulty === 'easy' && "bg-green-500/90 text-white"
                    )}>
                      {scenario.difficulty}
                    </span>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{scenario.estimatedTime}분</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{scenario.playCount.toLocaleString()}명 플레이</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-primary text-primary" />
                      <span>{(scenario.rating / 100).toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="prose prose-invert max-w-none">
                <p className="text-muted-foreground leading-relaxed text-lg">
                  {scenario.synopsis}
                </p>
                <div className="mt-4 p-4 bg-muted/20 rounded-lg border border-border/50">
                  <p className="text-muted-foreground leading-relaxed">
                    {scenarioId === 1 && "1986년 10월, 화성군 태안읍의 한 농촌 마을. 첫 번째 피해자가 발견된 이후, 비슷한 수법의 연쇄 살인이 계속되고 있다. 경찰은 수사에 총력을 기울이고 있지만, 결정적인 단서를 찾지 못하고 있다. 당신은 이 미제 사건을 해결할 수 있는 마지막 희망이다."}
                    {scenarioId === 2 && "고급 호텔의 스위트룸. 내부에서 잠긴 방에서 발견된 시신. 창문도 잠겨있고, 환풍구는 사람이 지나갈 수 없을 정도로 좁다. 완벽한 밀실에서 어떻게 살인이 일어난 것인가?"}
                    {scenarioId === 3 && "국내 10대 재벌가의 외동딸이 갑자기 사라졌다. 납치인가, 자발적 실종인가? 거액의 유산을 둘러싼 가족들의 음모가 의심된다."}
                    {scenarioId === 4 && "서울에서 부산으로 향하는 KTX 열차. 터널을 지나는 동안 벌어진 살인. 범인은 반드시 이 열차 안에 있다. 12명의 용의자 중 진범을 찾아라."}
                    {scenarioId === 5 && "100년 된 고택에서 들려오는 정체 모를 비명. 오래전 이곳에서 일어난 비극의 진실은 무엇인가? 초자연적 현상인지, 누군가의 계획된 범행인지 밝혀내야 한다."}
                  </p>
                </div>
              </div>
            </div>

            {/* 용의자 목록 */}
            <div>
              <h2 className="text-xl font-bold mb-4 bracket-left">용의자 목록</h2>
              <div className="flex gap-6 overflow-x-auto pb-4">
                {suspects.map(suspect => (
                  <SuspectCard
                    key={suspect.id}
                    suspect={suspect}
                  />
                ))}
              </div>
            </div>

            {/* 플레이어 리뷰 섹션 (페이지네이션) */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold bracket-left">플레이어 리뷰</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setReviewPage(prev => Math.max(0, prev - 1))}
                    disabled={reviewPage === 0}
                    className={cn(
                      "w-8 h-8 rounded-full border border-border flex items-center justify-center transition-colors",
                      reviewPage === 0 ? "opacity-50 cursor-not-allowed" : "hover:bg-muted"
                    )}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm text-muted-foreground">
                    {reviewPage + 1} / {totalReviewPages}
                  </span>
                  <button
                    onClick={() => setReviewPage(prev => Math.min(totalReviewPages - 1, prev + 1))}
                    disabled={reviewPage >= totalReviewPages - 1}
                    className={cn(
                      "w-8 h-8 rounded-full border border-border flex items-center justify-center transition-colors",
                      reviewPage >= totalReviewPages - 1 ? "opacity-50 cursor-not-allowed" : "hover:bg-muted"
                    )}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentReviews.map(review => (
                  <div
                    key={review.id}
                    className="bg-card/50 border border-border rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-bold text-sm">{review.nickname}</p>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              "w-3 h-3",
                              i < review.rating ? "fill-primary text-primary" : "text-muted-foreground"
                            )}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">"{review.review}"</p>
                    <p className="text-xs text-muted-foreground/60 mt-2">{review.date}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 오른쪽: 사이드바 (1/3) */}
          <div className="w-80 space-y-6">
            {/* 썸네일 이미지 */}
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="aspect-[3/4] bg-muted">
                <img
                  src={scenario.thumbnail}
                  alt={scenario.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none'
                  }}
                />
              </div>
            </div>

            {/* Top3 랭킹 */}
            <div className="bg-card border border-border rounded-lg p-4">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-400" />
                클리어 시간 Top 3
              </h3>
              <div className="space-y-2">
                {top3.map(player => (
                  <Top3Item
                    key={player.uuid}
                    player={player}
                    onViewReport={handleViewReport}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3 text-center">
                UUID 클릭 시 수사보고서 확인 가능
              </p>
            </div>

            {/* 게임하러 가기 버튼 */}
            <Button
              variant="neon"
              className="w-full py-6 text-lg"
              onClick={() => setGameStartModalOpen(true)}
            >
              게임하러 가기
            </Button>
          </div>
        </div>
      </div>

      {/* 게임 시작 모달 */}
      <GameStartModal
        isOpen={gameStartModalOpen}
        onClose={() => setGameStartModalOpen(false)}
        scenario={scenario}
      />

      {/* 수사보고서 모달 */}
      <ReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        report={reportData}
      />
    </div>
  )
}
