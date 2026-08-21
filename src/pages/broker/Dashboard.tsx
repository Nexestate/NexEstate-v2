import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { BROKER_NAV } from '../../config/navigation';
import { useBrokerSidebarData } from '../../hooks/useBrokerSidebarData';

export function BrokerDashboard() {
  const { managedProperties, sharedProperties } = useBrokerSidebarData();

  return (
    <DashboardLayout
      sections={BROKER_NAV}
      managedProperties={managedProperties}
      sharedProperties={sharedProperties}
      mobileNav="broker"
      notificationsPath="/broker/notifications"
    />
  );
}
