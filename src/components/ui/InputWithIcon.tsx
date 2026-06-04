import React from 'react'
import clsx from 'clsx'

type InputWithIconProps = {
  type?: React.HTMLInputTypeAttribute
  icon: React.ReactNode
  placeholder?: string
  value: string
  onChange: React.ChangeEventHandler<HTMLInputElement>
  className?: string
  wrapperClassName?: string
}

export function InputWithIcon({
  type = 'text',
  icon,
  placeholder,
  value,
  onChange,
  className,
  wrapperClassName,
}: InputWithIconProps) {
  return (
    <div className={clsx('relative', wrapperClassName)}>
      <span
        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none flex items-center justify-center z-[1]"
        aria-hidden
      >
        {icon}
      </span>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={clsx('app-search-input', className)}
      />
    </div>
  )
}
