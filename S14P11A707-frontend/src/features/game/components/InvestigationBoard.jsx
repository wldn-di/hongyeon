import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import { X, Pin, Save, Check, Plus, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MemoInputModal } from '@/features/game/modals'
import { fetchBoard, saveBoard } from '@/features/session/api/sessionApi'
import { toast } from 'sonner'

/**
 * 추리 보드 컴포넌트 (localStorage + 저장 버튼 API 연동)
 */
export function InvestigationBoard({
  sessionId = null,
  scenarioId = 1,
  victim = null,
  isModal = false,
  onClose = null,
  readOnly = false,
  title = "추리 보드",
  acceptExternalDrop = false,
  pendingAddItem = null,
  onConsumePendingAddItem = null,
  mode = 'investigation',
  initialBoardItems = null,
  initialConnections = null,
  persist = true,
  allowMemo = true,
  allowedLineModes = null,
  hideFilter = false,
  hideSave = false,
  onBoardStateChange = null,
}) {
  const isSubmitMode = mode === 'submit'
  const effectiveAllowedLineModes =
    allowedLineModes ?? (isSubmitMode ? ['confirmed'] : ['confirmed', 'suspected'])

  const canSaveToApi = Boolean(sessionId) && !isSubmitMode && !readOnly
  const storageKey = sessionId ? `board-${sessionId}` : `board-scenario-${scenarioId}`

  // ========================================
  // State
  // ========================================
  const [filter, setFilter] = useState('all')
  const [selectedItem, setSelectedItem] = useState(null)
  const [boardItems, setBoardItems] = useState([])
  const [connections, setConnections] = useState([])
  const [saveStatus, setSaveStatus] = useState(null)
  const [memoModalOpen, setMemoModalOpen] = useState(false)
  const [lineMode, setLineMode] = useState(null)
  const [pendingConnectFrom, setPendingConnectFrom] = useState(null)
  const [selectedConnectionKey, setSelectedConnectionKey] = useState(null)
  const [selectedConnectionPos, setSelectedConnectionPos] = useState(null)
  const [modalOffset, setModalOffset] = useState({ x: 0, y: 0 })
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const boardRef = useRef(null)
  const autosaveTimerRef = useRef(null)
  const pendingConnectFromRef = useRef(null)
  const isLoadedRef = useRef(false)  // 로드 중복 방지
  const modalDragRef = useRef({
    isDragging: false,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
  })
  const dragRef = useRef({
    isDragging: false,
    itemId: null,
    startX: 0,
    startY: 0,
    offsetX: 0,
    offsetY: 0,
    didMove: false,
  })

  // ========================================
  // 유틸리티 함수
  // ========================================
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value))

  const getConnectionKey = (fromId, toId) => {
    const a = String(fromId ?? '')
    const b = String(toId ?? '')
    return a < b ? `${a}__${b}` : `${b}__${a}`
  }

  const hashString = (value) => {
    const str = String(value ?? '')
    let hash = 0
    for (let i = 0; i < str.length; i += 1) {
      hash = (hash * 31 + str.charCodeAt(i)) | 0
    }
    return Math.abs(hash)
  }

  // ========================================
  // localStorage 저장/로드
  // ========================================
  const saveToLocalStorage = useCallback((items, conns) => {
    try {
      localStorage.setItem(`${storageKey}-items`, JSON.stringify(items))
      localStorage.setItem(`${storageKey}-connections`, JSON.stringify(conns))
    } catch (e) {
      console.error('localStorage 저장 실패:', e)
    }
  }, [storageKey])

  const loadFromLocalStorage = useCallback(() => {
    try {
      const itemsRaw = localStorage.getItem(`${storageKey}-items`)
      const connsRaw = localStorage.getItem(`${storageKey}-connections`)
      return {
        items: itemsRaw ? JSON.parse(itemsRaw) : [],
        connections: connsRaw ? JSON.parse(connsRaw) : [],
      }
    } catch (e) {
      console.error('localStorage 로드 실패:', e)
      return { items: [], connections: [] }
    }
  }, [storageKey])

  // ========================================
  // API: 보드 전체 저장 (PUT /api/sessions/{sessionId}/board)
  // ========================================
  const saveBoardToApi = useCallback(async () => {
    if (!canSaveToApi || isSaving) return false

    setIsSaving(true)
    setSaveStatus('saving')

    try {
      // UI 데이터를 API 형식으로 변환
      const nodes = boardItems.map(item => {
        let type = 'MEMO'
        let targetId = null

        if (item.type === 'evidence') {
          type = 'CLUE'
          targetId = item.evidenceId ?? Number(String(item.id).replace('evidence-', ''))
        } else if (item.type === 'suspect') {
          type = 'SUSPECT'
          targetId = item.suspectId ?? Number(String(item.id).replace('suspect-', ''))
        } else if (item.type === 'victim') {
          type = 'VICTIM'
          targetId = item.victimId ?? Number(String(item.id).replace('victim-', ''))
        } else if (item.type === 'location') {
          type = 'LOCATION'
          targetId = item.locationId ?? Number(String(item.id).replace('location-', ''))
        }

        return {
          type,
          targetId: targetId || null,
          memoContent: item.type === 'note' ? item.note : null,
          x: Math.round(item.x || 0),
          y: Math.round(item.y || 0),
        }
      })

      // 연결선: UI id -> nodes 배열 인덱스로 변환
      const itemIdToIndex = new Map()
      boardItems.forEach((item, index) => {
        itemIdToIndex.set(item.id, index)
      })

      const apiConnections = connections
        .map(conn => {
          const fromIndex = itemIdToIndex.get(conn.from)
          const toIndex = itemIdToIndex.get(conn.to)
          if (fromIndex === undefined || toIndex === undefined) return null

          return {
            fromIndex,
            toIndex,
            type: conn.type === 'suspected' ? 'YELLOW' : 'RED',
          }
        })
        .filter(Boolean)

      await saveBoard(sessionId, {
        nodes,
        connections: apiConnections,
      })

      setSaveStatus('saved')
      toast.success('보드가 저장되었습니다.')
      setTimeout(() => setSaveStatus(null), 2000)
      return true
    } catch (err) {
      console.error('보드 저장 실패:', err)
      setSaveStatus(null)
      toast.error('보드 저장에 실패했습니다.')
      return false
    } finally {
      setIsSaving(false)
    }
  }, [canSaveToApi, isSaving, sessionId, boardItems, connections])

  // ========================================
  // API: 보드 불러오기 (GET /api/sessions/{sessionId}/board)
  // ========================================
  console.log("[loadBoardFromApi]", sessionId, typeof sessionId, Date.now());

  const loadBoardFromApi = useCallback(async () => {
    if (!sessionId) return false
    
    // 이미 로드 중이면 스킵
    if (isLoadedRef.current) {
      console.log('[InvestigationBoard] 이미 로드됨 - 스킵')
      return false
    }
    
    isLoadedRef.current = true
    setIsLoading(true)
    try {
      const response = await fetchBoard(sessionId)

      if (!response?.nodes?.length) {
        // API에 데이터 없으면 localStorage에서 로드
        const local = loadFromLocalStorage()
        setBoardItems(local.items)
        setConnections(local.connections)
        return false
      }

      // API 데이터를 UI 형식으로 변환
      const uiItems = response.nodes.map(node => {
        const nodeId = node.nodeId
        let type = 'note'
        let id = `note-${nodeId}`
        let extraProps = {}

        if (node.type === 'CLUE') {
          type = 'evidence'
          id = `evidence-${node.targetId}`
          extraProps = { evidenceId: node.targetId }
        } else if (node.type === 'SUSPECT') {
          type = 'suspect'
          id = `suspect-${node.targetId}`
          extraProps = { suspectId: node.targetId }
        } else if (node.type === 'VICTIM') {
          type = 'victim'
          id = `victim-${node.targetId}`
          extraProps = { victimId: node.targetId }
        } else if (node.type === 'LOCATION') {
          type = 'location'
          id = `location-${node.targetId}`
          extraProps = { locationId: node.targetId }
        }

        return {
          id,
          type,
          name: node.memoContent || type,
          x: node.x || 0,
          y: node.y || 0,
          note: node.memoContent || '',
          nodeId,
          ...extraProps,
        }
      })

      // nodeId -> UI id 매핑
      const nodeIdToUiId = new Map()
      response.nodes.forEach((node, idx) => {
        nodeIdToUiId.set(node.nodeId, uiItems[idx]?.id)
      })

      // 연결선 변환
      const uiConnections = (response.connections || []).map(conn => {
        const fromUiId = nodeIdToUiId.get(conn.fromNodeId)
        const toUiId = nodeIdToUiId.get(conn.toNodeId)
        if (!fromUiId || !toUiId) return null

        return {
          from: fromUiId,
          to: toUiId,
          type: conn.type === 'YELLOW' ? 'suspected' : 'confirmed',
        }
      }).filter(Boolean)

      setBoardItems(uiItems)
      setConnections(uiConnections)

      // localStorage에도 동기화
      saveToLocalStorage(uiItems, uiConnections)

      return true
    } catch (err) {
      console.error('보드 불러오기 실패:', err)
      // 실패 시 localStorage에서 로드
      const local = loadFromLocalStorage()
      setBoardItems(local.items)
      setConnections(local.connections)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [sessionId, loadFromLocalStorage, saveToLocalStorage])

  // ========================================
  // 초기 데이터 로드
  // ========================================
  useEffect(() => {
    if (Array.isArray(initialBoardItems) || Array.isArray(initialConnections)) {
      setBoardItems(Array.isArray(initialBoardItems) ? initialBoardItems : [])
      setConnections(Array.isArray(initialConnections) ? initialConnections : [])
      return
    }

    if (sessionId) {
      loadBoardFromApi()
    } else {
      const local = loadFromLocalStorage()
      setBoardItems(local.items)
      setConnections(local.connections)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, initialBoardItems, initialConnections])

  // sessionId 변경 시 플래그 리셋
  useEffect(() => {
    isLoadedRef.current = false
  }, [sessionId])

  // ========================================
  // 보드 상태 변경 콜백
  // ========================================
  useEffect(() => {
    onBoardStateChange?.({ items: boardItems, connections })
  }, [onBoardStateChange, boardItems, connections])

  // ========================================
  // localStorage 자동 저장 (디바운스)
  // ========================================
  useEffect(() => {
    if (readOnly || isSubmitMode) return

    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current)
    autosaveTimerRef.current = setTimeout(() => {
      saveToLocalStorage(boardItems, connections)
    }, 300)

    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current)
    }
  }, [boardItems, connections, readOnly, isSubmitMode, saveToLocalStorage])

  // ========================================
  // 아이템 추가 함수들
  // ========================================
  const addEvidenceItem = useCallback((evidence, { x, y } = {}) => {
    if (readOnly || !evidence?.id) return

    const rect = boardRef.current?.getBoundingClientRect()
    const fallbackX = rect ? rect.width / 2 - 88 : 350
    const fallbackY = rect ? rect.height / 2 - 100 : 200
    const maxX = rect ? Math.max(0, rect.width - 176) : 750
    const maxY = rect ? Math.max(0, rect.height - 200) : 500

    const nextItemId = `evidence-${evidence.id}`

    setBoardItems(prev => {
      if (prev.some(item => item.id === nextItemId)) {
        setSelectedItem(nextItemId)
        return prev
      }

      const nextItem = {
        id: nextItemId,
        type: 'evidence',
        evidenceId: evidence.id,
        name: evidence.name,
        x: clamp(Number.isFinite(x) ? x : fallbackX, 0, maxX),
        y: clamp(Number.isFinite(y) ? y : fallbackY, 0, maxY),
        image: evidence.image || evidence.detailImageUrl || null,
        note: evidence.description || evidence.location || '',
      }
      setSelectedItem(nextItemId)
      return [...prev, nextItem]
    })
  }, [readOnly])

  const addSuspectItem = useCallback((suspect, { x, y } = {}) => {
    if (readOnly || !suspect?.id) return

    const rect = boardRef.current?.getBoundingClientRect()
    const fallbackX = rect ? rect.width / 2 - 88 : 350
    const fallbackY = rect ? rect.height / 2 - 100 : 200
    const maxX = rect ? Math.max(0, rect.width - 176) : 750
    const maxY = rect ? Math.max(0, rect.height - 200) : 500

    const nextItemId = `suspect-${suspect.id}`

    setBoardItems(prev => {
      if (prev.some(item => item.id === nextItemId)) {
        setSelectedItem(nextItemId)
        return prev
      }

      const nextItem = {
        id: nextItemId,
        type: 'suspect',
        suspectId: suspect.id,
        name: suspect.name,
        x: clamp(Number.isFinite(x) ? x : fallbackX, 0, maxX),
        y: clamp(Number.isFinite(y) ? y : fallbackY, 0, maxY),
        image: suspect.image || suspect.portraitUrl || null,
        role: suspect.role || suspect.occupation || '',
        note: suspect.oneLiner || '',
      }
      setSelectedItem(nextItemId)
      return [...prev, nextItem]
    })
  }, [readOnly])

  const addLocationItem = useCallback((location, { x, y } = {}) => {
    if (readOnly || !location?.id) return

    const rect = boardRef.current?.getBoundingClientRect()
    const fallbackX = rect ? rect.width / 2 - 88 : 350
    const fallbackY = rect ? rect.height / 2 - 100 : 200
    const maxX = rect ? Math.max(0, rect.width - 176) : 750
    const maxY = rect ? Math.max(0, rect.height - 200) : 500

    const nextItemId = `location-${location.id}`

    setBoardItems(prev => {
      if (prev.some(item => item.id === nextItemId)) {
        setSelectedItem(nextItemId)
        return prev
      }

      const nextItem = {
        id: nextItemId,
        type: 'location',
        locationId: location.id,
        name: location.name,
        x: clamp(Number.isFinite(x) ? x : fallbackX, 0, maxX),
        y: clamp(Number.isFinite(y) ? y : fallbackY, 0, maxY),
        image: location.image || null,
        floorNumber: location.floorNumber || location.id,
        note: location.description || '',
      }
      setSelectedItem(nextItemId)
      return [...prev, nextItem]
    })
  }, [readOnly])

  const addVictimItem = useCallback((victimData, { x, y } = {}) => {
    if (readOnly || !victimData?.id) return

    const rect = boardRef.current?.getBoundingClientRect()
    const fallbackX = rect ? rect.width / 2 - 88 : 350
    const fallbackY = rect ? rect.height / 2 - 100 : 200
    const maxX = rect ? Math.max(0, rect.width - 176) : 750
    const maxY = rect ? Math.max(0, rect.height - 200) : 500

    const nextItemId = `victim-${victimData.id}`

    setBoardItems(prev => {
      if (prev.some(item => item.id === nextItemId)) return prev

      const nextItem = {
        id: nextItemId,
        type: 'victim',
        victimId: victimData.id,
        name: victimData.name ?? '피해자',
        x: clamp(Number.isFinite(x) ? x : fallbackX, 0, maxX),
        y: clamp(Number.isFinite(y) ? y : fallbackY, 0, maxY),
        image: victimData.portraitUrl ?? victimData.image ?? null,
        occupation: victimData.occupation || '',
        note: victimData.background || '',
      }
      setSelectedItem(nextItemId)
      return [...prev, nextItem]
    })
  }, [readOnly])

  const addNoteItem = useCallback((text, { x, y } = {}) => {
    if (readOnly || isSubmitMode || !allowMemo) return
    const normalized = String(text ?? '').trim()
    if (!normalized) return

    const rect = boardRef.current?.getBoundingClientRect()
    const fallbackX = rect ? rect.width / 2 - 88 : 350
    const fallbackY = rect ? rect.height / 2 - 100 : 200
    const maxX = rect ? Math.max(0, rect.width - 176) : 750
    const maxY = rect ? Math.max(0, rect.height - 200) : 500

    const nextItemId = `note-${Date.now()}`
    const nextItem = {
      id: nextItemId,
      type: 'note',
      name: '메모',
      x: clamp(Number.isFinite(x) ? x : fallbackX, 0, maxX),
      y: clamp(Number.isFinite(y) ? y : fallbackY, 0, maxY),
      note: normalized,
    }

    setBoardItems(prev => [...prev, nextItem])
    setSelectedItem(nextItemId)
  }, [readOnly, isSubmitMode, allowMemo])

  // ========================================
  // 연결선 관리
  // ========================================
  const setPendingConnectFromWithRef = useCallback((value) => {
    pendingConnectFromRef.current = value
    setPendingConnectFrom(value)
  }, [])

  const upsertConnection = useCallback((fromId, toId, type) => {
    if (readOnly || !fromId || !toId || fromId === toId) return

    const key = getConnectionKey(fromId, toId)

    setConnections(prev => {
      const existingIndex = prev.findIndex(conn =>
        getConnectionKey(conn.from, conn.to) === key
      )

      if (existingIndex !== -1) {
        if (prev[existingIndex].type === type) return prev
        const next = [...prev]
        next[existingIndex] = { ...prev[existingIndex], type }
        return next
      }

      return [...prev, { from: fromId, to: toId, type }]
    })
  }, [readOnly])

  const removeConnectionByKey = useCallback((keyToRemove) => {
    if (readOnly || !keyToRemove) return
    setConnections(prev => prev.filter(conn =>
      getConnectionKey(conn.from, conn.to) !== keyToRemove
    ))
  }, [readOnly])

  const removeItemById = useCallback((itemId) => {
    if (readOnly || !itemId) return
    setBoardItems(prev => prev.filter(it => it.id !== itemId))
    setConnections(prev => prev.filter(c => c.from !== itemId && c.to !== itemId))
    setSelectedItem(prev => prev === itemId ? null : prev)
  }, [readOnly])

  // ========================================
  // 드래그 핸들러
  // ========================================
  useEffect(() => {
    if (!isModal) return

    const handleMove = (e) => {
      if (!modalDragRef.current.isDragging) return
      setModalOffset({
        x: modalDragRef.current.originX + (e.clientX - modalDragRef.current.startX),
        y: modalDragRef.current.originY + (e.clientY - modalDragRef.current.startY),
      })
    }

    const handleUp = () => {
      modalDragRef.current.isDragging = false
    }

    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
    return () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
    }
  }, [isModal])

  const handleHeaderPointerDown = useCallback((e) => {
    if (!isModal || readOnly || e.button !== 0) return
    if (e.target?.closest?.('button, a, input, [data-no-modal-drag]')) return

    e.preventDefault()
    modalDragRef.current = {
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      originX: modalOffset.x,
      originY: modalOffset.y,
    }
  }, [isModal, readOnly, modalOffset])

  const handleExternalDragOver = useCallback((e) => {
    if (!acceptExternalDrop || readOnly || isSubmitMode) return
    e.preventDefault()
  }, [acceptExternalDrop, readOnly, isSubmitMode])

  const handleExternalDrop = useCallback((e) => {
    if (!acceptExternalDrop || readOnly || isSubmitMode) return
    e.preventDefault()
    e.stopPropagation()

    try {
      const itemDataStr = e.dataTransfer?.getData('itemData') || e.dataTransfer?.getData('text/plain')
      if (!itemDataStr) return

      const { type, data } = JSON.parse(itemDataStr)
      const rect = boardRef.current?.getBoundingClientRect()
      const point = rect ? { x: e.clientX - rect.left - 88, y: e.clientY - rect.top - 100 } : {}

      if (type === 'evidence') addEvidenceItem(data, point)
      if (type === 'suspect') addSuspectItem(data, point)
      if (type === 'location') addLocationItem(data, point)
    } catch {}
  }, [acceptExternalDrop, readOnly, isSubmitMode, addEvidenceItem, addSuspectItem, addLocationItem])

  // pendingAddItem 처리
  useEffect(() => {
    if (!pendingAddItem || readOnly || isSubmitMode) return

    const rect = boardRef.current?.getBoundingClientRect()
    const point = rect && Number.isFinite(pendingAddItem.dropClientX) ? {
      x: pendingAddItem.dropClientX - rect.left - 88,
      y: pendingAddItem.dropClientY - rect.top - 100,
    } : {}

    const { type, data } = pendingAddItem
    if (type === 'evidence') addEvidenceItem(data, point)
    if (type === 'suspect') addSuspectItem(data, point)
    if (type === 'location') addLocationItem(data, point)

    onConsumePendingAddItem?.()
  }, [pendingAddItem, readOnly, isSubmitMode, addEvidenceItem, addSuspectItem, addLocationItem, onConsumePendingAddItem])

  // 아이템 드래그
  const handleMouseDown = (e, itemId) => {
    if (readOnly || e.button !== 0) return
    const item = boardItems.find(it => it.id === itemId)
    if (!item) return

    dragRef.current = {
      isDragging: true,
      itemId,
      startX: e.clientX,
      startY: e.clientY,
      offsetX: item.x,
      offsetY: item.y,
      didMove: false,
    }
    setSelectedItem(itemId)
    document.body.style.cursor = 'grabbing'
  }

  const handleMouseMove = useCallback((e) => {
    if (!dragRef.current.isDragging || readOnly) return

    const deltaX = e.clientX - dragRef.current.startX
    const deltaY = e.clientY - dragRef.current.startY
    if (!dragRef.current.didMove && (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3)) {
      dragRef.current.didMove = true
    }

    const rect = boardRef.current?.getBoundingClientRect()
    const maxX = rect ? Math.max(0, rect.width - 176) : 750
    const maxY = rect ? Math.max(0, rect.height - 200) : 500

    setBoardItems(prev => prev.map(item =>
      item.id === dragRef.current.itemId
        ? { ...item, x: clamp(dragRef.current.offsetX + deltaX, 0, maxX), y: clamp(dragRef.current.offsetY + deltaY, 0, maxY) }
        : item
    ))
  }, [readOnly])

  const handleMouseUp = useCallback(() => {
    dragRef.current.isDragging = false
    dragRef.current.itemId = null
    dragRef.current.didMove = false
    document.body.style.cursor = ''
  }, [])

  const toggleLineMode = useCallback((nextMode) => {
    if (readOnly || !effectiveAllowedLineModes.includes(nextMode)) return
    setLineMode(prev => prev === nextMode ? null : nextMode)
    setPendingConnectFromWithRef(null)
    setSelectedConnectionKey(null)
    setSelectedConnectionPos(null)
  }, [readOnly, effectiveAllowedLineModes, setPendingConnectFromWithRef])

  const handleCardClick = useCallback((itemId) => {
    if (readOnly || dragRef.current.didMove) return

    setSelectedItem(itemId)
    setSelectedConnectionKey(null)
    setSelectedConnectionPos(null)

    if (!lineMode || !effectiveAllowedLineModes.includes(lineMode)) return

    const currentPending = pendingConnectFromRef.current

    if (!currentPending) {
      setPendingConnectFromWithRef(itemId)
      return
    }

    if (currentPending === itemId) {
      setPendingConnectFromWithRef(null)
      return
    }

    upsertConnection(currentPending, itemId, lineMode)
    setPendingConnectFromWithRef(null)
  }, [readOnly, lineMode, effectiveAllowedLineModes, upsertConnection, setPendingConnectFromWithRef])

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [handleMouseMove, handleMouseUp])

  // 피해자 자동 추가 (API 로드 완료 후, 중복 방지)
  useEffect(() => {
    if (readOnly || !victim?.id || isLoading) return

    // setBoardItems 내부에서 중복 체크
    setBoardItems(prev => {
      const victimId = `victim-${victim.id}`
      if (prev.some(item => item.id === victimId)) {
        return prev  // 이미 있으면 그대로 반환
      }

      const rect = boardRef.current?.getBoundingClientRect()
      const fallbackX = rect ? rect.width / 2 - 88 : 350
      const fallbackY = rect ? rect.height / 2 - 100 : 200
      const maxX = rect ? Math.max(0, rect.width - 176) : 750
      const maxY = rect ? Math.max(0, rect.height - 200) : 500

      return [...prev, {
        id: victimId,
        type: 'victim',
        victimId: victim.id,
        name: victim.name ?? '피해자',
        x: clamp(fallbackX, 0, maxX),
        y: clamp(fallbackY, 0, maxY),
        image: victim.portraitUrl ?? victim.image ?? null,
        occupation: victim.occupation || '',
        note: victim.background || '',
      }]
    })
  }, [victim?.id, readOnly, isLoading])

  // submit 모드에서 필터 초기화
  useEffect(() => {
    if (isSubmitMode) setFilter('all')
  }, [isSubmitMode])

  // 필터링된 아이템
  const filteredItems = boardItems.filter(item => {
    if (isSubmitMode && item.type === 'note') return false
    if (item.type === 'victim') return true
    if (filter === 'all') return true
    return item.type === filter
  })

  const filterOptions = [
    { value: 'all', label: '전체 보기' },
    { value: 'victim', label: '피해자' },
    { value: 'suspect', label: '용의자' },
    { value: 'evidence', label: '증거' },
    { value: 'location', label: '장소' },
    ...(!isSubmitMode ? [{ value: 'note', label: '메모' }] : []),
  ]

  // ========================================
  // 렌더링
  // ========================================
  return (
    <div
      className={cn("bg-card rounded-lg", isModal && "p-0")}
      style={isModal ? { transform: `translate3d(${modalOffset.x}px, ${modalOffset.y}px, 0)` } : undefined}
    >
      {/* 헤더 */}
      <div
        className={cn(
          "flex items-center justify-between p-4 border-b border-border",
          isModal && !readOnly && "cursor-grab active:cursor-grabbing"
        )}
        onPointerDown={handleHeaderPointerDown}
      >
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold gold-glow">{title}</h2>
          {(isLoading || isSaving) && (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          )}
        </div>
        <div className="flex gap-3 items-center">
          {!readOnly && effectiveAllowedLineModes.length > 0 && (
            <div className="flex items-center gap-2">
              {effectiveAllowedLineModes.includes('confirmed') && (
                <button
                  type="button"
                  onClick={() => toggleLineMode('confirmed')}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-bold border transition-colors",
                    lineMode === 'confirmed'
                      ? "bg-red-500/15 border-red-500/50 text-red-400"
                      : "bg-muted/30 border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  확정
                </button>
              )}
              {effectiveAllowedLineModes.includes('suspected') && (
                <button
                  type="button"
                  onClick={() => toggleLineMode('suspected')}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-bold border transition-colors",
                    lineMode === 'suspected'
                      ? "bg-amber-500/15 border-amber-500/50 text-amber-400"
                      : "bg-muted/30 border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  의심
                </button>
              )}
              {lineMode && (
                <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                  {pendingConnectFrom ? '1/2 선택' : '2개 클릭'}
                </span>
              )}
            </div>
          )}

          {!readOnly && !isSubmitMode && allowMemo && (
            <Button variant="outline" size="sm" onClick={() => setMemoModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              메모
            </Button>
          )}

          {!hideSave && canSaveToApi && (
            <Button
              variant="outline"
              size="sm"
              onClick={saveBoardToApi}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  저장 중...
                </>
              ) : saveStatus === 'saved' ? (
                <>
                  <Check className="w-4 h-4 mr-2 text-green-500" />
                  저장됨
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  저장
                </>
              )}
            </Button>
          )}

          {isModal && onClose && (
            <Button variant="ghost" size="icon" onClick={onClose} data-no-modal-drag>
              <X className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>

      {/* 필터 */}
      {!hideFilter && (
        <div className="p-3 border-b border-border bg-muted/20 flex gap-2 overflow-x-auto">
          {filterOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={cn(
                "px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors",
                filter === opt.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 text-muted-foreground hover:text-foreground"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {/* 보드 영역 */}
      <div
        ref={boardRef}
        className="relative overflow-auto"
        style={{
          height: isModal ? '65vh' : '500px',
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)',
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)
          `,
          backgroundSize: '30px 30px, 30px 30px, 100% 100%',
        }}
        onDragOver={handleExternalDragOver}
        onDrop={handleExternalDrop}
        onClick={() => {
          setSelectedItem(null)
          setPendingConnectFromWithRef(null)
          setSelectedConnectionKey(null)
          setSelectedConnectionPos(null)
        }}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-50">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {/* 연결선 */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ minWidth: '100%', minHeight: '100%' }}>
          {connections.map(conn => {
            if (!conn?.from || !conn?.to) return null
            const fromItem = boardItems.find(item => item.id === conn.from)
            const toItem = boardItems.find(item => item.id === conn.to)
            if (!fromItem || !toItem) return null

            const key = getConnectionKey(conn.from, conn.to)
            const hash = hashString(key)
            const fromX = fromItem.x + 88, fromY = fromItem.y + 100
            const toX = toItem.x + 88, toY = toItem.y + 100
            const midX = (fromX + toX) / 2, midY = (fromY + toY) / 2
            const controlX = midX + ((hash % 7) - 3) * 10
            const controlY = midY - 50 + ((hash % 5) - 2) * 5
            const pathD = `M ${fromX} ${fromY} Q ${controlX} ${controlY} ${toX} ${toY}`
            const isConfirmed = conn.type !== 'suspected'

            return (
              <g key={key}>
                <path
                  d={pathD}
                  stroke="transparent"
                  strokeWidth={20}
                  fill="none"
                  style={{ pointerEvents: 'stroke' }}
                  onClick={(e) => {
                    e.stopPropagation()
                    setPendingConnectFromWithRef(null)
                    setSelectedItem(null)
                    setSelectedConnectionPos({ x: controlX, y: controlY })
                    setSelectedConnectionKey(prev => prev === key ? null : key)
                  }}
                />
                <path
                  d={pathD}
                  stroke={isConfirmed ? '#dc2626' : '#f59e0b'}
                  strokeWidth={isConfirmed ? 4 : 3}
                  strokeDasharray={isConfirmed ? undefined : '8 8'}
                  fill="none"
                  style={{ pointerEvents: 'none', filter: 'drop-shadow(3px 3px 6px rgba(0,0,0,0.4))' }}
                />
              </g>
            )
          })}
        </svg>

        {/* 연결선 삭제 버튼 */}
        {!readOnly && selectedConnectionKey && selectedConnectionPos && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              removeConnectionByKey(selectedConnectionKey)
              setSelectedConnectionKey(null)
              setSelectedConnectionPos(null)
            }}
            className="absolute w-7 h-7 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 flex items-center justify-center text-sm border border-white/20"
            style={{ left: selectedConnectionPos.x, top: selectedConnectionPos.y, transform: 'translate(-50%, -50%)', zIndex: 5 }}
          >
            ✕
          </button>
        )}

        {/* 아이템 카드 - 폴라로이드 스타일 */}
        {filteredItems.map(item => {
          // 타입별 색상 및 라벨
          const typeConfig = {
            victim: { label: '피해자', color: 'bg-red-500', borderColor: 'border-red-400' },
            suspect: { label: '용의자', color: 'bg-amber-500', borderColor: 'border-amber-400' },
            evidence: { label: '증거', color: 'bg-blue-500', borderColor: 'border-blue-400' },
            location: { label: '장소', color: 'bg-green-500', borderColor: 'border-green-400' },
            note: { label: '메모', color: 'bg-gray-500', borderColor: 'border-gray-400' },
          }
          const config = typeConfig[item.type] || typeConfig.note

          return (
            <div
              key={item.id}
              className={cn(
                "absolute group select-none",
                lineMode && pendingConnectFrom === item.id && (lineMode === 'confirmed' ? "ring-4 ring-red-500 ring-offset-2" : "ring-4 ring-amber-500 ring-offset-2"),
                !readOnly && "cursor-move"
              )}
              style={{ left: item.x, top: item.y, zIndex: selectedItem === item.id ? 10 : 2 }}
              onMouseDown={(e) => handleMouseDown(e, item.id)}
              onClick={(e) => {
                e.stopPropagation()
                handleCardClick(item.id)
              }}
            >
              {/* 핀 */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                <Pin className="w-6 h-6 text-red-600 fill-red-600" style={{ filter: 'drop-shadow(0 3px 4px rgba(0,0,0,0.5))' }} />
              </div>

              {/* 폴라로이드 카드 */}
              <div
                className={cn(
                  "w-44 bg-white transition-all duration-300",
                  selectedItem === item.id && "ring-2 ring-primary"
                )}
                style={{
                  transform: selectedItem === item.id ? 'scale(1.05) rotate(0deg)' : `rotate(${(hashString(item.id) % 2 === 0 ? 1 : -1) * 2}deg)`,
                  boxShadow: '4px 4px 12px rgba(0,0,0,0.3), 0 0 0 1px rgba(0,0,0,0.05)'
                }}
              >
                {/* 이미지 영역 */}
                <div className="p-2 pb-0">
                  {item.image ? (
                    <div className="relative">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-28 object-cover bg-gray-200"
                        onError={(e) => {
                          e.target.onerror = null
                          e.target.src = ''
                          e.target.className = 'w-full h-28 bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center'
                        }}
                      />
                      {/* 타입 뱃지 */}
                      <span className={cn(
                        "absolute top-1 right-1 px-2 py-0.5 text-[10px] font-bold text-white rounded",
                        config.color
                      )}>
                        {config.label}
                      </span>
                    </div>
                  ) : (
                    <div className={cn(
                      "w-full h-28 flex items-center justify-center relative",
                      item.type === 'note'
                        ? "bg-gradient-to-br from-amber-100 to-amber-200"
                        : "bg-gradient-to-br from-gray-200 to-gray-300"
                    )}>
                      {item.type === 'note' ? (
                        <span className="text-4xl">📝</span>
                      ) : item.type === 'location' ? (
                        <span className="text-4xl">📍</span>
                      ) : item.type === 'evidence' ? (
                        <span className="text-4xl">🔍</span>
                      ) : (
                        <span className="text-4xl">👤</span>
                      )}
                      {/* 타입 뱃지 */}
                      <span className={cn(
                        "absolute top-1 right-1 px-2 py-0.5 text-[10px] font-bold text-white rounded",
                        config.color
                      )}>
                        {config.label}
                      </span>
                    </div>
                  )}
                </div>

                {/* 정보 영역 */}
                <div className="p-2 pt-2 pb-3 text-center">
                  {/* 이름 */}
                  <p className="text-sm font-bold text-gray-900 truncate">{item.name || '이름 없음'}</p>

                  {/* 역할/타입 */}
                  {item.type === 'victim' && item.occupation && (
                    <p className="text-xs text-gray-500 mt-0.5">{item.occupation}</p>
                  )}
                  {item.type === 'suspect' && item.role && (
                    <p className="text-xs text-gray-500 mt-0.5">{item.role}</p>
                  )}

                  {/* 설명 (메모, 장소, 증거) */}
                  {(item.type === 'note' || item.type === 'location' || item.type === 'evidence') && item.note && (
                    <p className="text-[11px] text-gray-600 mt-1 line-clamp-2 leading-tight px-1">
                      {item.note}
                    </p>
                  )}

                  {/* 장소: 층 정보 */}
                  {item.type === 'location' && item.floorNumber && (
                    <p className="text-[10px] text-green-600 font-semibold mt-1">{item.floorNumber}층</p>
                  )}
                </div>
              </div>

              {/* 삭제 버튼 - victim 제외 */}
              {!readOnly && selectedItem === item.id && item.type !== 'victim' && (
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); e.stopPropagation() }}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    removeItemById(item.id)
                  }}
                  className="absolute -top-2 -right-2 w-7 h-7 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 flex items-center justify-center text-sm font-bold border-2 border-white transition-transform hover:scale-110"
                  style={{ zIndex: 20 }}
                >
                  ✕
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* 범례 */}
      <div className="p-4 flex gap-6 justify-center items-center text-sm border-t border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-1 bg-red-600 rounded" />
          <span className="text-muted-foreground">확정</span>
        </div>
        {effectiveAllowedLineModes.includes('suspected') && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-1 rounded" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #f59e0b 0, #f59e0b 4px, transparent 4px, transparent 8px)' }} />
            <span className="text-muted-foreground">의심</span>
          </div>
        )}
      </div>

      <MemoInputModal isOpen={memoModalOpen} onClose={() => setMemoModalOpen(false)} onSubmit={addNoteItem} />
    </div>
  )
}