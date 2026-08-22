import { calculateDemoStats, DEMO_MANAGED_PROPERTIES, DEMO_PROPERTIES } from '../../data/demoData';
import type { PropertyWithUnits } from '../../types/domain';
import { fetchClients, fetchLeads, fetchLeases, fetchProperties, fetchTasks, fetchTenants } from './index';
import { isDemoMode } from './serviceHelpers';

export interface BrokerDashboardStats {
  properties: number;
  units: number;
  occupiedUnits: number;
  tenants: number;
  clients: number;
  leads: number;
  tasks: number;
  monthlyIncome: number;
  occupancyPercent: number;
  myListings: number;
}

export interface ManagedPropertySidebarItem {
  id: string;
  title: string;
  totalUnits: number;
  tenantCount: number;
  leaseCount: number;
  paymentCount: number;
}

export async function fetchBrokerDashboardStats(brokerId?: string): Promise<BrokerDashboardStats> {
  if (isDemoMode() || !brokerId) {
    const demo = calculateDemoStats();
    return {
      properties: demo.properties,
      units: demo.units,
      occupiedUnits: Math.round((demo.occupancyPercent / 100) * demo.units),
      tenants: demo.tenants,
      clients: demo.clients,
      leads: demo.leads,
      tasks: demo.tasks,
      monthlyIncome: demo.monthlyIncome,
      occupancyPercent: demo.occupancyPercent,
      myListings: 3,
    };
  }

  const [properties, leads, clients, tasks, tenants] = await Promise.all([
    fetchProperties(brokerId),
    fetchLeads(brokerId),
    fetchClients(brokerId),
    fetchTasks(brokerId),
    fetchTenants(brokerId),
  ]);

  const units = properties.reduce((sum, p) => sum + p.totalUnits, 0);
  const occupiedUnits = properties.reduce((sum, p) => sum + p.occupiedUnits, 0);
  const monthlyIncome = properties.reduce((sum, p) => sum + p.monthlyIncome, 0);
  const myListings = properties.filter((p) => p.status === 'active' || p.status === 'published').length;

  return {
    properties: properties.length,
    units,
    occupiedUnits,
    tenants: tenants.length,
    clients: clients.length,
    leads: leads.length,
    tasks: tasks.length,
    monthlyIncome,
    occupancyPercent: units > 0 ? Math.round((occupiedUnits / units) * 100) : 0,
    myListings,
  };
}

export async function fetchManagedPropertySidebar(
  brokerId?: string,
): Promise<{ properties: PropertyWithUnits[]; sidebar: ManagedPropertySidebarItem[] }> {
  const properties = await fetchProperties(brokerId);

  if (isDemoMode()) {
    const sidebar: ManagedPropertySidebarItem[] = DEMO_MANAGED_PROPERTIES.map((p) => ({
      id: p.id,
      title: p.title,
      totalUnits: p.totalUnits,
      tenantCount: 3,
      leaseCount: 4,
      paymentCount: 4,
    }));
    return { properties: DEMO_PROPERTIES, sidebar };
  }

  const [tenants, leases] = await Promise.all([
    fetchTenants(brokerId),
    fetchLeases(brokerId),
  ]);

  const tenantByProperty = new Map<string, Set<string>>();
  const leaseByProperty = new Map<string, number>();

  for (const l of leases) {
    if (!l.property_id) continue;
    leaseByProperty.set(l.property_id, (leaseByProperty.get(l.property_id) ?? 0) + 1);
    if (l.tenant_id) {
      const set = tenantByProperty.get(l.property_id) ?? new Set<string>();
      set.add(l.tenant_id);
      tenantByProperty.set(l.property_id, set);
    }
  }
  for (const t of tenants) {
    if (!t.property_id) continue;
    const set = tenantByProperty.get(t.property_id) ?? new Set<string>();
    set.add(t.id);
    tenantByProperty.set(t.property_id, set);
  }

  const sidebar: ManagedPropertySidebarItem[] = properties.map((p) => ({
    id: p.id,
    title: p.title,
    totalUnits: p.totalUnits,
    tenantCount: tenantByProperty.get(p.id)?.size ?? 0,
    leaseCount: leaseByProperty.get(p.id) ?? 0,
    paymentCount: leaseByProperty.get(p.id) ?? 0,
  }));

  return { properties, sidebar };
}
