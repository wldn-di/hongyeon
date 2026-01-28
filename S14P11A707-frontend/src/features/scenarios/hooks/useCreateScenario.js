import { useState, useCallback, useRef } from 'react'
import { createScenario as createScenarioApi } from '../api/scenariosApi'
import { mapScenarioCreateResponse, mapScenarioStatusResponse } from '../api/scenarioMappers'
import { toast } from 'sonner'

/**
 * 시나리오 생성 Hook
 * @returns {Object} { createScenario, isGenerating, progress, error }
 */
export function useCreateScenario() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState('')
  const [error, setError] = useState(null)
  const pollTimerRef = useRef(null)
  const abortControllerRef = useRef(null)

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current)
      pollTimerRef.current = null
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
  }, [])

  const pollScenarioStatus = useCallback(async (scenarioId) => {
    const maxPolls = 60 // 최대 60회 (1분)
    let polls = 0

    const poll = async () => {
      try {
        // AbortController로 이전 요청 취소 가능하게 설정
        if (abortControllerRef.current) {
          abortControllerRef.current.abort()
        }
        abortControllerRef.current = new AbortController()

        const response = await fetch(`/api/scenarios/${scenarioId}/status`, {
          signal: abortControllerRef.current.signal,
        })
        if (!response.ok) {
          throw new Error('상태 확인 실패')
        }

        const data = await response.json()
        const status = mapScenarioStatusResponse(data)

        if (!status) {
          throw new Error('상태 확인 실패')
        }

        // 진행률 업데이트
        setProgress(status.progress)
        setMessage(status.message || '생성 중...')

        // 완료 또는 실패
        if (status.status === 'COMPLETED') {
          setIsGenerating(false)
          setProgress(100)
          setMessage('시나리오 생성 완료!')
          toast.success('시나리오가 생성되었습니다.')
          stopPolling()
          return { success: true, scenarioId }
        }

        if (status.status === 'FAILED') {
          setIsGenerating(false)
          setError(status.message || '시나리오 생성에 실패했습니다.')
          toast.error('시나리오 생성에 실패했습니다.')
          stopPolling()
          return { success: false, scenarioId, error: status.message }
        }

        // 계속 폴링
        polls++
        if (polls >= maxPolls) {
          setIsGenerating(false)
          setError('생성 시간이 초과되었습니다.')
          toast.error('생성 시간이 초과되었습니다.')
          stopPolling()
          return { success: false, scenarioId, error: 'timeout' }
        }

        // 2초 후 다시 폴링
        pollTimerRef.current = setTimeout(poll, 2000)

      } catch (err) {
        if (err.name === 'AbortError') {
          return // 요청이 취소된 경우 무시
        }
        setIsGenerating(false)
        setError(err.message || '상태 확인 중 오류가 발생했습니다.')
        toast.error('상태 확인 중 오류가 발생했습니다.')
        stopPolling()
        return { success: false, scenarioId, error: err.message }
      }
    }

    return poll()
  }, [stopPolling])

  const createScenario = useCallback(async (formData) => {
    // 이전 진행 중인 요청 취소
    stopPolling()
    setIsGenerating(true)
    setProgress(0)
    setMessage('시나리오 생성을 시작합니다...')
    setError(null)

    try {
      // 생성 API 호출
      const response = await createScenarioApi({
        title: formData.title,
        genre: formData.genre,
        suspectCount: formData.suspectCount,
        userSynopsis: formData.synopsis,
      })

      const result = mapScenarioCreateResponse(response)

      if (!result) {
        throw new Error('생성 요청 실패')
      }

      // 즉시 실패인 경우
      if (result.status === 'FAILED') {
        setIsGenerating(false)
        setError(result.errorMessage || '생성 요청이 실패했습니다.')
        toast.error(result.errorMessage || '생성 요청이 실패했습니다.')
        return { success: false, error: result.errorMessage }
      }

      // scenarioId를 받으면 상태 폴링 시작
      return await pollScenarioStatus(result.scenarioId)

    } catch (err) {
      setIsGenerating(false)
      setError(err.message || '시나리오 생성에 실패했습니다.')
      toast.error(err.message || '시나리오 생성에 실패했습니다.')
      return { success: false, error: err.message }
    }
  }, [stopPolling, pollScenarioStatus])

  // 컴포넌트 언마운트 시 정리
  useState(() => {
    return () => {
      stopPolling()
    }
  })

  return {
    createScenario,
    isGenerating,
    progress,
    message,
    error,
  }
}
