import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Trophy, Medal, Award, Search, User, Clock, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { useRanking } from '@/features/ranking/hooks/useRanking'

export default function Ranking() {
  // ========================================
  // AuthContext 연동
  // ========================================
  const { state } = useAuth()
  const currentUser = state.user

  // 사용자 정보 추출
  const currentUserId = currentUser?.userId ?? currentUser?.user_id ?? null

  const currentUserIdNumber =
    currentUserId === null || currentUserId === undefined
    ? null
    : Number.isFinite(Number(currentUserId))
      ? Number(currentUserId)
      : null

  const currentUsername = currentUser?.nickname || currentUser?.email || null

  // ========================================
  // 랭킹 데이터 훅
  // ========================================
  const { rankingData, myRanking, isLoading, error, refetch } = useRanking()

  // ========================================
  // 검색 상태 관리
  // ========================================
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResult, setSearchResult] = useState(null)

  // ========================================
  // 이벤트 핸들러
  // ========================================

  /**
   * 사용자 이름으로 검색
   */
  const handleSearch = (e) => {
    e.preventDefault()

    const trimmedQuery = searchQuery.trim()

    if (!trimmedQuery) {
      setSearchResult(null)
      return
    }

    if (trimmedQuery.length < 2) {
      setSearchResult({
        success: false,
        message: "검색어는 최소 2자 이상 입력해주세요."
      })
      return
    }

    const candidates = [...rankingData]
    if (myRanking && !candidates.some(entry => entry.userId === myRanking.userId)) {
      candidates.push(myRanking)
    }

    const found = candidates.find(user =>
      user.username.toLowerCase().includes(trimmedQuery.toLowerCase())
    )

    if (found) {
      setSearchResult({
        success: true,
        data: found
      })
    } else {
      setSearchResult({
        success: false,
        message: "해당 사용자를 찾을 수 없습니다."
      })
    }
  }

  const handleClearSearch = () => {
    setSearchQuery('')
    setSearchResult(null)
  }

  const handleRefresh = () => {
    refetch()
  }

  // ========================================
  // 로그인/로그아웃 전환 처리
  // ========================================
  useEffect(() => {
    if (!currentUserId) {
      setSearchResult(null)
    } else {
      refetch()
    }
  }, [currentUserId])

  // ========================================
  // UI 헬퍼 함수
  // ========================================

  const getRankIcon = (index) => {
    if (index === 0) return <Trophy className="w-5 h-5 text-yellow-500" />
    if (index === 1) return <Medal className="w-5 h-5 text-gray-400" />
    if (index === 2) return <Award className="w-5 h-5 text-amber-600" />
    return null
  }

  const getRankStyle = (index) => {
    return index < 3 ? 'font-bold text-primary' : ''
  }

  // ========================================
  // 렌더링
  // ========================================

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 py-12">
        <div className="container max-w-4xl">
          {/* 헤더 */}
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold gold-glow mb-2">명탐정 랭킹</h1>
            <p className="text-muted-foreground">최고의 탐정들을 확인하세요</p>

            {/* 로그인 상태 표시 */}
            {currentUser && (
              <div className="mt-2 inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-1">
                <span className="text-xs text-primary">
                  {currentUsername}
                </span>
              </div>
            )}
          </div>

          {/* 에러 메시지 */}
          {error && (
            <Card className="bg-red-500/10 border-red-500/30 p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-red-400 text-lg">⚠️</span>
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
                <Button variant="outline" size="sm" onClick={handleRefresh}>
                  <span className="mr-2">🔄</span>
                  다시 시도
                </Button>
              </div>
            </Card>
          )}

          {/* 검색 기능 */}
          <Card className="bg-card/50 border-border p-4 mb-6">
            <form onSubmit={handleSearch} className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="사용자 이름으로 검색 (최소 2자)..."
                  className="w-full bg-muted border border-border rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  disabled={isLoading}
                  maxLength={50}
                />
              </div>
              <Button
                type="submit"
                variant="neon"
                disabled={isLoading || !searchQuery.trim() || searchQuery.trim().length < 2}
              >
                {isLoading ? '검색 중...' : '검색'}
              </Button>
              {searchQuery && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClearSearch}
                  disabled={isLoading}
                >
                  초기화
                </Button>
              )}
            </form>

            {/* 검색 결과 */}
            {searchResult && (
              <div className="mt-4 pt-4 border-t border-border">
                {searchResult.success ? (
                  <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <User className="w-5 h-5 text-primary" />
                      <h3 className="font-bold text-lg">{searchResult.data.username}</h3>
                      {searchResult.data.rank && (
                        <span className="text-sm bg-primary/20 text-primary px-2 py-1 rounded-full">
                          {searchResult.data.rank}위
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-yellow-500" />
                        <div>
                          <p className="text-muted-foreground text-xs">총점</p>
                          <p className="font-bold text-primary">
                            {searchResult.data.totalScore.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <div>
                          <p className="text-muted-foreground text-xs">해결</p>
                          <p className="font-bold">{searchResult.data.solvedCases}건</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-500" />
                        <div>
                          <p className="text-muted-foreground text-xs">평균 시간</p>
                          <p className="font-bold">{searchResult.data.avgClearTime}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-center">
                    <p className="text-red-400 text-sm">{searchResult.message}</p>
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Top 10 랭킹 테이블 */}
          <Card className="bg-card/50 border-border overflow-hidden mb-6">
            <div className="p-4 bg-muted/50 border-b border-border flex items-center justify-between">
              <h2 className="font-bold flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" />
                Top 10 랭킹
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading}
                className={cn(isLoading && "opacity-50")}
              >
                <span className={cn("text-lg", isLoading && "animate-spin inline-block")}>
                  🔄
                </span>
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-4 font-semibold">순위</th>
                    <th className="text-left p-4 font-semibold">이름</th>
                    <th className="text-right p-4 font-semibold">점수</th>
                    <th className="text-right p-4 font-semibold">해결</th>
                    <th className="text-right p-4 font-semibold">평균 시간</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-muted-foreground">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                          <span>로딩 중...</span>
                        </div>
                      </td>
                    </tr>
                  ) : rankingData.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-muted-foreground">
                        랭킹 데이터가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    rankingData.slice(0, 10).map((user, index) => (
                      <tr
                        key={user.userId}
                        className={cn(
                          "border-t border-border hover:bg-muted/30 transition-colors",
                          currentUserIdNumber !== null &&
                            user.userId === currentUserIdNumber &&
                            "bg-primary/10"
                        )}
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            {getRankIcon(index)}
                            <span className={getRankStyle(index)}>
                              {user.rank}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{user.username}</span>
                            {currentUserIdNumber !== null &&
                              user.userId === currentUserIdNumber && (
                              <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                                나
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-right font-mono text-primary">
                          {user.totalScore.toLocaleString()}
                        </td>
                        <td className="p-4 text-right">{user.solvedCases}건</td>
                        <td className="p-4 text-right text-muted-foreground">
                          {user.avgClearTime}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* 내 랭킹 (10위 밖일 때만 표시) */}
          {myRanking && myRanking.rank && myRanking.rank > 10 && (
            <Card className="bg-card/50 border-border overflow-hidden">
              <div className="p-4 bg-muted/50 border-b border-border">
                <h2 className="font-bold flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  내 랭킹
                </h2>
              </div>

              {/* ... (생략 표시) */}
              <div className="p-4 text-center border-b border-border">
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full" />
                  <div className="w-2 h-2 bg-muted-foreground rounded-full" />
                  <div className="w-2 h-2 bg-muted-foreground rounded-full" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {myRanking.rank - 10}개 순위 생략
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <tbody>
                    <tr className="border-t border-primary/50 bg-primary/10">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <User className="w-5 h-5 text-primary" />
                          <span className="font-bold text-primary">
                            {myRanking.rank}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{myRanking.username}</span>
                          <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                            나
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-right font-mono text-primary font-bold">
                        {myRanking.totalScore.toLocaleString()}
                      </td>
                      <td className="p-4 text-right font-bold">
                        {myRanking.solvedCases}건
                      </td>
                      <td className="p-4 text-right text-muted-foreground">
                        {myRanking.avgClearTime}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* 상세 통계 */}
              {myRanking.perfectClears > 0 && (
                <div className="p-4 border-t border-border bg-muted/20">
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-yellow-500" />
                      <span className="text-muted-foreground">완벽한 클리어:</span>
                      <span className="font-bold text-yellow-500">
                        {myRanking.perfectClears}회
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* 안내 메시지 */}
          {!currentUserId && (
            <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg text-center">
              <p className="text-sm text-blue-400">
                💡 Google 로그인하고 사건을 해결하여 랭킹에 도전하세요!
              </p>
            </div>
          )}

          {currentUserId && !myRanking && (
            <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg text-center">
              <p className="text-sm text-blue-400">
                💡 사건을 해결하고 랭킹에 도전하세요!
              </p>
            </div>
          )}
        </div>
      </main>

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
