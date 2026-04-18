import { useState } from 'react'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAromaTags } from '@/lib/hooks/useWines'
import type { AromaCategory } from '@/lib/ordinalScales'

interface SelectedAroma {
  tag_id: string
  context: 'nose' | 'palate'
  category: AromaCategory
}

interface Props {
  context: 'nose' | 'palate'
  selected: SelectedAroma[]
  onChange: (aromas: SelectedAroma[]) => void
}

const TABS: AromaCategory[] = ['primary', 'secondary', 'tertiary']

export function AromaTagPicker({ context, selected, onChange }: Props) {
  const { data: allTags = [] } = useAromaTags()
  const [activeTab, setActiveTab] = useState<AromaCategory>('primary')
  const [customInput, setCustomInput] = useState('')

  const contextSelected = selected.filter((s) => s.context === context)
  const selectedIds = new Set(contextSelected.map((s) => s.tag_id))

  const visibleTags = allTags.filter(
    (t) => t.category_hint === activeTab && !t.is_custom
  )

  function toggle(tagId: string) {
    if (selectedIds.has(tagId)) {
      onChange(selected.filter((s) => !(s.tag_id === tagId && s.context === context)))
    } else {
      const tag = allTags.find((t) => t.id === tagId)
      onChange([
        ...selected,
        { tag_id: tagId, context, category: tag?.category_hint ?? activeTab },
      ])
    }
  }

  function addCustom() {
    const trimmed = customInput.trim().toLowerCase()
    if (!trimmed) return
    const existing = allTags.find((t) => t.name === trimmed)
    const fakeId = `custom-${context}-${trimmed}`
    if (!selectedIds.has(existing?.id ?? fakeId)) {
      onChange([...selected, { tag_id: existing?.id ?? fakeId, context, category: activeTab }])
    }
    setCustomInput('')
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-1 bg-zinc-800 rounded-lg p-1">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={cn(
              'flex-1 py-1.5 text-sm rounded-md font-medium capitalize transition-colors',
              activeTab === tab ? 'bg-zinc-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {visibleTags.map((tag) => (
          <button
            key={tag.id}
            type="button"
            onClick={() => toggle(tag.id)}
            className={cn(
              'px-2.5 py-1 rounded-full text-sm transition-colors min-h-[36px]',
              selectedIds.has(tag.id)
                ? 'bg-rose-700 text-white'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            )}
          >
            {tag.name}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustom())}
          placeholder="Add custom aroma…"
          className="flex-1 bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-rose-600"
        />
        <button
          type="button"
          onClick={addCustom}
          className="p-2 bg-zinc-700 rounded-md hover:bg-zinc-600 min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {contextSelected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1 border-t border-zinc-800">
          {contextSelected.map((s) => {
            const tag = allTags.find((t) => t.id === s.tag_id)
            const name = tag?.name ?? s.tag_id.replace(`custom-${context}-`, '')
            return (
              <span
                key={s.tag_id}
                className="px-2 py-0.5 bg-rose-900/50 text-rose-300 rounded-full text-xs flex items-center gap-1"
              >
                {name}
                <button
                  type="button"
                  onClick={() => toggle(s.tag_id)}
                  className="hover:text-white"
                >
                  ×
                </button>
              </span>
            )
          })}
        </div>
      )}
    </div>
  )
}
