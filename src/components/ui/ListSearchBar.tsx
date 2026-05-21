import React from 'react'
import { Search } from 'lucide-react'
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
      <Search
        className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/40 dark:text-white/40"
        size={18}
        aria-hidden
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={clsx(
          'w-full pl-10 pr-4 py-2.5 rounded-xl border border-primary/10 dark:border-white/10',
          'bg-white dark:bg-white/5 text-sm font-medium text-primary dark:text-white',
          'placeholder:text-primary/30 dark:placeholder:text-white/30',
          'focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none',
          inputClassName
        )}
      />
    </div>
  )
}
