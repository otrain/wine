import { WINE_TYPE, CELLAR_STATUS, type WineType, type CellarStatus } from '@/lib/ordinalScales'
import { useVarietals } from '@/lib/hooks/useWines'
import type { WineFormData } from './types'

interface Props {
  data: WineFormData
  onChange: (patch: Partial<WineFormData>) => void
}

const FIELD = 'w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-rose-600'
const LABEL = 'block text-sm font-medium text-zinc-300 mb-1'

export function Step1_Identity({ data, onChange }: Props) {
  const { data: varietals = [] } = useVarietals()

  function toggleVarietal(name: string) {
    const cur = data.varietal
    onChange({ varietal: cur.includes(name) ? cur.filter((v) => v !== name) : [...cur, name] })
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-zinc-100">Wine Identity</h2>

      <div>
        <label className={LABEL}>Wine Name *</label>
        <input className={FIELD} value={data.wine_name} onChange={(e) => onChange({ wine_name: e.target.value })} placeholder="e.g. Château Montus Madiran" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL}>Producer</label>
          <input className={FIELD} value={data.producer} onChange={(e) => onChange({ producer: e.target.value })} placeholder="Producer name" />
        </div>
        <div>
          <label className={LABEL}>Vintage</label>
          <input className={FIELD} value={data.vintage} onChange={(e) => onChange({ vintage: e.target.value })} placeholder="NV or year" type="text" inputMode="numeric" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL}>Region</label>
          <input className={FIELD} value={data.region} onChange={(e) => onChange({ region: e.target.value })} placeholder="e.g. Bordeaux" />
        </div>
        <div>
          <label className={LABEL}>Appellation</label>
          <input className={FIELD} value={data.appellation} onChange={(e) => onChange({ appellation: e.target.value })} placeholder="e.g. St-Émilion" />
        </div>
      </div>

      <div>
        <label className={LABEL}>Wine Type *</label>
        <div className="flex flex-wrap gap-2">
          {WINE_TYPE.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onChange({ wine_type: t as WineType })}
              className={`px-3 py-2 rounded-md text-sm font-medium capitalize transition-colors min-h-[44px] ${data.wine_type === t ? 'bg-rose-700 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className={LABEL}>Varietals</label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {varietals.slice(0, 20).map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => toggleVarietal(v.name)}
              className={`px-2.5 py-1 rounded-full text-sm transition-colors ${data.varietal.includes(v.name) ? 'bg-rose-700 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}
            >
              {v.name}
            </button>
          ))}
        </div>
        {data.varietal.length > 0 && (
          <p className="text-xs text-zinc-400">{data.varietal.join(', ')}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL}>Date Tasted</label>
          <input type="date" className={FIELD} value={data.date_tasted} onChange={(e) => onChange({ date_tasted: e.target.value })} />
        </div>
        <div>
          <label className={LABEL}>Cellar Status</label>
          <select className={FIELD} value={data.cellar_status} onChange={(e) => onChange({ cellar_status: e.target.value as CellarStatus })}>
            {CELLAR_STATUS.map((s) => (
              <option key={s} value={s}>{s.replace(/-/g, ' ')}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={LABEL}>Vivino URL</label>
        <input className={FIELD} value={data.vivino_url} onChange={(e) => onChange({ vivino_url: e.target.value })} placeholder="https://www.vivino.com/wines/…" type="url" />
      </div>
    </div>
  )
}
