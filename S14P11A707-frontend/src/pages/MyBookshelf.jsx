import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'wouter'

import { Button } from '@/components/ui/Button'
import { ReportModal } from '@/features/game/modals'
import { ReplayConfirmModal } from '@/components/ui/ReplayConfirmModal'
import { fetchMyReport } from '@/features/session/api/sessionApi'
import { normalizeInvestigationReportResponse } from '@/features/session/api/sessionMappers'
import { useBookshelf } from '@/features/user/hooks/useBookshelf'
import { useAuth } from '@/contexts/AuthContext'
import {
  ChevronLeft, ChevronRight, Clock, Award,
  FileText, BookOpen, RotateCcw
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// 등급별 스타일
const gradeStyles = {
  S: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50',
  A: 'bg-purple-500/20 text-purple-400 border border-purple-500/50',
  B: 'bg-blue-500/20 text-blue-400 border border-blue-500/50',
  C: 'bg-green-500/20 text-green-400 border border-green-500/50',
  D: 'bg-gray-500/20 text-gray-400 border border-gray-500/50',
  F: 'bg-red-500/20 text-red-400 border border-red-500/50',
}

// =========================
// 책 표지 카드
// =========================
function BookCard({ book, mode, isActive, onViewReport, onReplay }) {
  const [, setLocation] = useLocation()

  // mode: 'solved' | 'progress' | 'failed'
  if (!book) return <div className="w-40 flex-shrink-0" />

  const isSolved = mode === 'solved'
  const isProgress = mode === 'progress'
  const isFailed = mode === 'failed'

  // 이어하기 클릭 핸들러 (시나리오 상세 페이지와 동일한 흐름 사용)
  const handleResume = () => {
    // scenarioId를 사용하여 게임 페이지로 이동 (startGame API가 기존 세션 처리)
    setLocation(`/game/${book.scenarioId}`)
  }

  // 처음부터 하기 클릭 핸들러 (실패한 게임)
  const handleRestart = () => {
    // scenarioId를 사용하여 게임 페이지로 이동 (startGame API가 리셋 처리)
    setLocation(`/game/${book.scenarioId}`)
  }

  // 재플레이 클릭 핸들러 (완료한 게임)
  const handleReplay = () => {
    onReplay?.(book)
  }

  return (
    <div
      className={cn(
        "relative transition-all duration-500 ease-out flex-shrink-0",
        isActive ? "w-56 z-10" : "w-40 opacity-60 scale-90"
      )}
    >
      <div
        className={cn(
          "relative aspect-[3/4] rounded-lg overflow-hidden",
          "transition-all duration-500",
          "border border-border/50",
          isActive && "shadow-2xl shadow-primary/20"
        )}
      >
        {/* 썸네일 이미지 */}
        {book.thumbnail ? (
          <img
            src={book.thumbnail}
            alt={book.title}
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => { e.target.style.display = 'none' }}
          />
        ) : (
          // 썸네일 없을 때 기본 배경
          <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
            <BookOpen className="w-12 h-12 text-muted-foreground/30" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 p-3">
          {/* 제목 */}
          <h3 className={cn("font-bold text-white mb-1 line-clamp-2", isActive ? "text-base" : "text-sm")}>
            {book.title || '제목 없음'}
          </h3>

          {/* 시놉시스 (활성 상태일 때만) */}
          {isActive && book.synopsis && (
            <p className="text-xs text-gray-300 line-clamp-2 mb-2">
              {book.synopsis}
            </p>
          )}

          {/* 하단 메타 */}
          {isSolved && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Clock className="w-3 h-3" />
                <span>{book.playTime ? `${Math.floor(book.playTime / 60)}:${String(book.playTime % 60).padStart(2, '0')}` : '--:--'}</span>
              </div>
              <span className={cn("px-2 py-0.5 rounded text-xs font-bold", gradeStyles[book.rankGrade] || gradeStyles.F)}>
                {book.rankGrade || 'F'}
              </span>
            </div>
          )}

          {isProgress && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-gray-400">
                <span>남은 시간</span>
                <span className="text-primary font-bold">
                  {book.expiresAt ? `${Math.ceil((new Date(book.expiresAt) - new Date()) / (1000 * 60 * 60 * 24))}일` : '7일'}
                </span>
              </div>
              {book.expiresAt && (
                <div className="text-xs text-gray-400">
                  만료: {new Date(book.expiresAt).toLocaleDateString('ko-KR')}
                </div>
              )}
            </div>
          )}

          {isFailed && (
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-400">정답 제출</div>
              <span className="text-xs font-bold text-red-400">실패</span>
            </div>
          )}
        </div>

        {/* 해결 배지 */}
        {isSolved && isActive && (
          <div className="absolute top-2 right-2">
            <Award className="w-6 h-6 text-primary drop-shadow-lg" />
          </div>
        )}

        {/* 호버 액션 */}
        {isActive && (
          <div className="absolute inset-0 bg-primary/10 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
            {isSolved ? (
              // 완료한 게임은 수사보고서 + 재플레이
              <div className="flex flex-col gap-2">
                <Button
                  variant="neon"
                  size="sm"
                  className="shadow-lg"
                  onClick={() => onViewReport(book)}
                >
                  <FileText className="w-4 h-4 mr-1" />
                  수사보고서 열람
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="shadow-lg"
                  onClick={handleReplay}
                >
                  <RotateCcw className="w-4 h-4 mr-1" />
                  재플레이
                </Button>
              </div>
            ) : isFailed ? (
              // 실패한 게임은 처음부터 다시
              <Button
                variant="neon"
                size="sm"
                className="shadow-lg"
                onClick={handleRestart}
              >
                처음부터 하기
              </Button>
            ) : (
              // 진행중인 게임은 이어하기
              <Button
                variant="neon"
                size="sm"
                className="shadow-lg"
                onClick={handleResume}
              >
                이어하기
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// =========================
// 섹션 헤더
// =========================
function ShelfHeader({ title, count }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <h2 className="text-2xl font-bold gold-glow">| {title} |</h2>
      <span className="text-sm text-muted-foreground font-serif">{count}건</span>
    </div>
  )
}

// =========================
// 책장 캐러셀 (가운데 활성)
// =========================
function BookShelf({ books, mode, title, onViewReport, onReplay }) {
  const [activeIndex, setActiveIndex] = useState(0)

  const safeBooks = Array.isArray(books) ? books : []
  const count = safeBooks.length

  const handlePrev = () => setActiveIndex(prev => Math.max(0, prev - 1))
  const handleNext = () => setActiveIndex(prev => Math.min(count - 1, prev + 1))

  const visibleBooks = [
    activeIndex > 0 ? safeBooks[activeIndex - 1] : null,
    safeBooks[activeIndex],
    activeIndex < count - 1 ? safeBooks[activeIndex + 1] : null,
  ]

  return (
    <div className="mb-16">
      <div className="flex items-center justify-between">
        <ShelfHeader title={title} count={count} />
        {count > 1 && (
          <div className="text-sm text-muted-foreground font-serif">
            {activeIndex + 1} / {count}
          </div>
        )}
      </div>

      <div className="relative">
        {activeIndex > 0 && (
          <button
            onClick={handlePrev}
            className={cn(
              "absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-20",
              "w-12 h-12 rounded-full",
              "bg-card border border-border",
              "flex items-center justify-center",
              "hover:bg-primary/20 hover:border-primary transition-all",
              "shadow-lg"
            )}
            aria-label="이전"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {activeIndex < count - 1 && (
          <button
            onClick={handleNext}
            className={cn(
              "absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-20",
              "w-12 h-12 rounded-full",
              "bg-card border border-border",
              "flex items-center justify-center",
              "hover:bg-primary/20 hover:border-primary transition-all",
              "shadow-lg"
            )}
            aria-label="다음"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}

        <div
          className="rounded-xl p-8 relative overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, rgba(30,25,20,0.9) 0%, rgba(20,17,14,0.95) 100%)',
            boxShadow: 'inset 0 2px 20px rgba(0,0,0,0.5), 0 8px 32px rgba(0,0,0,0.3)',
          }}
        >
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, rgba(212,175,55,0.3) 1px, transparent 0)`,
              backgroundSize: '24px 24px',
            }}
          />
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

          {count === 0 ? (
            <div className="text-center py-16 text-muted-foreground relative z-10">
              <div className="text-5xl mb-4 opacity-30">📚</div>
              <p className="text-lg">아직 {title}이 없습니다</p>
              <Link href="/scenarios">
                <Button variant="neon" className="mt-4">
                  시나리오 둘러보기
                </Button>
              </Link>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-6 relative z-10 min-h-[320px]">
              {visibleBooks.map((book, idx) => (
                <BookCard
                  key={book?.sessionId || `empty-${idx}`}
                  book={book}
                  mode={mode}
                  isActive={idx === 1}
                  onViewReport={onViewReport}
                  onReplay={onReplay}
                />
              ))}
            </div>
          )}

          <div
            className="absolute bottom-0 left-0 right-0 h-3"
            style={{
              background: 'linear-gradient(180deg, rgba(60,50,40,0.8) 0%, rgba(40,33,27,1) 100%)',
              boxShadow: '0 -2px 10px rgba(0,0,0,0.3)',
            }}
          />
        </div>
      </div>
    </div>
  )
}

// =========================
// 메인 페이지
// =========================
export default function MyBookshelf() {
  const { state, actions } = useAuth()
  const user = state.user
  const authLoading = state.loading
  const gateAutoOpenedRef = useRef(false)

  const [, setLocation] = useLocation()
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [selectedReport, setSelectedReport] = useState(null)
  const [reportLoading, setReportLoading] = useState(false)

  // 재플레이 모달 상태
  const [replayModalOpen, setReplayModalOpen] = useState(false)
  const [selectedReplayBook, setSelectedReplayBook] = useState(null)

  // API 기반 데이터 조회
  const {
    completedSessions,
    playingSessions,
    failedSessions,
    totalAttempts,
    totalClears,
    clearRatePercent,
    sRankCount,
    loading,
    error,
  } = useBookshelf({ enabled: !!user })

  useEffect(() => {
    if (gateAutoOpenedRef.current) return
    if (authLoading) return
    if (user) return

    gateAutoOpenedRef.current = true
    actions.openLoginGate(null, { redirectTo: '/my-bookshelf' })
  }, [actions, authLoading, user])

  const handleViewReport = useCallback(async (book) => {
    if (!book?.sessionId) return
    if (reportLoading) return

    try {
      setReportLoading(true)
      const response = await fetchMyReport(book.sessionId)
      const normalized = normalizeInvestigationReportResponse(response)
      setSelectedReport(normalized)
      setReportModalOpen(true)
    } catch (err) {
      console.error('handleViewReport error:', err)
      toast.error('수사보고서를 불러오는데 실패했습니다.')
    } finally {
      setReportLoading(false)
    }
  }, [reportLoading])

  // 재플레이 모달 열기
  const handleReplayClick = useCallback((book) => {
    setSelectedReplayBook(book)
    setReplayModalOpen(true)
  }, [])

  // 재플레이 확정 - 단순히 게임 페이지로 이동 (백엔드가 알아서 처리)
  const handleReplayConfirm = useCallback(() => {
    if (!selectedReplayBook?.scenarioId) return
    setReplayModalOpen(false)
    setLocation(`/game/${selectedReplayBook.scenarioId}`)
  }, [selectedReplayBook, setLocation])

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 py-12">
        <div className="container max-w-6xl">
          {/* 헤더 */}
          <div className="mb-12 text-center">
            <h1 className="text-4xl font-bold gold-glow mb-4">내 수사록</h1>
            <p className="text-muted-foreground">당신의 추리 기록이 책으로 남아있습니다</p>
          </div>

          {/* 로딩 상태 */}
          {authLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="text-center">
                <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-muted-foreground">로그인 상태를 확인하는 중...</p>
              </div>
            </div>
          ) : !user ? (
            <div className="bg-card/40 border border-border rounded-xl p-10 text-center mb-6">
              <p className="text-xl font-bold mb-2">로그인이 필요합니다</p>
              <p className="text-muted-foreground mb-6">내 수사록을 보려면 Google 로그인을 해주세요.</p>
              <Button
                variant="neon"
                onClick={() => actions.openLoginGate(null, { redirectTo: '/my-bookshelf' })}
              >
                구글 로그인
              </Button>
            </div>
          ) : loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="text-center">
                <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-muted-foreground">책장 데이터를 불러오는 중...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex justify-center items-center py-20">
              <div className="text-center">
                <p className="text-red-400 mb-4">책장 데이터를 불러오는데 실패했습니다.</p>
                <Button onClick={() => window.location.reload()}>다시 시도</Button>
              </div>
            </div>
          ) : (
            <>
              {/* 통계 - API 기반 (totalAttempts, totalClears, clearRate, sRankCount) */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
                <StatCard label="담당한 사건 수" value={totalAttempts} tone="gold" />
                <StatCard label="해결한 사건 수" value={totalClears} tone="gold" />
                <StatCard label="S등급" value={sRankCount} tone="gold" />
                <StatCard label="사건 해결률" value={`${clearRatePercent}%`} tone="gold" />
              </div>

              {/* 섹션들 */}
              <BookShelf
                books={completedSessions}
                mode="solved"
                title="해결한 사건들"
                onViewReport={handleViewReport}
                onReplay={handleReplayClick}
              />

              <BookShelf
                books={playingSessions}
                mode="progress"
                title="진행중인 사건들"
                onViewReport={handleViewReport}
              />

              <BookShelf
                books={failedSessions}
                mode="failed"
                title="미제 사건들"
                onViewReport={handleViewReport}
              />
            </>
          )}
        </div>
      </main>

      <ReportModal
        isOpen={reportModalOpen}
        onClose={() => {
          setReportModalOpen(false)
          setSelectedReport(null)
        }}
        report={selectedReport}
      />

      {/* 재플레이 확인 모달 */}
      <ReplayConfirmModal
        isOpen={replayModalOpen}
        onClose={() => {
          setReplayModalOpen(false)
          setSelectedReplayBook(null)
        }}
        onConfirm={handleReplayConfirm}
        status={selectedReplayBook?.status}
        scenarioTitle={selectedReplayBook?.title}
      />

      <footer className="border-t border-border py-8 bg-card/30">
        <div className="container text-center">
          <p className="error-code">
              | HONG-YEON | COPYRIGHT_2026 |
          </p>
        </div>
      </footer>
    </div>
  )
}

// =========================
// 통계 카드
// =========================
function StatCard({ label, value, tone = "gold" }) {
  const valueClass =
    tone === "red" ? "text-red-500" : "text-primary"

  return (
    <div className="bg-card/50 border border-border rounded-lg p-4 text-center">
      <div className={cn("text-3xl font-bold", valueClass)}>{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  )
}
