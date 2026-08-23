import { ChevronLeft, Eye, LogOut, Pencil, Plus, Shield } from 'lucide-react';
import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useQuickAdd, type QuickAddType } from '../../contexts/QuickAddContext';
import type { ManagedPropertySidebarItem } from '../../lib/services/brokerStatsService';
import { ROLE_LABELS } from '../../lib/roles';
import { cn, getInitials } from '../../lib/utils';
import type { NavSection, PermissionLevel } from '../../types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Logo } from './Logo';

interface SidebarProps {
  sections: NavSection[];
  managedProperties?: ManagedPropertySidebarItem[];
  managedPropertiesLoading?: boolean;
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

export function Sidebar({
  sections,
  managedProperties = [],
  managedPropertiesLoading = false,
  sharedProperties = [],
  onClose,
}: SidebarProps) {
  const { user, signOut } = useAuth();
  const { openQuickAdd } = useQuickAdd();
  const location = useLocation();
  const [managedOpen, setManagedOpen] = useState(false);
  const [expandedProperties, setExpandedProperties] = useState<Set<string>>(() => new Set());
  const [sharedOpen, setSharedOpen] = useState(false);

  const activePropertyId =
    location.pathname.match(/^\/broker\/properties\/([^/]+)/)?.[1] ??
    new URLSearchParams(location.search).get('property');

  const isManagedSectionActive =
    location.pathname.startsWith('/broker/properties') ||
    ['/broker/units', '/broker/tenants', '/broker/leases', '/broker/payments'].some((path) =>
      location.pathname.startsWith(path),
    );

  useEffect(() => {
    if (isManagedSectionActive) setManagedOpen(true);
    if (activePropertyId) {
      setExpandedProperties((prev) => {
        if (prev.has(activePropertyId)) return prev;
        const next = new Set(prev);
        next.add(activePropertyId);
        return next;
      });
    }
  }, [activePropertyId, isManagedSectionActive]);

  const toggleProperty = (propertyId: string) => {
    setExpandedProperties((prev) => {
      const next = new Set(prev);
      if (next.has(propertyId)) next.delete(propertyId);
      else next.add(propertyId);
      return next;
    });
  };

  const isPropertyExpanded = (propertyId: string) => expandedProperties.has(propertyId);

  const handleQuickAdd = (e: React.MouseEvent, type: QuickAddType, propertyId?: string) => {
    e.preventDefault();
    e.stopPropagation();
    openQuickAdd(type, propertyId ? { propertyId } : undefined);
    onClose?.();
  };

  return (
    <aside className="flex h-[100dvh] w-64 flex-col border-s border-sidebar-border bg-sidebar">
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
                const isManagedPropertiesItem = item.to === '/broker/properties';
                return (
                  <li key={item.to}>
                    <div className="flex items-center gap-1">
                      {isManagedPropertiesItem && (
                        <button
                          type="button"
                          aria-label={managedOpen ? 'סגור רשימת נכסים' : 'פתח רשימת נכסים'}
                          aria-expanded={managedOpen}
                          onClick={() => setManagedOpen((open) => !open)}
                          className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                          <ChevronLeft
                            className={cn(
                              'h-4 w-4 transition-transform duration-200',
                              managedOpen && '-rotate-90',
                            )}
                          />
                        </button>
                      )}
                      <NavLink
                        to={item.to}
                        end={item.end}
                        onClick={onClose}
                        className={({ isActive }) =>
                          cn(
                            'flex flex-1 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                            isActive
                              ? 'bg-primary/10 text-primary'
                              : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                          )
                        }
                      >
                        <Icon className="h-5 w-5 shrink-0" />
                        <span className="flex-1">{item.label}</span>
                        {isManagedPropertiesItem && !managedOpen && managedProperties.length > 0 && (
                          <span className="text-[10px] text-muted-foreground">({managedProperties.length})</span>
                        )}
                      </NavLink>
                      {item.addNew && (
                        <button
                          type="button"
                          aria-label={`הוסף ${item.label}`}
                          className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-primary/10 text-primary hover:bg-primary/20"
                          onClick={(e) => handleQuickAdd(e, item.addNew as QuickAddType)}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    {isManagedPropertiesItem && managedOpen && (
                      <ul className="me-2 mt-1 space-y-0.5 border-s border-border ps-3">
                        {managedPropertiesLoading ? (
                          <li className="px-2 py-2 text-xs text-muted-foreground">טוען נכסים...</li>
                        ) : managedProperties.length === 0 ? (
                          <li className="px-2 py-2 text-xs text-muted-foreground">אין נכסים מנוהלים</li>
                        ) : (
                          managedProperties.map((prop) => (
                          <li key={prop.id}>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                aria-label={isPropertyExpanded(prop.id) ? 'סגור תפריט נכס' : 'פתח תפריט נכס'}
                                aria-expanded={isPropertyExpanded(prop.id)}
                                onClick={() => toggleProperty(prop.id)}
                                className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                              >
                                <ChevronLeft
                                  className={cn(
                                    'h-3.5 w-3.5 transition-transform duration-200',
                                    isPropertyExpanded(prop.id) && '-rotate-90',
                                  )}
                                />
                              </button>
                              <NavLink
                                to={`/broker/properties/${prop.id}`}
                                onClick={onClose}
                                className={({ isActive }) =>
                                  cn(
                                    'flex min-w-0 flex-1 items-center gap-1 rounded-lg px-2 py-1.5 text-xs transition-colors',
                                    isActive || activePropertyId === prop.id
                                      ? 'bg-primary/10 font-medium text-primary'
                                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                                  )
                                }
                              >
                                <span className="truncate">{prop.title}</span>
                                <span className="shrink-0 text-muted-foreground">({prop.totalUnits})</span>
                              </NavLink>
                            </div>
                            {isPropertyExpanded(prop.id) && (
                              <ul className="me-2 space-y-0.5 border-s border-border ps-3 pb-1 pt-1">
                                <li>
                                  <div className="flex items-center gap-1 rounded px-2 py-1 text-xs text-muted-foreground hover:text-foreground">
                                    <NavLink
                                      to={`/broker/units?property=${prop.id}`}
                                      onClick={onClose}
                                      className="flex-1"
                                    >
                                      יחידות ({prop.totalUnits})
                                    </NavLink>
                                    <button
                                      type="button"
                                      aria-label="הוסף יחידה"
                                      className="grid h-5 w-5 place-items-center rounded text-primary hover:bg-primary/10"
                                      onClick={(e) => handleQuickAdd(e, 'unit', prop.id)}
                                    >
                                      <Plus className="h-3 w-3" />
                                    </button>
                                  </div>
                                </li>
                                <li>
                                  <div className="flex items-center gap-1 rounded px-2 py-1 text-xs text-muted-foreground hover:text-foreground">
                                    <NavLink
                                      to={`/broker/tenants?property=${prop.id}`}
                                      onClick={onClose}
                                      className="flex-1"
                                    >
                                      שוכרים ({prop.tenantCount})
                                    </NavLink>
                                    <button
                                      type="button"
                                      aria-label="הוסף שוכר"
                                      className="grid h-5 w-5 place-items-center rounded text-primary hover:bg-primary/10"
                                      onClick={(e) => handleQuickAdd(e, 'tenant', prop.id)}
                                    >
                                      <Plus className="h-3 w-3" />
                                    </button>
                                  </div>
                                </li>
                                <li>
                                  <div className="flex items-center gap-1 rounded px-2 py-1 text-xs text-muted-foreground hover:text-foreground">
                                    <NavLink
                                      to={`/broker/leases?property=${prop.id}`}
                                      onClick={onClose}
                                      className="flex-1"
                                    >
                                      חוזים ({prop.leaseCount})
                                    </NavLink>
                                    <button
                                      type="button"
                                      aria-label="הוסף חוזה"
                                      className="grid h-5 w-5 place-items-center rounded text-primary hover:bg-primary/10"
                                      onClick={(e) => handleQuickAdd(e, 'lease', prop.id)}
                                    >
                                      <Plus className="h-3 w-3" />
                                    </button>
                                  </div>
                                </li>
                                <li>
                                  <NavLink
                                    to={`/broker/payments?property=${prop.id}`}
                                    onClick={onClose}
                                    className="flex items-center gap-2 rounded px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                                  >
                                    תשלומים ({prop.paymentCount})
                                  </NavLink>
                                </li>
                              </ul>
                            )}
                          </li>
                        ))
                        )}
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
              aria-expanded={sharedOpen}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              <ChevronLeft
                className={cn('h-3.5 w-3.5 transition-transform duration-200', sharedOpen && '-rotate-90')}
              />
              נכסים ששותפו איתי
              {!sharedOpen && (
                <span className="text-[10px] font-normal normal-case">({sharedProperties.length})</span>
              )}
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
        'fixed inset-y-0 start-0 z-50 w-[min(100vw-3rem,16rem)] transform transition-transform duration-200 lg:hidden',
        open ? 'pointer-events-auto translate-x-0' : 'pointer-events-none translate-x-full',
      )}
      aria-hidden={!open}
    >
      {children}
      {open && (
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 end-[-2.75rem] grid h-10 w-10 place-items-center rounded-lg bg-card text-muted-foreground shadow-md"
          aria-label="סגור תפריט"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
