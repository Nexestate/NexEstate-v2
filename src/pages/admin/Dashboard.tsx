import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { ADMIN_NAV } from '../../config/navigation';

export function AdminDashboard() {
  return (
    <DashboardLayout
      sections={ADMIN_NAV}
      mobileNav="admin"
      headerSubtitle="סקירה כללית של הפלטפורמה"
      notificationsPath="/admin/notifications"
    />
  );
}
