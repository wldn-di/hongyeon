import React, { useMemo, useState } from 'react'
import { Link } from 'wouter'
import { Button } from '@/components/ui/Button'
import { completedScenarios, imcompletedScenarios, failedScenarios } from '@/data/dummyData'
import {
  Trophy, XCircle, ChevronLeft, ChevronRight, Clock, Award,
  X, Share2, FileText
} from 'lucide-react'
import { cn } from '@/lib/utils'

// 등급별 스타일
const gradeStyles = {
  S: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50',
  A: 'bg-purple-500/20 text-purple-400 border border-purple-500/50',
  B: 'bg-blue-500/20 text-blue-400 border border-blue-500/50',
}

// =========================
// 수사보고서 모달
// =========================
function ReportModal({ isOpen, onClose, book }) {
  const [shareUuid, setShareUuid] = useState(null)
  const [copied, setCopied] = useState(false)

  const generateUuid = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  }

  const handleShare = () => {
    if (!shareUuid) setShareUuid(generateUuid())
  }

  const handleCopyUuid = async () => {
    if (!shareUuid) return
    try {
      await navigator.clipboard.writeText(shareUuid)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const textArea = document.createElement('textarea')
      textArea.value = shareUuid
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleClose = () => {
    setShareUuid(null)
    setCopied(false)
    onClose()
  }

  if (!isOpen || !book) return null

  // 더미 보고서 데이터 (현재 book 기반)
  const report = {
    playerName: "탐정",
    scenarioTitle: book.title,
    playTime: `${book.playTime}:00`,
    grade: book.grade,
    accuracy: book.grade === 'S' ? 95 : book.grade === 'A' ? 85 : 75,
    hintsUsed: book.grade === 'S' ? 0 : book.grade === 'A' ? 1 : 2,
    interrogations: 5,
    summary: book.grade === 'S'
      ? "완벽한 추리력을 보여주셨습니다! 모든 증거를 정확하게 분석하고 범인을 정확히 특정했습니다."
      : book.grade === 'A'
        ? "훌륭한 추리력을 보여주셨습니다. 대부분의 증거를 정확하게 분석했으며, 범인의 동기를 정확히 파악했습니다."
        : "좋은 추리력을 보여주셨습니다. 일부 증거 분석에 오류가 있었지만 결국 사건을 해결했습니다.",
    timeline: [
      { time: "00:05", event: "첫 번째 증거 발견" },
      { time: "00:15", event: "용의자 심문 시작" },
      { time: "00:25", event: "핵심 단서 발견" },
      { time: "00:35", event: "범인 특정" },
      { time: `00:${book.playTime}`, event: "사건 해결" },
    ]
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-xl font-bold gold-glow">수사 보고서</h2>
          <button onClick={handleClose} className="p-1 hover:bg-muted rounded">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="text-center mb-6">
            <p className="text-sm text-muted-foreground">시나리오</p>
            <p className="text-2xl font-bold">{report.scenarioTitle}</p>
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

        <div className="p-4 border-t border-border space-y-3">
          {shareUuid && (
            <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-3">
              <span className="text-xs text-muted-foreground">공유 코드:</span>
              <button
                onClick={handleCopyUuid}
                className="flex-1 font-mono text-sm text-primary hover:text-primary/80 truncate text-left"
              >
                {shareUuid}
              </button>
              <span className={cn(
                "text-xs px-2 py-1 rounded transition-all",
                copied ? "bg-green-500/20 text-green-400" : "bg-muted text-muted-foreground"
              )}>
                {copied ? "복사됨!" : "클릭하여 복사"}
              </span>
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={handleClose}>
              닫기
            </Button>
            <Button variant="neon" className="flex-1" onClick={handleShare}>
              <Share2 className="w-4 h-4 mr-2" />
              공유하기
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// =========================
// 책 표지 카드
// =========================
function BookCard({ book, mode, isActive, onViewReport }) {
  // mode: 'solved' | 'progress' | 'failed'
  if (!book) return <div className="w-40 flex-shrink-0" />

  const isSolved = mode === 'solved'
  const isProgress = mode === 'progress'
  const isFailed = mode === 'failed'

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
        <img
          src={book.thumbnail}
          alt={book.title}
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => { e.target.style.display = 'none' }}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className={cn("font-bold text-white mb-1 line-clamp-1", isActive ? "text-base" : "text-sm")}>
            {book.title}
          </h3>

          {isActive && (
            <p className="text-xs text-gray-300 line-clamp-2 mb-2">
              {book.synopsis}
            </p>
          )}

          {/* 하단 메타 */}
          {isSolved && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Clock className="w-3 h-3" />
                <span>{book.playTime}분</span>
              </div>
              <span className={cn("px-2 py-0.5 rounded text-xs font-bold", gradeStyles[book.grade] || gradeStyles.B)}>
                {book.grade}
              </span>
            </div>
          )}

          {isProgress && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-gray-400">
                <span>진척도</span>
                <span className="text-primary font-bold">{book.progress ?? 0}%</span>
              </div>
              <div className="h-1 bg-black/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-yellow-500 to-yellow-300 rounded-full"
                  style={{ width: `${book.progress ?? 0}%` }}
                />
              </div>
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
              <Button
                variant="neon"
                size="sm"
                className="shadow-lg"
                onClick={() => onViewReport(book)}
              >
                <FileText className="w-4 h-4 mr-1" />
                수사보고서 열람
              </Button>
            ) : (
              // 진행중/실패 둘 다 “이어하기”로 처리(실패는 재도전 개념)
              <Link href={`/scenario/${book.scenarioId}`}>
                <Button variant="neon" size="sm" className="shadow-lg">
                  이어하기
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// =========================
// 섹션 헤더(사진처럼)
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
function BookShelf({ books, mode, title, onViewReport }) {
  const [activeIndex, setActiveIndex] = useState(0)

  const safeBooks = Array.isArray(books) ? books : []
  const count = safeBooks.length

  const handlePrev = () => setActiveIndex(prev => Math.max(0, prev - 1))
  const handleNext = () => setActiveIndex(prev => Math.min(count - 1, prev + 1))

  const visibleBooks = useMemo(() => {
    const prev = activeIndex > 0 ? safeBooks[activeIndex - 1] : null
    const current = safeBooks[activeIndex]
    const next = activeIndex < count - 1 ? safeBooks[activeIndex + 1] : null
    return [prev, current, next]
  }, [activeIndex, safeBooks, count])

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
                  key={book?.id || `empty-${idx}`}
                  book={book}
                  mode={mode}
                  isActive={idx === 1}
                  onViewReport={onViewReport}
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
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [selectedBook, setSelectedBook] = useState(null)

  const solvedCount = completedScenarios.length
  const inProgressCount = imcompletedScenarios.length
  const failedCount = failedScenarios.length
  const sGradeCount = completedScenarios.filter(s => s.grade === 'S').length

  const totalCount = solvedCount + inProgressCount + failedCount
  const solveRate = totalCount > 0 ? Math.round((solvedCount / totalCount) * 100) : 0

  const handleViewReport = (book) => {
    setSelectedBook(book)
    setReportModalOpen(true)
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 py-12">
        <div className="container max-w-6xl">
          {/* 헤더 */}
          <div className="mb-12 text-center">
            <h1 className="text-4xl font-bold gold-glow mb-4">내 수사록</h1>
            <p className="text-muted-foreground">당신의 추리 기록이 책으로 남아있습니다</p>
          </div>

          {/* ✅ 통계 (사진처럼 5칸 한 줄) */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-12">
            <StatCard label="해결" value={solvedCount} tone="gold" />
            <StatCard label="미해결" value={inProgressCount} tone="red" />
            <StatCard label="미제" value={failedCount} tone="red" />
            <StatCard label="S등급" value={sGradeCount} tone="gold" />
            <StatCard label="사건 해결률" value={`${solveRate}%`} tone="gold" />
          </div>

          {/* 섹션들 (사진처럼 제목) */}
          <BookShelf
            books={completedScenarios}
            mode="solved"
            title="해결한 사건들"
            onViewReport={handleViewReport}
          />

          <BookShelf
            books={imcompletedScenarios}
            mode="progress"
            title="미해결 사건들"
            onViewReport={handleViewReport}
          />

          <BookShelf
            books={failedScenarios}
            mode="failed"
            title="미제 사건들"
            onViewReport={handleViewReport}
          />
        </div>
      </main>

      <ReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        book={selectedBook}
      />

      <footer className="border-t border-border py-8 bg-card/30">
        <div className="container text-center">
          <p className="error-code">
            [SYSTEM_STATUS: OPERATIONAL] | DETECTIVE v2.0 | [COPYRIGHT_2024]
          </p>
        </div>
      </footer>
    </div>
  )
}

// =========================
// 통계 카드 (재사용)
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
