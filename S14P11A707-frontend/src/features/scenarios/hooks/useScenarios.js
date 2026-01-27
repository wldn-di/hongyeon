import { useState, useEffect } from 'react'
import { fetchScenarios, searchScenarios } from '../api/scenariosApi'
import { mapScenarioListResponseFull } from '../api/scenarioMappers'
import { toast } from 'sonner'

/**
 * 시나리오 목록 조회 Hook
 * @returns {Object} { scenarios, loading, error, refetch }
 */
export function useScenarios() {
  const [data, setData] = useState({
    scenarios: [],
    totalPages: 0,
    totalElements: 0,
    currentPage: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetchScenarios()
      const mapped = mapScenarioListResponseFull(response)
      setData({
        scenarios: mapped.content,
        totalPages: mapped.totalPages,
        totalElements: mapped.totalElements,
        currentPage: mapped.currentPage,
      })
    } catch (err) {
      setError(err)
      toast.error('시나리오 목록을 불러오는데 실패했습니다.')
      console.error('useScenarios error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetch()
  }, [])

  return {
    scenarios: data.scenarios,
    totalPages: data.totalPages,
    totalElements: data.totalElements,
    currentPage: data.currentPage,
    loading,
    error,
    refetch: fetch,
  }
}

/**
 * 시나리오 검색 Hook
 * @param {string} keyword - 검색 키워드
 * @returns {Object} { scenarios, loading, error, search }
 */
export function useScenarioSearch() {
  const [data, setData] = useState({
    scenarios: [],
    totalPages: 0,
    totalElements: 0,
    currentPage: 0,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const search = async (keyword) => {
    if (!keyword || keyword.trim() === '') {
      setData({ scenarios: [], totalPages: 0, totalElements: 0, currentPage: 0 })
      return
    }

    try {
      setLoading(true)
      setError(null)
      const response = await searchScenarios(keyword.trim())
      const mapped = mapScenarioListResponseFull(response)
      setData({
        scenarios: mapped.content,
        totalPages: mapped.totalPages,
        totalElements: mapped.totalElements,
        currentPage: mapped.currentPage,
      })
    } catch (err) {
      setError(err)
      toast.error('시나리오 검색에 실패했습니다.')
      console.error('useScenarioSearch error:', err)
    } finally {
      setLoading(false)
    }
  }

  return {
    scenarios: data.scenarios,
    loading,
    error,
    search,
  }
}

export default useScenarios
