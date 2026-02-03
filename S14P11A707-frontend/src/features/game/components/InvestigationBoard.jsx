import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import { X, Pin, Save, Check, Plus, Minus, Loader2 } from 'lucide-react'
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
  isActive = true,
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
  fullHeight = false, // 전체 높이 사용 여부
  clues = [],      // 단서 목록 (API 응답에서 상세정보 조회용)
  suspects = [],   // 용의자 목록 (API 응답에서 상세정보 조회용)
  rooms = [],      // 장소 목록 (API 응답에서 상세정보 조회용)
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
  const [hoveredItem, setHoveredItem] = useState(null) // 호버된 카드 ID
  const [zoom, setZoom] = useState(1)

  const boardRef = useRef(null)
  const hoverTimeoutRef = useRef(null) // 호버 1초 딜레이용
  const autosaveTimerRef = useRef(null)
  const pendingConnectFromRef = useRef(null)
  const isLoadedRef = useRef(false)  // 로드 중복 방지
  const zoomRef = useRef(1)
  const panRef = useRef({
    isPanning: false,
    startX: 0,
    startY: 0,
    startScrollLeft: 0,
    startScrollTop: 0,
    didMove: false,
  })
  const didAutoCenterVictimRef = useRef(false)
  const didAutoFitSubmitRef = useRef(false)

  useEffect(() => {
    didAutoCenterVictimRef.current = false
  }, [victim?.id, sessionId, scenarioId])
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

  const BOARD_BASE_WIDTH = 1600
  const BOARD_BASE_HEIGHT = 1200
  const CARD_WIDTH = 176
  const CARD_HEIGHT = 200
  const CARD_HALF_WIDTH = CARD_WIDTH / 2
  const CARD_HALF_HEIGHT = CARD_HEIGHT / 2
  const MIN_ZOOM = 0.6
  const MAX_ZOOM = 1.8
  const ZOOM_STEP = 0.1

  useEffect(() => {
    zoomRef.current = zoom
  }, [zoom])

  const getViewportCenterWorld = useCallback(() => {
    const el = boardRef.current
    const rect = el?.getBoundingClientRect()
    const currentZoom = zoomRef.current || 1

    if (!el || !rect) {
      return { x: BOARD_BASE_WIDTH / 2, y: BOARD_BASE_HEIGHT / 2 }
    }

    return {
      x: (el.scrollLeft + rect.width / 2) / currentZoom,
      y: (el.scrollTop + rect.height / 2) / currentZoom,
    }
  }, [])

  const getWorldTopLeftFromClient = useCallback((clientX, clientY) => {
    const el = boardRef.current
    const rect = el?.getBoundingClientRect()
    const currentZoom = zoomRef.current || 1
    if (!el || !rect) return null

    const worldX = (clientX - rect.left + el.scrollLeft) / currentZoom
    const worldY = (clientY - rect.top + el.scrollTop) / currentZoom
    return { x: worldX - CARD_HALF_WIDTH, y: worldY - CARD_HALF_HEIGHT }
  }, [])

  const zoomTo = useCallback((nextZoom, options = {}) => {
    const el = boardRef.current
    const rect = el?.getBoundingClientRect()
    const prevZoom = zoomRef.current || 1

    const clamped = clamp(Number(nextZoom) || 1, MIN_ZOOM, MAX_ZOOM)

    if (!el || !rect) {
      zoomRef.current = clamped
      setZoom(clamped)
      return
    }

    const anchorClientX = Number.isFinite(Number(options.clientX)) ? Number(options.clientX) : rect.left + rect.width / 2
    const anchorClientY = Number.isFinite(Number(options.clientY)) ? Number(options.clientY) : rect.top + rect.height / 2
    const anchorX = anchorClientX - rect.left
    const anchorY = anchorClientY - rect.top

    const worldX = (el.scrollLeft + anchorX) / prevZoom
    const worldY = (el.scrollTop + anchorY) / prevZoom

    zoomRef.current = clamped
    setZoom(clamped)
    requestAnimationFrame(() => {
      const nextEl = boardRef.current
      if (!nextEl) return
      nextEl.scrollLeft = worldX * clamped - anchorX
      nextEl.scrollTop = worldY * clamped - anchorY
    })
  }, [])

  const handleBoardWheelZoom = useCallback((e) => {
    if (!boardRef.current) return
    if (!Number.isFinite(e?.deltaY) || e.deltaY === 0) return

    e.preventDefault()

    const direction = e.deltaY < 0 ? 1 : -1
    const nextZoom = (zoomRef.current || 1) + direction * ZOOM_STEP
    zoomTo(nextZoom, { clientX: e.clientX, clientY: e.clientY })
  }, [zoomTo])

  useEffect(() => {
    const el = boardRef.current
    if (!el || isSubmitMode) return

    // React wheel 이벤트는 passive일 수 있어 직접 등록
    el.addEventListener('wheel', handleBoardWheelZoom, { passive: false })
    return () => {
      el.removeEventListener('wheel', handleBoardWheelZoom)
    }
  }, [handleBoardWheelZoom, isSubmitMode])

  useEffect(() => {
    if (!isSubmitMode) return
    if (didAutoFitSubmitRef.current) return

    const el = boardRef.current
    if (!el) return

    const items = boardItems.filter((item) => item?.type && item.type !== 'note')
    if (items.length === 0) return

    const rect = el.getBoundingClientRect()
    if (!rect?.width || !rect?.height) return

    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity

    items.forEach((item) => {
      const x = Number(item?.x) || 0
      const y = Number(item?.y) || 0
      minX = Math.min(minX, x)
      minY = Math.min(minY, y)
      maxX = Math.max(maxX, x + CARD_WIDTH)
      maxY = Math.max(maxY, y + CARD_HEIGHT)
    })

    if (!Number.isFinite(minX) || !Number.isFinite(minY) || !Number.isFinite(maxX) || !Number.isFinite(maxY)) {
      return
    }

    didAutoFitSubmitRef.current = true

    const padding = 56
    const contentWidth = Math.max(1, (maxX - minX) + padding * 2)
    const contentHeight = Math.max(1, (maxY - minY) + padding * 2)

    const fitZoomRaw = Math.min(rect.width / contentWidth, rect.height / contentHeight)
    const nextZoom = clamp(fitZoomRaw, 0.35, 1)

    zoomRef.current = nextZoom
    setZoom(nextZoom)

    requestAnimationFrame(() => {
      const nextEl = boardRef.current
      if (!nextEl) return
      const nextRect = nextEl.getBoundingClientRect()
      const centerX = (minX + maxX) / 2
      const centerY = (minY + maxY) / 2
      const targetScrollLeft = centerX * nextZoom - nextRect.width / 2
      const targetScrollTop = centerY * nextZoom - nextRect.height / 2

      nextEl.scrollLeft = clamp(targetScrollLeft, 0, nextEl.scrollWidth - nextRect.width)
      nextEl.scrollTop = clamp(targetScrollTop, 0, nextEl.scrollHeight - nextRect.height)
    })
  }, [isSubmitMode, boardItems])

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
  const loadBoardFromApi = useCallback(async () => {
    console.log('[InvestigationBoard] loadBoardFromApi 호출됨 - sessionId:', sessionId, 'isLoadedRef:', isLoadedRef.current)

    if (!sessionId) {
      console.log('[InvestigationBoard] sessionId 없음 - 스킵')
      return false
    }

    // 이미 로드 중이면 스킵
    if (isLoadedRef.current) {
      console.log('[InvestigationBoard] 이미 로드됨 - 스킵')
      return false
    }

    isLoadedRef.current = true
    setIsLoading(true)
    console.log('[InvestigationBoard] API 호출 시작 - sessionId:', sessionId)

    try {
      const response = await fetchBoard(sessionId)
      console.log('[InvestigationBoard] API 응답:', response)

      if (!response?.nodes?.length) {
        // API에 데이터 없으면 빈 보드로 시작 (localStorage 폴백 제거 - 깨진 데이터 방지)
        console.log('[InvestigationBoard] API 데이터 없음 - 빈 보드로 시작')
        setBoardItems([])
        setConnections([])
        return false
      }

      // API 데이터를 UI 형식으로 변환 (상세정보 조회)
      const uiItems = response.nodes.map(node => {
        const nodeId = node.nodeId
        let type = 'note'
        let id = `note-${nodeId}`
        let extraProps = {}
        let name = node.memoContent || ''
        let image = null
        let note = node.memoContent || ''

        if (node.type === 'CLUE') {
          type = 'evidence'
          id = `evidence-${node.targetId}`
          extraProps = { evidenceId: node.targetId }
          // clues 목록에서 상세정보 조회
          const clueData = clues.find(c => c.id === node.targetId)
          if (clueData) {
            name = clueData.name || clueData.title || name
            image = clueData.image || clueData.detailImageUrl || clueData.imageUrl || null
            note = clueData.description || clueData.location || note
          }
        } else if (node.type === 'SUSPECT') {
          type = 'suspect'
          id = `suspect-${node.targetId}`
          extraProps = { suspectId: node.targetId }
          // suspects 목록에서 상세정보 조회
          const suspectData = suspects.find(s => s.id === node.targetId)
          if (suspectData) {
            name = suspectData.name || name
            image = suspectData.image || suspectData.portraitUrl || null
            extraProps.role = suspectData.role || suspectData.occupation || ''
            note = suspectData.oneLiner || note
          }
        } else if (node.type === 'VICTIM') {
          type = 'victim'
          id = `victim-${node.targetId}`
          extraProps = { victimId: node.targetId }
          // victim prop에서 상세정보 조회
          if (victim && (victim.id === node.targetId || !node.targetId)) {
            name = victim.name || '피해자'
            image = victim.portraitUrl || victim.image || null
            extraProps.occupation = victim.occupation || ''
            note = victim.background || note
          }
        } else if (node.type === 'LOCATION') {
          type = 'location'
          id = `location-${node.targetId}`
          extraProps = { locationId: node.targetId }
          // rooms 목록에서 상세정보 조회
          const roomData = rooms.find(r => r.id === node.targetId || r.floor === node.targetId)
          if (roomData) {
            name = roomData.name || name
            image = roomData.image || null
            extraProps.floorNumber = roomData.floorNumber || roomData.floor || roomData.id
            note = roomData.description || note
          }
        }

        return {
          id,
          type,
          name: name || type,
          x: node.x || 0,
          y: node.y || 0,
          image,
          note,
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
      // 실패 시 빈 보드로 시작 (localStorage 폴백 제거 - 깨진 데이터 방지)
      console.log('[InvestigationBoard] API 실패 - 빈 보드로 시작')
      setBoardItems([])
      setConnections([])
      return false
    } finally {
      setIsLoading(false)
    }
  }, [sessionId, loadFromLocalStorage, saveToLocalStorage, clues, suspects, rooms, victim])

  // ========================================
  // 초기 데이터 로드
  // ========================================
  useEffect(() => {
    //  sessionId 변경 시 플래그 먼저 리셋 (API 호출 전에!)
    isLoadedRef.current = false

    if (Array.isArray(initialBoardItems) || Array.isArray(initialConnections)) {
      setBoardItems(Array.isArray(initialBoardItems) ? initialBoardItems : [])
      setConnections(Array.isArray(initialConnections) ? initialConnections : [])
      return
    }

    if (sessionId) {
      console.log('[InvestigationBoard] sessionId 변경 감지 - API 로드 시작:', sessionId)
      loadBoardFromApi()
    } else {
      // sessionId 없을 때는 빈 보드로 시작
      setBoardItems([])
      setConnections([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, initialBoardItems, initialConnections])

  // ========================================
  // 보드 아이템 상세정보 보강 (clues/suspects/rooms가 늦게 로드될 경우)
  // ========================================
  useEffect(() => {
    if (boardItems.length === 0) return
    // 상세정보가 누락된 아이템이 있는지 확인
    const needsEnrichment = boardItems.some(item => {
      if (item.type === 'evidence' && item.evidenceId && !item.image && clues.length > 0) return true
      if (item.type === 'suspect' && item.suspectId && !item.image && suspects.length > 0) return true
      if (item.type === 'location' && item.locationId && !item.image && rooms.length > 0) return true
      if (item.type === 'victim' && item.victimId && !item.image && victim) return true
      return false
    })

    if (!needsEnrichment) return

    // 상세정보 보강
    setBoardItems(prev => prev.map(item => {
      if (item.type === 'evidence' && item.evidenceId) {
        const clueData = clues.find(c => c.id === item.evidenceId)
        if (clueData && !item.image) {
          return {
            ...item,
            name: clueData.name || clueData.title || item.name,
            image: clueData.image || clueData.detailImageUrl || clueData.imageUrl || null,
            note: clueData.description || clueData.location || item.note,
          }
        }
      }
      if (item.type === 'suspect' && item.suspectId) {
        const suspectData = suspects.find(s => s.id === item.suspectId)
        if (suspectData && !item.image) {
          return {
            ...item,
            name: suspectData.name || item.name,
            image: suspectData.image || suspectData.portraitUrl || null,
            role: suspectData.role || suspectData.occupation || item.role || '',
            note: suspectData.oneLiner || item.note,
          }
        }
      }
      if (item.type === 'location' && item.locationId) {
        const roomData = rooms.find(r => r.id === item.locationId || r.floor === item.locationId)
        if (roomData && !item.image) {
          return {
            ...item,
            name: roomData.name || item.name,
            image: roomData.image || null,
            floorNumber: roomData.floorNumber || roomData.floor || roomData.id,
            note: roomData.description || item.note,
          }
        }
      }
      if (item.type === 'victim' && item.victimId && victim) {
        if (!item.image) {
          return {
            ...item,
            name: victim.name || item.name,
            image: victim.portraitUrl || victim.image || null,
            occupation: victim.occupation || item.occupation || '',
            note: victim.background || item.note,
          }
        }
      }
      return item
    }))
  }, [clues, suspects, rooms, victim, boardItems.length])

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

    const center = getViewportCenterWorld()
    const fallbackX = center.x - CARD_HALF_WIDTH
    const fallbackY = center.y - CARD_HALF_HEIGHT
    const maxX = Math.max(0, BOARD_BASE_WIDTH - CARD_WIDTH)
    const maxY = Math.max(0, BOARD_BASE_HEIGHT - CARD_HEIGHT)

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
        image: evidence.image || evidence.detailImageUrl || evidence.imageUrl || null,
        note: evidence.description || evidence.location || '',
      }
      setSelectedItem(nextItemId)
      return [...prev, nextItem]
    })
  }, [readOnly, getViewportCenterWorld])

  const addSuspectItem = useCallback((suspect, { x, y } = {}) => {
    if (readOnly || !suspect?.id) return

    const center = getViewportCenterWorld()
    const fallbackX = center.x - CARD_HALF_WIDTH
    const fallbackY = center.y - CARD_HALF_HEIGHT
    const maxX = Math.max(0, BOARD_BASE_WIDTH - CARD_WIDTH)
    const maxY = Math.max(0, BOARD_BASE_HEIGHT - CARD_HEIGHT)

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
  }, [readOnly, getViewportCenterWorld])

  const addLocationItem = useCallback((location, { x, y } = {}) => {
    if (readOnly || !location?.id) return

    const center = getViewportCenterWorld()
    const fallbackX = center.x - CARD_HALF_WIDTH
    const fallbackY = center.y - CARD_HALF_HEIGHT
    const maxX = Math.max(0, BOARD_BASE_WIDTH - CARD_WIDTH)
    const maxY = Math.max(0, BOARD_BASE_HEIGHT - CARD_HEIGHT)

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
  }, [readOnly, getViewportCenterWorld])

  const addVictimItem = useCallback((victimData, { x, y } = {}) => {
    if (readOnly || !victimData?.id) return

    const center = getViewportCenterWorld()
    const fallbackX = center.x - CARD_HALF_WIDTH
    const fallbackY = center.y - CARD_HALF_HEIGHT
    const maxX = Math.max(0, BOARD_BASE_WIDTH - CARD_WIDTH)
    const maxY = Math.max(0, BOARD_BASE_HEIGHT - CARD_HEIGHT)

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
  }, [readOnly, getViewportCenterWorld])

  const addNoteItem = useCallback((text, { x, y } = {}) => {
    if (readOnly || isSubmitMode || !allowMemo) return
    const normalized = String(text ?? '').trim()
    if (!normalized) return

    const center = getViewportCenterWorld()
    const fallbackX = center.x - CARD_HALF_WIDTH
    const fallbackY = center.y - CARD_HALF_HEIGHT
    const maxX = Math.max(0, BOARD_BASE_WIDTH - CARD_WIDTH)
    const maxY = Math.max(0, BOARD_BASE_HEIGHT - CARD_HEIGHT)

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
  }, [readOnly, isSubmitMode, allowMemo, getViewportCenterWorld])

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
      const point = getWorldTopLeftFromClient(e.clientX, e.clientY) || {}

      if (type === 'evidence') addEvidenceItem(data, point)
      if (type === 'suspect') addSuspectItem(data, point)
      if (type === 'location') addLocationItem(data, point)
    } catch {}
  }, [acceptExternalDrop, readOnly, isSubmitMode, addEvidenceItem, addSuspectItem, addLocationItem, getWorldTopLeftFromClient])

  // pendingAddItem 처리
  useEffect(() => {
    if (!pendingAddItem || readOnly || isSubmitMode) return

    const point =
      Number.isFinite(pendingAddItem.dropClientX) && Number.isFinite(pendingAddItem.dropClientY)
        ? (getWorldTopLeftFromClient(pendingAddItem.dropClientX, pendingAddItem.dropClientY) || {})
        : {}

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

    const currentZoom = zoomRef.current || 1
    const deltaX = (e.clientX - dragRef.current.startX) / currentZoom
    const deltaY = (e.clientY - dragRef.current.startY) / currentZoom
    if (!dragRef.current.didMove && (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3)) {
      dragRef.current.didMove = true
    }

    const maxX = Math.max(0, BOARD_BASE_WIDTH - CARD_WIDTH)
    const maxY = Math.max(0, BOARD_BASE_HEIGHT - CARD_HEIGHT)

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

      const center = getViewportCenterWorld()
      const fallbackX = center.x - CARD_HALF_WIDTH
      const fallbackY = center.y - CARD_HALF_HEIGHT
      const maxX = Math.max(0, BOARD_BASE_WIDTH - CARD_WIDTH)
      const maxY = Math.max(0, BOARD_BASE_HEIGHT - CARD_HEIGHT)

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
  }, [victim?.id, readOnly, isLoading, getViewportCenterWorld])

  useEffect(() => {
    if (!fullHeight || !isActive) return
    if (didAutoCenterVictimRef.current) return

    const el = boardRef.current
    if (!el) return

    const victimItemId = victim?.id ? `victim-${victim.id}` : null
    const victimItem =
      boardItems.find((item) => item?.type === 'victim' && item?.victimId === victim?.id) ??
      (victimItemId ? boardItems.find((item) => item?.id === victimItemId) : null)

    if (!victimItem) return

    didAutoCenterVictimRef.current = true

    const centerVictim = () => {
      const rect = el.getBoundingClientRect()
      if (!rect?.width || !rect?.height) return

      const currentZoom = zoomRef.current || 1
      const worldCenterX = (victimItem.x || 0) + CARD_HALF_WIDTH
      const worldCenterY = (victimItem.y || 0) + CARD_HALF_HEIGHT
      const targetScrollLeft = worldCenterX * currentZoom - rect.width / 2
      const targetScrollTop = worldCenterY * currentZoom - rect.height / 2

      el.scrollLeft = clamp(targetScrollLeft, 0, el.scrollWidth - rect.width)
      el.scrollTop = clamp(targetScrollTop, 0, el.scrollHeight - rect.height)
    }

    requestAnimationFrame(() => {
      centerVictim()
      window.setTimeout(centerVictim, 350)
    })
  }, [fullHeight, isActive, victim?.id, boardItems, clamp])

  const handleBoardPointerDown = useCallback((e) => {
    const el = boardRef.current
    if (!el || e.button !== 0) return

    // 카드/버튼 등 위에서는 pan 시작 금지 (DnD 우선)
    if (e.target?.closest?.('[data-board-item], button, a, input, textarea, [data-no-board-pan]')) return

    panRef.current = {
      isPanning: true,
      startX: e.clientX,
      startY: e.clientY,
      startScrollLeft: el.scrollLeft,
      startScrollTop: el.scrollTop,
      didMove: false,
    }

    try {
      el.setPointerCapture?.(e.pointerId)
    } catch {
      // ignore
    }

    e.preventDefault()
    document.body.style.cursor = 'grabbing'
  }, [])

  const handleBoardPointerMove = useCallback((e) => {
    const el = boardRef.current
    if (!el || !panRef.current.isPanning) return

    const dx = e.clientX - panRef.current.startX
    const dy = e.clientY - panRef.current.startY

    if (!panRef.current.didMove && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
      panRef.current.didMove = true
    }

    el.scrollLeft = panRef.current.startScrollLeft - dx
    el.scrollTop = panRef.current.startScrollTop - dy
  }, [])

  const handleBoardPointerUp = useCallback(() => {
    if (!panRef.current.isPanning) return
    panRef.current.isPanning = false
    document.body.style.cursor = ''
  }, [])

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
      className={cn("bg-card rounded-lg flex flex-col", fullHeight && "h-full min-h-0", isModal && "p-0")}
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

          {!isSubmitMode && (
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => zoomTo(zoom - ZOOM_STEP)}
                title="축소"
              >
                <Minus className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="font-mono px-3"
                onClick={() => zoomTo(1)}
                title="줌 리셋"
              >
                {Math.round(zoom * 100)}%
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => zoomTo(zoom + ZOOM_STEP)}
                title="확대"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
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
        className={cn(
          "relative",
          isSubmitMode ? "overflow-hidden pointer-events-none" : "overflow-auto",
          fullHeight && !isSubmitMode && "no-scrollbar",
          fullHeight && "flex-1 min-h-0"
        )}
        style={{
          height: fullHeight ? undefined : (isModal ? '65vh' : (isSubmitMode ? 'min(420px, 45vh)' : '500px')),
          overscrollBehavior: 'contain',
        }}
        onDragOver={handleExternalDragOver}
        onDrop={handleExternalDrop}
        onPointerDown={handleBoardPointerDown}
        onPointerMove={handleBoardPointerMove}
        onPointerUp={handleBoardPointerUp}
        onPointerCancel={handleBoardPointerUp}
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

        <div
          className="relative"
          style={{
            width: `${BOARD_BASE_WIDTH * zoom}px`,
            height: `${BOARD_BASE_HEIGHT * zoom}px`,
          }}
        >
          <div
            className="relative"
            style={{
              width: `${BOARD_BASE_WIDTH}px`,
              height: `${BOARD_BASE_HEIGHT}px`,
              transform: `scale(${zoom})`,
              transformOrigin: '0 0',
              backgroundImage: 'url(/board/board.jpg)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {/* 연결선 - 확정은 실 이미지, 의심은 점선 */}
            {connections.map(conn => {
              if (!conn?.from || !conn?.to) return null
              const fromItem = boardItems.find(item => item.id === conn.from)
              const toItem = boardItems.find(item => item.id === conn.to)
              if (!fromItem || !toItem) return null

              const key = getConnectionKey(conn.from, conn.to)
              const isConfirmed = conn.type !== 'suspected'
              const fromX = fromItem.x + CARD_HALF_WIDTH, fromY = fromItem.y + CARD_HALF_HEIGHT
              const toX = toItem.x + CARD_HALF_WIDTH, toY = toItem.y + CARD_HALF_HEIGHT
              const dx = toX - fromX, dy = toY - fromY
              const distance = Math.sqrt(dx * dx + dy * dy)
              const angle = Math.atan2(dy, dx) * 180 / Math.PI
              const midX = (fromX + toX) / 2, midY = (fromY + toY) / 2
              const isSelected = selectedConnectionKey === key

              // 확정 연결선: 실 이미지 사용 (튜토리얼과 동일)
              if (isConfirmed) {
                const sag = Math.min(distance * 0.08, 25)
                return (
                  <div
                    key={key}
                    className={cn("absolute cursor-pointer", isSelected && "z-10")}
                    style={{
                      left: midX,
                      top: midY,
                      width: distance,
                      height: 40,
                      transform: `translate(-50%, -50%) rotate(${angle}deg)`,
                      transformOrigin: 'center center',
                    }}
                    onClick={(e) => {
                      e.stopPropagation()
                      setPendingConnectFromWithRef(null)
                      setSelectedItem(null)
                      setSelectedConnectionPos({ x: midX, y: midY })
                      setSelectedConnectionKey(prev => prev === key ? null : key)
                    }}
                  >
                    <div
                      className="w-full h-full relative"
                      style={{
                        backgroundImage: 'url(/board/thread.png)',
                        backgroundSize: 'auto 100%',
                        backgroundRepeat: 'repeat-x',
                        backgroundPosition: 'center',
                        filter: isSelected ? 'brightness(1.5) drop-shadow(0 0 4px white)' : 'drop-shadow(1px 2px 2px rgba(0,0,0,0.3))',
                        borderRadius: `0 0 ${sag}px ${sag}px`,
                        transform: `scaleY(${1 + sag/50})`,
                      }}
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-white/30 rounded animate-pulse" />
                    )}
                  </div>
                )
              }

              // 의심 연결선: 기존 SVG 점선 유지
              const hash = hashString(key)
              const controlX = midX + ((hash % 7) - 3) * 10
              const controlY = midY - 50 + ((hash % 5) - 2) * 5
              const pathD = `M ${fromX} ${fromY} Q ${controlX} ${controlY} ${toX} ${toY}`

              return (
                <svg key={key} className="absolute inset-0 w-full h-full pointer-events-none" style={{ minWidth: '100%', minHeight: '100%', zIndex: isSelected ? 10 : 1 }}>
                  <path
                    d={pathD}
                    stroke="transparent"
                    strokeWidth={20}
                    fill="none"
                    style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
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
                    stroke="#f59e0b"
                    strokeWidth={3}
                    strokeDasharray="8 8"
                    fill="none"
                    style={{ pointerEvents: 'none', filter: isSelected ? 'brightness(1.5) drop-shadow(0 0 4px white)' : 'drop-shadow(3px 3px 6px rgba(0,0,0,0.4))' }}
                  />
                </svg>
              )
            })}

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
                className="absolute w-9 h-9 bg-red-600 text-white rounded-full shadow-xl hover:bg-red-700 flex items-center justify-center text-base font-bold border-2 border-white/50 transition-transform hover:scale-110"
                style={{ left: selectedConnectionPos.x, top: selectedConnectionPos.y, transform: 'translate(-50%, -50%)', zIndex: 200 }}
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
                  data-board-item
                  className={cn(
                    "absolute group select-none",
                    lineMode && pendingConnectFrom === item.id && (lineMode === 'confirmed' ? "ring-4 ring-red-500 ring-offset-2" : "ring-4 ring-amber-500 ring-offset-2"),
                    !readOnly && "cursor-move"
                  )}
                  style={{ left: item.x, top: item.y, zIndex: hoveredItem === item.id ? 50 : (selectedItem === item.id ? 10 : 2) }}
                  onMouseDown={(e) => handleMouseDown(e, item.id)}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleCardClick(item.id)
                  }}
                  onMouseEnter={() => {
                    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
                    hoverTimeoutRef.current = setTimeout(() => {
                      setHoveredItem(item.id)
                    }, 1000) // 1초 딜레이
                  }}
                  onMouseLeave={() => {
                    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
                    setHoveredItem(null)
                  }}
                >
              {/* 호버 툴팁 - 상세정보 (1초 딜레이, 튜토리얼 스타일 그대로) */}
              {hoveredItem === item.id && item.type !== 'note' && (
                <div
                  className="absolute left-full ml-3 top-0 w-64 bg-gray-900 border border-gray-700 rounded-lg shadow-xl p-3 pointer-events-none animate-in fade-in duration-150"
                  style={{ zIndex: 100 }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className={cn("px-2 py-0.5 text-xs font-bold text-white rounded", config.color)}>
                      {config.label}
                    </span>
                    <span className="font-bold text-sm text-white">{item.name}</span>
                  </div>
                  {item.type === 'victim' && (
                    <div className="text-xs space-y-1 text-gray-300">
                      {item.occupation && <p>직업: {item.occupation}</p>}
                      {item.note && <p>배경: {item.note}</p>}
                    </div>
                  )}
                  {item.type === 'suspect' && (
                    <div className="text-xs space-y-1 text-gray-300">
                      {item.role && <p>역할: {item.role}</p>}
                      {item.note && <p className="italic">"{item.note}"</p>}
                    </div>
                  )}
                  {item.type === 'evidence' && (
                    <div className="text-xs text-gray-300">
                      {item.note && <p className="whitespace-pre-line">{item.note}</p>}
                    </div>
                  )}
                  {item.type === 'location' && (
                    <div className="text-xs text-gray-300">
                      {item.floorNumber && <p>층: {item.floorNumber}층</p>}
                      <p>장소명: {item.name}</p>
                      {item.note && <p className="mt-1">{item.note}</p>}
                    </div>
                  )}
                </div>
              )}

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
                        draggable={false}
                        onDragStart={(e) => e.preventDefault()}
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
        </div>
      </div>

      {/* 범례 */}
      {!isSubmitMode && (
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
      )}

      <MemoInputModal isOpen={memoModalOpen} onClose={() => setMemoModalOpen(false)} onSubmit={addNoteItem} />
    </div>
  )
}
