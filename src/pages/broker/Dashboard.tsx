import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { BROKER_NAV } from '../../config/navigation';

export function BrokerDashboard() {
  return (
    <DashboardLayout
      sections={BROKER_NAV}
      mobileNav="broker"
      notificationsPath="/broker/notifications"
    />
  );
}
