import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import { X, Pin, Save, Check, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MemoInputModal } from '@/features/game/modals'

export function InvestigationBoard({ 
  scenarioId = 1,
  victim = null, 
  isModal = false,
  onClose = null,
  readOnly = false,
  title = "추리 보드",
  acceptExternalDrop = false,
  pendingAddItem = null,
  onConsumePendingAddItem = null,
  mode = 'investigation', // 'investigation' | 'submit'
  initialBoardItems = null,
  initialConnections = null,
  persist = true,
  allowMemo = true,
  allowedLineModes = null, // default: investigation = ['confirmed','suspected'], submit = ['confirmed']
  hideFilter = false,
  hideSave = false,
  onBoardStateChange = null,
}) {
  const isSubmitMode = mode === 'submit'
  const effectiveAllowedLineModes =
    allowedLineModes ??
    (isSubmitMode ? ['confirmed'] : ['confirmed', 'suspected'])

  const storageEnabled = persist && !readOnly && !isSubmitMode

  const [filter, setFilter] = useState('all')
  const [selectedItem, setSelectedItem] = useState(null)
  const [boardItems, setBoardItems] = useState(() => [])
  const [connections, setConnections] = useState(() => [])
  const [saveStatus, setSaveStatus] = useState(null)
  const [memoModalOpen, setMemoModalOpen] = useState(false)
  const [lineMode, setLineMode] = useState(null) // 'confirmed' | 'suspected' | null
  const [pendingConnectFrom, setPendingConnectFrom] = useState(null) // itemId
  const [selectedConnectionKey, setSelectedConnectionKey] = useState(null) // for delete ui
  const [selectedConnectionPos, setSelectedConnectionPos] = useState(null) // { x, y }
  const [modalOffset, setModalOffset] = useState({ x: 0, y: 0 })
  
  const boardRef = useRef(null)
  const autosaveTimerRef = useRef(null)
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

  useEffect(() => {
    onBoardStateChange?.({ items: boardItems, connections })
  }, [onBoardStateChange, boardItems, connections])

  useEffect(() => {
    const safeJsonParse = (value, fallback) => {
      if (!value) return fallback
      try {
        return JSON.parse(value)
      } catch {
        return fallback
      }
    }

    const normalizeBoardState = (itemsRaw, connectionsRaw) => {
      const itemsArray = Array.isArray(itemsRaw) ? itemsRaw : []
      const connectionsArray = Array.isArray(connectionsRaw) ? connectionsRaw : []

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
          const num = parseNumeric(originalIdStr.slice(prefix.length))
          return num
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
        .map((conn) => {
          const from = mapEndpoint(conn?.from)
          const to = mapEndpoint(conn?.to)
          const type = conn?.type === 'suspected' ? 'suspected' : 'confirmed'
          return { from, to, type }
        })
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

    const resetUiState = () => {
      setSelectedItem(null)
      setLineMode(null)
      setPendingConnectFrom(null)
      setSelectedConnectionKey(null)
      setSelectedConnectionPos(null)
    }

    if (Array.isArray(initialBoardItems) || Array.isArray(initialConnections)) {
      setBoardItems(Array.isArray(initialBoardItems) ? initialBoardItems : [])
      setConnections(Array.isArray(initialConnections) ? initialConnections : [])
      resetUiState()
      return
    }

    const itemsRaw = localStorage.getItem(`board-items-${scenarioId}`)
    const connectionsRaw = localStorage.getItem(`board-connections-${scenarioId}`)
    const parsedItems = safeJsonParse(itemsRaw, [])
    const parsedConnections = safeJsonParse(connectionsRaw, [])
    const normalized = normalizeBoardState(parsedItems, parsedConnections)

    setBoardItems(normalized.items)
    setConnections(normalized.connections)
    resetUiState()
  }, [scenarioId, initialBoardItems, initialConnections])

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

  const addEvidenceItem = useCallback((evidence, { x, y } = {}) => {
    if (readOnly) return
    if (!evidence || evidence.id == null) return

    const rect = boardRef.current?.getBoundingClientRect()
    const fallbackX = rect ? rect.width / 2 - 88 : 350
    const fallbackY = rect ? rect.height / 2 - 100 : 200
    const maxX = rect ? Math.max(0, rect.width - 176) : 750
    const maxY = rect ? Math.max(0, rect.height - 200) : 500

    const nextX = Number.isFinite(x) ? x : fallbackX
    const nextY = Number.isFinite(y) ? y : fallbackY

    const nextItemId = `evidence-${evidence.id}`
    const nextItem = {
      id: nextItemId,
      type: 'evidence',
      evidenceId: evidence.id,
      name: evidence.name,
      x: clamp(nextX, 0, maxX),
      y: clamp(nextY, 0, maxY),
      image: evidence.image ?? null,
      note: evidence.location || '',
    }

    setBoardItems((prev) => {
      const evidenceIdStr = String(evidence.id)

      const matchesEvidence = (item) => {
        if (!item || item.type !== 'evidence') return false

        if (item.evidenceId != null && String(item.evidenceId) === evidenceIdStr) return true

        const itemIdStr = String(item.id ?? '')
        if (itemIdStr === nextItemId) return true
        if (itemIdStr.startsWith('evidence-') && itemIdStr.slice('evidence-'.length) === evidenceIdStr) return true

        return Boolean(evidence.name) && item.name === evidence.name
      }

      const firstMatchIndex = prev.findIndex(matchesEvidence)
      if (firstMatchIndex === -1) {
        setSelectedItem(nextItemId)
        return [...prev, nextItem]
      }

      const keepId = prev[firstMatchIndex]?.id ?? nextItemId
      setSelectedItem(keepId)
      return prev.map((item, index) =>
        index === firstMatchIndex ? { ...item, ...nextItem, id: keepId } : item
      )
    })
  }, [readOnly])

  const addSuspectItem = useCallback((suspect, { x, y } = {}) => {
    if (readOnly) return
    if (!suspect || suspect.id == null) return

    const rect = boardRef.current?.getBoundingClientRect()
    const fallbackX = rect ? rect.width / 2 - 88 : 350
    const fallbackY = rect ? rect.height / 2 - 100 : 200
    const maxX = rect ? Math.max(0, rect.width - 176) : 750
    const maxY = rect ? Math.max(0, rect.height - 200) : 500

    const nextX = Number.isFinite(x) ? x : fallbackX
    const nextY = Number.isFinite(y) ? y : fallbackY

    const nextItemId = `suspect-${suspect.id}`
    const nextItem = {
      id: nextItemId,
      type: 'suspect',
      suspectId: suspect.id,
      name: suspect.name,
      x: clamp(nextX, 0, maxX),
      y: clamp(nextY, 0, maxY),
      image: suspect.image ?? null,
      note: suspect.role || '',
    }

    setBoardItems((prev) => {
      const suspectIdStr = String(suspect.id)

      const matchesSuspect = (item) => {
        if (!item || item.type !== 'suspect') return false

        if (item.suspectId != null && String(item.suspectId) === suspectIdStr) return true

        const itemIdStr = String(item.id ?? '')
        if (itemIdStr === nextItemId) return true
        if (itemIdStr.startsWith('suspect-') && itemIdStr.slice('suspect-'.length) === suspectIdStr) return true

        return Boolean(suspect.name) && item.name === suspect.name
      }

      const firstMatchIndex = prev.findIndex(matchesSuspect)
      if (firstMatchIndex === -1) {
        setSelectedItem(nextItemId)
        return [...prev, nextItem]
      }

      const keepId = prev[firstMatchIndex]?.id ?? nextItemId
      setSelectedItem(keepId)
      return prev.map((item, index) =>
        index === firstMatchIndex ? { ...item, ...nextItem, id: keepId } : item
      )
    })
  }, [readOnly])

  const addLocationItem = useCallback((location, { x, y } = {}) => {
    if (readOnly) return
    if (!location || location.id == null) return

    const rect = boardRef.current?.getBoundingClientRect()
    const fallbackX = rect ? rect.width / 2 - 88 : 350
    const fallbackY = rect ? rect.height / 2 - 100 : 200
    const maxX = rect ? Math.max(0, rect.width - 176) : 750
    const maxY = rect ? Math.max(0, rect.height - 200) : 500

    const nextX = Number.isFinite(x) ? x : fallbackX
    const nextY = Number.isFinite(y) ? y : fallbackY

    const nextItemId = `location-${location.id}`
    const nextItem = {
      id: nextItemId,
      type: 'location',
      locationId: location.id,
      name: location.name,
      x: clamp(nextX, 0, maxX),
      y: clamp(nextY, 0, maxY),
      image: null,
      note: '장소',
    }

    setBoardItems((prev) => {
      const locationIdStr = String(location.id)

      const matchesLocation = (item) => {
        if (!item || item.type !== 'location') return false

        if (item.locationId != null && String(item.locationId) === locationIdStr) return true

        const itemIdStr = String(item.id ?? '')
        if (itemIdStr === nextItemId) return true
        if (itemIdStr.startsWith('location-') && itemIdStr.slice('location-'.length) === locationIdStr) return true

        return Boolean(location.name) && item.name === location.name
      }

      const firstMatchIndex = prev.findIndex(matchesLocation)
      if (firstMatchIndex === -1) {
        setSelectedItem(nextItemId)
        return [...prev, nextItem]
      }

      const keepId = prev[firstMatchIndex]?.id ?? nextItemId
      setSelectedItem(keepId)
      return prev.map((item, index) =>
        index === firstMatchIndex ? { ...item, ...nextItem, id: keepId } : item
      )
    })
  }, [readOnly])

const addVictimItem = useCallback((victimData, { x, y } = {}) => {
  if (readOnly) return
  if (!victimData || victimData.id == null) return

  const rect = boardRef.current?.getBoundingClientRect()
  const fallbackX = rect ? rect.width / 2 - 88 : 350
  const fallbackY = rect ? rect.height / 2 - 100 : 200
  const maxX = rect ? Math.max(0, rect.width - 176) : 750
  const maxY = rect ? Math.max(0, rect.height - 200) : 500

  const nextX = Number.isFinite(x) ? x : fallbackX
  const nextY = Number.isFinite(y) ? y : fallbackY

  const nextItemId = `victim-${victimData.id}`
  const nextItem = {
    id: nextItemId,
    type: 'victim',
    victimId: victimData.id,
    name: victimData.name ?? '피해자',
    x: clamp(nextX, 0, maxX),
    y: clamp(nextY, 0, maxY),
    image: victimData.portraitUrl ?? null,
    note: victimData.occupation || '', // 원하면 background 같은 걸로 바꿔도 됨
  }

  setBoardItems((prev) => {
    const victimIdStr = String(victimData.id)
    const exists = prev.some((it) =>
      it?.type === 'victim' && (String(it.victimId ?? '') === victimIdStr || String(it.id) === nextItemId)
    )
    if (exists) return prev

    setSelectedItem(nextItemId)
    return [...prev, nextItem]
  })
}, [readOnly])


  const upsertConnection = useCallback((fromId, toId, type) => {
    if (readOnly) return
    if (!fromId || !toId) return
    if (String(fromId) === String(toId)) return

    const key = getConnectionKey(fromId, toId)

    setConnections((prev) => {
      const existingIndex = prev.findIndex((conn) => getConnectionKey(conn.from, conn.to) === key)
      if (existingIndex === -1) return [...prev, { from: fromId, to: toId, type }]

      const existing = prev[existingIndex]
      if (existing?.type === type) return prev

      const next = [...prev]
      next[existingIndex] = { ...existing, type }
      return next
    })
  }, [readOnly])

  const removeConnectionByKey = useCallback((keyToRemove) => {
    if (readOnly) return
    if (!keyToRemove) return
    setConnections((prev) => prev.filter((conn) => getConnectionKey(conn.from, conn.to) !== keyToRemove))
  }, [readOnly])

  const removeItemById = useCallback((itemId) => {
  if (readOnly) return
  if (!itemId) return

  setBoardItems((prev) => prev.filter((it) => it.id !== itemId))
  setConnections((prev) => prev.filter((c) => c.from !== itemId && c.to !== itemId))

  setSelectedItem((prev) => (prev === itemId ? null : prev))
  setPendingConnectFrom((prev) => (prev === itemId ? null : prev))
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

    const nextX = Number.isFinite(x) ? x : fallbackX
    const nextY = Number.isFinite(y) ? y : fallbackY

    const nextItemId = `note-${Date.now()}`
    const nextItem = {
      id: nextItemId,
      type: 'note',
      name: '메모',
      x: clamp(nextX, 0, maxX),
      y: clamp(nextY, 0, maxY),
      note: normalized,
    }

    setBoardItems((prev) => [...prev, nextItem])
    setSelectedItem(nextItemId)
  }, [readOnly, isSubmitMode, allowMemo])

  useEffect(() => {
    if (!isModal) return

    const handleMove = (e) => {
      if (!modalDragRef.current.isDragging) return
      const deltaX = e.clientX - modalDragRef.current.startX
      const deltaY = e.clientY - modalDragRef.current.startY
      setModalOffset({
        x: modalDragRef.current.originX + deltaX,
        y: modalDragRef.current.originY + deltaY,
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
    if (!isModal || readOnly) return
    if (e.button != null && e.button !== 0) return

    const target = e.target
    const isInteractive =
      target?.closest?.('button, a, input, textarea, select, [role="button"], [data-no-modal-drag]')
    if (isInteractive) return

    e.preventDefault()
    modalDragRef.current.isDragging = true
    modalDragRef.current.startX = e.clientX
    modalDragRef.current.startY = e.clientY
    modalDragRef.current.originX = modalOffset.x
    modalDragRef.current.originY = modalOffset.y
  }, [isModal, readOnly, modalOffset.x, modalOffset.y])

  const handleExternalDragOver = useCallback((e) => {
    if (!acceptExternalDrop || readOnly || isSubmitMode) return
    e.preventDefault()
  }, [acceptExternalDrop, readOnly, isSubmitMode])

  const handleExternalDrop = useCallback((e) => {
    if (!acceptExternalDrop || readOnly || isSubmitMode) return
    e.preventDefault()
    e.stopPropagation()

    const itemDataStr =
      e.dataTransfer?.getData('itemData') ||
      e.dataTransfer?.getData('text/plain')
    if (!itemDataStr) return

    try {
      const parsed = JSON.parse(itemDataStr)
      const type = parsed?.type
      const data = parsed?.data

      const rect = boardRef.current?.getBoundingClientRect()
      if (!rect) {
        if (type === 'evidence') addEvidenceItem(data)
        if (type === 'suspect') addSuspectItem(data)
        if (type === 'location') addLocationItem(data)
        return
      }

      const point = {
        x: e.clientX - rect.left - 88,
        y: e.clientY - rect.top - 100,
      }

      if (type === 'evidence') addEvidenceItem(data, point)
      if (type === 'suspect') addSuspectItem(data, point)
      if (type === 'location') addLocationItem(data, point)
    } catch {
      // ignore invalid drops
    }
  }, [acceptExternalDrop, readOnly, isSubmitMode, addEvidenceItem, addSuspectItem, addLocationItem])

  useEffect(() => {
    if (!pendingAddItem) return
    if (readOnly || isSubmitMode) return

    const rect = boardRef.current?.getBoundingClientRect()
    const dropClientX = pendingAddItem?.dropClientX
    const dropClientY = pendingAddItem?.dropClientY
    const hasDropPoint =
      rect &&
      Number.isFinite(dropClientX) &&
      Number.isFinite(dropClientY)

    const point = hasDropPoint
      ? {
          x: dropClientX - rect.left - 88,
          y: dropClientY - rect.top - 100,
        }
      : undefined

    if (pendingAddItem.type === 'evidence') addEvidenceItem(pendingAddItem.data, point)
    if (pendingAddItem.type === 'suspect') addSuspectItem(pendingAddItem.data, point)
    if (pendingAddItem.type === 'location') addLocationItem(pendingAddItem.data, point)
    onConsumePendingAddItem?.()
  }, [pendingAddItem, readOnly, isSubmitMode, addEvidenceItem, addSuspectItem, addLocationItem, onConsumePendingAddItem])

  const handleMouseDown = (e, itemId) => {
    if (readOnly) return
    e.preventDefault()
    const item = boardItems.find(i => i.id === itemId)
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

    setBoardItems(prev => prev.map(item => {
      if (item.id === dragRef.current.itemId) {
        const newX = Math.max(0, Math.min(maxX, dragRef.current.offsetX + deltaX))
        const newY = Math.max(0, Math.min(maxY, dragRef.current.offsetY + deltaY))
        return { ...item, x: newX, y: newY }
      }
      return item
    }))
  }, [readOnly])

  const handleMouseUp = useCallback(() => {
    dragRef.current.isDragging = false
    dragRef.current.itemId = null
    document.body.style.cursor = ''
  }, [])

  const toggleLineMode = useCallback((nextMode) => {
    if (readOnly) return
    if (!effectiveAllowedLineModes.includes(nextMode)) return
    setLineMode((prev) => (prev === nextMode ? null : nextMode))
    setPendingConnectFrom(null)
    setSelectedConnectionKey(null)
    setSelectedConnectionPos(null)
  }, [readOnly, effectiveAllowedLineModes])

  const handleCardClick = useCallback((itemId) => {
    if (readOnly) return
    if (dragRef.current.didMove) return

    setSelectedItem(itemId)
    setSelectedConnectionKey(null)
    setSelectedConnectionPos(null)

    if (!lineMode) return
    if (!effectiveAllowedLineModes.includes(lineMode)) return

    if (!pendingConnectFrom) {
      setPendingConnectFrom(itemId)
      return
    }

    if (pendingConnectFrom === itemId) {
      setPendingConnectFrom(null)
      return
    }

    upsertConnection(pendingConnectFrom, itemId, lineMode)
    setPendingConnectFrom(null)
  }, [readOnly, lineMode, pendingConnectFrom, upsertConnection, effectiveAllowedLineModes])

  useEffect(() => {
    if (!lineMode) return
    if (effectiveAllowedLineModes.includes(lineMode)) return
    setLineMode(null)
    setPendingConnectFrom(null)
  }, [effectiveAllowedLineModes, lineMode])

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [handleMouseMove, handleMouseUp])

  useEffect(() => {
    if (!storageEnabled) return

    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current)
    autosaveTimerRef.current = setTimeout(() => {
      localStorage.setItem(`board-items-${scenarioId}`, JSON.stringify(boardItems))
      localStorage.setItem(`board-connections-${scenarioId}`, JSON.stringify(connections))
    }, 200)

    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current)
    }
  }, [scenarioId, storageEnabled, boardItems, connections])

  const handleSave = () => {
    if (!storageEnabled) return
    setSaveStatus('saving')
    localStorage.setItem(`board-items-${scenarioId}`, JSON.stringify(boardItems))
    localStorage.setItem(`board-connections-${scenarioId}`, JSON.stringify(connections))
    setTimeout(() => {
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus(null), 2000)
    }, 500)
  }

  useEffect(() => {
  if (readOnly) return
  if (!victim || victim.id == null) return

  // submit 모드/개인 모드 둘 다 victim은 떠도 됨 (원하면 submit만/개인만 조건 걸어도 됨)
  const hasVictim = boardItems.some((it) => it?.type === 'victim' && String(it.victimId ?? '') === String(victim.id))
  if (hasVictim) return

  // 보드가 아직 초기화 전이면(빈 배열로 잠깐) 여기서 넣어버리면 중복될 수 있어서,
  // "초기화 완료 후" 느낌으로 한번만 넣고 싶으면 조건을 하나 더 둬도 됨.
  // 지금은 단순하게: victim 없으면 삽입.
  addVictimItem(victim)
}, [victim?.id, readOnly, boardItems, addVictimItem])


  useEffect(() => {
    if (!isSubmitMode) return
    setFilter('all')
  }, [isSubmitMode])

  const filteredItems = boardItems.filter((item) => {
    if (isSubmitMode && item.type === 'note') return false
    // 피해자 카드는 항상 표시
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
        <h2 className="text-xl font-bold gold-glow">{title}</h2>
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

          {!hideSave && storageEnabled && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSave}
              disabled={saveStatus === 'saving'}
            >
              {saveStatus === 'saving' ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-primary border-t-transparent rounded-full animate-spin" />
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

          {!hideFilter && !isSubmitMode && (
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="h-9 bg-muted/40 border border-border rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {filterOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          )}

          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* 보드 */}
      <div
        ref={boardRef}
        className="relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8f8f8 100%)',
          boxShadow: 'inset 0 0 30px rgba(0,0,0,0.08)',
        }}
      >
	        <div
	          className="relative w-full h-[600px]"
	          onClick={() => {
	            setSelectedConnectionKey(null)
	            setSelectedConnectionPos(null)
	          }}
	          onDragOver={acceptExternalDrop && !readOnly ? handleExternalDragOver : undefined}
	          onDrop={acceptExternalDrop && !readOnly ? handleExternalDrop : undefined}
	        >
          {/* 그리드 */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `
                linear-gradient(rgba(0,0,0,0.015) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0,0,0,0.015) 1px, transparent 1px)
              `,
              backgroundSize: '30px 30px',
            }}
          />

          {/* 연결선 */}
          <svg
            className="absolute top-0 left-0 w-full h-full"
            style={{ zIndex: 1, pointerEvents: 'none' }}
          >
            {connections.map((conn) => {
              if (!conn?.from || !conn?.to) return null

              const fromItem = boardItems.find((item) => item.id === conn.from)
              const toItem = boardItems.find((item) => item.id === conn.to)
              if (!fromItem || !toItem) return null

              const key = getConnectionKey(conn.from, conn.to)
              const hash = hashString(key)

              const fromX = fromItem.x + 88
              const fromY = fromItem.y + 100
              const toX = toItem.x + 88
              const toY = toItem.y + 100

              const midX = (fromX + toX) / 2
              const midY = (fromY + toY) / 2

              const controlX = midX + ((hash % 7) - 3) * 10
              const controlY = midY - 50 + ((hash % 5) - 2) * 5

              const pathD = `M ${fromX} ${fromY} Q ${controlX} ${controlY} ${toX} ${toY}`

              const type = conn.type === 'suspected' ? 'suspected' : 'confirmed'
              const strokeColor = type === 'confirmed' ? '#dc2626' : '#f59e0b'
              const strokeWidth = type === 'confirmed' ? 4 : 3
              const strokeDasharray = type === 'suspected' ? '8 8' : undefined

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
                      setPendingConnectFrom(null)
                      setSelectedItem(null)
                      setSelectedConnectionPos({ x: controlX, y: controlY })
                      setSelectedConnectionKey((prev) => (prev === key ? null : key))
                    }}
                  />
                  <path
                    d={pathD}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeDasharray={strokeDasharray}
                    fill="none"
                    style={{
                      pointerEvents: 'none',
                      filter: 'drop-shadow(3px 3px 6px rgba(0,0,0,0.4))',
                    }}
                  />
                </g>
              )
            })}
          </svg>

          {!readOnly && selectedConnectionKey && selectedConnectionPos && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                removeConnectionByKey(selectedConnectionKey)
                setSelectedConnectionKey(null)
                setSelectedConnectionPos(null)
              }}
              aria-label="연결 삭제"
              title="삭제"
              className="absolute w-7 h-7 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 flex items-center justify-center text-sm border border-white/20"
              style={{
                left: `${selectedConnectionPos.x}px`,
                top: `${selectedConnectionPos.y}px`,
                transform: 'translate(-50%, -50%)',
                zIndex: 5,
              }}
            >
              ✕
            </button>
          )}

          {/* 아이템 */}
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className={cn(
                "absolute group select-none",
                lineMode && pendingConnectFrom === item.id && (
                  lineMode === 'confirmed' ? "ring-2 ring-red-500" : "ring-2 ring-amber-500"
                ),
                !readOnly && "cursor-move"
              )}
              style={{
                left: `${item.x}px`,
                top: `${item.y}px`,
                zIndex: selectedItem === item.id ? 10 : 2,
              }}
              onMouseDown={(e) => handleMouseDown(e, item.id)}
              onClick={() => handleCardClick(item.id)}
            >
              {/* 압정 */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                <Pin
                  className="w-6 h-6 text-red-600 fill-red-600"
                  style={{ filter: 'drop-shadow(0 3px 4px rgba(0,0,0,0.5))' }}
                />
              </div>

              {/* 카드 */}
              <div
                className="w-44 relative transition-transform duration-300"
                style={{
                  transform: selectedItem === item.id
                    ? 'scale(1.05) rotate(0deg)'
                    : `rotate(${(hashString(item.id) % 2 === 0 ? 1 : -1) * 2}deg)`,
                }}
              >
                {item.image ? (
                  <div
                    className="bg-white p-2 pb-10"
                    style={{ boxShadow: '4px 4px 12px rgba(0,0,0,0.25)' }}
                  >
                    <img 
                      src={item.image}
                      alt={item.name}
                      className="w-full h-32 object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none'
                        e.target.nextSibling.style.display = 'flex'
                      }}
                    />
                    <div 
                      className="w-full h-32 bg-gray-200 items-center justify-center text-gray-400 text-xs hidden"
                    >
                      [이미지]
                    </div>
                    <p className="text-center mt-2 text-sm text-gray-800 font-bold">
                      {item.name}
                    </p>
                    {item.note && (
                      <p className="text-center text-xs text-gray-500 mt-1 whitespace-pre-line">
                        {item.note}
                      </p>
                    )}
                  </div>
                ) : (
                  <div
                    className="p-4 min-h-[180px]"
                    style={{
                      background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                      boxShadow: '4px 4px 10px rgba(0,0,0,0.2)',
                    }}
                  >
                    <h3 className="text-sm font-bold mb-2 text-gray-900">
                      {item.name}
                    </h3>
                    <p className="text-xs text-gray-700 whitespace-pre-line leading-relaxed">
                      {item.note}
                    </p>
                  </div>
                )}
              </div>

              {/* 삭제 버튼 (피해자 제외) */}
              {!readOnly && selectedItem === item.id && item.type !== 'victim' && (
                <button
                  type="button"
                  aria-label="카드 삭제"
                  title="삭제"
                  onMouseDown={(e) => { e.preventDefault(); e.stopPropagation() }}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    removeItemById(item.id)
                  }}
                  className="absolute -top-2 -right-2 w-7 h-7 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 flex items-center justify-center text-sm border border-white/20"
                  style={{ zIndex: 20 }}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

	      {/* 범례 */}
	      <div className="p-4 flex gap-6 justify-center items-center text-sm border-t border-border">
	        <div className="flex items-center gap-2">
	          <div className="w-8 h-1 bg-red-600 rounded" />
	          <span className="text-muted-foreground">확정</span>
	        </div>
	        {effectiveAllowedLineModes.includes('suspected') && (
	          <div className="flex items-center gap-2">
	            <div
	              className="w-8 h-1 rounded"
	              style={{ backgroundImage: 'repeating-linear-gradient(90deg, #f59e0b 0, #f59e0b 4px, transparent 4px, transparent 8px)' }}
	            />
	            <span className="text-muted-foreground">의심</span>
	          </div>
	        )}
	      </div>

      <MemoInputModal
        isOpen={memoModalOpen}
        onClose={() => setMemoModalOpen(false)}
        onSubmit={addNoteItem}
      />
    </div>
  )
}
