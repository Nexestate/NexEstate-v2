import { Construction } from 'lucide-react';
import { EmptyState } from '../../components/ui/EmptyState';

interface ComingSoonPageProps {
  title?: string;
}

export function ComingSoonPage({ title = 'בקרוב' }: ComingSoonPageProps) {
  return (
    <EmptyState
      icon={Construction}
      title={title}
      description="הדף הזה יהיה זמין בשלב הבא של הפיתוח"
    />
  );
}
