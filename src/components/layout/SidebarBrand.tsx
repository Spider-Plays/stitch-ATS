import React from 'react'
import { Link } from 'react-router-dom'
import { StitchLogo } from '../branding/StitchLogo'

type SidebarBrandProps = {
  subtitle?: string
  homeTo?: string
  /** Skip outer `.sidebar-brand` wrapper when parent supplies layout (e.g. collapse row). */
  bare?: boolean
}

export function SidebarBrand({
  subtitle = 'Workspace',
  homeTo = '/dashboard',
  bare = false,
}: SidebarBrandProps) {
  const link = (
    <Link
      to={homeTo}
      className="sidebar-brand-link rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <StitchLogo tone="primary" subtitle={subtitle} size="md" />
    </Link>
  )

  if (bare) return link

  return <div className="sidebar-brand">{link}</div>
}
