export type AppSelectOption = {
  value: string
  label: string
  sublabel?: string
  /** Renders label inside a colored chip (pipeline stages, status badges, etc.) */
  chipClassName?: string
  disabled?: boolean
}
