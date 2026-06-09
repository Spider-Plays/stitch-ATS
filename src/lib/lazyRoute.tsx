import React, { lazy, Suspense } from 'react'
import { PageLoader } from '../components/ui/PageLoader'

/** Code-split a page and show a shared loading fallback while the chunk downloads. */
export function lazyPage(importer: () => Promise<{ default: React.ComponentType }>) {
  const Lazy = lazy(importer)
  return function LazyPage() {
    return (
      <Suspense fallback={<PageLoader />}>
        <Lazy />
      </Suspense>
    )
  }
}
