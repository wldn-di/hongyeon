import { useState, useEffect, useCallback } from 'react'
import { fetchGlobalRankings, fetchMyRankings } from '../api/rankingApi'
import { normalizeRankingResponse, normalizeRankingEntry } from '../api/rankingMappers'
import { getErrorMessage } from '@/api/errors/errorHandler'
import { useAuth } from '@/contexts/AuthContext'

/**
 * 랭킹 타입 옵션
 */
export const RANKING_TYPES = {
  score: { value: 'score', label: '총 점수', unit: '점' },
  clears: { value: 'clears', label: '클리어 수', unit: '회' },
  time: { value: 'time', label: '플레이 시간', unit: '' },
}

/**
 * 랭킹 데이터를 관리하는 커스텀 훅
 * @param {string} initialType - 초기 랭킹 타입 ('score' | 'clears' | 'time')
 * @returns {UseRankingReturn}
 */
export const useRanking = (initialType = 'score') => {
  const { state } = useAuth()
  const isLoggedIn = !!state.user

  const [rankingType, setRankingType] = useState(initialType)
  const [rankingData, setRankingData] = useState([])
  const [myRanking, setMyRanking] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  /**
   * 랭킹 데이터 가져오기
   * - 비로그인: 전체 랭킹(Top 10)만 조회
   * - 로그인: 전체 랭킹(Top 10) + 내 랭킹 조회
   */
  const fetchRankings = useCallback(async (type = rankingType) => {
    setIsLoading(true)
    setError(null)

    try {
      // 1. 전체 랭킹 (Top 10) 조회 - 모든 사용자
      const globalResponse = await fetchGlobalRankings(type)
      const { rankingData: data } = normalizeRankingResponse(globalResponse, type)
      setRankingData(data)

      // 2. 내 랭킹 조회 - 로그인한 사용자만
      if (isLoggedIn) {
        try {
          const myRankResponse = await fetchMyRankings(type)
          if (myRankResponse) {
            const normalizedMyRank = normalizeRankingEntry(myRankResponse, data.length, type)
            setMyRanking(normalizedMyRank)
          } else {
            setMyRanking(null)
          }
        } catch (myRankErr) {
          console.warn('내 랭킹 조회 실패 (플레이 기록이 없을 수 있음):', myRankErr)
          setMyRanking(null)
        }
      } else {
        setMyRanking(null)
      }
    } catch (err) {
      console.error('랭킹 데이터 로드 실패:', err)
      const errorMessage = getErrorMessage(err)
      setError(errorMessage)
      setRankingData([])
      setMyRanking(null)
    } finally {
      setIsLoading(false)
    }
  }, [rankingType, isLoggedIn])

  /**
   * 랭킹 타입 변경
   */
  const changeRankingType = useCallback((newType) => {
    if (RANKING_TYPES[newType]) {
      setRankingType(newType)
    }
  }, [])

  /**
   * 초기 로딩 및 타입 변경 시 refetch
   */
  useEffect(() => {
    fetchRankings(rankingType)
  }, [rankingType, isLoggedIn])

  return {
    rankingType,
    rankingData,
    myRanking,
    isLoading,
    error,
    refetch: () => fetchRankings(rankingType),
    changeRankingType,
  }
}

/**
 * @typedef {Object} UseRankingReturn
 * @property {string} rankingType - 현재 랭킹 타입
 * @property {Array} rankingData - 랭킹 데이터 배열
 * @property {Object|null} myRanking - 내 랭킹 정보
 * @property {boolean} isLoading - 로딩 상태
 * @property {string|null} error - 에러 메시지
 * @property {Function} refetch - 데이터 다시 가져오기 함수
 * @property {Function} changeRankingType - 랭킹 타입 변경 함수
 */

export default useRanking