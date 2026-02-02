import React, { useMemo, useState } from 'react'
import { Filter, ArrowUpDown, ChevronDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

// shadcn/ui Popover 사용 (프로젝트에 이미 있으면 OK)
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover'
import { Button } from '@/components/ui/Button'

function summarizeSelection(selectedValues, options, allLabel) {
  const selected = Array.isArray(selectedValues) ? selectedValues : []
  if (selected.length === 0) return allLabel

  const map = new Map((options || []).map((o) => [o.value, o.label]))
  const labels = selected.map((v) => map.get(v) ?? v).filter(Boolean)

  if (labels.length === 0) return allLabel
  if (labels.length === 1) return labels[0]
  return `${labels[0]} +${labels.length - 1}`
}

function MultiSelectPopover({
  label,
  allLabel,
  selectedValues,
  options,
  onToggle,
  onClear,
  align = 'start',
}) {
  const [open, setOpen] = useState(false)

  const summary = useMemo(
    () => summarizeSelection(selectedValues, options, allLabel),
    [selectedValues, options, allLabel],
  )

  const selectedSet = useMemo(() => new Set(selectedValues || []), [selectedValues])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'inline-flex items-center gap-2 rounded-lg border border-border bg-muted/40',
            'px-3 py-2 text-sm text-foreground hover:bg-muted/60 transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-primary',
          )}
        >
          <span className="text-sm">{summary}</span>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </button>
      </PopoverTrigger>

      <PopoverContent align={align} className="w-56 p-2">
        <div className="flex items-center justify-between px-2 py-1.5">
          <span className="text-xs text-muted-foreground">{label}</span>
          <button
            type="button"
            onClick={() => {
              onClear?.()
              // 전체 누르면 즉시 닫고 싶으면 아래 주석 해제
              // setOpen(false)
            }}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            전체
          </button>
        </div>

        <div className="h-px bg-border my-1" />

        <div className="max-h-64 overflow-auto py-1">
          {(options || []).map((opt) => {
            const active = selectedSet.has(opt.value)
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onToggle?.(opt.value)}
                className={cn(
                  'w-full flex items-center justify-between gap-2 rounded-md px-2 py-2 text-sm',
                  'hover:bg-muted/50 transition-colors',
                  active ? 'bg-primary/10' : 'bg-transparent',
                )}
              >
                <span className={cn(active ? 'text-foreground' : 'text-muted-foreground')}>
                  {opt.label}
                </span>
                {active && <Check className="w-4 h-4 text-primary" />}
              </button>
            )
          })}
        </div>

        <div className="h-px bg-border my-1" />

        {/* 닫기 버튼(선택). UX상 바깥 클릭으로 닫혀도 되지만, 명시 버튼이 있으면 안정적 */}
        <div className="flex justify-end p-1">
          <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
            닫기
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export function ScenarioFilters({
  selectedGenres,
  selectedDifficulties,
  sortBy,
  onToggleGenre,
  onToggleDifficulty,
  onClearGenres,
  onClearDifficulties,
  onSortChange,
  genres,
  difficulties,
  sortOptions,
}) {
  // 'all' 옵션은 UI에서 "전체"로 처리하므로 제거
  const genreOptions = useMemo(
    () => (genres || []).filter((g) => g.value !== 'all'),
    [genres],
  )
  const difficultyOptions = useMemo(
    () => (difficulties || []).filter((d) => d.value !== 'all'),
    [difficulties],
  )

  return (
    <div className="mb-8 p-4 bg-card/50 border border-border rounded-lg">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* 왼쪽: 필터들 */}
        <div className="flex items-center gap-3 flex-wrap">
          <Filter className="w-4 h-4 text-muted-foreground" />

          {/* ✅ 전체 장르 ▼ */}
          <MultiSelectPopover
            label="장르"
            allLabel="전체 장르"
            selectedValues={selectedGenres}
            options={genreOptions}
            onToggle={onToggleGenre}
            onClear={onClearGenres}
            align="start"
          />

          {/* ✅ 전체 난이도 ▼ (멀티) */}
          <MultiSelectPopover
            label="난이도"
            allLabel="전체 난이도"
            selectedValues={selectedDifficulties}
            options={difficultyOptions}
            onToggle={onToggleDifficulty}
            onClear={onClearDifficulties}
            align="start"
          />
        </div>

        {/* 오른쪽: 정렬 */}
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
          <div className="flex gap-1">
            {(sortOptions || []).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onSortChange?.(opt.value)}
                className={cn(
                  'px-3 py-2 rounded-lg text-sm transition-colors',
                  sortBy === opt.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground',
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
