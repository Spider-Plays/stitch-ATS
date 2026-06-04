import React from 'react'
import clsx from 'clsx'
import { getUserAvatarUrl } from '../../lib/userAvatar'

const SIZE_CLASSES = {
  sm: 'size-8',
  md: 'size-10',
  lg: 'size-12',
} as const

export type UserAvatarProps = {
  name?: string | null
  avatar?: string | null
  size?: keyof typeof SIZE_CLASSES
  className?: string
  borderClassName?: string
  alt?: string
}

export function UserAvatar({
  name,
  avatar,
  size = 'md',
  className,
  borderClassName,
  alt,
}: UserAvatarProps) {
  const displayName = (name || 'User').trim()
  const src = getUserAvatarUrl(displayName, avatar)

  return (
    <img
      src={src}
      alt={alt ?? displayName}
      className={clsx(
        'object-cover rounded-full shrink-0',
        SIZE_CLASSES[size],
        borderClassName,
        className
      )}
    />
  )
}
