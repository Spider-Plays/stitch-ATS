import React, { useMemo } from 'react'
import { MapPin } from 'lucide-react'
import { SearchableSelect } from '../ui/SearchableSelect'
import { indianItCityOptions } from '../../lib/indianItCities'

type IndianItCitySelectProps = {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  allowClear?: boolean
  className?: string
}

export function IndianItCitySelect({
  value,
  onChange,
  disabled = false,
  allowClear = false,
  className,
}: IndianItCitySelectProps) {
  const options = useMemo(() => indianItCityOptions(value), [value])

  return (
    <SearchableSelect
      value={value}
      onChange={onChange}
      options={options}
      placeholder="Select city"
      searchPlaceholder="Search Indian IT cities..."
      emptyLabel="No matching city"
      allowClear={allowClear}
      disabled={disabled}
      className={className}
      icon={<MapPin size={18} className="text-muted-foreground" />}
    />
  )
}
