/** Warm route chunks on sidebar hover so navigation feels instant after first visit. */
const ROUTE_CHUNKS: Record<string, () => Promise<unknown>> = {
  '/dashboard': () => import('../pages/dashboard/Dashboard'),
  '/requirements': () => import('../pages/requirements/list/RequirementsList'),
  '/vendors': () => import('../pages/vendors/list/VendorsList'),
  '/candidates': () => import('../pages/candidates/list/CandidatesList'),
  '/pipeline': () => import('../pages/pipeline/board/Pipeline'),
  '/interviews': () => import('../pages/interviews/list/Interviews'),
  '/offers': () => import('../pages/offers/list/Offers'),
  '/admin': () => import('../pages/admin/overview/AdminOverview'),
  '/settings': () => import('../pages/settings/account/Settings'),
  '/notifications': () => import('../pages/notifications/list/Notifications'),
}

const prefetched = new Set<string>()

export function prefetchRoute(path: string) {
  const match = Object.keys(ROUTE_CHUNKS).find(
    (route) => path === route || path.startsWith(`${route}/`)
  )
  if (!match || prefetched.has(match)) return
  prefetched.add(match)
  void ROUTE_CHUNKS[match]()
}
