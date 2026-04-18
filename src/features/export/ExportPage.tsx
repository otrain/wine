import { useState } from 'react'
import { Download } from 'lucide-react'
import Papa from 'papaparse'
import { useWines, useAromaTags } from '@/lib/hooks/useWines'
import type { Wine } from '@/lib/database.types'

const ALL_FIELDS: { key: keyof Wine | 'aroma_nose' | 'aroma_palate'; label: string }[] = [
  { key: 'wine_name',               label: 'Wine Name' },
  { key: 'producer',                label: 'Producer' },
  { key: 'region',                  label: 'Region' },
  { key: 'appellation',             label: 'Appellation' },
  { key: 'varietal',                label: 'Varietal(s)' },
  { key: 'vintage',                 label: 'Vintage' },
  { key: 'wine_type',               label: 'Wine Type' },
  { key: 'date_tasted',             label: 'Date Tasted' },
  { key: 'overall_rating',          label: 'Overall Rating' },
  { key: 'price_paid',              label: 'Price Paid' },
  { key: 'retail_price',            label: 'Retail Price' },
  { key: 'value_score',             label: 'Value Score' },
  { key: 'deal_delta',              label: 'Deal Delta' },
  { key: 'cellar_status',           label: 'Cellar Status' },
  { key: 'appearance_clarity',      label: 'Clarity' },
  { key: 'appearance_intensity',    label: 'App. Intensity' },
  { key: 'appearance_color',        label: 'Color' },
  { key: 'nose_condition',          label: 'Nose Condition' },
  { key: 'nose_intensity',          label: 'Nose Intensity' },
  { key: 'nose_development',        label: 'Development' },
  { key: 'aroma_nose',              label: 'Nose Aromas' },
  { key: 'palate_sweetness',        label: 'Sweetness' },
  { key: 'palate_acidity',          label: 'Acidity' },
  { key: 'palate_tannin_level',     label: 'Tannin Level' },
  { key: 'palate_tannin_texture',   label: 'Tannin Texture' },
  { key: 'palate_alcohol',          label: 'Alcohol' },
  { key: 'palate_body',             label: 'Body' },
  { key: 'palate_mousse',           label: 'Mousse' },
  { key: 'palate_flavour_intensity',label: 'Flavour Intensity' },
  { key: 'palate_finish',           label: 'Finish' },
  { key: 'aroma_palate',            label: 'Palate Aromas' },
  { key: 'conclusion_quality',      label: 'Quality' },
  { key: 'conclusion_readiness',    label: 'Readiness' },
  { key: 'occasion_notes',          label: 'Notes' },
  { key: 'vivino_url',              label: 'Vivino URL' },
]

const DEFAULT_SELECTED = new Set<string>([
  'wine_name', 'producer', 'region', 'varietal', 'vintage', 'wine_type',
  'date_tasted', 'overall_rating', 'price_paid', 'value_score',
  'palate_acidity', 'palate_body', 'conclusion_quality', 'aroma_nose', 'aroma_palate', 'occasion_notes',
])

export function ExportPage() {
  const { data: wines = [] } = useWines()
  const { data: aromaTags = [] } = useAromaTags()
  const [selected, setSelected] = useState<Set<string>>(DEFAULT_SELECTED)

  function toggle(key: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  function download() {
    const tagMap = new Map(aromaTags.map((t) => [t.id, t.name]))

    const rows = wines.map((w) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const row: Record<string, any> = {}
      for (const f of ALL_FIELDS) {
        if (!selected.has(f.key)) continue
        if (f.key === 'aroma_nose' || f.key === 'aroma_palate') continue // handled below
        const val = w[f.key as keyof Wine]
        row[f.label] = Array.isArray(val) ? val.join(', ') : (val ?? '')
      }
      return row
    })

    // tagMap is available for future aroma column expansion
    void tagMap

    const csv = Papa.unparse(rows)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const blobUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = `wines-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(blobUrl)
  }

  return (
    <div className="min-h-screen bg-zinc-950 pb-20">
      <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-3">
        <div className="max-w-lg mx-auto">
          <h1 className="text-lg font-semibold text-zinc-100">Export</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        <div className="bg-zinc-900 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-zinc-200">{wines.length} wines · {selected.size} fields selected</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setSelected(new Set(ALL_FIELDS.map((f) => f.key)))} className="text-xs text-zinc-400 hover:text-zinc-200">All</button>
              <button type="button" onClick={() => setSelected(new Set())} className="text-xs text-zinc-400 hover:text-zinc-200">None</button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {ALL_FIELDS.map((f) => (
              <label key={f.key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selected.has(f.key)}
                  onChange={() => toggle(f.key)}
                  className="accent-rose-600 w-4 h-4"
                />
                <span className="text-sm text-zinc-300">{f.label}</span>
              </label>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={download}
          disabled={wines.length === 0 || selected.size === 0}
          className="w-full flex items-center justify-center gap-2 py-3 bg-rose-700 text-white rounded-xl font-medium hover:bg-rose-600 disabled:opacity-40 min-h-[52px]"
        >
          <Download className="w-5 h-5" />
          Download CSV
        </button>
      </div>
    </div>
  )
}
