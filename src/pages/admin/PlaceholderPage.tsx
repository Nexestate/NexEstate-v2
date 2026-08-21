import { Construction } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { EmptyState } from '../../components/ui/EmptyState';

const TITLES: Record<string, string> = {
  '/admin/properties': 'ניהול נכסים',
  '/admin/users': 'ניהול משתמשים',
  '/admin/shares': 'שיתופי נכסים',
  '/admin/support': 'פניות תמיכה',
  '/admin/import': 'ייבוא עסקאות',
  '/admin/pending': 'ממתינים לאישור',
  '/admin/approved': 'מאושרים היום',
  '/admin/rejected': 'דחויים היום',
  '/admin/settings': 'הגדרות',
  '/admin/notifications': 'התראות',
};

export function AdminPlaceholderPage() {
  const { pathname } = useLocation();
  return (
    <EmptyState
      icon={Construction}
      title={TITLES[pathname] ?? 'בקרוב'}
      description="הדף הזה יהיה זמין בשלב הבא של הפיתוח"
    />
  );
}
