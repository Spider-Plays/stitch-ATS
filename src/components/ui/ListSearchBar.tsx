import React from 'react'
import clsx from 'clsx'

type ListSearchBarProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  inputClassName?: string
}

export function ListSearchBar({
  value,
  onChange,
  placeholder = 'Search...',
  className,
  inputClassName,
}: ListSearchBarProps) {
  return (
    <div className={clsx('relative flex-1 min-w-[200px] max-w-md', className)}>
      <span
        className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground text-lg pointer-events-none z-[1]"
        aria-hidden
      >
        search
      </span>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={clsx('app-search-input', inputClassName)}
      />
    </div>
  )
}
