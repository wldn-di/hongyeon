import React, { useEffect, useMemo, useState } from "react"
import { Button } from '@/components/ui/Button'
import { InvestigationBoard } from "@/features/game/components/InvestigationBoard"

// 최종 정답 제출: 추리보드(확정선) 기반 자동 추출
export default function SubmitAnswerModal({ isOpen, onClose, onSubmit, sessionId, scenarioId, victim = null }) {
  const [submitInitialItems, setSubmitInitialItems] = useState([])
  const [submitInitialConnections, setSubmitInitialConnections] = useState([])
  const [submitBoardState, setSubmitBoardState] = useState({ items: [], connections: [] })
  const [motive, setMotive] = useState('') // 범행동기 입력
  const [validationError, setValidationError] = useState(null) // 사전 검증 에러 메시지

  useEffect(() => {
    if (!isOpen) return

    // sessionId가 있으면 sessionId 기반, 없으면 scenarioId 기반 키 사용
    const storageKey = sessionId ? `board-${sessionId}` : `board-scenario-${scenarioId}`
    const itemsRaw = localStorage.getItem(`${storageKey}-items`)
    const connectionsRaw = localStorage.getItem(`${storageKey}-connections`)

    // 기존 키도 fallback으로 체크
    const legacyItemsRaw = localStorage.getItem(`board-items-${scenarioId}`)
    const legacyConnectionsRaw = localStorage.getItem(`board-connections-${scenarioId}`)

    const safeJsonParse = (value, fallback) => {
      if (!value) return fallback
      try {
        return JSON.parse(value)
      } catch {
        return fallback
      }
    }

    const normalizeBoardState = (itemsRawValue, connectionsRawValue) => {
      const itemsArray = Array.isArray(itemsRawValue) ? itemsRawValue : []
      const connectionsArray = Array.isArray(connectionsRawValue) ? connectionsRawValue : []

      const idMap = new Map()

      const normalizeItemId = (item, index) => {
        const type = item?.type
        const originalId = item?.id
        const originalIdStr = String(originalId ?? '')

        const parseNumeric = (value) => {
          const num = Number(value)
          return Number.isFinite(num) ? num : null
        }

        const parseFromPrefix = (prefix) => {
          if (!originalIdStr.startsWith(prefix)) return null
          return parseNumeric(originalIdStr.slice(prefix.length))
        }

        if (type === 'evidence') {
          const inferredId = item?.evidenceId ?? parseFromPrefix('evidence-') ?? parseNumeric(originalId)
          const nextId = originalIdStr.startsWith('evidence-')
            ? originalIdStr
            : inferredId != null
              ? `evidence-${inferredId}`
              : `evidence-${Date.now()}-${index}`
          return { id: nextId, patch: { evidenceId: item?.evidenceId ?? inferredId } }
        }

        if (type === 'suspect') {
          const inferredId = item?.suspectId ?? parseFromPrefix('suspect-') ?? parseNumeric(originalId)
          const nextId = originalIdStr.startsWith('suspect-')
            ? originalIdStr
            : inferredId != null
              ? `suspect-${inferredId}`
              : `suspect-${Date.now()}-${index}`
          return { id: nextId, patch: { suspectId: item?.suspectId ?? inferredId } }
        }

        if (type === 'location') {
          const inferredId = item?.locationId ?? parseFromPrefix('location-') ?? parseNumeric(originalId)
          const nextId = originalIdStr.startsWith('location-')
            ? originalIdStr
            : inferredId != null
              ? `location-${inferredId}`
              : `location-${Date.now()}-${index}`
          return { id: nextId, patch: { locationId: item?.locationId ?? inferredId } }
        }

        if (type === 'victim') {
          const inferredId = item?.victimId ?? parseFromPrefix('victim-') ?? parseNumeric(originalId)
          const nextId = originalIdStr.startsWith('victim-')
            ? originalIdStr
            : inferredId != null
              ? `victim-${inferredId}`
              : `victim-${Date.now()}-${index}`
          return { id: nextId, patch: { victimId: item?.victimId ?? inferredId } }
        }

        if (type === 'note') {
          const nextId = originalIdStr.startsWith('note-')
            ? originalIdStr
            : originalIdStr
              ? `note-${originalIdStr}`
              : `note-${Date.now()}-${index}`
          return { id: nextId, patch: null }
        }

        const nextId = originalIdStr || `item-${Date.now()}-${index}`
        return { id: nextId, patch: null }
      }

      const normalizedItems = itemsArray.map((item, index) => {
        const { id, patch } = normalizeItemId(item, index)
        const originalIdStr = item?.id == null ? '' : String(item.id)
        if (originalIdStr) idMap.set(originalIdStr, id)
        idMap.set(id, id)
        return patch ? { ...item, ...patch, id } : { ...item, id }
      })

      const getIdentityKey = (item) => {
        if (!item) return 'unknown:'
        if (item.type === 'evidence') {
          if (item.evidenceId != null) return `evidence:${item.evidenceId}`
          if (item.name) return `evidenceName:${item.name}`
          return `evidenceId:${item.id}`
        }
        if (item.type === 'suspect') {
          if (item.suspectId != null) return `suspect:${item.suspectId}`
          if (item.name) return `suspectName:${item.name}`
          return `suspectId:${item.id}`
        }
        if (item.type === 'location') {
          if (item.locationId != null) return `location:${item.locationId}`
          if (item.name) return `locationName:${item.name}`
          return `locationId:${item.id}`
        }
        if (item.type === 'victim') {
          if (item.victimId != null) return `victim:${item.victimId}`
          if (item.name) return `victimName:${item.name}`
          return `victimId:${item.id}`
        }
        if (item.type === 'note') return `note:${item.id}`
        return `${item.type ?? 'item'}:${item.id}`
      }

      const dedupedItems = []
      const seenIdentity = new Map() // identityKey -> keptId
      const seenIds = new Set()

      normalizedItems.forEach((item) => {
        const id = String(item?.id ?? '')
        if (!id) return

        const identityKey = getIdentityKey(item)
        const existingId = seenIdentity.get(identityKey)
        if (existingId) {
          if (id !== existingId) idMap.set(id, existingId)
          return
        }

        if (seenIds.has(id)) return
        seenIds.add(id)
        seenIdentity.set(identityKey, id)
        dedupedItems.push(item)
      })

      const mapEndpoint = (value) => {
        const key = String(value ?? '')
        return idMap.get(key) ?? key
      }

      const normalizedConnectionsRaw = connectionsArray
        .map((conn) => ({
          from: mapEndpoint(conn?.from),
          to: mapEndpoint(conn?.to),
          type: conn?.type === 'suspected' ? 'suspected' : 'confirmed',
        }))
        .filter((conn) => conn.from && conn.to && conn.from !== conn.to)

      const itemIdSet = new Set(dedupedItems.map((item) => item.id))
      const normalizedConnections = normalizedConnectionsRaw.filter(
        (conn) => itemIdSet.has(conn.from) && itemIdSet.has(conn.to)
      )

      const getConnectionKeyForNormalize = (fromId, toId) => {
        const a = String(fromId ?? '')
        const b = String(toId ?? '')
        return a < b ? `${a}__${b}` : `${b}__${a}`
      }

      const connectionByKey = new Map()
      normalizedConnections.forEach((conn) => {
        const key = getConnectionKeyForNormalize(conn.from, conn.to)
        const existing = connectionByKey.get(key)
        if (!existing) {
          connectionByKey.set(key, conn)
          return
        }
        if (existing.type === 'suspected' && conn.type === 'confirmed') {
          connectionByKey.set(key, conn)
        }
      })

      return { items: dedupedItems, connections: [...connectionByKey.values()] }
    }

    // 새 키에서 먼저 시도, 없으면 레거시 키에서 로드
    const rawItems = safeJsonParse(itemsRaw, null) ?? safeJsonParse(legacyItemsRaw, [])
    const rawConnections = safeJsonParse(connectionsRaw, null) ?? safeJsonParse(legacyConnectionsRaw, [])
    const normalized = normalizeBoardState(rawItems, rawConnections)

    const confirmedConnections = normalized.connections.filter((conn) => conn.type === 'confirmed')
    const nodeIdSet = new Set(confirmedConnections.flatMap((c) => [c.from, c.to]))
    // 빨간선으로 연결된 카드들만 포함 (메모 제외, victim 포함)
    const submitItems = normalized.items.filter((item) => (
      nodeIdSet.has(item.id) && ['suspect', 'evidence', 'location', 'victim'].includes(item.type)
    ))

    const submitItemIdSet = new Set(submitItems.map((item) => item.id))
    const submitConnections = confirmedConnections.filter(
      (conn) => submitItemIdSet.has(conn.from) && submitItemIdSet.has(conn.to)
    )

    setSubmitInitialItems(submitItems)
    setSubmitInitialConnections(submitConnections)
    setSubmitBoardState({ items: submitItems, connections: submitConnections })
  }, [isOpen, sessionId, scenarioId])

  // 백엔드 검증 조건에 맞춘 사전 검증
  const readyToSubmit = useMemo(() => {
    const items = Array.isArray(submitBoardState.items) ? submitBoardState.items : []
    const connections = Array.isArray(submitBoardState.connections) ? submitBoardState.connections : []

    const itemsById = new Map(items.map((item) => [item?.id, item]).filter(([id]) => id != null))
    const confirmedConnections = connections.filter((conn) => conn?.type === 'confirmed')

    // 조건 1: 빨간선 정확히 3개
    if (confirmedConnections.length !== 3) {
      setValidationError(`빨간선 연결이 정확히 3개여야 합니다. (현재: ${confirmedConnections.length}개)`)
      return false
    }

    const nodeIdSet = new Set(confirmedConnections.flatMap((c) => [c.from, c.to]))

    // 조건 2: 4가지 타입 모두 연결 (VICTIM, SUSPECT, LOCATION, CLUE)
    const requiredTypes = ['victim', 'suspect', 'location', 'evidence']
    const connectedTypes = new Set()

    nodeIdSet.forEach((id) => {
      const item = itemsById.get(id)
      if (!item) return
      if (requiredTypes.includes(item.type)) {
        connectedTypes.add(item.type)
      }
    })

    const missingTypes = requiredTypes.filter(type => !connectedTypes.has(type))
    if (missingTypes.length > 0) {
      const typeNames = {
        victim: '피해자',
        suspect: '용의자',
        location: '장소',
        evidence: '증거'
      }
      const missingNames = missingTypes.map(t => typeNames[t]).join(', ')
      setValidationError(`모든 타입이 연결되어야 합니다. (미연결: ${missingNames})`)
      return false
    }

    setValidationError(null)
    return true
  }, [submitBoardState])

  const handleSubmit = () => {
    // 사전 검증 실패 시 제출 불가
    if (!readyToSubmit) {
      return
    }

    // 범행동기 필수
    if (!motive.trim()) {
      setValidationError('범행 동기를 입력해주세요.')
      return
    }

    setValidationError(null)
    onSubmit?.({
      submissionItems: submitBoardState.items,
      confirmedConnections: submitBoardState.connections,
      motive: motive.trim(),
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="text-xl font-bold gold-glow">최종 정답 제출</h2>
          <p className="text-sm text-muted-foreground mt-1">
            확정(빨간선)만 사용합니다. 제출 단계에서는 노란선/메모/카드 추가가 없습니다.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
            <div className="bg-muted/20 border border-border rounded-xl p-3">
              <InvestigationBoard
                key={`submit-board-${scenarioId}-${isOpen ? 'open' : 'closed'}`}
                scenarioId={scenarioId}
                title="제출 보드"
                mode="submit"
                persist={false}
                allowMemo={false}
                hideFilter={true}
                hideSave={true}
                acceptExternalDrop={false}
                initialBoardItems={submitInitialItems}
                initialConnections={submitInitialConnections}
                onBoardStateChange={setSubmitBoardState}
              />
            </div>

            <div className="space-y-4">
              {/* 검증 에러 메시지 또는 안내 */}
              {validationError ? (
                <div className="text-sm text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                  {validationError}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground bg-muted/20 border border-border rounded-lg p-4">
                  <p className="font-semibold mb-2">제출 조건:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>빨간선(확정) 연결이 정확히 <span className="text-red-300 font-bold">3개</span>여야 합니다</li>
                    <li>피해자, 용의자, 장소, 증거 <span className="text-red-300 font-bold">4가지 타입</span>이 모두 연결되어야 합니다</li>
                  </ul>
                </div>
              )}

              {/* 범행동기 입력 폼 */}
              <div className="bg-muted/20 border border-border rounded-xl p-4">
                <label className="block text-sm font-semibold mb-2">
                  범행 동기 <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={motive}
                  onChange={(e) => setMotive(e.target.value)}
                  placeholder="범인의 범행 동기를 추론하여 입력해주세요..."
                  className="w-full min-h-[120px] p-3 bg-background border border-border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                  maxLength={500}
                />
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <span>최종 정답 제출 전에 범행 동기를 입력해주세요</span>
                  <span>{motive.length}/500</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-border flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>취소</Button>
          <Button
            variant="neon"
            className="flex-1"
            onClick={handleSubmit}
            disabled={!readyToSubmit || !motive.trim()}
          >
            최종 제출하기
          </Button>
        </div>
      </div>
    </div>
  )
}
