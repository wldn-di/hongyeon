import { useMemo } from 'react'
import { scenarios } from '@/data/dummyData'

export function useScenarioById(id) {
  return useMemo(() => {
    if (!id) return null
    return scenarios.find((s) => s.id === id) ?? null
  }, [id])
}

