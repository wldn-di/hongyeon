import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Home, ArrowRight } from 'lucide-react'
import TypingText from '@/features/tutorial/components/TypingText'

/**
 * 게임 종료 모달 (성공/실패) - 오프닝과 동일한 디자인
 * - 실패: 게임오버 → 범인 독백(unsolvedMonologue)
 * - 성공: 사건해결 → 에필로그 → 범인 자백 → 리뷰로 이동
 */
export function GameEndModal({
  isOpen,
  type = 'fail', // 'success' | 'fail'
  scenario = null,
  result = null, // API 응답: { rankGrade, finalScore, epilogue, culpritMonologue, unsolvedMonologue, ... }
  onGoHome,
  onProceedToReview,
}) {
  const [stage, setStage] = useState('initial')
  const [typingDone, setTypingDone] = useState(false)

  // 모달 열릴 때 초기화 - 성공 시 바로 에필로그, 실패(게임오버) 시 initial
  useEffect(() => {
    if (isOpen) {
      // 성공이면 바로 에필로그, 실패면 GAME OVER 화면부터
      setStage(type === 'success' ? 'epilogue' : 'initial')
      setTypingDone(false)
    }
  }, [isOpen, type])

  if (!isOpen) return null

  // API 응답에서 텍스트 가져오기 (없으면 기본값)
  // 1. result (submit 응답)에서 먼저 찾기
  // 2. scenario (시나리오 상세)에서 찾기
  // 3. 기본값 사용
  const unsolvedMonologue = result?.unsolvedMonologue ||
    scenario?.unsolved_monologue ||
    `"후후... 결국 찾아내지 못했군요."\n\n범인은 어둠 속으로 사라졌습니다.\n\n진실은 영원히 묻히고 말았습니다...`

  const epilogueText = result?.epilogue ||
    scenario?.narration_epilogue ||
    `사건이 해결되었습니다.\n\n당신의 뛰어난 추리력으로 범인의 정체를 밝혀냈습니다.\n\n피해자의 영혼은 이제 편히 쉴 수 있을 것입니다.`

  const culpritMonologue = result?.culpritMonologue ||
    scenario?.culprit_monologue ||
    `"...결국 들켰군요."\n\n범인이 고개를 숙입니다.\n\n"더 이상 숨길 수 없겠네요. 모든 것을 말씀드리겠습니다..."`

  // ========================================
  // 실패 화면 (오프닝 스타일)
  // ========================================
  if (type === 'fail') {
    return (
      <div className="fixed inset-0 bg-black z-[100] flex items-center justify-center">
        {/* 배경 효과 */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-10"
          style={{
            backgroundImage: scenario?.thumbnail ? `url(${scenario.thumbnail})` : 'none',
            filter: 'blur(4px) grayscale(80%)'
          }}
        />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(circle, transparent 0%, rgba(0,0,0,0.9) 100%)' }} />

        <div className="relative z-10 text-center max-w-2xl px-8">
          {stage === 'initial' && (
            <div className="animate-in fade-in duration-1000">
              <p className="text-sm text-red-500 tracking-widest mb-4">GAME OVER</p>
              <h1 className="text-4xl md:text-5xl font-bold text-red-500 mb-8">
                <TypingText
                  text="수사 실패"
                  speed={100}
                  onComplete={() => setTimeout(() => setTypingDone(true), 500)}
                />
              </h1>
              {typingDone && (
                <div className="animate-in fade-in duration-500 space-y-4">
                  <p className="text-lg text-gray-400 mb-8">제출 기회를 모두 소진했습니다</p>
                  <div className="flex flex-col gap-3 max-w-xs mx-auto">
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full border-red-900/50 hover:bg-red-900/20"
                      onClick={() => {
                        setTypingDone(false)
                        setStage('monologue')
                      }}
                    >
                      범인의 독백 보기 <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="lg"
                      className="w-full"
                      onClick={onGoHome}
                    >
                      <Home className="w-5 h-5 mr-2" /> 홈으로 돌아가기
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {stage === 'monologue' && (
            <div className="animate-in fade-in duration-700">
              <p className="text-sm text-red-500 tracking-widest mb-4">CULPRIT'S MONOLOGUE</p>
              <h2 className="text-2xl font-bold text-red-400 mb-6">범인의 독백</h2>
              <div className="text-lg text-gray-300 whitespace-pre-line mb-8 max-h-[50vh] overflow-y-auto" style={{ letterSpacing: '0.05em', lineHeight: '2.2' }}>
                <TypingText
                  text={unsolvedMonologue}
                  speed={25}
                  onComplete={() => setTimeout(() => setTypingDone(true), 500)}
                />
              </div>
              {typingDone && (
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={onGoHome}
                  className="animate-in fade-in duration-500"
                >
                  <Home className="w-5 h-5 mr-2" /> 홈으로 돌아가기
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ========================================
  // 성공 화면 (오프닝 스타일)
  // ========================================
  return (
    <div className="fixed inset-0 bg-black z-[100] flex items-center justify-center">
      {/* 배경 효과 */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-15"
        style={{
          backgroundImage: scenario?.thumbnail ? `url(${scenario.thumbnail})` : 'none',
          filter: 'blur(4px) grayscale(40%)'
        }}
      />
      <div className="absolute inset-0" style={{ background: 'radial-gradient(circle, transparent 0%, rgba(0,0,0,0.85) 100%)' }} />

      <div className="relative z-10 text-center max-w-2xl px-8">
        {stage === 'initial' && (
          <div className="animate-in fade-in duration-1000">
            <p className="text-sm text-primary tracking-widest mb-4">CASE CLOSED</p>
            <h1 className="text-4xl md:text-5xl font-bold gold-glow mb-8">
              <TypingText
                text="사건 해결!"
                speed={100}
                onComplete={() => setTimeout(() => setTypingDone(true), 500)}
              />
            </h1>
            {typingDone && (
              <div className="animate-in fade-in duration-500">
                {result?.rankGrade && (
                  <div className="flex items-center justify-center gap-8 mb-8">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">랭크</p>
                      <p className="text-4xl font-bold text-primary">{result.rankGrade}</p>
                    </div>
                    {result?.finalScore && (
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground mb-1">점수</p>
                        <p className="text-4xl font-bold">{result.finalScore}</p>
                      </div>
                    )}
                  </div>
                )}
                <Button
                  variant="neon"
                  size="lg"
                  onClick={() => {
                    setTypingDone(false)
                    setStage('epilogue')
                  }}
                >
                  에필로그 보기 <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            )}
          </div>
        )}

        {stage === 'epilogue' && (
          <div className="animate-in fade-in duration-700">
            <p className="text-sm text-primary tracking-widest mb-4">EPILOGUE</p>
            <h2 className="text-2xl font-bold gold-glow mb-6">에필로그</h2>
            <div className="text-lg text-amber-100/80 whitespace-pre-line mb-8 max-h-[50vh] overflow-y-auto" style={{ letterSpacing: '0.05em', lineHeight: '2.2' }}>
              <TypingText
                text={epilogueText}
                speed={25}
                onComplete={() => setTimeout(() => setTypingDone(true), 500)}
              />
            </div>
            {typingDone && (
              <Button
                variant="neon"
                size="lg"
                onClick={() => {
                  setTypingDone(false)
                  setStage('culprit')
                }}
                className="animate-in fade-in duration-500"
              >
                범인의 자백 보기 <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            )}
          </div>
        )}

        {stage === 'culprit' && (
          <div className="animate-in fade-in duration-700">
            <p className="text-sm text-amber-500 tracking-widest mb-4">CULPRIT'S CONFESSION</p>
            <h2 className="text-2xl font-bold text-amber-400 mb-6">범인의 자백</h2>
            <div className="text-lg text-gray-300 whitespace-pre-line mb-8 max-h-[50vh] overflow-y-auto" style={{ letterSpacing: '0.05em', lineHeight: '2.2' }}>
              <TypingText
                text={culpritMonologue}
                speed={25}
                onComplete={() => setTimeout(() => setTypingDone(true), 500)}
              />
            </div>
            {typingDone && (
              // 첫 클리어: 리뷰 작성, 재클리어: 홈으로
              result?.hasCleared ? (
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={onGoHome}
                  className="animate-in fade-in duration-500"
                >
                  <Home className="w-5 h-5 mr-2" /> 홈으로 돌아가기
                </Button>
              ) : (
                <Button
                  variant="neon"
                  size="lg"
                  onClick={onProceedToReview}
                  className="animate-in fade-in duration-500"
                >
                  리뷰 작성하기 <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              )
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default GameEndModal