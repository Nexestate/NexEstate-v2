import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { BUYER_NAV } from '../../config/navigation';
import { useBuyerSharedProperties } from '../../hooks/useBuyerSharedProperties';

export function BuyerDashboard() {
  const { properties } = useBuyerSharedProperties();

  return (
    <DashboardLayout
      sections={BUYER_NAV}
      sharedProperties={properties.map((p) => ({
        id: p.id,
        title: p.title,
        permissionLevel: p.permissionLevel,
      }))}
      mobileNav="buyer"
      notificationsPath="/buyer/notifications"
    />
  );
}
