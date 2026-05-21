import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { MoreVertical } from 'lucide-react'
import clsx from 'clsx'

export type ActionMenuItem = {
    id: string
    label: string
    onClick: () => void
    variant?: 'default' | 'danger'
    hidden?: boolean
    disabled?: boolean
}

type ActionsMenuProps = {
    items: ActionMenuItem[]
    align?: 'left' | 'right'
    'aria-label'?: string
}

type MenuPlacement = 'below' | 'above'

export function ActionsMenu({ items, align = 'right', 'aria-label': ariaLabel = 'Actions' }: ActionsMenuProps) {
    const [open, setOpen] = useState(false)
    const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({})
    const [placement, setPlacement] = useState<MenuPlacement>('below')
    const triggerRef = useRef<HTMLButtonElement>(null)
    const menuRef = useRef<HTMLDivElement>(null)

    const visibleItems = items.filter((item) => !item.hidden)

    const updatePosition = useCallback(() => {
        const trigger = triggerRef.current
        if (!trigger) return

        const rect = trigger.getBoundingClientRect()
        const menuHeight = menuRef.current?.offsetHeight ?? visibleItems.length * 32 + 8
        const gap = 6
        const placeAbove = rect.bottom + menuHeight + gap > window.innerHeight - 8 && rect.top > menuHeight + gap
        const nextPlacement: MenuPlacement = placeAbove ? 'above' : 'below'

        setPlacement(nextPlacement)

        const top =
            nextPlacement === 'below'
                ? rect.bottom + gap
                : Math.max(8, rect.top - gap - menuHeight)

        const base: React.CSSProperties = {
            position: 'fixed',
            top,
            width: 'max-content',
            minWidth: '9.5rem',
            maxWidth: '13rem',
            zIndex: 9999,
        }

        if (align === 'right') {
            setMenuStyle({
                ...base,
                right: Math.max(8, window.innerWidth - rect.right),
            })
        } else {
            setMenuStyle({
                ...base,
                left: Math.min(rect.left, window.innerWidth - 152 - 8),
            })
        }
    }, [align, visibleItems.length])

    useLayoutEffect(() => {
        if (!open) return
        updatePosition()
        requestAnimationFrame(() => updatePosition())
    }, [open, updatePosition])

    useEffect(() => {
        if (!open) return

        const onPointerDown = (e: MouseEvent) => {
            const target = e.target as Node
            if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return
            setOpen(false)
        }

        const onScrollOrResize = () => updatePosition()

        document.addEventListener('mousedown', onPointerDown)
        window.addEventListener('scroll', onScrollOrResize, true)
        window.addEventListener('resize', onScrollOrResize)

        return () => {
            document.removeEventListener('mousedown', onPointerDown)
            window.removeEventListener('scroll', onScrollOrResize, true)
            window.removeEventListener('resize', onScrollOrResize)
        }
    }, [open, updatePosition])

    useEffect(() => {
        if (!open) return
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setOpen(false)
        }
        document.addEventListener('keydown', onKeyDown)
        return () => document.removeEventListener('keydown', onKeyDown)
    }, [open])

    const slideY = placement === 'above' ? 6 : -6

    const menuPortal =
        typeof document !== 'undefined'
            ? createPortal(
                  <AnimatePresence>
                      {open && visibleItems.length > 0 && (
                          <motion.div
                              ref={menuRef}
                              role="menu"
                              initial={{ opacity: 0, scale: 0.96, y: slideY }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.96, y: slideY }}
                              transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
                              style={{
                                  ...menuStyle,
                                  transformOrigin:
                                      placement === 'above'
                                          ? align === 'right'
                                              ? 'bottom right'
                                              : 'bottom left'
                                          : align === 'right'
                                            ? 'top right'
                                            : 'top left',
                              }}
                              className={clsx(
                                  'rounded-lg border border-slate-200/90 dark:border-white/10',
                                  'bg-white dark:bg-slate-900 shadow-lg ring-1 ring-black/5 dark:ring-white/10',
                                  'py-1 overflow-hidden'
                              )}
                          >
                              {visibleItems.map((item) => (
                                  <button
                                      key={item.id}
                                      type="button"
                                      role="menuitem"
                                      disabled={item.disabled}
                                      onClick={() => {
                                          if (item.disabled) return
                                          item.onClick()
                                          setOpen(false)
                                      }}
                                      className={clsx(
                                          'block w-full whitespace-nowrap px-3 py-1.5 text-left text-xs font-medium transition-colors',
                                          'disabled:opacity-40 disabled:cursor-not-allowed',
                                          item.variant === 'danger'
                                              ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40'
                                              : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5'
                                      )}
                                  >
                                      {item.label}
                                  </button>
                              ))}
                          </motion.div>
                      )}
                  </AnimatePresence>,
                  document.body
              )
            : null

    return (
        <>
            <button
                ref={triggerRef}
                type="button"
                aria-label={ariaLabel}
                aria-expanded={open}
                aria-haspopup="menu"
                onClick={(e) => {
                    e.stopPropagation()
                    setOpen((o) => !o)
                }}
                className={clsx(
                    'p-1.5 rounded-md transition-colors',
                    open
                        ? 'text-primary bg-primary/10 dark:text-white dark:bg-white/10'
                        : 'text-primary/40 hover:text-primary hover:bg-primary/5 dark:text-white/40 dark:hover:text-white dark:hover:bg-white/10'
                )}
            >
                <MoreVertical size={16} />
            </button>
            {menuPortal}
        </>
    )
}
