import React, { useState } from 'react'
import { Link } from 'wouter'
import { Button } from '@/components/ui/Button'
import { completedScenarios, failedScenarios } from '@/data/dummyData'
import { Trophy, XCircle, ChevronLeft, ChevronRight, Clock, Award, X, Share2, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

// 등급별 스타일 - 단순하고 어울리게
const gradeStyles = {
  S: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50',
  A: 'bg-purple-500/20 text-purple-400 border border-purple-500/50',
  B: 'bg-blue-500/20 text-blue-400 border border-blue-500/50',
}

// 수사보고서 팝업
function ReportModal({ isOpen, onClose, book }) {
  const [shareUuid, setShareUuid] = useState(null)
  const [copied, setCopied] = useState(false)

  // UUID 생성 함수
  const generateUuid = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  }

  const handleShare = () => {
    if (!shareUuid) {
      setShareUuid(generateUuid())
    }
  }

  const handleCopyUuid = async () => {
    if (shareUuid) {
      try {
        await navigator.clipboard.writeText(shareUuid)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (err) {
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
  }

  const handleClose = () => {
    setShareUuid(null)
    setCopied(false)
    onClose()
  }

  if (!isOpen || !book) return null

  // 더미 보고서 데이터 생성
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
          {/* UUID 공유 영역 */}
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

          {/* 버튼 영역 */}
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

// 책 표지 카드 컴포넌트
function BookCard({ book, isSuccess, isActive, onViewReport }) {
  if (!book) {
    // 빈 슬롯
    return <div className="w-40 flex-shrink-0" />
  }

  return (
    <div
      className={cn(
        "relative transition-all duration-500 ease-out flex-shrink-0",
        isActive ? "w-56 z-10" : "w-40 opacity-60 scale-90"
      )}
    >
      {/* 책 표지 */}
      <div
        className={cn(
          "relative aspect-[3/4] rounded-lg overflow-hidden",
          "transition-all duration-500",
          "border border-border/50",
          isActive && "shadow-2xl shadow-primary/20"
        )}
      >
        {/* 썸네일 이미지 */}
        <img
          src={book.thumbnail}
          alt={book.title}
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => {
            e.target.style.display = 'none'
          }}
        />

        {/* 그라데이션 오버레이 */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />

        {/* 책 정보 */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className={cn(
            "font-bold text-white mb-1 line-clamp-1",
            isActive ? "text-base" : "text-sm"
          )}>
            {book.title}
          </h3>
          {isActive && (
            <p className="text-xs text-gray-300 line-clamp-2 mb-2">
              {book.synopsis}
            </p>
          )}

          {isSuccess ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Clock className="w-3 h-3" />
                <span>{book.playTime}분</span>
              </div>
              {/* 단순한 등급 뱃지 */}
              <span className={cn(
                "px-2 py-0.5 rounded text-xs font-bold",
                gradeStyles[book.grade]
              )}>
                {book.grade}
              </span>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-gray-400">
                <span>진척도</span>
                <span className="text-red-400 font-bold">{book.progress}%</span>
              </div>
              <div className="h-1 bg-black/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-red-500 to-red-400 rounded-full"
                  style={{ width: `${book.progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* 성공 배지 */}
        {isSuccess && isActive && (
          <div className="absolute top-2 right-2">
            <Award className="w-6 h-6 text-primary drop-shadow-lg" />
          </div>
        )}

        {/* 호버 오버레이 */}
        {isActive && (
          <div className="absolute inset-0 bg-primary/10 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
            {isSuccess ? (
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

// 책장 캐러셀 컴포넌트 - 선택 항목이 가운데
function BookShelf({ books, isSuccess, title, icon: Icon, onViewReport }) {
  const [activeIndex, setActiveIndex] = useState(0)

  const handlePrev = () => {
    setActiveIndex(prev => Math.max(0, prev - 1))
  }

  const handleNext = () => {
    setActiveIndex(prev => Math.min(books.length - 1, prev + 1))
  }

  // 가운데 정렬: [이전 책, 활성 책, 다음 책]
  const getVisibleBooks = () => {
    const prev = activeIndex > 0 ? books[activeIndex - 1] : null
    const current = books[activeIndex]
    const next = activeIndex < books.length - 1 ? books[activeIndex + 1] : null
    return [prev, current, next]
  }

  const visibleBooks = getVisibleBooks()

  return (
    <div className="mb-16">
      {/* 섹션 타이틀 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Icon className={cn("w-7 h-7", isSuccess ? 'text-primary' : 'text-red-500')} />
          <h2 className={cn("text-2xl font-bold", isSuccess ? 'gold-glow' : 'red-glow')}>
            {title}
          </h2>
          <span className="font-serif text-muted-foreground ml-2">[{books.length}권]</span>
        </div>

        {/* 페이지 인디케이터 */}
        {books.length > 1 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground font-serif">
            <span>{activeIndex + 1}</span>
            <span>/</span>
            <span>{books.length}</span>
          </div>
        )}
      </div>

      {/* 책장 컨테이너 */}
      <div className="relative">
        {/* 좌측 네비게이션 */}
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
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* 우측 네비게이션 */}
        {activeIndex < books.length - 1 && (
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
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}

        {/* 책장 배경 */}
        <div
          className="rounded-xl p-8 relative overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, rgba(30,25,20,0.9) 0%, rgba(20,17,14,0.95) 100%)',
            boxShadow: 'inset 0 2px 20px rgba(0,0,0,0.5), 0 8px 32px rgba(0,0,0,0.3)',
          }}
        >
          {/* 미묘한 패턴 */}
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, rgba(212,175,55,0.3) 1px, transparent 0)`,
              backgroundSize: '24px 24px',
            }}
          />

          {/* 상단 장식 라인 */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

          {books.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground relative z-10">
              <div className="text-5xl mb-4 opacity-30">📚</div>
              <p className="text-lg">아직 {isSuccess ? '성공한' : '도전한'} 시나리오가 없습니다</p>
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
                  isSuccess={isSuccess}
                  isActive={idx === 1} // 가운데가 활성
                  onViewReport={onViewReport}
                />
              ))}
            </div>
          )}

          {/* 하단 선반 효과 */}
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

export default function MyBookshelf() {
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [selectedBook, setSelectedBook] = useState(null)

  const handleViewReport = (book) => {
    setSelectedBook(book)
    setReportModalOpen(true)
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">

      <main className="flex-1 py-12">
        <div className="container max-w-6xl">
          {/* 페이지 헤더 */}
          <div className="mb-12 text-center">
            <h1 className="text-4xl font-bold gold-glow mb-4">내 수사록</h1>
            <p className="text-muted-foreground">
              당신의 추리 기록이 책으로 남아있습니다
            </p>
          </div>

          {/* 통계 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            <div className="bg-card/50 border border-border rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-primary">{completedScenarios.length}</div>
              <div className="text-sm text-muted-foreground">성공</div>
            </div>
            <div className="bg-card/50 border border-border rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-red-500">{failedScenarios.length}</div>
              <div className="text-sm text-muted-foreground">미완</div>
            </div>
            <div className="bg-card/50 border border-border rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-primary">
                {completedScenarios.filter(s => s.grade === 'S').length}
              </div>
              <div className="text-sm text-muted-foreground">S등급</div>
            </div>
            <div className="bg-card/50 border border-border rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-primary">
                {Math.round((completedScenarios.length / (completedScenarios.length + failedScenarios.length)) * 100) || 0}%
              </div>
              <div className="text-sm text-muted-foreground">성공률</div>
            </div>
          </div>

          {/* 성공 책장 */}
          <BookShelf
            books={completedScenarios}
            isSuccess={true}
            title="성공한 시나리오"
            icon={Trophy}
            onViewReport={handleViewReport}
          />

          {/* 실패 책장 */}
          <BookShelf
            books={failedScenarios}
            isSuccess={false}
            title="미완의 기록"
            icon={XCircle}
            onViewReport={handleViewReport}
          />
        </div>
      </main>

      {/* 수사보고서 모달 */}
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
