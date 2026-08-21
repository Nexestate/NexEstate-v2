import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { DEMO_SHARED_PROPERTIES } from '../../data/demoData';
import { BUYER_NAV } from '../../config/navigation';

export function BuyerDashboard() {
  return (
    <DashboardLayout
      sections={BUYER_NAV}
      sharedProperties={DEMO_SHARED_PROPERTIES.map((p) => ({
        id: p.id,
        title: p.title,
        permissionLevel: p.permissionLevel,
      }))}
      mobileNav="buyer"
      notificationsPath="/buyer/notifications"
    />
  );
}
