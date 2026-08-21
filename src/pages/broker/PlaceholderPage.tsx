import { Construction } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { EmptyState } from '../../components/ui/EmptyState';

const PAGE_TITLES: Record<string, string> = {
  '/broker/my-properties': 'נכסים שלי',
  '/broker/auctions': 'מכירות פומביות',
  '/broker/notifications': 'התראות',
  '/broker/clients': 'לקוחות',
  '/broker/leads': 'לידים',
  '/broker/tasks': 'משימות',
  '/broker/agreements': 'הסכמים',
  '/broker/properties': 'נכסים מנוהלים',
  '/broker/reports': 'דוחות',
  '/broker/profile': 'הפרופיל שלי',
  '/broker/settings': 'הגדרות',
  '/broker/tenants': 'שוכרים',
  '/broker/leases': 'חוזים',
  '/broker/payments': 'תשלומים',
};

export function PlaceholderPage() {
  const { pathname } = useLocation();
  const title = PAGE_TITLES[pathname] ?? 'בקרוב';

  return (
    <EmptyState
      icon={Construction}
      title={title}
      description="הדף הזה יהיה זמין בשלב הבא של הפיתוח"
    />
  );
}
