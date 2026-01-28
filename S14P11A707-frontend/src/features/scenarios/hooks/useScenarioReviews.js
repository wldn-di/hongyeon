import { useState, useEffect } from 'react'
import { fetchReviews } from '../api/reviewsApi'
import { mapReviewListResponse } from '../api/reviewMappers'
import { toast } from 'sonner'

/**
 * 시나리오 리뷰 목록 조회 Hook
 * @param {number} scenarioId - 시나리오 ID
 * @param {Object} options
 * @param {number} options.page - 페이지 번호 (default: 0)
 * @param {number} options.size - 페이지 크기 (default: 10)
 * @returns {Object} { reviews, totalPages, totalElements, currentPage, loading, error, loadMore, refetch }
 */
export function useScenarioReviews(scenarioId, options = {}) {
  const { page = 0, size = 10 } = options

  const [data, setData] = useState({
    reviews: [],
    totalPages: 0,
    totalElements: 0,
    currentPage: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = async (pageNum = page) => {
    if (!scenarioId) {
      setData({ reviews: [], totalPages: 0, totalElements: 0, currentPage: 0 })
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const response = await fetchReviews(Number(scenarioId), pageNum, size)
      const mapped = mapReviewListResponse(response)
      setData({
        reviews: mapped.content,
        totalPages: mapped.totalPages,
        totalElements: mapped.totalElements,
        currentPage: mapped.currentPage,
      })
    } catch (err) {
      setError(err)
      toast.error('리뷰 목록을 불러오는데 실패했습니다.')
      console.error('useScenarioReviews error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetch()
  }, [scenarioId, page, size])

  const loadMore = async () => {
    if (data.currentPage + 1 >= data.totalPages) return
    await fetch(data.currentPage + 1)
  }

  return {
    reviews: data.reviews,
    totalPages: data.totalPages,
    totalElements: data.totalElements,
    currentPage: data.currentPage,
    loading,
    error,
    loadMore,
    refetch: () => fetch(page),
  }
}

export default useScenarioReviews
