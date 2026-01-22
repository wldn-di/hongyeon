import React from 'react'
import { Link } from 'wouter'
import { Button } from '@/components/ui/Button'
import { Star, Clock, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ScenarioCard({ scenario, className }) {
  return (
    <div 
      className={cn(
        "rounded-lg border bg-card/50 border-border hover:border-primary/50 transition-all group overflow-hidden flex",
        "h-64",
        className
      )}
    >
      {/* 왼쪽: 썸네일 이미지 (세로 포스터) */}
      <div className="relative w-44 flex-shrink-0 overflow-hidden">
        <img 
          src={scenario.thumbnail} 
          alt={scenario.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          onError={(e) => {
            e.target.style.display = 'none'
            e.target.nextSibling.style.display = 'flex'
          }}
        />
        {/* 이미지 없을 때 플레이스홀더 */}
        <div 
          className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 items-center justify-center hidden"
        >
          <span className="text-4xl opacity-50">🔍</span>
        </div>
        {/* 난이도 배지 */}
        <div className="absolute top-3 left-3">
          <span className={cn(
            "px-2 py-1 rounded text-xs font-bold uppercase tracking-wider",
            scenario.difficulty === 'hard' && "bg-red-500/90 text-white",
            scenario.difficulty === 'medium' && "bg-yellow-500/90 text-black",
            scenario.difficulty === 'easy' && "bg-green-500/90 text-white"
          )}>
            {scenario.difficulty}
          </span>
        </div>
      </div>

      {/* 오른쪽: 콘텐츠 */}
      <div className="flex-1 p-5 flex flex-col">
        {/* 상단: 제목 + 줄거리 */}
        <div>
          <h3 className="text-xl font-bold gold-glow group-hover:text-primary transition-all mb-3">
            {scenario.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
            {scenario.synopsis}
          </p>
        </div>
        
        {/* 중앙: 버튼 (가운데 정렬) */}
        <div className="flex-1 flex items-end justify-center pb-2">
          <Link href={`/game/${scenario.id}`}>
            <Button variant="neon">
              자세히
            </Button>
          </Link>
        </div>

        {/* 하단: 메타 정보 */}
        <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground pt-2">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{scenario.estimatedTime}분</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{scenario.playCount.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-primary text-primary" />
            <span>{(scenario.rating / 100).toFixed(1)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}