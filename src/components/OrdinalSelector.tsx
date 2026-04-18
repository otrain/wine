import { cn } from '@/lib/utils'

interface Props {
  label: string
  options: readonly string[]
  value: string | null | undefined
  onChange: (v: string) => void
  labelMap?: Record<string, string>
  className?: string
}

export function OrdinalSelector({ label, options, value, onChange, labelMap, className }: Props) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label className="text-sm font-medium text-zinc-300">{label}</label>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(value === opt ? '' : opt)}
            className={cn(
              'px-3 py-1.5 rounded-md text-sm font-medium transition-colors min-h-[44px] min-w-[44px]',
              value === opt
                ? 'bg-rose-700 text-white'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            )}
          >
            {labelMap?.[opt] ?? opt}
          </button>
        ))}
      </div>
    </div>
  )
}
