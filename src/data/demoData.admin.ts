import type { PermissionLevel } from '../types';

export interface PropertyShare {
  id: string;
  property_title: string;
  property_city: string;
  shared_with_name: string;
  shared_with_email: string;
  shared_by_name: string;
  permission_level: PermissionLevel;
  created_at: string;
}

export interface SupportTicket {
  id: string;
  user_name: string;
  user_email: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved';
  priority: 'low' | 'medium' | 'high';
  created_at: string;
}

export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export interface PropertyReview {
  id: string;
  title: string;
  city: string;
  address: string;
  broker_name: string;
  broker_email: string;
  kind: string;
  status: ReviewStatus;
  submitted_at: string;
  reviewed_at?: string;
  rejection_reason?: string;
}

export const DEMO_PROPERTY_SHARES: PropertyShare[] = [
  {
    id: 'share-1',
    property_title: 'בניין שקטר 30',
    property_city: 'תל אביב',
    shared_with_name: 'שרה כהן',
    shared_with_email: 'sara@email.com',
    shared_by_name: 'מיכאל וינר',
    permission_level: 'view',
    created_at: '2026-08-15T10:00:00Z',
  },
  {
    id: 'share-2',
    property_title: 'מתכת 34',
    property_city: 'חולון',
    shared_with_name: 'דוד לevy',
    shared_with_email: 'david@email.com',
    shared_by_name: 'יוסי כהן',
    permission_level: 'edit',
    created_at: '2026-08-14T14:30:00Z',
  },
  {
    id: 'share-3',
    property_title: 'בניין שקטר 30',
    property_city: 'תל אביב',
    shared_with_name: 'Admin',
    shared_with_email: 'admin@nexestate.co',
    shared_by_name: 'מיכאל וינר',
    permission_level: 'admin',
    created_at: '2026-08-10T09:00:00Z',
  },
];

export const DEMO_SUPPORT_TICKETS: SupportTicket[] = [
  {
    id: 'ticket-1',
    user_name: 'שרה כהן',
    user_email: 'sara@email.com',
    subject: 'לא מצליחה לראות נכס ששותף',
    message: 'קיבלתי הזמנה לנכס אבל הוא לא מופיע ברשימה שלי',
    status: 'open',
    priority: 'high',
    created_at: '2026-08-19T08:00:00Z',
  },
  {
    id: 'ticket-2',
    user_name: 'מיכאל וינר',
    user_email: 'viner.michael@gmail.com',
    subject: 'בעיה ביצירת קישור חתימה',
    message: 'הקישור נוצר אבל הלקוח מקבל שגיאה 404',
    status: 'in_progress',
    priority: 'medium',
    created_at: '2026-08-18T11:00:00Z',
  },
  {
    id: 'ticket-3',
    user_name: 'דוד לevy',
    user_email: 'david@email.com',
    subject: 'בקשה לשינוי תפקיד',
    message: 'אני רוצה לעבור מתפקיד קונה לבעל נכס',
    status: 'resolved',
    priority: 'low',
    created_at: '2026-08-17T16:00:00Z',
  },
];

export const DEMO_PROPERTY_REVIEWS: PropertyReview[] = [
  {
    id: 'rev-1',
    title: 'דירת 4 חדרים — נווה צedeק',
    city: 'תל אביב',
    address: 'שדה יehudah 12',
    broker_name: 'מיכאל וינר',
    broker_email: 'viner.michael@gmail.com',
    kind: 'מגורים',
    status: 'pending',
    submitted_at: '2026-08-19T07:00:00Z',
  },
  {
    id: 'rev-2',
    title: 'משרדים — Azrieli',
    city: 'תל אביב',
    address: 'מגדלי Azrieli',
    broker_name: 'יוסי כהן',
    broker_email: 'yossi@email.com',
    kind: 'משרדים',
    status: 'pending',
    submitted_at: '2026-08-19T06:30:00Z',
  },
  {
    id: 'rev-3',
    title: 'מגרש בנייה — ראשון לציון',
    city: 'ראשון לציון',
    address: 'אזור התעשייה',
    broker_name: 'דוד לevy',
    broker_email: 'david@email.com',
    kind: 'מגרש',
    status: 'pending',
    submitted_at: '2026-08-18T15:00:00Z',
  },
  {
    id: 'rev-4',
    title: 'בניין שקטר 30',
    city: 'תל אביב',
    address: 'רחוב שקטר 30',
    broker_name: 'מיכאל וינר',
    broker_email: 'viner.michael@gmail.com',
    kind: 'משרדים',
    status: 'approved',
    submitted_at: '2026-08-19T09:00:00Z',
    reviewed_at: '2026-08-19T10:30:00Z',
  },
  {
    id: 'rev-5',
    title: 'דירת 3 חדרים — רמת גan',
    city: 'רמת גan',
    address: 'הרצל 45',
    broker_name: 'שרה כהן',
    broker_email: 'sara@email.com',
    kind: 'מגורים',
    status: 'approved',
    submitted_at: '2026-08-19T08:00:00Z',
    reviewed_at: '2026-08-19T09:15:00Z',
  },
  {
    id: 'rev-6',
    title: 'חנות — שוק הכarmel',
    city: 'תל אביב',
    address: 'שוק הכarmel 8',
    broker_name: 'יוסי כהן',
    broker_email: 'yossi@email.com',
    kind: 'מסחרי',
    status: 'rejected',
    submitted_at: '2026-08-19T07:30:00Z',
    reviewed_at: '2026-08-19T08:00:00Z',
    rejection_reason: 'חסרים מסמכי בעלות ותשריט בניין',
  },
];

export const DEMO_IMPORT_HISTORY = [
  { id: 'imp-1', filename: 'transactions_aug2026.csv', rows: 142, imported: 138, errors: 4, created_at: '2026-08-18T14:00:00Z' },
  { id: 'imp-2', filename: 'deals_q2.csv', rows: 89, imported: 89, errors: 0, created_at: '2026-08-10T10:00:00Z' },
];
