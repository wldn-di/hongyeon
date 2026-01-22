import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { rankings } from '@/data/dummyData'
import { Trophy, Medal, Award, Search, User, Clock, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'  // ← AuthContext 사용

// API 설정
const getApiBaseUrl = () => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env.VITE_API_URL || 'http://localhost:3000'
  }
  if (typeof process !== 'undefined' && process.env) {
    return process.env.REACT_APP_API_URL || 'http://localhost:3000'
  }
  return 'http://localhost:3000'
}

const API_BASE_URL = getApiBaseUrl()

const ENDPOINTS = {
  rankings: `${API_BASE_URL}/api/rankings`,
  myRanking: `${API_BASE_URL}/api/rankings/me`,
  search: `${API_BASE_URL}/api/rankings/search`,
}

// ⚙️ 개발 모드 설정
const USE_DUMMY_DATA = false

export default function Ranking() {

  // ========================================
  // AuthContext 연동 ✅
  // ========================================
  const { state } = useAuth()
  const currentUser = state.user
  const isLoading = state.loading

  // 사용자 정보 추출
  const currentUserId = currentUser?.user_id || null
  const currentUsername = currentUser?.nickname || currentUser?.email || null
  const currentUserPicture = currentUser?.picture || null

  // ========================================
  // 상태 관리
  // ========================================
  const [rankingData, setRankingData] = useState([])
  const [myRanking, setMyRanking] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResult, setSearchResult] = useState(null)
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [error, setError] = useState(null)

  // ========================================
  // 유틸리티 함수
  // ========================================

  const convertTimeToSeconds = (timeStr) => {
    if (!timeStr || typeof timeStr !== 'string') return 0
    const parts = timeStr.split(':')
    if (parts.length !== 2) return 0
    const minutes = parseInt(parts[0], 10) || 0
    const seconds = parseInt(parts[1], 10) || 0
    return minutes * 60 + seconds
  }

  const getErrorMessage = (error) => {
    if (error.response?.data?.message) {
      return error.response.data.message
    }
    if (error.message) {
      return error.message
    }
    return '알 수 없는 오류가 발생했습니다.'
  }

  // ========================================
  // API 연동 함수들
  // ========================================

  /**
   * 전체 랭킹 데이터 가져오기
   */
  const fetchRankings = async () => {
    setIsLoadingData(true)
    setError(null)

    try {
      let result

      if (USE_DUMMY_DATA) {
        // ✅ 더미 데이터 사용
        console.log('[DEV] 더미 데이터 사용 중')
        await new Promise(resolve => setTimeout(resolve, 500))

        result = {
          success: true,
          data: rankings.map((user, index) => ({
            userId: `user${index + 1}`,
            username: user.name,
            rank: user.rank,
            totalScore: user.score,
            solvedCases: user.solved,
            avgClearTime: user.avgTime,
            avgClearTimeSeconds: convertTimeToSeconds(user.avgTime),
            perfectClears: Math.floor(Math.random() * 5),
            lastPlayedAt: new Date().toISOString()
          })),
          pagination: {
            total: rankings.length,
            limit: 10,
            offset: 0
          }
        }
      } else {
        // 🔧 실제 API 호출
        const response = await fetch(`${ENDPOINTS.rankings}?limit=10`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',  // ← 쿠키 포함
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        result = await response.json()
      }

      // 응답 검증
      if (!result || typeof result !== 'object') {
        throw new Error('잘못된 응답 형식: 객체가 아닙니다')
      }

      if (!result.success) {
        throw new Error(result.message || '랭킹 데이터 로드 실패')
      }

      if (!Array.isArray(result.data)) {
        throw new Error('잘못된 응답 형식: data가 배열이 아닙니다')
      }

      // 데이터 정규화
      const validatedData = result.data.map((item, index) => ({
        userId: item.userId || `unknown-${index}`,
        username: item.username || '알 수 없음',
        rank: typeof item.rank === 'number' ? item.rank : index + 1,
        totalScore: typeof item.totalScore === 'number' ? item.totalScore : 0,
        solvedCases: typeof item.solvedCases === 'number' ? item.solvedCases : 0,
        avgClearTime: item.avgClearTime || '-',
        avgClearTimeSeconds: typeof item.avgClearTimeSeconds === 'number' 
          ? item.avgClearTimeSeconds 
          : convertTimeToSeconds(item.avgClearTime || '0:0'),
        perfectClears: typeof item.perfectClears === 'number' ? item.perfectClears : 0,
        lastPlayedAt: item.lastPlayedAt || null
      }))

      setRankingData(validatedData)
      setError(null)

    } catch (err) {
      console.error('랭킹 데이터 로드 실패:', err)
      setError(getErrorMessage(err))
      setRankingData([])
    } finally {
      setIsLoadingData(false)
    }
  }

  /**
   * 내 랭킹 정보 가져오기
   */
  const fetchMyRanking = async () => {
    // 로그인 안 했으면 스킵
    if (!currentUserId) {
      setMyRanking(null)
      return
    }

    try {
      let result

      if (USE_DUMMY_DATA) {
        // ✅ 더미 데이터 사용
        console.log('[DEV] 내 랭킹 더미 데이터 사용 중')
        await new Promise(resolve => setTimeout(resolve, 300))

        result = {
          success: true,
          data: {
            userId: currentUserId,
            username: currentUsername || "나",
            rank: 42,
            totalScore: 7200,
            solvedCases: 8,
            avgClearTime: "18:45",
            avgClearTimeSeconds: 1125,
            perfectClears: 2
          }
        }
      } else {
        // 🔧 실제 API 호출 (쿠키 기반 인증)
        const response = await fetch(ENDPOINTS.myRanking, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',  // ← 쿠키 포함
        })

        if (response.status === 401) {
          console.warn('인증 실패: 로그인이 필요합니다.')
          setMyRanking(null)
          throw new Error('로그인이 필요합니다.')
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        result = await response.json()
      }

      if (!result || !result.success || !result.data) {
        throw new Error('내 랭킹 정보를 불러올 수 없습니다')
      }

      const validatedData = {
        userId: result.data.userId || currentUserId,
        username: result.data.username || currentUsername || '나',
        rank: typeof result.data.rank === 'number' ? result.data.rank : null,
        totalScore: typeof result.data.totalScore === 'number' ? result.data.totalScore : 0,
        solvedCases: typeof result.data.solvedCases === 'number' ? result.data.solvedCases : 0,
        avgClearTime: result.data.avgClearTime || '-',
        avgClearTimeSeconds: typeof result.data.avgClearTimeSeconds === 'number' 
          ? result.data.avgClearTimeSeconds 
          : convertTimeToSeconds(result.data.avgClearTime || '0:0'),
        perfectClears: typeof result.data.perfectClears === 'number' ? result.data.perfectClears : 0
      }

      setMyRanking(validatedData)

    } catch (err) {
      console.error('내 랭킹 정보 로드 실패:', err)
      setMyRanking(null)
      
      if (err.message.includes('로그인')) {
        setError(err.message)
      }
    }
  }

  /**
   * 사용자 이름으로 검색
   */
  const handleSearch = async (e) => {
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

    setIsLoadingData(true)

    try {
      let result

      if (USE_DUMMY_DATA) {
        // ✅ 더미 데이터에서 검색
        console.log('[DEV] 검색 더미 데이터 사용 중')
        await new Promise(resolve => setTimeout(resolve, 300))

        const found = rankingData.find(user =>
          user.username.toLowerCase().includes(trimmedQuery.toLowerCase())
        )

        if (found) {
          result = {
            success: true,
            data: found
          }
        } else {
          result = {
            success: false,
            message: "해당 사용자를 찾을 수 없습니다.",
            errorCode: "USER_NOT_FOUND"
          }
        }
      } else {
        // 🔧 실제 API 호출
        const response = await fetch(
          `${ENDPOINTS.search}?username=${encodeURIComponent(trimmedQuery)}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',  // ← 쿠키 포함
          }
        )

        result = await response.json()
      }

      if (!result || typeof result !== 'object') {
        throw new Error('잘못된 응답 형식')
      }

      if (result.success && result.data) {
        const validatedData = {
          userId: result.data.userId || 'unknown',
          username: result.data.username || trimmedQuery,
          rank: typeof result.data.rank === 'number' ? result.data.rank : null,
          totalScore: typeof result.data.totalScore === 'number' ? result.data.totalScore : 0,
          solvedCases: typeof result.data.solvedCases === 'number' ? result.data.solvedCases : 0,
          avgClearTime: result.data.avgClearTime || '-',
          avgClearTimeSeconds: typeof result.data.avgClearTimeSeconds === 'number' 
            ? result.data.avgClearTimeSeconds 
            : 0
        }

        setSearchResult({
          success: true,
          data: validatedData
        })
      } else {
        setSearchResult({
          success: false,
          message: result.message || "검색 결과가 없습니다."
        })
      }

    } catch (err) {
      console.error('검색 실패:', err)
      setSearchResult({
        success: false,
        message: getErrorMessage(err)
      })
    } finally {
      setIsLoadingData(false)
    }
  }

  const handleClearSearch = () => {
    setSearchQuery('')
    setSearchResult(null)
  }

  const handleRefresh = () => {
    fetchRankings()
    if (currentUserId) {
      fetchMyRanking()
    }
  }

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
  // 생명주기
  // ========================================

  useEffect(() => {
    fetchRankings()
  }, [])

  useEffect(() => {
    if (currentUserId && !isLoading) {
      fetchMyRanking()
    } else {
      setMyRanking(null)
    }
  }, [currentUserId, isLoading])

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
            
            {/* 개발 모드 표시 */}
            {USE_DUMMY_DATA && (
              <div className="mt-2 inline-block bg-yellow-500/10 border border-yellow-500/30 rounded px-3 py-1">
                <p className="text-xs text-yellow-500">
                  🔧 개발 모드: 더미 데이터 사용 중
                </p>
              </div>
            )}

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
                  disabled={isLoadingData}
                  maxLength={50}
                />
              </div>
              <Button
                type="submit"
                variant="neon"
                disabled={isLoadingData || !searchQuery.trim() || searchQuery.trim().length < 2}
              >
                {isLoadingData ? '검색 중...' : '검색'}
              </Button>
              {searchQuery && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClearSearch}
                  disabled={isLoadingData}
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
                disabled={isLoadingData}
                className={cn(isLoadingData && "opacity-50")}
              >
                <span className={cn("text-lg", isLoadingData && "animate-spin inline-block")}>
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
                  {isLoadingData ? (
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
                          user.userId === String(currentUserId) && "bg-primary/10"
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
                            {user.userId === String(currentUserId) && (
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
