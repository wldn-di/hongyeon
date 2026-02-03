import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Trophy, Medal, Award, Search, User, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { useRanking, RANKING_TYPES } from '@/features/ranking/hooks/useRanking'

export default function Ranking() {
  const { state } = useAuth()
  const currentUser = state.user
  const currentUserId = currentUser?.userId ?? currentUser?.user_id ?? null
  const currentUserIdNumber = currentUserId ? Number(currentUserId) : null
  const currentUsername = currentUser?.nickname || currentUser?.email || null

  const {
    rankingType,
    rankingData,
    myRanking,
    isLoading,
    error,
    refetch,
    changeRankingType
  } = useRanking()

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResult, setSearchResult] = useState(null)

  const handleSearch = (e) => {
    e.preventDefault()
    const trimmedQuery = searchQuery.trim()

    if (!trimmedQuery) {
      setSearchResult(null)
      return
    }

    if (trimmedQuery.length < 2) {
      setSearchResult({ success: false, message: '검색어는 최소 2자 이상 입력해주세요.' })
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
      setSearchResult({ success: true, data: found })
    } else {
      setSearchResult({ success: false, message: '해당 사용자를 찾을 수 없습니다.' })
    }
  }

  const handleClearSearch = () => {
    setSearchQuery('')
    setSearchResult(null)
  }

  // 로그아웃 시 검색 결과 초기화
  // (로그인/로그아웃 시 랭킹 데이터 refetch는 useRanking 훅에서 자동 처리)
  useEffect(() => {
    if (!currentUserId) {
      setSearchResult(null)
    }
  }, [currentUserId])

  const getRankIcon = (index) => {
    if (index === 0) return <Trophy className="w-5 h-5 text-yellow-500" />
    if (index === 1) return <Medal className="w-5 h-5 text-gray-400" />
    if (index === 2) return <Award className="w-5 h-5 text-amber-600" />
    return null
  }

  const getRankStyle = (index) => {
    return index < 3 ? 'font-bold text-primary' : ''
  }

  const getValueLabel = () => {
    return RANKING_TYPES[rankingType]?.label || '점수'
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 py-12">
        <div className="container max-w-4xl">
          {/* 헤더 */}
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold gold-glow mb-2">명탐정 랭킹</h1>
            <p className="text-muted-foreground">최고의 탐정들을 확인하세요</p>

            {currentUser && (
              <div className="mt-2 inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-1">
                <span className="text-xs text-primary">{currentUsername}</span>
              </div>
            )}
          </div>

          {/* 랭킹 타입 필터 탭 */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {Object.values(RANKING_TYPES).map((type) => (
              <button
                key={type.value}
                onClick={() => changeRankingType(type.value)}
                className={cn(
                  "px-6 py-2.5 text-sm font-medium transition-all duration-200",
                  "border-b-2",
                  rankingType === type.value
                    ? "text-primary border-primary"
                    : "text-muted-foreground border-transparent hover:text-foreground hover:bg-muted/30"
                )}
              >
                {type.label}
              </button>
            ))}
          </div>

          {/* 에러 메시지 */}
          {error && (
            <Card className="bg-red-500/10 border-red-500/30 p-4 mb-6">
              <div className="flex items-center justify-between">
                <p className="text-red-400 text-sm">{error}</p>
                <Button variant="outline" size="sm" onClick={refetch}>
                  다시 시도
                </Button>
              </div>
            </Card>
          )}

          {/* 검색 */}
          <Card className="bg-card/50 border-border p-4 mb-6">
            <form onSubmit={handleSearch} className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="사용자 이름으로 검색..."
                  className="w-full bg-muted border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  disabled={isLoading}
                />
              </div>
              <Button type="submit" variant="neon" disabled={isLoading || !searchQuery.trim()}>
                검색
              </Button>
              {searchQuery && (
                <Button type="button" variant="outline" onClick={handleClearSearch}>
                  초기화
                </Button>
              )}
            </form>

            {searchResult && (
              <div className="mt-4 pt-4 border-t border-border">
                {searchResult.success ? (
                  <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <User className="w-5 h-5 text-primary" />
                        <span className="font-bold">{searchResult.data.username}</span>
                        <span className="text-sm bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                          {searchResult.data.rank}위
                        </span>
                      </div>
                      <span className="font-mono text-primary font-bold">
                        {searchResult.data.formattedValue}
                      </span>
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
            <div className="p-4 bg-muted/30 border-b border-border flex items-center justify-between">
              <h2 className="font-bold flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" />
                Top 10 랭킹
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={refetch}
                disabled={isLoading}
              >
                <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/30">
                  <tr>
                    <th className="text-left p-4 font-semibold text-sm">순위</th>
                    <th className="text-left p-4 font-semibold text-sm">이름</th>
                    <th className="text-right p-4 font-semibold text-sm">{getValueLabel()}</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan="3" className="p-8 text-center text-muted-foreground">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                          <span>로딩 중...</span>
                        </div>
                      </td>
                    </tr>
                  ) : rankingData.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="p-8 text-center text-muted-foreground">
                        랭킹 데이터가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    rankingData.map((user, index) => (
                      <tr
                        key={user.userId}
                        className={cn(
                          "border-t border-border hover:bg-muted/20 transition-colors",
                          currentUserIdNumber && user.userId === currentUserIdNumber && "bg-primary/10"
                        )}
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            {getRankIcon(index)}
                            <span className={getRankStyle(index)}>{user.rank}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{user.username}</span>
                            {currentUserIdNumber && user.userId === currentUserIdNumber && (
                              <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                                나
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-right font-mono text-primary">
                          {user.formattedValue}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* 내 랭킹 (10위 밖일 때만) */}
          {myRanking && myRanking.rank > 10 && (
            <Card className="bg-card/50 border-border overflow-hidden">
              <div className="p-4 bg-muted/30 border-b border-border">
                <h2 className="font-bold flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  내 랭킹
                </h2>
              </div>

              <div className="p-4 text-center border-b border-border">
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full" />
                  <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full" />
                  <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">{myRanking.rank - 10}개 순위 생략</p>
              </div>

              <div className="p-4 bg-primary/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-primary text-lg">{myRanking.rank}위</span>
                    <span className="font-bold">{myRanking.username}</span>
                    <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">나</span>
                  </div>
                  <span className="font-mono text-primary font-bold">{myRanking.formattedValue}</span>
                </div>
              </div>
            </Card>
          )}

          {/* 안내 메시지 */}
          {!currentUserId && (
            <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg text-center">
              <p className="text-sm text-blue-400">
                로그인하고 사건을 해결해 랭킹에 도전하세요!
              </p>
            </div>
          )}

          {currentUserId && !myRanking && (
            <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg text-center">
              <p className="text-sm text-blue-400">
                사건을 해결하고 랭킹에 도전하세요!
              </p>
            </div>
          )}
        </div>
      </main>

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