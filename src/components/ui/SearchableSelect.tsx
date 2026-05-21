import React, { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, Search } from 'lucide-react'
import clsx from 'clsx'

export type SelectOption = {
  value: string
  label: string
  sublabel?: string
}

type SearchableSelectProps = {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  searchPlaceholder?: string
  emptyLabel?: string
  allowClear?: boolean
  clearLabel?: string
  icon?: React.ReactNode
  disabled?: boolean
  className?: string
}

export function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  searchPlaceholder = 'Search...',
  emptyLabel = 'No matches found',
  allowClear = true,
  clearLabel = 'Clear selection',
  icon,
  disabled = false,
  className,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)

  const selected = options.find((o) => o.value === value)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        (o.sublabel?.toLowerCase().includes(q) ?? false)
    )
  }, [options, query])

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

  const pick = (next: string) => {
    onChange(next)
    setOpen(false)
    setQuery('')
  }

  return (
    <div ref={rootRef} className={clsx('relative', className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        className={clsx(
          'w-full flex items-center gap-2 rounded-xl border border-primary/10 dark:border-white/10',
          'bg-primary/[0.02] dark:bg-white/[0.02] py-3 text-left font-bold text-primary dark:text-white',
          'focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-colors',
          disabled && 'opacity-50 cursor-not-allowed',
          icon ? 'pl-10 pr-10' : 'pl-4 pr-10'
        )}
      >
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/30 pointer-events-none">
            {icon}
          </span>
        )}
        <span className={clsx('flex-1 truncate text-sm', !selected && 'text-primary/40 dark:text-white/40 font-medium')}>
          {selected ? (
            <>
              <span className="block truncate">{selected.label}</span>
              {selected.sublabel && (
                <span className="block truncate text-[11px] font-medium text-primary/50 dark:text-white/50">
                  {selected.sublabel}
                </span>
              )}
            </>
          ) : (
            placeholder
          )}
        </span>
        <ChevronDown
          size={18}
          className={clsx(
            'absolute right-3 top-1/2 -translate-y-1/2 text-primary/40 transition-transform',
            open && 'rotate-180'
          )}
        />
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-full rounded-xl border border-primary/10 dark:border-white/10 bg-white dark:bg-slate-900 shadow-xl overflow-hidden">
          <div className="p-2 border-b border-primary/5 dark:border-white/5">
            <div className="relative">
              <Search
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-primary/40"
                size={16}
                aria-hidden
              />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                autoFocus
                className="w-full pl-8 pr-3 py-2 rounded-lg border border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02] text-sm text-primary dark:text-white outline-none focus:border-primary"
              />
            </div>
          </div>
          <ul className="max-h-56 overflow-y-auto custom-scrollbar py-1" role="listbox">
            {allowClear && value && (
              <li>
                <button
                  type="button"
                  onClick={() => pick('')}
                  className="w-full px-3 py-2 text-left text-xs font-bold text-slate-500 hover:bg-primary/5 dark:hover:bg-white/5"
                >
                  {clearLabel}
                </button>
              </li>
            )}
            {filtered.length === 0 ? (
              <li className="px-3 py-4 text-sm text-slate-500 text-center">{emptyLabel}</li>
            ) : (
              filtered.map((o) => (
                <li key={o.value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={o.value === value}
                    onClick={() => pick(o.value)}
                    className={clsx(
                      'w-full px-3 py-2.5 text-left hover:bg-primary/5 dark:hover:bg-white/5 transition-colors',
                      o.value === value && 'bg-primary/10 dark:bg-white/10'
                    )}
                  >
                    <p className="text-sm font-bold text-primary dark:text-white truncate">{o.label}</p>
                    {o.sublabel && (
                      <p className="text-[11px] font-medium text-primary/50 dark:text-white/50 truncate">
                        {o.sublabel}
                      </p>
                    )}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
