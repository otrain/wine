import { OrdinalSelector } from '@/components/OrdinalSelector'
import { NOSE_INTENSITY, DEVELOPMENT } from '@/lib/ordinalScales'
import { AromaTagPicker } from './AromaTagPicker'
import type { WineFormData } from './types'

interface Props {
  data: WineFormData
  onChange: (patch: Partial<WineFormData>) => void
}

export function Step3_Nose({ data, onChange }: Props) {
  return (
    <div className="space-y-5">
      <h2 className="text-lg font-semibold text-zinc-100">Nose</h2>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-zinc-300">Condition</label>
        <div className="flex gap-2">
          {(['clean', 'faulty'] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onChange({ nose_condition: data.nose_condition === c ? '' : c })}
              className={`flex-1 py-2 rounded-md text-sm font-medium capitalize transition-colors min-h-[44px] ${data.nose_condition === c ? 'bg-rose-700 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <OrdinalSelector
        label="Intensity"
        options={NOSE_INTENSITY}
        value={data.nose_intensity}
        onChange={(v) => onChange({ nose_intensity: v as WineFormData['nose_intensity'] })}
      />

      <OrdinalSelector
        label="Development"
        options={DEVELOPMENT}
        value={data.nose_development}
        onChange={(v) => onChange({ nose_development: v as WineFormData['nose_development'] })}
      />

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-zinc-300">Aroma Notes (Nose)</label>
        <AromaTagPicker
          context="nose"
          selected={data.aromas}
          onChange={(aromas) => onChange({ aromas })}
        />
      </div>
    </div>
  )
}
