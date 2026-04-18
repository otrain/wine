import { OrdinalSelector } from '@/components/OrdinalSelector'
import { CLARITY, APPEARANCE_INTENSITY, COLOR_WHITE, COLOR_ROSE, COLOR_RED } from '@/lib/ordinalScales'
import type { WineFormData } from './types'

interface Props {
  data: WineFormData
  onChange: (patch: Partial<WineFormData>) => void
}

function colorOptions(wineType: string) {
  if (wineType === 'rosé' || wineType === 'orange') return COLOR_ROSE
  if (wineType === 'red' || wineType === 'fortified') return COLOR_RED
  return COLOR_WHITE
}

export function Step2_Appearance({ data, onChange }: Props) {
  const colors = colorOptions(data.wine_type)

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-semibold text-zinc-100">Appearance</h2>

      <OrdinalSelector
        label="Clarity"
        options={CLARITY}
        value={data.appearance_clarity}
        onChange={(v) => onChange({ appearance_clarity: v as WineFormData['appearance_clarity'] })}
      />

      <OrdinalSelector
        label="Intensity"
        options={APPEARANCE_INTENSITY}
        value={data.appearance_intensity}
        onChange={(v) => onChange({ appearance_intensity: v as WineFormData['appearance_intensity'] })}
      />

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-zinc-300">Color</label>
        <div className="flex flex-wrap gap-1.5">
          {colors.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onChange({ appearance_color: data.appearance_color === c ? '' : c })}
              className={`px-3 py-1.5 rounded-md text-sm font-medium capitalize transition-colors min-h-[44px] ${data.appearance_color === c ? 'bg-rose-700 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
