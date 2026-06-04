import React from 'react'
import type { SkillCatalogItem } from '../../services/http/skills'
import { SkillCatalogEditor } from './SkillCatalogEditor'

type EditSkillsModalProps = {
  open: boolean
  onClose: () => void
  skills: SkillCatalogItem[]
}

export function EditSkillsModal({ open, onClose, skills }: EditSkillsModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div
        className="app-modal w-full max-w-lg max-h-[85vh] flex flex-col"
        role="dialog"
        aria-labelledby="edit-skills-title"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-primary/10 dark:border-white/10">
          <div>
            <h2 id="edit-skills-title" className="text-lg font-black text-primary dark:text-white">
              Edit skill catalog
            </h2>
            <p className="text-xs text-primary/50 dark:text-white/50 mt-0.5">
              Skills appear in candidate and requirement dropdowns.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-primary/5 dark:hover:bg-white/5 text-primary/60"
            aria-label="Close"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <SkillCatalogEditor skills={skills} variant="modal" />

        <div className="px-6 py-4 border-t border-primary/10 dark:border-white/10 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-primary/10 dark:bg-white/10 text-sm font-bold text-primary dark:text-white"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
