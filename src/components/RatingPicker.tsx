import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  value: number
  onChange: (v: number) => void
  max?: number
  className?: string
}

export function RatingPicker({ value, onChange, max = 5, className }: Props) {
  return (
    <div className={cn('flex gap-1', className)}>
      {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className="p-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label={`${n} star${n !== 1 ? 's' : ''}`}
        >
          <Star
            className={cn(
              'w-8 h-8 transition-colors',
              n <= value ? 'fill-amber-400 text-amber-400' : 'text-zinc-600'
            )}
          />
        </button>
      ))}
    </div>
  )
}
