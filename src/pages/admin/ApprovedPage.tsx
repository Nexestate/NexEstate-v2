import { PropertyReviewList } from '../../components/admin/PropertyReviewList';

export function AdminApprovedPage() {
  return (
    <PropertyReviewList
      status="approved"
      title="מאושרים היום"
      description="נכסים שאושרו היום"
      emptyTitle="אין נכסים שאושרו היום"
      emptyDescription="נכסים שיאושרו יופיעו כאן"
    />
  );
}
