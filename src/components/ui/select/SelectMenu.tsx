import React from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle2 } from 'lucide-react'
import clsx from 'clsx'
import type { AppSelectOption } from './types'
import { menuPositionStyle, type MenuAnchor } from './useSelectMenuPortal'

type SelectMenuProps = {
  menuId: string
  anchor: MenuAnchor | null
  options: AppSelectOption[]
  value: string
  onSelect: (value: string) => void
  /** Optional search field at top of menu */
  search?: React.ReactNode
  emptyLabel?: string
  allowClear?: boolean
  clearLabel?: string
  onClear?: () => void
}

export function SelectMenu({
  menuId,
  anchor,
  options,
  value,
  onSelect,
  search,
  emptyLabel = 'No options',
  allowClear,
  clearLabel = 'Clear selection',
  onClear,
}: SelectMenuProps) {
  if (!anchor) return null

  return createPortal(
    <div
      id={menuId}
      role="listbox"
      className="app-select-menu custom-scrollbar"
      style={menuPositionStyle(anchor)}
    >
      {search}
      {allowClear && value && onClear && (
        <button type="button" onClick={onClear} className="app-select-clear">
          {clearLabel}
        </button>
      )}
      {options.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-muted-foreground">{emptyLabel}</p>
      ) : (
        options.map((o) => {
          const selected = o.value === value
          return (
            <button
              key={o.value}
              type="button"
              role="option"
              aria-selected={selected}
              disabled={o.disabled || selected}
              onClick={() => onSelect(o.value)}
              className={clsx('app-select-option', selected && 'app-select-option-selected')}
            >
              {o.chipClassName ? (
                <span className={clsx('app-select-chip', o.chipClassName)}>{o.label}</span>
              ) : (
                <span className="app-select-option-label">
                  <span className="block truncate">{o.label}</span>
                  {o.sublabel && (
                    <span className="block truncate text-[11px] font-medium text-muted-foreground mt-0.5">
                      {o.sublabel}
                    </span>
                  )}
                </span>
              )}
              {selected && <CheckCircle2 size={16} className="text-primary shrink-0" aria-hidden />}
            </button>
          )
        })
      )}
    </div>,
    document.body
  )
}
