import React, { useId, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import clsx from 'clsx'
import type { AppSelectOption } from './select/types'
import { SelectMenu } from './select/SelectMenu'
import { useSelectMenuPortal } from './select/useSelectMenuPortal'

export type { AppSelectOption } from './select/types'

type AppSelectProps = {
  value: string
  onChange: (value: string) => void
  options: AppSelectOption[]
  placeholder?: string
  disabled?: boolean
  className?: string
  /** filled = primary pill (pipeline stage); outlined = form fields */
  variant?: 'filled' | 'outlined'
  size?: 'sm' | 'md'
  allowClear?: boolean
  clearLabel?: string
  'aria-label'?: string
}

export function AppSelect({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  disabled = false,
  className,
  variant = 'outlined',
  size = 'md',
  allowClear = false,
  clearLabel,
  'aria-label': ariaLabel,
}: AppSelectProps) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuId = useId().replace(/:/g, '')
  const close = () => setOpen(false)
  const { anchor } = useSelectMenuPortal(open, triggerRef, menuId, close)

  const selected = options.find((o) => o.value === value)

  const pick = (next: string) => {
    onChange(next)
    setOpen(false)
  }

  return (
    <div className={clsx('relative', className)}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-label={ariaLabel ?? (selected?.label || placeholder)}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => !disabled && setOpen((o) => !o)}
        className={clsx(
          'app-select-trigger w-full',
          variant === 'filled' ? 'app-select-trigger-filled' : 'app-select-trigger-outlined',
          size === 'sm' && 'app-select-trigger-sm',
          disabled && 'opacity-[0.38] cursor-not-allowed'
        )}
      >
        <span className={clsx('flex-1 truncate text-left', !selected && 'text-muted-foreground')}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown
          size={size === 'sm' ? 16 : 18}
          className={clsx('shrink-0 transition-transform opacity-90', open && 'rotate-180')}
        />
      </button>

      <SelectMenu
        menuId={menuId}
        anchor={open ? anchor : null}
        options={options}
        value={value}
        onSelect={pick}
        allowClear={allowClear}
        clearLabel={clearLabel}
        onClear={allowClear ? () => pick('') : undefined}
      />
    </div>
  )
}
