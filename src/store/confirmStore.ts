import { create } from 'zustand'

export type ConfirmVariant = 'danger' | 'primary'

export type ConfirmOptions = {
  title?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: ConfirmVariant
}

type ConfirmState = {
  open: boolean
  options: ConfirmOptions | null
  resolve: ((value: boolean) => void) | null
  requestConfirm: (options: ConfirmOptions) => Promise<boolean>
  confirm: () => void
  cancel: () => void
}

function closeWithResult(
  set: (partial: Partial<ConfirmState> | ((s: ConfirmState) => Partial<ConfirmState>)) => void,
  get: () => ConfirmState,
  result: boolean
) {
  const { resolve } = get()
  resolve?.(result)
  set({ open: false, options: null, resolve: null })
}

export const useConfirmStore = create<ConfirmState>((set, get) => ({
  open: false,
  options: null,
  resolve: null,

  requestConfirm: (options) =>
    new Promise<boolean>((resolve) => {
      const pending = get().resolve
      if (pending) pending(false)

      set({
        open: true,
        options: {
          title: options.title ?? 'Confirm',
          confirmLabel: options.confirmLabel ?? 'Confirm',
          cancelLabel: options.cancelLabel ?? 'Cancel',
          variant: options.variant ?? 'primary',
          message: options.message,
        },
        resolve,
      })
    }),

  confirm: () => closeWithResult(set, get, true),
  cancel: () => closeWithResult(set, get, false),
}))
