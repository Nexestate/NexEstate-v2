import type { AppNotification, FavoriteProperty } from '../types/domain';

export type { FavoriteProperty };

export const DEMO_FAVORITES: FavoriteProperty[] = [
  {
    id: 'fav-1',
    title: 'דירת 4 חדרים — נווה צedeק',
    city: 'תל אביב',
    address: 'שדה יehudah 12',
    price: 3_200_000,
    kind: 'מגורים',
    rooms: 4,
    added_at: '2026-08-17T10:00:00Z',
  },
  {
    id: 'fav-2',
    title: 'מגרש בנייה — ראשון לציון',
    city: 'ראשון לציון',
    address: 'אזור התעשייה',
    price: 1_800_000,
    kind: 'מגרש',
    added_at: '2026-08-16T14:00:00Z',
  },
];

export const DEMO_BUYER_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'b-notif-1',
    type: 'share',
    title: 'נכס חדש שותף איתך',
    message: 'מיכאל וינר שיתף איתך את "בניין שקטר 30" — הרשאת צפייה',
    severity: 'info',
    is_read: false,
    created_at: '2026-08-19T08:00:00Z',
  },
  {
    id: 'b-notif-2',
    type: 'price',
    title: 'ירידת מחיר בנכס שמועדף',
    message: 'דירת 4 חדרים בנווה צedeק — המחיר ירד ל-₪3,100,000',
    severity: 'warning',
    is_read: false,
    created_at: '2026-08-18T12:00:00Z',
  },
  {
    id: 'b-notif-3',
    type: 'auction',
    title: 'מכירה פומבית מתחילה מחר',
    message: 'מכירה פומבית — דירת 4 חדרים, חולון. מחיר פתיחה: ₪2,800,000',
    severity: 'info',
    is_read: true,
    created_at: '2026-08-17T09:00:00Z',
  },
];

export const DEMO_BROKER_LISTINGS = [
  {
    id: 'prop-1',
    title: 'בניין שקטר 30',
    city: 'תל אביב',
    address: 'רחוב שקטר 30',
    kind: 'משרדים',
    status: 'for_rent' as const,
    price: 105_633,
    area_sqm: 4500,
    leads_count: 4,
  },
  {
    id: 'listing-2',
    title: 'מתכת 34 — משרדים',
    city: 'חולון',
    address: 'רחוב מתכת 34',
    kind: 'משרדים',
    status: 'for_sale' as const,
    price: 3_200_000,
    area_sqm: 280,
    leads_count: 2,
  },
  {
    id: 'listing-3',
    title: 'דירת 4 חדרים — נווה צedeק',
    city: 'תל אביב',
    address: 'שדה יehudah 12',
    kind: 'מגורים',
    status: 'for_sale' as const,
    price: 3_500_000,
    area_sqm: 95,
    leads_count: 6,
  },
];
