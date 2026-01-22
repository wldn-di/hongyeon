import React from 'react'
import { Filter, ArrowUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ScenarioFilters({
  genreFilter,
  difficultyFilter,
  sortBy,
  onGenreChange,
  onDifficultyChange,
  onSortChange,
  genres,
  difficulties,
  sortOptions,
}) {
  return (
    <div className="flex flex-wrap items-center gap-4 mb-8 p-4 bg-card/50 border border-border rounded-lg">
      {/* 장르 필터링 기능 */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <select
          value={genreFilter}
          onChange={(e) => onGenreChange(e.target.value)}
          className="bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {genres.map((g) => (
            <option key={g.value} value={g.value}>
              {g.label}
            </option>
          ))}
        </select>
      </div>

      {/* 난이도 필터링 기능 */}
      <div className="flex items-center gap-2">
        <select
          value={difficultyFilter}
          onChange={(e) => onDifficultyChange(e.target.value)}
          className="bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {difficulties.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex-1" />

      {/* 정렬 목적 기능 */}
      <div className="flex items-center gap-2">
        <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
        <div className="flex gap-1">
          {sortOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onSortChange(opt.value)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm transition-colors',
                sortBy === opt.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}