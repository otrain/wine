import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { WINE_TYPE, CELLAR_STATUS, ACIDITY, SWEETNESS, BODY, TANNIN_LEVEL } from '@/lib/ordinalScales'
import type { WineFilters } from '@/lib/hooks/useWines'
import { cn } from '@/lib/utils'

interface Props {
  filters: WineFilters
  onChange: (f: WineFilters) => void
}

function toggle(arr: string[] | undefined, val: string): string[] {
  const a = arr ?? []
  return a.includes(val) ? a.filter((x) => x !== val) : [...a, val]
}

function Pill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'px-2.5 py-1 rounded-full text-xs font-medium transition-colors capitalize',
        active ? 'bg-rose-700 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
      )}
    >
      {label.replace(/-/g, ' ')}
    </button>
  )
}

export function FilterPanel({ filters, onChange }: Props) {
  const [open, setOpen] = useState(false)

  const activeCount = [
    filters.wine_type?.length,
    filters.cellar_status?.length,
    filters.palate_acidity?.length,
    filters.palate_sweetness?.length,
    filters.palate_body?.length,
    filters.palate_tannin_level?.length,
    filters.min_rating,
    filters.min_price ?? filters.max_price,
  ].filter(Boolean).length

  return (
    <div className="bg-zinc-900 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-zinc-200"
      >
        <span>Filters{activeCount > 0 ? ` (${activeCount})` : ''}</span>
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4 border-t border-zinc-800">
          <section className="space-y-1.5 pt-3">
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Wine Type</p>
            <div className="flex flex-wrap gap-1.5">
              {WINE_TYPE.map((t) => (
                <Pill key={t} label={t} active={!!filters.wine_type?.includes(t)}
                  onClick={() => onChange({ ...filters, wine_type: toggle(filters.wine_type, t) })} />
              ))}
            </div>
          </section>

          <section className="space-y-1.5">
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Rating</p>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((r) => (
                <Pill key={r} label={`${r}★`} active={filters.min_rating === r}
                  onClick={() => onChange({ ...filters, min_rating: filters.min_rating === r ? undefined : r })} />
              ))}
            </div>
          </section>

          <section className="space-y-1.5">
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Price Max ($)</p>
            <div className="flex gap-1.5">
              {[10, 15, 20, 25, 30, 40].map((p) => (
                <Pill key={p} label={`≤$${p}`} active={filters.max_price === p}
                  onClick={() => onChange({ ...filters, max_price: filters.max_price === p ? undefined : p })} />
              ))}
            </div>
          </section>

          <section className="space-y-1.5">
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Acidity</p>
            <div className="flex flex-wrap gap-1.5">
              {ACIDITY.map((a) => (
                <Pill key={a} label={a} active={!!filters.palate_acidity?.includes(a)}
                  onClick={() => onChange({ ...filters, palate_acidity: toggle(filters.palate_acidity, a) })} />
              ))}
            </div>
          </section>

          <section className="space-y-1.5">
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Sweetness</p>
            <div className="flex flex-wrap gap-1.5">
              {SWEETNESS.map((s) => (
                <Pill key={s} label={s} active={!!filters.palate_sweetness?.includes(s)}
                  onClick={() => onChange({ ...filters, palate_sweetness: toggle(filters.palate_sweetness, s) })} />
              ))}
            </div>
          </section>

          <section className="space-y-1.5">
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Body</p>
            <div className="flex flex-wrap gap-1.5">
              {BODY.map((b) => (
                <Pill key={b} label={b} active={!!filters.palate_body?.includes(b)}
                  onClick={() => onChange({ ...filters, palate_body: toggle(filters.palate_body, b) })} />
              ))}
            </div>
          </section>

          <section className="space-y-1.5">
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Tannin Level</p>
            <div className="flex flex-wrap gap-1.5">
              {TANNIN_LEVEL.map((t) => (
                <Pill key={t} label={t} active={!!filters.palate_tannin_level?.includes(t)}
                  onClick={() => onChange({ ...filters, palate_tannin_level: toggle(filters.palate_tannin_level, t) })} />
              ))}
            </div>
          </section>

          <section className="space-y-1.5">
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Cellar Status</p>
            <div className="flex flex-wrap gap-1.5">
              {CELLAR_STATUS.map((s) => (
                <Pill key={s} label={s} active={!!filters.cellar_status?.includes(s)}
                  onClick={() => onChange({ ...filters, cellar_status: toggle(filters.cellar_status, s) })} />
              ))}
            </div>
          </section>

          <button
            type="button"
            onClick={() => onChange({})}
            className="text-xs text-rose-400 hover:text-rose-300 mt-1"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  )
}
