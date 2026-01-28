import React, { useState } from 'react'
import { Link, useLocation } from 'wouter'
import { Button } from '@/components/ui/Button'
import { ArrowLeft, Sparkles, Users, BookOpen, Layers } from 'lucide-react'
import { cn } from '@/lib/utils'

// 장르 옵션
const genreOptions = [
  { value: 'crime', label: '범죄/수사', icon: '🔍' },
  { value: 'mystery', label: '미스터리', icon: '❓' },
  { value: 'horror', label: '공포/스릴러', icon: '👻' },
  { value: 'historical', label: '시대극', icon: '📜' },
  { value: 'romance', label: '로맨스', icon: '💕' },
  { value: 'sf', label: 'SF/판타지', icon: '🚀' },
]

// 용의자 수 옵션
const suspectCountOptions = [4, 5]

export default function CreateScenario() {
  const [, setLocation] = useLocation()
  const [formData, setFormData] = useState({
    title: '',
    synopsis: '',
    suspectCount: 4,
    genre: 'crime',
  })
  const [isGenerating, setIsGenerating] = useState(false)

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.title.trim()) {
      alert('제목을 입력해주세요.')
      return
    }
    if (!formData.synopsis.trim()) {
      alert('스토리 내용을 입력해주세요.')
      return
    }

    setIsGenerating(true)

    // 시나리오 생성 시뮬레이션 (실제로는 AI API 호출)
    setTimeout(() => {
      setIsGenerating(false)
      alert('시나리오가 생성되었습니다! (더미)')
      setLocation('/scenarios')
    }, 2000)
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 py-12">
        <div className="container max-w-2xl">
          {/* 뒤로가기 */}
          <Link href="/scenarios">
            <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              시나리오 목록으로
            </button>
          </Link>

          {/* 헤더 */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold gold-glow mb-2">시나리오 만들기</h1>
            <p className="text-muted-foreground">
              AI가 당신만의 추리 시나리오를 생성해드립니다
            </p>
          </div>

          {/* 폼 */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 제목 */}
            <div className="bg-card border border-border rounded-lg p-6">
              <label className="flex items-center gap-2 font-bold mb-3">
                <BookOpen className="w-5 h-5 text-primary" />
                시나리오 제목
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="시나리오의 제목을 입력하세요"
                className="w-full bg-muted border border-border rounded-lg px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-xs text-muted-foreground mt-2">
                * 제목은 AI 스토리 생성에 반영되지 않습니다
              </p>
            </div>

            {/* 시놉시스/스토리 */}
            <div className="bg-card border border-border rounded-lg p-6">
              <label className="flex items-center gap-2 font-bold mb-3">
                <Sparkles className="w-5 h-5 text-primary" />
                스토리 아이디어
              </label>
              <textarea
                value={formData.synopsis}
                onChange={(e) => handleChange('synopsis', e.target.value)}
                placeholder="대략적인 스토리를 적어주세요&#10;&#10;예시:&#10;- 폐쇄된 섬에서 일어난 연쇄 살인&#10;- 키워드: 복수, 유산 분쟁, 과거의 비밀&#10;- 반전: 피해자가 실은 범인이었다"
                rows={6}
                className="w-full bg-muted border border-border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
              <p className="text-xs text-muted-foreground mt-2">
                간단한 스토리, 키워드, 원하는 반전 등을 자유롭게 작성해주세요
              </p>
            </div>

            {/* 용의자 수 */}
            <div className="bg-card border border-border rounded-lg p-6">
              <label className="flex items-center gap-2 font-bold mb-3">
                <Users className="w-5 h-5 text-primary" />
                용의자 수
              </label>
              <div className="flex gap-3">
                {suspectCountOptions.map(count => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => handleChange('suspectCount', count)}
                    className={cn(
                      "flex-1 py-3 rounded-lg border-2 font-bold transition-all",
                      formData.suspectCount === count
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    {count}명
                  </button>
                ))}
              </div>
            </div>

            {/* 장르 */}
            <div className="bg-card border border-border rounded-lg p-6">
              <label className="flex items-center gap-2 font-bold mb-3">
                <Layers className="w-5 h-5 text-primary" />
                장르
              </label>
              <div className="grid grid-cols-3 gap-3">
                {genreOptions.map(genre => (
                  <button
                    key={genre.value}
                    type="button"
                    onClick={() => handleChange('genre', genre.value)}
                    className={cn(
                      "py-3 px-4 rounded-lg border-2 transition-all text-left",
                      formData.genre === genre.value
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <span className="text-xl mr-2">{genre.icon}</span>
                    <span className="text-sm font-medium">{genre.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 제출 버튼 */}
            <div className="flex gap-4">
              <Link href="/scenarios" className="flex-1">
                <Button type="button" variant="outline" className="w-full py-6">
                  취소
                </Button>
              </Link>
              <Button
                type="submit"
                variant="neon"
                className="flex-[2] py-6"
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    AI가 시나리오 생성 중...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    시나리오 생성하기
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
