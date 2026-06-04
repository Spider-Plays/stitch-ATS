import { create } from 'zustand'

const STORAGE_KEY = 'ats-sidebar-collapsed'

/** Match Tailwind `lg` — sidebar hide/show only below this width. */
export const SIDEBAR_MOBILE_MQ = '(max-width: 1023px)'

export function isSidebarMobileViewport(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia(SIDEBAR_MOBILE_MQ).matches
}

function applyCollapsed(collapsed: boolean) {
  const mobile = isSidebarMobileViewport()
  document.documentElement.classList.toggle('sidebar-collapsed', mobile && collapsed)
}

function readInitialCollapsed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

const initialCollapsed = readInitialCollapsed()
if (typeof window !== 'undefined') {
  applyCollapsed(initialCollapsed)
}

interface SidebarState {
  collapsed: boolean
  toggle: () => void
  setCollapsed: (collapsed: boolean) => void
}

function persistCollapsed(collapsed: boolean) {
  applyCollapsed(collapsed)
  try {
    localStorage.setItem(STORAGE_KEY, String(collapsed))
  } catch {
    /* ignore */
  }
}

export const useSidebarStore = create<SidebarState>((set) => ({
  collapsed: initialCollapsed,
  toggle: () =>
    set((state) => {
      if (!isSidebarMobileViewport()) return state
      const collapsed = !state.collapsed
      persistCollapsed(collapsed)
      return { collapsed }
    }),
  setCollapsed: (collapsed) => {
    if (!isSidebarMobileViewport() && collapsed) return
    persistCollapsed(collapsed)
    set({ collapsed })
  },
}))

/** Keep drawer visible on desktop when the viewport crosses the mobile breakpoint. */
export function bindSidebarViewportSync() {
  if (typeof window === 'undefined') return () => {}

  const mq = window.matchMedia(SIDEBAR_MOBILE_MQ)
  const sync = () => {
    const { collapsed } = useSidebarStore.getState()
    if (mq.matches) {
      applyCollapsed(collapsed)
    } else {
      document.documentElement.classList.remove('sidebar-collapsed')
    }
  }

  sync()
  mq.addEventListener('change', sync)
  return () => mq.removeEventListener('change', sync)
}
