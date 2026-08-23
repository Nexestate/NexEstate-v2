import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useRealtimeNotifications } from '../../hooks/useRealtimeNotifications';
import { QuickAddProvider } from '../../contexts/QuickAddContext';
import { cn } from '../../lib/utils';
import type { NavSection, PermissionLevel } from '../../types';
import { QuickAddModals } from '../broker/QuickAddModals';
import { Header } from './Header';
import { MobileBottomNav } from '../mobile/MobileBottomNav';
import { Sidebar, SidebarOverlay, MobileSidebarDrawer } from './Sidebar';

interface DashboardLayoutProps {
  sections: NavSection[];
  managedProperties?: import('../../lib/services/brokerStatsService').ManagedPropertySidebarItem[];
  managedPropertiesLoading?: boolean;
  sharedProperties?: Array<{ id: string; title: string; permissionLevel: PermissionLevel }>;
  mobileNav?: 'broker' | 'buyer' | 'admin';
  headerSubtitle?: string;
  notificationsPath?: string;
}

export function DashboardLayout({
  sections,
  managedProperties,
  managedPropertiesLoading,
  sharedProperties,
  mobileNav = 'broker',
  headerSubtitle,
  notificationsPath,
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  useRealtimeNotifications(user?.id);

  useEffect(() => {
    if (sidebarOpen) document.body.classList.add('mobile-menu-open');
    else document.body.classList.remove('mobile-menu-open');
    return () => document.body.classList.remove('mobile-menu-open');
  }, [sidebarOpen]);

  return (
    <QuickAddProvider>
      <div className="flex min-h-[100dvh] min-w-0 bg-background">
        <div className="hidden lg:block">
          <Sidebar
            sections={sections}
            managedProperties={managedProperties}
            managedPropertiesLoading={managedPropertiesLoading}
            sharedProperties={sharedProperties}
          />
        </div>

        <SidebarOverlay open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <MobileSidebarDrawer open={sidebarOpen} onClose={() => setSidebarOpen(false)}>
          <Sidebar
            sections={sections}
            managedProperties={managedProperties}
            managedPropertiesLoading={managedPropertiesLoading}
            sharedProperties={sharedProperties}
            onClose={() => setSidebarOpen(false)}
          />
        </MobileSidebarDrawer>

        <div className="flex min-w-0 flex-1 flex-col">
          <main
            className={cn('flex min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto p-4 pb-24 lg:p-8 lg:pb-8')}
          >
            <Header
              subtitle={headerSubtitle}
              onMenuClick={() => setSidebarOpen(true)}
              notificationsPath={notificationsPath}
            />
            <Outlet />
          </main>
          <MobileBottomNav variant={mobileNav} />
        </div>
      </div>
      <QuickAddModals />
    </QuickAddProvider>
  );
}
