import { useConfirmStore } from '../store/confirmStore'

export function useConfirm() {
  return useConfirmStore((s) => s.requestConfirm)
}
