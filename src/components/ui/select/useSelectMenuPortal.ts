import { useCallback, useEffect, useState, type CSSProperties } from 'react'

export type MenuAnchor = {
  left: number
  width: number
  openUp: boolean
  anchorTop: number
  anchorBottom: number
}

export function useSelectMenuPortal(
  open: boolean,
  triggerRef: React.RefObject<HTMLElement | null>,
  menuId: string,
  onClose?: () => void
) {
  const [anchor, setAnchor] = useState<MenuAnchor | null>(null)

  const updatePosition = useCallback(() => {
    const el = triggerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const menuMaxHeight = 320
    const gap = 8
    const spaceBelow = window.innerHeight - rect.bottom - gap
    const openUp = spaceBelow < menuMaxHeight && rect.top > spaceBelow
    setAnchor({
      left: rect.left,
      width: rect.width,
      openUp,
      anchorTop: rect.top,
      anchorBottom: rect.bottom,
    })
  }, [triggerRef])

  useEffect(() => {
    if (!open) {
      setAnchor(null)
      return
    }
    updatePosition()
    const onScrollOrResize = () => updatePosition()
    window.addEventListener('scroll', onScrollOrResize, true)
    window.addEventListener('resize', onScrollOrResize)
    return () => {
      window.removeEventListener('scroll', onScrollOrResize, true)
      window.removeEventListener('resize', onScrollOrResize)
    }
  }, [open, updatePosition])

  useEffect(() => {
    if (!open || !onClose) return
    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node
      if (triggerRef.current?.contains(target)) return
      const menu = document.getElementById(menuId)
      if (menu?.contains(target)) return
      onClose()
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open, menuId, triggerRef, onClose])

  return { anchor, updatePosition }
}

export function menuPositionStyle(anchor: MenuAnchor): CSSProperties {
  const gap = 8
  return anchor.openUp
    ? {
        left: anchor.left,
        width: anchor.width,
        bottom: window.innerHeight - anchor.anchorTop + gap,
        maxHeight: anchor.anchorTop - 16,
      }
    : {
        left: anchor.left,
        width: anchor.width,
        top: anchor.anchorBottom + gap,
        maxHeight: window.innerHeight - anchor.anchorBottom - 16,
      }
}
