export const CLARITY = ['clear', 'hazy'] as const
export const APPEARANCE_INTENSITY = ['pale', 'medium', 'deep'] as const
export const COLOR_WHITE = ['water-white', 'lemon-green', 'lemon', 'gold', 'amber', 'brown'] as const
export const COLOR_ROSE = ['pink', 'salmon', 'orange'] as const
export const COLOR_RED = ['purple', 'ruby', 'garnet', 'tawny', 'brown'] as const

export const NOSE_INTENSITY = ['light', 'medium', 'pronounced'] as const
export const DEVELOPMENT = ['youthful', 'developing', 'mature', 'tired'] as const

export const SWEETNESS = ['dry', 'off-dry', 'medium-dry', 'medium-sweet', 'sweet', 'luscious'] as const
export const ACIDITY = ['low', 'medium-minus', 'medium', 'medium-plus', 'high'] as const
export const TANNIN_LEVEL = ['low', 'medium-minus', 'medium', 'medium-plus', 'high'] as const
export const TANNIN_TEXTURE = ['grippy', 'smooth'] as const
export const ALCOHOL = ['low', 'medium', 'high'] as const
export const BODY = ['light', 'medium-minus', 'medium', 'medium-plus', 'full'] as const
export const MOUSSE = ['delicate', 'creamy', 'aggressive'] as const
export const FLAVOUR_INTENSITY = ['light', 'medium', 'pronounced'] as const
export const FINISH = ['short', 'medium', 'long'] as const

export const QUALITY = ['faulty', 'poor', 'acceptable', 'good', 'very-good', 'outstanding'] as const
export const READINESS = ['too-young', 'can-drink-has-potential', 'drink-now', 'too-old'] as const
export const WINE_TYPE = ['red', 'white', 'rosé', 'orange', 'sparkling', 'fortified', 'dessert'] as const
export const CELLAR_STATUS = ['tried', 'want-to-try', 'in-my-cellar'] as const

export type Clarity = typeof CLARITY[number]
export type AppearanceIntensity = typeof APPEARANCE_INTENSITY[number]
export type NoseIntensity = typeof NOSE_INTENSITY[number]
export type Development = typeof DEVELOPMENT[number]
export type Sweetness = typeof SWEETNESS[number]
export type Acidity = typeof ACIDITY[number]
export type TanninLevel = typeof TANNIN_LEVEL[number]
export type TanninTexture = typeof TANNIN_TEXTURE[number]
export type Alcohol = typeof ALCOHOL[number]
export type Body = typeof BODY[number]
export type Mousse = typeof MOUSSE[number]
export type FlavourIntensity = typeof FLAVOUR_INTENSITY[number]
export type Finish = typeof FINISH[number]
export type Quality = typeof QUALITY[number]
export type Readiness = typeof READINESS[number]
export type WineType = typeof WINE_TYPE[number]
export type CellarStatus = typeof CELLAR_STATUS[number]
export type AromaCategory = 'primary' | 'secondary' | 'tertiary'

/** Returns all values in the scale at or above the given value (inclusive). */
export function atLeast<T extends string>(scale: readonly T[], value: T): T[] {
  const idx = scale.indexOf(value)
  if (idx === -1) return []
  return [...scale.slice(idx)]
}

export const WINE_TYPE_COLORS: Record<WineType, string> = {
  red:       '#b91c1c',
  white:     '#ca8a04',
  rosé:      '#db2777',
  orange:    '#ea580c',
  sparkling: '#7c3aed',
  fortified: '#92400e',
  dessert:   '#0891b2',
}

export const QUALITY_LABELS: Record<Quality, string> = {
  faulty:      'Faulty',
  poor:        'Poor',
  acceptable:  'Acceptable',
  good:        'Good',
  'very-good': 'Very Good',
  outstanding: 'Outstanding',
}
