import React from 'react'
// import { Link } from 'wouter'
import { Button } from '@/components/ui/Button'
import { Star, Clock, Users, Play, Trophy, ChevronLeft, ChevronRight, User, AlertTriangle, RotateCcw, CheckCircle, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useReviews } from '../hooks/useReviews'

// 난이도 배지
function DifficultyBadge({ difficulty }) {
  const label = {
    easy: '쉬움',
    medium: '보통',
    hard: '어려움',
  }[difficulty] || '보통'

  return (
    <span className={cn(
      "px-3 py-1 rounded text-sm font-bold uppercase tracking-wider",
      difficulty === 'hard' && "bg-red-500/90 text-white",
      difficulty === 'medium' && "bg-yellow-500/90 text-black",
      difficulty === 'easy' && "bg-green-500/90 text-white"
    )}>
      {label}
    </span>
  )
}

// 용의자 카드
function SuspectCard({ suspect }) {
  return (
    <div className="bg-card/60 border border-border rounded-lg p-4 hover:border-primary/50 transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-full bg-muted overflow-hidden flex-shrink-0">
          {suspect.image ? (
            <img src={suspect.image} alt={suspect.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <User className="w-6 h-6 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-sm">{suspect.name}</h4>
          <p className="text-xs text-muted-foreground">{suspect.occupation}</p>
          {suspect.oneLiner && (
            <p className="text-xs text-muted-foreground mt-1 italic line-clamp-1">"{suspect.oneLiner}"</p>
          )}
        </div>
      </div>
    </div>
  )
}

// 랭킹 아이템
function RankingItem({ ranking, index }) {
  const rankColors = {
    0: 'text-yellow-400',
    1: 'text-gray-300',
    2: 'text-amber-600',
  }

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}분 ${s}초`
  }

  return (
    <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
      <div className={cn("font-bold text-lg w-6 text-center", rankColors[index])}>
        {index + 1}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">{ranking.nickname}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className={cn(
            "px-1.5 py-0.5 rounded text-xs font-bold",
            ranking.rankGrade === 'S' && "bg-yellow-500/20 text-yellow-400",
            ranking.rankGrade === 'A' && "bg-green-500/20 text-green-400",
            ranking.rankGrade === 'B' && "bg-blue-500/20 text-blue-400",
            ranking.rankGrade === 'C' && "bg-gray-500/20 text-gray-400",
          )}>
            {ranking.rankGrade}
          </span>
          <span>{ranking.score}점</span>
          <span>{formatTime(ranking.clearTime)}</span>
        </div>
      </div>
    </div>
  )
}

// 리뷰 아이템
function ReviewItem({ review }) {
  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    try {
      return new Date(dateStr).toLocaleDateString('ko-KR')
    } catch {
      return ''
    }
  }

  const getDifficultyLabel = (diff) => {
    if (diff <= 2) return '쉬움'
    if (diff <= 4) return '보통'
    return '어려움'
  }

  return (
    <div className="p-4 bg-card/40 rounded-lg border border-border/50">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">{review.nickname}</span>
          <div className="flex items-center gap-0.5">
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
        <span className="text-xs text-muted-foreground">{formatDate(review.createdAt)}</span>
      </div>

      <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
        <span>체감 난이도: {getDifficultyLabel(review.difficulty)}</span>
      </div>

      {review.isSpoiler ? (
        <div className="flex items-center gap-2 text-yellow-500 text-sm">
          <AlertTriangle className="w-4 h-4" />
          <span>스포일러가 포함된 리뷰입니다</span>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground line-clamp-3">
          {review.content}
        </p>
      )}
    </div>
  )
}

export default function ScenarioDetailCard({ scenario, onPlay, playStatus, isPlaying }) {
  const { reviews, loading: reviewsLoading, page, totalPages, hasNext, hasPrev, nextPage, prevPage } = useReviews(scenario?.id, 2)

  if (!scenario) return null

  const difficulty = scenario.difficulty || 'medium'
  const playCount = scenario.playCount || 0
  const avgRating = scenario.avgRating || 0
  const suspects = scenario.suspects || []
  const rankings = scenario.rankings || []

  // 플레이 상태에 따른 버튼 설정
  const getPlayButtonConfig = () => {
    if (isPlaying) {
      return {
        label: '이어하기',
        icon: <Play className="w-5 h-5 mr-2" />,
        variant: 'neon',
      }
    }
    if (playStatus === 'COMPLETED') {
      return {
        label: '재플레이',
        icon: <RotateCcw className="w-5 h-5 mr-2" />,
        variant: 'outline',
        badge: { label: '해결', color: 'bg-green-500/20 text-green-400 border-green-500/50' },
      }
    }
    if (playStatus === 'FAILED') {
      return {
        label: '재도전',
        icon: <RotateCcw className="w-5 h-5 mr-2" />,
        variant: 'outline',
        badge: { label: '미제', color: 'bg-red-500/20 text-red-400 border-red-500/50' },
      }
    }
    return {
      label: '플레이 시작',
      icon: <Play className="w-5 h-5 mr-2" />,
      variant: 'neon',
    }
  }

  const buttonConfig = getPlayButtonConfig()

  return (
    <div className="relative pb-24">
      {/* 메인 콘텐츠 그리드 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 왼쪽: 메인 콘텐츠 (2/3) */}
        <div className="lg:col-span-2 space-y-8">
          {/* 타이틀 섹션 */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <h1 className="text-3xl font-bold gold-glow">{scenario.title}</h1>
              <DifficultyBadge difficulty={difficulty} />
            </div>

            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{playCount.toLocaleString()}회 플레이</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-primary text-primary" />
                <span>{avgRating.toFixed(1)}</span>
              </div>
              {scenario.genre && (
                <span className="px-2 py-0.5 bg-primary/20 text-primary rounded text-xs">
                  {scenario.genre}
                </span>
              )}
            </div>
          </div>

          {/* 시놉시스 */}
          <div>
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
              <span className="text-primary">[</span>
              시놉시스
              <span className="text-primary">]</span>
            </h2>
            <div className="bg-card/40 rounded-lg p-4 border border-border/50">
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                {scenario.synopsisDetail || scenario.synopsis}
              </p>
            </div>
          </div>

          {/* 용의자 목록 */}
          {suspects.length > 0 && (
            <div>
              <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                <span className="text-primary">[</span>
                용의자
                <span className="text-primary">]</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {suspects.map(suspect => (
                  <SuspectCard key={suspect.id} suspect={suspect} />
                ))}
              </div>
            </div>
          )}

          {/* 리뷰 목록 */}
          <div>
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
              <span className="text-primary">[</span>
              플레이어 리뷰
              <span className="text-primary">]</span>
            </h2>

            {reviewsLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                리뷰를 불러오는 중...
              </div>
            ) : reviews.length > 0 ? (
              <div className="space-y-3">
                {reviews.map(review => (
                  <ReviewItem key={review.reviewId} review={review} />
                ))}

                {/* 페이지네이션 */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-4 pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={prevPage}
                      disabled={!hasPrev}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {page + 1} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={nextPage}
                      disabled={!hasNext}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground bg-card/40 rounded-lg border border-border/50">
                아직 작성된 리뷰가 없습니다.
              </div>
            )}
          </div>
        </div>

        {/* 오른쪽: 썸네일 + 랭킹 (1/3) */}
        <div className="space-y-6">
          {/* 썸네일 */}
          <div className="rounded-lg overflow-hidden border border-border shadow-lg">
            <img
              src={scenario.thumbnail}
              alt={scenario.title}
              className="w-full aspect-[3/4] object-cover"
              onError={(e) => {
                e.target.src = '/images/placeholder.png'
              }}
            />
          </div>

          {/* 랭킹 Top 3 */}
          <div className="bg-card/50 rounded-lg border border-border p-4">
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              랭킹 TOP 3
            </h3>

            {rankings.length > 0 ? (
              <div className="space-y-2">
                {rankings.slice(0, 3).map((ranking, idx) => (
                  <RankingItem key={ranking.userId} ranking={ranking} index={idx} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                아직 클리어한 플레이어가 없습니다.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 플레이 버튼 (하단 중앙 고정) */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
        <div className="flex flex-col items-center gap-2">
          {/* 상태 배지 */}
          {buttonConfig.badge && (
            <div className={cn(
              "px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5",
              buttonConfig.badge.color
            )}>
              {playStatus === 'COMPLETED' ? (
                <CheckCircle className="w-3.5 h-3.5" />
              ) : (
                <XCircle className="w-3.5 h-3.5" />
              )}
              {buttonConfig.badge.label}
            </div>
          )}
          <Button
            variant={buttonConfig.variant}
            size="lg"
            className={cn(
              "shadow-lg px-8",
              buttonConfig.variant === 'neon' && "shadow-primary/25"
            )}
            onClick={onPlay}
          >
            {buttonConfig.icon}
            {buttonConfig.label}
          </Button>
        </div>
      </div>
    </div>
  )
}
