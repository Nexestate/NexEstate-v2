/** Standard amenities / inclusions for managed units (stored as JSON id list). */
export const UNIT_AMENITY_OPTIONS = [
  { id: 'ac', label: 'מיזוג' },
  { id: 'kitchenette', label: 'מטבחון' },
  { id: 'restrooms', label: 'שירותים' },
  { id: 'parking', label: 'חנייה' },
  { id: 'elevator', label: 'מעלית' },
  { id: 'accessibility', label: 'גישה לנכים' },
  { id: 'storage', label: 'מחסן' },
  { id: 'balcony', label: 'מרפסת / חצר' },
  { id: 'security', label: 'מערכת אבטחה' },
  { id: 'internet', label: 'תשתית אינטרנט' },
  { id: 'furniture', label: 'ריהוט' },
  { id: 'electricity', label: 'חשמל (כלול)' },
  { id: 'water', label: 'מים (כלול)' },
  { id: 'arnona', label: 'ארנונה (כלול)' },
  { id: 'vaad', label: 'ועד בית (כלול)' },
] as const;

export type UnitAmenityId = (typeof UNIT_AMENITY_OPTIONS)[number]['id'];

export function amenityLabels(ids: string[]): string[] {
  const map = new Map(UNIT_AMENITY_OPTIONS.map((a) => [a.id, a.label]));
  return ids.map((id) => map.get(id as UnitAmenityId) ?? id);
}
