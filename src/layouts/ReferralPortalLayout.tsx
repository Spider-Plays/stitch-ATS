import React from 'react'
import ReferralSidebar from '../components/ReferralSidebar'
import { AnimatedOutlet } from '../components/motion/AnimatedOutlet'

const ReferralPortalLayout = () => (
  <div className="min-h-screen app-shell-bg">
    <ReferralSidebar />
    <main className="app-main-canvas flex-1 ml-[var(--sidebar-width)] p-6 md:p-8 min-h-screen custom-scrollbar">
      <AnimatedOutlet />
    </main>
  </div>
)

export default ReferralPortalLayout
