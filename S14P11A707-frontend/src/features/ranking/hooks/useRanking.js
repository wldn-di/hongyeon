import { useState, useEffect } from 'react'
import { fetchGlobalRankings, fetchMyRankings } from '../api/rankingApi'
import { normalizeMyRankingResponse, normalizeRankingResponse } from '../api/rankingMappers'
import { getErrorMessage } from '@/api/errors/errorHandler'

/**
 * 랭킹 데이터를 관리하는 커스텀 훅
 * @returns {UseRankingReturn}
 */
export const useRanking = () => {
  const [rankingData, setRankingData] = useState([])
  const [myRanking, setMyRanking] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  /**
   * 랭킹 데이터 가져오기
   */
  const fetchRankings = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetchGlobalRankings()
      const { rankingData: data, myRanking: myRankFromGlobal } = normalizeRankingResponse(response)

      let myRank = myRankFromGlobal

      // 글로벌 응답에 내 랭킹이 없으면 /me로 보완 (401은 무시)
      if (!myRank) {
        try {
          const myResponse = await fetchMyRankings()
          myRank = normalizeMyRankingResponse(myResponse)
        } catch (e) {
          // 인증이 없거나(401) /me 엔드포인트 미구현(404) 등은 silent
          myRank = null
        }
      }

      setRankingData(data)
      setMyRanking(myRank)
    } catch (err) {
      console.error('랭킹 데이터 로드 실패:', err)
      const errorMessage = getErrorMessage(err)
      setError(errorMessage)
      setRankingData([])
      setMyRanking(null)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * 초기 로딩
   */
  useEffect(() => {
    fetchRankings()
  }, [])

  return {
    rankingData,
    myRanking,
    isLoading,
    error,
    refetch: fetchRankings,
  }
}

/**
 * @typedef {Object} UseRankingReturn
 * @property {Array} rankingData - 랭킹 데이터 배열
 * @property {Object|null} myRanking - 내 랭킹 정보
 * @property {boolean} isLoading - 로딩 상태
 * @property {string|null} error - 에러 메시지
 * @property {Function} refetch - 데이터 다시 가져오기 함수
 */

export default useRanking
