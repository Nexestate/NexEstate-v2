import type { ManagedProperty, SharedProperty } from '../types';

export interface DemoStats {
  properties: number;
  units: number;
  tenants: number;
  clients: number;
  leads: number;
  tasks: number;
  monthlyIncome: number;
  occupancyPercent: number;
}

export const DEMO_MANAGED_PROPERTIES: ManagedProperty[] = [
  {
    id: 'prop-1',
    title: 'בניין שקטר 30',
    address: 'רחוב שקטר 30',
    city: 'תל אביב',
    totalUnits: 30,
    occupiedUnits: 28,
    monthlyIncome: 105_633,
  },
];

export const DEMO_SHARED_PROPERTIES: SharedProperty[] = [
  {
    id: 'shared-1',
    title: 'בניין שקטר 30',
    address: 'רחוב שקטר 30',
    city: 'תל אביב',
    permissionLevel: 'view',
    sharedByName: 'מיכאל וינר',
  },
  {
    id: 'shared-2',
    title: 'מתכת 34',
    address: 'רחוב מתכת 34',
    city: 'חולון',
    permissionLevel: 'edit',
    sharedByName: 'יוסי כהן',
  },
];

export function calculateDemoStats(): DemoStats {
  const property = DEMO_MANAGED_PROPERTIES[0];
  return {
    properties: DEMO_MANAGED_PROPERTIES.length,
    units: property.totalUnits,
    tenants: 24,
    clients: 4,
    leads: 6,
    tasks: 4,
    monthlyIncome: property.monthlyIncome,
    occupancyPercent: Math.round((property.occupiedUnits / property.totalUnits) * 100),
  };
}

export const DEMO_ADMIN_STATS = {
  totalUsers: 42,
  totalProperties: 15,
  newUsersToday: 2,
  rejectedProperties: 0,
  newPropertiesToday: 3,
  suspendedUsers: 0,
  approvedProperties: 12,
  pendingProperties: 5,
};

export const DEMO_ROLE_DISTRIBUTION = [
  { key: 'broker', label: 'מתווכים', count: 8, color: '#3b82f6' },
  { key: 'developer', label: 'קבלנים/יזמים', count: 4, color: '#f59e0b' },
  { key: 'management', label: 'חברות ניהול', count: 3, color: '#10b981' },
  { key: 'owner', label: 'בעלי נכסים', count: 6, color: '#8b5cf6' },
  { key: 'investor', label: 'משקיעים', count: 2, color: '#ec4899' },
  { key: 'lawyer', label: 'כונסים/עו"ד', count: 1, color: '#06b6d4' },
  { key: 'buyer', label: 'קונים', count: 18, color: '#64748b' },
];
