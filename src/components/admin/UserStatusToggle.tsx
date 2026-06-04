import React from 'react'
import clsx from 'clsx'
import { Switch } from '../ui/Switch'

type UserStatusToggleProps = {
  active: boolean
  disabled?: boolean
  pending?: boolean
  onToggle: () => void
  showLabel?: boolean
  size?: 'sm' | 'md'
  className?: string
}

export function UserStatusToggle({
  active,
  disabled = false,
  pending = false,
  onToggle,
  showLabel = true,
  size = 'md',
  className,
}: UserStatusToggleProps) {
  const handleChange = () => {
    if (disabled || pending) return
    onToggle()
  }

  return (
    <div className={clsx('inline-flex items-center gap-2.5', className)}>
      <Switch
        checked={active}
        onChange={handleChange}
        disabled={disabled || pending}
        ariaLabel={active ? 'Disable user' : 'Enable user'}
        size={size}
      />
      {showLabel && (
        <span
          className={clsx(
            'text-m3-label-sm normal-case tracking-normal font-medium',
            active ? 'text-on-surface' : 'text-on-surface-variant',
            pending && 'opacity-60'
          )}
        >
          {pending ? 'Updating…' : active ? 'Active' : 'Disabled'}
        </span>
      )}
    </div>
  )
}
