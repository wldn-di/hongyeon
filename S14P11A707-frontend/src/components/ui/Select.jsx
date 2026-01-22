import React, { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { ChevronDown } from 'lucide-react'

export function Select({ value, onValueChange, children }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={ref} className="relative">
      {React.Children.map(children, child => {
        if (child.type === SelectTrigger) {
          return React.cloneElement(child, { 
            onClick: () => setOpen(!open),
            open 
          })
        }
        if (child.type === SelectContent) {
          return open ? React.cloneElement(child, { 
            onSelect: (val) => {
              onValueChange(val)
              setOpen(false)
            },
            value 
          }) : null
        }
        return child
      })}
    </div>
  )
}

export function SelectTrigger({ className, children, onClick, open }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex h-10 w-full items-center justify-between rounded-md border border-border bg-card px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        className
      )}
    >
      {children}
      <ChevronDown className={cn('h-4 w-4 opacity-50 transition-transform', open && 'rotate-180')} />
    </button>
  )
}

export function SelectContent({ children, onSelect, value }) {
  return (
    <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover text-popover-foreground shadow-md">
      <div className="p-1">
        {React.Children.map(children, child => {
          if (child.type === SelectItem) {
            return React.cloneElement(child, { 
              onSelect,
              selected: child.props.value === value
            })
          }
          return child
        })}
      </div>
    </div>
  )
}

export function SelectItem({ children, value, onSelect, selected }) {
  return (
    <div
      onClick={() => onSelect(value)}
      className={cn(
        'relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 px-2 text-sm outline-none hover:bg-muted',
        selected && 'bg-muted'
      )}
    >
      {children}
    </div>
  )
}

export function SelectValue({ placeholder }) {
  return <span>{placeholder}</span>
}
