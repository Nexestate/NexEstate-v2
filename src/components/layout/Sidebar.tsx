import { ChevronDown, ChevronLeft, Eye, LogOut, Pencil, Plus, Shield } from 'lucide-react';
import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { DEMO_MANAGED_PROPERTIES } from '../../data/demoData';
import { ROLE_LABELS } from '../../lib/roles';
import { cn, getInitials } from '../../lib/utils';
import type { NavSection, PermissionLevel } from '../../types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Logo } from './Logo';

interface SidebarProps {
  sections: NavSection[];
  sharedProperties?: Array<{
    id: string;
    title: string;
    permissionLevel: PermissionLevel;
  }>;
  onClose?: () => void;
}

const PERMISSION_ICONS: Record<PermissionLevel, typeof Eye> = {
  view: Eye,
  edit: Pencil,
  admin: Shield,
};

const PERMISSION_LABELS: Record<PermissionLevel, string> = {
  view: 'צפייה',
  edit: 'עריכה',
  admin: 'מנהל',
};

export function Sidebar({ sections, sharedProperties = [], onClose }: SidebarProps) {
  const { user, signOut } = useAuth();
  const [expandedProperty, setExpandedProperty] = useState<string | null>(DEMO_MANAGED_PROPERTIES[0]?.id ?? null);
  const [sharedOpen, setSharedOpen] = useState(sharedProperties.length > 0);

  return (
    <aside className="flex h-full w-64 flex-col border-s border-sidebar-border bg-sidebar">
      <div className="border-b border-sidebar-border p-4">
        <Logo size="sm" />
      </div>

      <nav className="flex-1 overflow-y-auto p-3">
        {sections.map((section) => (
          <div key={section.title || 'main'} className="mb-4">
            {section.title && (
              <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {section.title}
              </p>
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                if (item.adminOnly && user?.role !== 'admin' && user?.role !== 'superadmin') {
                  return null;
                }
                const Icon = item.icon;
                return (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.end}
                      onClick={onClose}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-primary/10 text-primary'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                        )
                      }
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      <span className="flex-1">{item.label}</span>
                      {item.addNew && (
                        <span
                          className="grid h-6 w-6 place-items-center rounded-md bg-primary/10 text-primary"
                          onClick={(e) => e.preventDefault()}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </span>
                      )}
                    </NavLink>

                    {item.to === '/broker/properties' && DEMO_MANAGED_PROPERTIES.length > 0 && (
                      <ul className="me-2 mt-1 space-y-0.5 border-s border-border ps-3">
                        {DEMO_MANAGED_PROPERTIES.map((prop) => (
                          <li key={prop.id}>
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedProperty(expandedProperty === prop.id ? null : prop.id)
                              }
                              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                            >
                              <ChevronDown
                                className={cn(
                                  'h-3.5 w-3.5 transition-transform',
                                  expandedProperty === prop.id && 'rotate-180',
                                )}
                              />
                              <span className="flex-1 truncate text-start">{prop.title}</span>
                              <span className="text-muted-foreground">({prop.totalUnits})</span>
                            </button>
                            {expandedProperty === prop.id && (
                              <ul className="me-2 space-y-0.5 border-s border-border ps-3 pb-1">
                                <li>
                                  <NavLink
                                    to={`/broker/tenants?property=${prop.id}`}
                                    className="flex items-center gap-2 rounded px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                                  >
                                    שוכרים (3)
                                    <Plus className="ms-auto h-3 w-3 text-primary" />
                                  </NavLink>
                                </li>
                                <li>
                                  <NavLink
                                    to={`/broker/leases?property=${prop.id}`}
                                    className="flex items-center gap-2 rounded px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                                  >
                                    חוזים (4)
                                    <Plus className="ms-auto h-3 w-3 text-primary" />
                                  </NavLink>
                                </li>
                                <li>
                                  <NavLink
                                    to={`/broker/payments?property=${prop.id}`}
                                    className="flex items-center gap-2 rounded px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                                  >
                                    תשלומים (4)
                                  </NavLink>
                                </li>
                              </ul>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        {sharedProperties.length > 0 && (
          <div className="mt-4 border-t border-sidebar-border pt-4">
            <button
              type="button"
              onClick={() => setSharedOpen(!sharedOpen)}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', sharedOpen && 'rotate-180')} />
              נכסים ששותפו איתי
            </button>
            {sharedOpen && (
              <ul className="mt-1 space-y-0.5">
                {sharedProperties.map((prop) => {
                  const PermIcon = PERMISSION_ICONS[prop.permissionLevel];
                  return (
                    <li key={prop.id}>
                      <NavLink
                        to={`/broker/properties/${prop.id}`}
                        className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        <span className="flex-1 truncate">{prop.title}</span>
                        <span title={PERMISSION_LABELS[prop.permissionLevel]}>
                          <PermIcon className="h-3.5 w-3.5 text-primary" />
                        </span>
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </nav>

      {user && (
        <div className="border-t border-sidebar-border p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-white">
              {getInitials(user.full_name)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{user.full_name}</p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <Badge variant="primary" className="mb-3">
            {ROLE_LABELS[user.role]}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => signOut()}
          >
            <LogOut className="h-4 w-4" />
            התנתקות
          </Button>
        </div>
      )}
    </aside>
  );
}

export function SidebarOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <button
      type="button"
      aria-label="סגור תפריט"
      className="fixed inset-0 z-40 bg-black/60 lg:hidden"
      onClick={onClose}
    />
  );
}

export function MobileSidebarDrawer({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'fixed inset-y-0 end-0 z-50 w-64 transform transition-transform duration-200 lg:hidden',
        open ? 'translate-x-0' : 'translate-x-full',
      )}
    >
      {children}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 start-[-2.5rem] grid h-8 w-8 place-items-center rounded-lg bg-card text-muted-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
    </div>
  );
}
