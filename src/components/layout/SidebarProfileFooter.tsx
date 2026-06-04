import React from 'react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import { useAuth } from '../../hooks/useAuth'
import { useLogout } from '../../hooks/useLogout'
import { UserAvatar } from '../ui/UserAvatar'

type SidebarProfileFooterProps = {
  profileTo?: string
  className?: string
}

export function SidebarProfileFooter({ profileTo, className }: SidebarProfileFooterProps) {
  const { user } = useAuth()
  const handleLogout = useLogout()
  const roleLabel = user?.role?.replace(/_/g, ' ') ?? ''

  const profileInner = (
    <>
      <UserAvatar
        name={user?.name}
        avatar={user?.avatar}
        size="md"
        className="rounded-full ring-2 ring-primary/20"
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-foreground truncate leading-tight">
          {user?.name || 'User'}
        </p>
        <p className="text-[10px] font-bold uppercase tracking-wider text-primary/70 truncate mt-0.5">
          {roleLabel}
        </p>
      </div>
      {profileTo && (
        <span className="material-symbols-outlined text-[18px] text-on-surface-variant shrink-0">
          chevron_right
        </span>
      )}
    </>
  )

  return (
    <div className={clsx('sidebar-footer', className)}>
      <div className="sidebar-profile-card">
        {profileTo ? (
          <Link to={profileTo} className="sidebar-profile-link">
            {profileInner}
          </Link>
        ) : (
          <div className="sidebar-profile-link pointer-events-none">{profileInner}</div>
        )}
      </div>

      <button
        type="button"
        onClick={() => void handleLogout()}
        className="sidebar-sign-out"
        aria-label="Sign out"
      >
        <span className="material-symbols-outlined text-[20px]">logout</span>
        Sign out
      </button>
    </div>
  )
}
