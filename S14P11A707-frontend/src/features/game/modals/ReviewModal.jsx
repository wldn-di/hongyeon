import { React, useState } from "react"
import { Star } from "lucide-react"
import { Button } from '@/components/ui/Button'
import { cn } from "@/lib/utils"

// 플레이 후기 작성(체감 난이도, 평점, 한줄 리뷰) 폼 모달
//TODO: 한줄리뷰 작성 여부 검증할 건지? (현재는 안 함)
export default function ReviewModal({ isOpen, onSubmit }) {
  const [difficulty, setDifficulty] = useState('medium')
  const [rating, setRating] = useState(5)
  const [review, setReview] = useState('')

  if (!isOpen) return null

  const difficultyOptions = [
    { value: 'easy', label: 'Easy', color: 'bg-green-500' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-500' },
    { value: 'hard', label: 'Hard', color: 'bg-red-500' },
  ]

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-md overflow-hidden">
        <div className="p-6">
          <h2 className="text-xl font-bold gold-glow mb-6">플레이 후기 작성</h2>

          <div className="mb-6">
            <p className="text-sm font-bold mb-3">체감 난이도</p>
            <div className="flex gap-2">
              {difficultyOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setDifficulty(opt.value)}
                  className={cn(
                    "flex-1 py-3 rounded-lg font-bold transition-all",
                    difficulty === opt.value ? `${opt.color} text-white` : "bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <p className="text-sm font-bold mb-3">평점</p>
            <div className="flex gap-2 justify-center">
              {[1, 2, 3, 4, 5].map(i => (
                <button key={i} onClick={() => setRating(i)} className="p-1">
                  <Star className={cn("w-10 h-10 transition-colors", i <= rating ? "fill-primary text-primary" : "text-muted-foreground")} />
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <p className="text-sm font-bold mb-2">한줄 리뷰</p>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="이 시나리오에 대한 후기를 남겨주세요"
              rows={3}
              className="w-full bg-muted border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          <Button variant="neon" className="w-full py-4" onClick={() => onSubmit(difficulty, rating, review)}>
            쓰고 수사보고서 받아보기
          </Button>
        </div>
      </div>
    </div>
  )
}