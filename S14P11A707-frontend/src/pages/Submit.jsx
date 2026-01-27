import React, { useState, useMemo } from 'react'
import { useRoute, Link, useLocation } from 'wouter'
import { Button } from '@/components/ui/Button'
import { useScenarioById } from '@/features/scenarios/hooks/useScenarioById'
import { useGameRooms } from '@/features/game/hooks/useGameRooms'
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function Submit() {
  const [, params] = useRoute('/submit/:scenarioId')
  const scenarioId = params?.scenarioId ? parseInt(params.scenarioId) : null
  const [, navigate] = useLocation()

  // 시나리오 정보 조회 (API)
  const { scenario, loading, error } = useScenarioById(scenarioId)

  // 방 정보 조회 (장소 목록용)
  const { rooms } = useGameRooms(scenarioId)

  const [culprit, setCulprit] = useState('')
  const [weapon, setWeapon] = useState('')
  const [method, setMethod] = useState('')
  const [location, setLocation] = useState('')
  const [motive, setMotive] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // 용의자 목록 (시나리오에서 가져옴)
  const suspects = scenario?.suspects || []

  // 증거 목록 (보드 localStorage에서 가져옴)
  const evidences = useMemo(() => {
    if (!scenarioId) return []
    const itemsRaw = localStorage.getItem(`board-items-${scenarioId}`)
    if (!itemsRaw) return []

    try {
      const items = JSON.parse(itemsRaw)
      return items
        .filter(item => item.type === 'evidence')
        .map(item => ({
          id: item.id,
          name: item.name || '증거',
        }))
    } catch {
      return []
    }
  }, [scenarioId])

  // 장소 목록 (방 정보에서 가져옴)
  const locations = useMemo(() => {
    if (!rooms || rooms.length === 0) return []
    return rooms.map(room => ({
      id: room.id,
      name: room.name,
    }))
  }, [rooms])

  const handleSubmit = () => {
    if (!culprit || !weapon || !method || !location || !motive) {
      toast.error('모든 항목을 입력해주세요')
      return
    }

    setSubmitting(true)

    // 제출 데이터를 localStorage에 저장 (게임 종료 시 사용)
    try {
      const submissionData = {
        culprit,
        weapon,
        method,
        location,
        motive,
        submittedAt: new Date().toISOString(),
      }
      localStorage.setItem(`submission-${scenarioId}`, JSON.stringify(submissionData))

      toast.success('제출되었습니다.')

      // 결과 페이지로 이동 (또는 게임 룸으로)
      setTimeout(() => {
        navigate(`/scenarios`)
      }, 1000)
    } catch (err) {
      toast.error('제출에 실패했습니다.')
      setSubmitting(false)
    }
  }

  const isComplete = culprit && weapon && method && location && motive

  // 로딩 상태
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 py-12">
          <div className="container max-w-3xl flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">시나리오 정보를 불러오는 중...</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // 에러 상태
  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 py-12">
          <div className="container max-w-3xl flex items-center justify-center py-20">
            <div className="text-center">
              <p className="text-red-400 mb-4">시나리오 정보를 불러오는데 실패했습니다.</p>
              <Button onClick={() => window.location.href = '/scenarios'}>시나리오 목록</Button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 py-12">
        <div className="container max-w-3xl">
          {/* 헤더 */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold gold-glow mb-4">최종 정답 제출</h1>
            <p className="text-muted-foreground">{scenario?.title || '시나리오'}</p>
          </div>

          {/* 경고 메시지 */}
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-red-400 mb-1">
                [WARNING] 최종 정답은 1회만 제출 가능합니다
              </p>
              <p className="text-sm text-muted-foreground">
                제출 후에는 수정할 수 없으며, 즉시 결과가 확인됩니다. 신중하게 작성해주세요.
              </p>
            </div>
          </div>

          {/* 입력 폼 */}
          <div className="space-y-6">
            {/* 범인 */}
            <div className="bg-card/50 border border-border rounded-lg p-6">
              <h3 className="font-bold mb-2 bracket-left text-primary">범인</h3>
              <p className="text-sm text-muted-foreground mb-4">사건의 범인을 선택하세요</p>
              <select 
                value={culprit} 
                onChange={(e) => setCulprit(e.target.value)}
                className="w-full bg-muted rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">범인 선택</option>
                {suspects.map(s => (
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* 흉기 */}
            <div className="bg-card/50 border border-border rounded-lg p-6">
              <h3 className="font-bold mb-2 bracket-left text-primary">흉기</h3>
              <p className="text-sm text-muted-foreground mb-4">범행에 사용된 흉기를 선택하세요</p>
              <select 
                value={weapon} 
                onChange={(e) => setWeapon(e.target.value)}
                className="w-full bg-muted rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">흉기 선택</option>
                {evidences.map(e => (
                  <option key={e.id} value={e.name}>{e.name}</option>
                ))}
                <option value="기타">기타</option>
              </select>
            </div>

            {/* 범행 방법 */}
            <div className="bg-card/50 border border-border rounded-lg p-6">
              <h3 className="font-bold mb-2 bracket-left text-primary">범행 방법</h3>
              <p className="text-sm text-muted-foreground mb-4">범행이 어떻게 이루어졌는지 설명하세요</p>
              <textarea
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                placeholder="범행 방법을 상세히 설명해주세요..."
                className="w-full bg-muted rounded-lg px-4 py-3 min-h-[120px] focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>

            {/* 범행 장소 */}
            <div className="bg-card/50 border border-border rounded-lg p-6">
              <h3 className="font-bold mb-2 bracket-left text-primary">범행 장소</h3>
              <p className="text-sm text-muted-foreground mb-4">범행이 발생한 장소를 선택하세요</p>
              <select 
                value={location} 
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-muted rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">장소 선택</option>
                {locations.map(l => (
                  <option key={l.id} value={l.name}>{l.name}</option>
                ))}
              </select>
            </div>

            {/* 동기 */}
            <div className="bg-card/50 border border-border rounded-lg p-6">
              <h3 className="font-bold mb-2 bracket-left text-primary">범행 동기</h3>
              <p className="text-sm text-muted-foreground mb-4">범인의 동기를 설명하세요</p>
              <textarea
                value={motive}
                onChange={(e) => setMotive(e.target.value)}
                placeholder="범행 동기를 설명해주세요..."
                className="w-full bg-muted rounded-lg px-4 py-3 min-h-[120px] focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>
          </div>

          {/* 제출 버튼 */}
          <div className="mt-8 flex gap-4">
            <Link href={`/game/${scenarioId}`} className="flex-1">
              <Button variant="outline" className="w-full">취소</Button>
            </Link>
            <Button
              variant="neon"
              className="flex-1"
              onClick={handleSubmit}
              disabled={!isComplete || submitting}
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  제출 중...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  최종 제출
                </>
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}