import { PropertyReviewList } from '../../components/admin/PropertyReviewList';

export function AdminRejectedPage() {
  return (
    <PropertyReviewList
      status="rejected"
      title="דחויים היום"
      description="נכסים שנדחו היום"
      emptyTitle="אין נכסים שנדחו היום"
      emptyDescription="נכסים שנדחו יופיעו כאן עם סיבת הדחייה"
    />
  );
}
