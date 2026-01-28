import { useState, useEffect, useCallback } from 'react'
import { fetchReviews } from '../api/reviewsApi'
import { toast } from 'sonner'

/**
 * 시나리오 리뷰 목록 조회 Hook (페이징)
 * @param {number} scenarioId - 시나리오 ID
 * @param {number} pageSize - 페이지 크기 (default: 2)
 * @returns {Object} { reviews, loading, error, page, totalPages, hasNext, hasPrev, nextPage, prevPage, refetch }
 */
export function useReviews(scenarioId, pageSize = 2) {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)

  const fetch = useCallback(async (pageNum) => {
    if (!scenarioId) {
      setReviews([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const response = await fetchReviews(scenarioId, pageNum, pageSize)

      setReviews(response.content || [])
      setTotalPages(response.totalPages || 0)
      setTotalElements(response.totalElements || 0)
      setPage(response.currentPage || pageNum)
    } catch (err) {
      setError(err)
      toast.error('리뷰를 불러오는데 실패했습니다.')
      console.error('useReviews error:', err)
    } finally {
      setLoading(false)
    }
  }, [scenarioId, pageSize])

  useEffect(() => {
    fetch(0)
  }, [scenarioId])

  const nextPage = useCallback(() => {
    if (page < totalPages - 1) {
      fetch(page + 1)
    }
  }, [page, totalPages, fetch])

  const prevPage = useCallback(() => {
    if (page > 0) {
      fetch(page - 1)
    }
  }, [page, fetch])

  const goToPage = useCallback((pageNum) => {
    if (pageNum >= 0 && pageNum < totalPages) {
      fetch(pageNum)
    }
  }, [totalPages, fetch])

  return {
    reviews,
    loading,
    error,
    page,
    totalPages,
    totalElements,
    hasNext: page < totalPages - 1,
    hasPrev: page > 0,
    nextPage,
    prevPage,
    goToPage,
    refetch: () => fetch(page),
  }
}

export default useReviews