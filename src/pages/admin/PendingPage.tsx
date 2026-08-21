import { PropertyReviewList } from '../../components/admin/PropertyReviewList';

export function AdminPendingPage() {
  return (
    <PropertyReviewList
      status="pending"
      title="ממתינים לאישור"
      description="נכסים שהוגשו וממתינים לבדיקה"
      emptyTitle="אין נכסים ממתינים"
      emptyDescription="כל הנכסים אושרו"
      showActions
    />
  );
}
