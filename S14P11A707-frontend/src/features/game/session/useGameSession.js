import { useCallback, useRef, useState } from 'react'

const defaultGetLogTime = (now = new Date()) => {
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')
  return `${hours}:${minutes}:${seconds}`
}

export function useGameSession({
  initialLogs = [],
  initialEvidence = [],
  getLogTime = defaultGetLogTime,
} = {}) {
  const eventTargetRef = useRef(null)
  if (!eventTargetRef.current) eventTargetRef.current = new EventTarget()

  const emit = useCallback((type, detail) => {
    eventTargetRef.current.dispatchEvent(new CustomEvent(type, { detail }))
  }, [])

  const subscribe = useCallback((type, handler) => {
    const listener = (event) => handler(event.detail, event)
    eventTargetRef.current.addEventListener(type, listener)
    return () => eventTargetRef.current.removeEventListener(type, listener)
  }, [])

  const [logs, setLogs] = useState(() => initialLogs)
  const logIdRef = useRef(
    initialLogs.reduce((maxId, log) => Math.max(maxId, Number(log?.id) || 0), 0) + 1
  )

  const addLog = useCallback(
    (type, message, meta) => {
      const id = logIdRef.current++
      const entry = {
        id,
        time: getLogTime(new Date()),
        type,
        message,
        meta,
      }
      setLogs((prev) => [...prev, entry])
      emit('log.added', { entry })
      return entry
    },
    [emit, getLogTime]
  )

  const [discoveredEvidence, setDiscoveredEvidence] = useState(() => initialEvidence)
  const evidenceIdsRef = useRef(null)
  if (!evidenceIdsRef.current) {
    evidenceIdsRef.current = new Set(
      initialEvidence.map((e) => e?.id).filter((id) => id != null)
    )
  }

  const resetSession = useCallback(
    ({ logs: nextLogs = [], evidence: nextEvidence = [] } = {}) => {
      const normalizedLogs = Array.isArray(nextLogs) ? nextLogs : []
      const normalizedEvidence = Array.isArray(nextEvidence) ? nextEvidence : []

      logIdRef.current =
        normalizedLogs.reduce((maxId, log) => Math.max(maxId, Number(log?.id) || 0), 0) + 1

      evidenceIdsRef.current = new Set(
        normalizedEvidence.map((e) => e?.id).filter((id) => id != null)
      )

      setLogs(normalizedLogs)
      setDiscoveredEvidence(normalizedEvidence)
      emit('session.reset', { logs: normalizedLogs, evidence: normalizedEvidence })
    },
    [emit]
  )

  const collectEvidence = useCallback(
    (evidence, { log = true } = {}) => {
      if (!evidence) return null
      if (evidence.id == null) return null

      const exists = evidenceIdsRef.current.has(evidence.id)
      if (exists) return evidence

      evidenceIdsRef.current.add(evidence.id)
      setDiscoveredEvidence((prev) => [...prev, evidence])
      emit('evidence.collected', { evidence })
      if (log) addLog('evidence', `[${evidence.name}] 발견!`, { evidenceId: evidence.id })

      return evidence
    },
    [addLog, emit]
  )

  return {
    events: { emit, subscribe },
    logs,
    addLog,
    discoveredEvidence,
    collectEvidence,
    resetSession,
  }
}
