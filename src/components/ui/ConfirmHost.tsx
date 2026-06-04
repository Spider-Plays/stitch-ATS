import { ConfirmModal } from './ConfirmModal'
import { useConfirmStore } from '../../store/confirmStore'

export function ConfirmHost() {
  const open = useConfirmStore((s) => s.open)
  const options = useConfirmStore((s) => s.options)
  const confirm = useConfirmStore((s) => s.confirm)
  const cancel = useConfirmStore((s) => s.cancel)

  if (!options) return null

  return (
    <ConfirmModal
      open={open}
      title={options.title ?? 'Confirm'}
      message={options.message}
      confirmLabel={options.confirmLabel}
      cancelLabel={options.cancelLabel}
      variant={options.variant}
      onClose={cancel}
      onConfirm={confirm}
    />
  )
}
