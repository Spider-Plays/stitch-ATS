import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Search } from 'lucide-react'
import clsx from 'clsx'
import type { SelectOption } from './SearchableSelect'

type SearchableMultiSelectProps = {
  value: string[]
  onChange: (value: string[]) => void
  options: SelectOption[]
  placeholder?: string
  searchPlaceholder?: string
  emptyLabel?: string
  className?: string
}

export function SearchableMultiSelect({
  value,
  onChange,
  options,
  placeholder = 'Add...',
  searchPlaceholder = 'Search...',
  emptyLabel = 'No matches found',
  className,
}: SearchableMultiSelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)

  const selectedOptions = options.filter((o) => value.includes(o.value))
  const available = useMemo(() => {
    const q = query.trim().toLowerCase()
    return options.filter((o) => {
      if (value.includes(o.value)) return false
      if (!q) return true
      return (
        o.label.toLowerCase().includes(q) ||
        (o.sublabel?.toLowerCase().includes(q) ?? false)
      )
    })
  }, [options, query, value])

  useEffect(() => {
    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [])

  const add = (id: string) => {
    if (!value.includes(id)) onChange([...value, id])
    setQuery('')
  }

  const remove = (id: string) => onChange(value.filter((v) => v !== id))

  const showResults = open

  return (
    <div ref={rootRef} className={clsx('relative', className)}>
      <div
        className={clsx(
          'flex flex-wrap gap-2 p-3 rounded-t-xl border border-b-0 border-primary/10 dark:border-white/10',
          'bg-primary/[0.02] dark:bg-white/[0.02] min-h-[60px] items-center'
        )}
      >
        {selectedOptions.map((o) => (
          <div
            key={o.value}
            className="flex items-center gap-2 bg-white dark:bg-white/10 border border-primary/10 dark:border-white/10 rounded-full pl-1 pr-2 py-1"
          >
            <div className="size-6 rounded-full bg-primary/10 dark:bg-white/20 flex items-center justify-center text-[10px] font-bold text-primary dark:text-white">
              {o.label.charAt(0)}
            </div>
            <span className="text-xs font-bold text-primary dark:text-white max-w-[140px] truncate">
              {o.label}
            </span>
            <button
              type="button"
              onClick={() => remove(o.value)}
              className="text-primary/40 hover:text-red-500 transition-colors p-0.5"
              aria-label={`Remove ${o.label}`}
            >
              <span className="material-symbols-outlined !text-sm">close</span>
            </button>
          </div>
        ))}
        {value.length === 0 && (
          <span className="text-sm font-medium text-primary/40 dark:text-white/40 px-2 py-1 pointer-events-none">
            {placeholder}
          </span>
        )}
      </div>

      <div
        className={clsx(
          'rounded-b-xl border border-primary/10 dark:border-white/10',
          'bg-primary/[0.02] dark:bg-white/[0.02]'
        )}
      >
        <div className="relative p-2">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/40" size={16} aria-hidden />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            placeholder={searchPlaceholder}
            className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-primary/10 dark:border-white/10 bg-white dark:bg-slate-900 text-sm text-primary dark:text-white outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {showResults && (
          <ul className="max-h-48 overflow-y-auto custom-scrollbar py-1 border-t border-primary/5 dark:border-white/5">
            {available.length === 0 ? (
              <li className="px-3 py-4 text-sm text-slate-500 text-center">{emptyLabel}</li>
            ) : (
              available.map((o) => (
                <li key={o.value}>
                  <button
                    type="button"
                    onClick={() => add(o.value)}
                    className="w-full px-3 py-2.5 text-left hover:bg-primary/5 dark:hover:bg-white/5"
                  >
                    <p className="text-sm font-bold text-primary dark:text-white">{o.label}</p>
                    {o.sublabel && (
                      <p className="text-[11px] text-primary/50 dark:text-white/50">{o.sublabel}</p>
                    )}
                  </button>
                </li>
              ))
            )}
          </ul>
        )}
      </div>
    </div>
  )
}
