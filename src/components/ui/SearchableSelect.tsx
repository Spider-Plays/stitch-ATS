import React, { useId, useMemo, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import clsx from 'clsx'
import type { AppSelectOption } from './select/types'
import { SelectMenu } from './select/SelectMenu'
import { useSelectMenuPortal } from './select/useSelectMenuPortal'

export type SelectOption = AppSelectOption

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
  size?: 'sm' | 'md'
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
  size = 'md',
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuId = useId().replace(/:/g, '')

  const close = () => {
    setOpen(false)
    setQuery('')
  }

  const { anchor } = useSelectMenuPortal(open, triggerRef, menuId, close)

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

  const pick = (next: string) => {
    onChange(next)
    close()
  }

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
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => !disabled && setOpen((o) => !o)}
        className={clsx(
          'app-select-trigger app-select-trigger-outlined w-full relative',
          size === 'sm' && 'app-select-trigger-sm',
          icon ? 'pl-10' : '',
          disabled && 'opacity-[0.38] cursor-not-allowed'
        )}
      >
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
            {icon}
          </span>
        )}
        <span className={clsx('flex-1 truncate text-left', !selected && 'text-muted-foreground font-medium')}>
          {selected ? (
            <>
              {selected.chipClassName ? (
                <span className={clsx('app-select-chip', selected.chipClassName)}>{selected.label}</span>
              ) : (
                <span className="block truncate">{selected.label}</span>
              )}
              {selected.sublabel && !selected.chipClassName && (
                <span className="block truncate text-[11px] font-medium text-muted-foreground">
                  {selected.sublabel}
                </span>
              )}
            </>
          ) : (
            placeholder
          )}
        </span>
        <ChevronDown size={size === 'sm' ? 16 : 18} className={clsx('shrink-0 opacity-70', open && 'rotate-180')} />
      </button>

      <SelectMenu
        menuId={menuId}
        anchor={open ? anchor : null}
        options={filtered}
        value={value}
        onSelect={pick}
        search={search}
        emptyLabel={emptyLabel}
        allowClear={allowClear}
        clearLabel={clearLabel}
        onClear={() => pick('')}
      />
    </div>
  )
}
