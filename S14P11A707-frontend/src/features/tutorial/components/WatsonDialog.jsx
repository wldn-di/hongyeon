import React, { useEffect, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import TypingText from '@/features/tutorial/components/TypingText'

export default function WatsonDialog({ dialog, onComplete }) {
  const [messageIndex, setMessageIndex] = useState(0)
  const [isTyping, setIsTyping] = useState(true)

  if (!dialog) return null

  const currentMessage = dialog.messages[messageIndex]
  const isLastMessage = messageIndex === dialog.messages.length - 1

  const handleNext = () => {
    if (isTyping) {
      setIsTyping(false)
      return
    }

    if (isLastMessage) {
      onComplete?.()
    } else {
      setMessageIndex((prev) => prev + 1)
      setIsTyping(true)
    }
  }

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        e.preventDefault()
        handleNext()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isTyping, isLastMessage, messageIndex])

  return (
    <>
      <div className="fixed inset-0 z-[190] bg-black/40 transition-opacity duration-500" />

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] w-[90%] max-w-2xl">
        <Card className="bg-card/98 backdrop-blur-lg border-2 border-primary shadow-2xl shadow-primary/20">
          <div className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-primary/30 to-primary/10 rounded-full flex items-center justify-center text-3xl border-2 border-primary/50">
                {dialog.avatar}
              </div>
              <div>
                <p className="font-bold text-lg text-primary">{dialog.speaker}</p>
                <p className="text-xs text-muted-foreground">수사 조수</p>
              </div>
            </div>

            <div className="min-h-[80px] text-lg leading-relaxed mb-4 pl-2 border-l-2 border-primary/30">
              {isTyping ? (
                <TypingText text={currentMessage} speed={25} onComplete={() => setIsTyping(false)} />
              ) : (
                currentMessage
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border/50">
              <p className="text-xs text-muted-foreground">
                <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Space</kbd> 또는 클릭으로 진행
              </p>
              <Button variant="neon" size="sm" onClick={handleNext} className="min-w-[120px]">
                {isTyping ? '스킵' : isLastMessage ? '알겠어요!' : '다음'}
                {!isTyping && !isLastMessage && <ArrowRight className="w-4 h-4 ml-1" />}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </>
  )
}

