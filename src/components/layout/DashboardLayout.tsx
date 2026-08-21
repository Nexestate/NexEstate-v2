import { useState } from 'react';
import { Outlet } from 'react-router-dom';
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
  sharedProperties?: Array<{ id: string; title: string; permissionLevel: PermissionLevel }>;
  mobileNav?: 'broker' | 'buyer' | 'admin';
  headerSubtitle?: string;
  notificationsPath?: string;
}

export function DashboardLayout({
  sections,
  managedProperties,
  sharedProperties,
  mobileNav = 'broker',
  headerSubtitle,
  notificationsPath,
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <QuickAddProvider>
      <div className="flex min-h-screen bg-background">
        <div className="hidden lg:block">
          <Sidebar sections={sections} managedProperties={managedProperties} sharedProperties={sharedProperties} />
        </div>

        <SidebarOverlay open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <MobileSidebarDrawer open={sidebarOpen} onClose={() => setSidebarOpen(false)}>
          <Sidebar
            sections={sections}
            managedProperties={managedProperties}
            sharedProperties={sharedProperties}
            onClose={() => setSidebarOpen(false)}
          />
        </MobileSidebarDrawer>

        <div className="flex flex-1 flex-col">
          <main className={cn('flex-1 overflow-y-auto p-4 pb-24 lg:p-8 lg:pb-8')}>
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
