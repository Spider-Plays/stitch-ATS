import React from 'react'
import { CandidatePortalSidebar } from '../components/portal/CandidatePortalSidebar'
import { AnimatedOutlet } from '../components/motion/AnimatedOutlet'

const CandidatePortalLayout = () => (
  <div className="min-h-screen app-shell-bg">
    <CandidatePortalSidebar />
    <main className="app-main-canvas ml-[var(--sidebar-width)] min-h-screen p-6 md:p-8 custom-scrollbar overflow-y-auto">
      <AnimatedOutlet />
    </main>
  </div>
)

export default CandidatePortalLayout
