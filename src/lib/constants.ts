import type { PropertyKind, PropertyStatus, UserRole } from '../types';
import type { SigningStatus } from '../types/domain';
import { ROLE_LABELS } from './roles';

export { ROLE_LABELS };

export const DEAL_TYPE_LABELS: Record<string, string> = {
  sale: 'מכירה',
  purchase: 'רכישה',
  rent: 'השכרה',
  investment: 'השקעה',
  long_term_rent: 'שכירות ארוכת טווח',
  business: 'עסקי',
  other: 'אחר',
};

export const AGREEMENT_TYPE_LABELS: Record<string, string> = {
  exclusive: 'בלעדי',
  non_exclusive: 'לא בלעדי',
  regular: 'רגיל',
};

export const PROPERTY_KIND_LABELS: Record<PropertyKind, string> = {
  apartment: 'דירה',
  house: 'בית',
  office: 'משרד',
  commercial: 'מסחרי',
  industrial: 'תעשייה',
  land: 'מגרש',
};

export const PROPERTY_STATUS_LABELS: Record<PropertyStatus, string> = {
  for_sale: 'למכירה',
  for_rent: 'להשכרה',
  sold: 'נמכר',
  rented: 'הושכר',
};

export const SIGNING_STATUS_LABELS: Record<SigningStatus, string> = {
  pending: 'ממתין',
  sent: 'נשלח',
  signed: 'נחתם',
  expired: 'פג תוקף',
};

export const INVITE_STATUS_LABELS: Record<string, string> = {
  pending: 'ממתין',
  claimed: 'נקלט',
  cancelled: 'בוטל',
};

export type { UserRole };
