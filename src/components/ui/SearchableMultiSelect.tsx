import React, { useId, useMemo, useRef, useState } from 'react'
import clsx from 'clsx'
import type { SelectOption } from './SearchableSelect'
import { SelectMenu } from './select/SelectMenu'
import { useSelectMenuPortal } from './select/useSelectMenuPortal'

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
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuId = useId().replace(/:/g, '')

  const close = () => {
    setOpen(false)
    setQuery('')
  }

  const { anchor } = useSelectMenuPortal(open, triggerRef, menuId, close)

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

  const add = (id: string) => {
    if (!value.includes(id)) onChange([...value, id])
    setQuery('')
  }

  const remove = (id: string) => onChange(value.filter((v) => v !== id))

  const search = (
    <div className="app-select-search">
      <div className="relative">
        <span
          className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground text-lg pointer-events-none z-[1]"
          aria-hidden
        >
          search
        </span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder={searchPlaceholder}
          autoFocus
          className="app-select-search-input"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  )

  return (
    <div className={clsx('relative', className)}>
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((o) => !o)}
        className="app-select-trigger app-select-trigger-outlined w-full min-h-[52px] h-auto items-start py-3"
      >
        <span className="flex flex-wrap gap-2 flex-1 min-w-0 text-left">
          {selectedOptions.length === 0 ? (
            <span className="text-sm font-medium text-muted-foreground">{placeholder}</span>
          ) : (
            selectedOptions.map((o) => (
              <span
                key={o.value}
                className="inline-flex items-center gap-1.5 rounded-full border border-outline-variant/60 bg-surface-container-highest pl-1 pr-2 py-0.5"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="size-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                  {o.label.charAt(0)}
                </span>
                <span className="text-xs font-semibold max-w-[140px] truncate">{o.label}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    remove(o.value)
                  }}
                  className="text-muted-foreground hover:text-destructive p-0.5"
                  aria-label={`Remove ${o.label}`}
                >
                  <span className="material-symbols-outlined !text-sm">close</span>
                </button>
              </span>
            ))
          )}
        </span>
      </button>

      <SelectMenu
        menuId={menuId}
        anchor={open ? anchor : null}
        options={available}
        value=""
        onSelect={add}
        search={search}
        emptyLabel={emptyLabel}
      />
    </div>
  )
}
