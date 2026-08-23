import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { BROKER_NAV, getMobileNavVariant, getNavSectionsForRole } from '../../config/navigation';
import { useBrokerSidebarData } from '../../hooks/useBrokerSidebarData';
import { useAuth } from '../../contexts/AuthContext';

export function BrokerDashboard() {
  const { user } = useAuth();
  const { managedProperties, sharedProperties, loading } = useBrokerSidebarData();
  const sections = user ? getNavSectionsForRole(user.role) : BROKER_NAV;
  const mobileNav = user ? getMobileNavVariant(user.role) : 'broker';

  return (
    <DashboardLayout
      sections={sections}
      managedProperties={managedProperties}
      managedPropertiesLoading={loading}
      sharedProperties={sharedProperties}
      mobileNav={mobileNav}
      notificationsPath="/broker/notifications"
    />
  );
}
