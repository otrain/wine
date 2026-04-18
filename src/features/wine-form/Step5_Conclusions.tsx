import { OrdinalSelector } from '@/components/OrdinalSelector'
import { RatingPicker } from '@/components/RatingPicker'
import { QUALITY, READINESS, QUALITY_LABELS } from '@/lib/ordinalScales'
import type { WineFormData } from './types'

interface Props {
  data: WineFormData
  onChange: (patch: Partial<WineFormData>) => void
}

const FIELD = 'w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-rose-600'
const LABEL = 'block text-sm font-medium text-zinc-300 mb-1'

export function Step5_Conclusions({ data, onChange }: Props) {
  return (
    <div className="space-y-5">
      <h2 className="text-lg font-semibold text-zinc-100">Conclusions</h2>

      <OrdinalSelector
        label="Quality"
        options={QUALITY}
        value={data.conclusion_quality}
        labelMap={QUALITY_LABELS}
        onChange={(v) => onChange({ conclusion_quality: v as WineFormData['conclusion_quality'] })}
      />

      <OrdinalSelector
        label="Readiness to Drink"
        options={READINESS}
        value={data.conclusion_readiness}
        labelMap={{
          'too-young': 'Too Young',
          'can-drink-has-potential': 'Drink / Hold',
          'drink-now': 'Drink Now',
          'too-old': 'Too Old',
        }}
        onChange={(v) => onChange({ conclusion_readiness: v as WineFormData['conclusion_readiness'] })}
      />

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-zinc-300">Overall Rating *</label>
        <RatingPicker value={data.overall_rating} onChange={(v) => onChange({ overall_rating: v })} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL}>Price Paid ($)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            className={FIELD}
            value={data.price_paid}
            onChange={(e) => onChange({ price_paid: e.target.value })}
            placeholder="0.00"
          />
        </div>
        <div>
          <label className={LABEL}>Retail Price ($)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            className={FIELD}
            value={data.retail_price}
            onChange={(e) => onChange({ retail_price: e.target.value })}
            placeholder="0.00"
          />
        </div>
      </div>

      <div>
        <label className={LABEL}>Occasion Notes</label>
        <textarea
          rows={4}
          className={`${FIELD} resize-none`}
          value={data.occasion_notes}
          onChange={(e) => onChange({ occasion_notes: e.target.value })}
          placeholder="Where, when, with whom…"
        />
      </div>
    </div>
  )
}
