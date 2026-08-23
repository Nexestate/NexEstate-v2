import { calculateDemoStats, DEMO_MANAGED_PROPERTIES, DEMO_PROPERTIES } from '../../data/demoData';
import type { PropertyWithUnits } from '../../types/domain';
import { fetchClients, fetchLeads, fetchLeases, fetchProperties, fetchTasks, fetchTenants } from './index';
import { isDemoMode, requireSupabase } from './serviceHelpers';

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

  const tenantByProperty = new Map<string, number>();
  const leaseByProperty = new Map<string, number>();

  try {
    const [tenants, leases] = await Promise.all([
      fetchTenants(brokerId),
      fetchLeases(brokerId),
    ]);

    const tenantIdsByProperty = new Map<string, Set<string>>();
    for (const l of leases) {
      if (!l.property_id || !l.is_active) continue;
      leaseByProperty.set(l.property_id, (leaseByProperty.get(l.property_id) ?? 0) + 1);
      if (l.tenant_id) {
        if (!tenantIdsByProperty.has(l.property_id)) {
          tenantIdsByProperty.set(l.property_id, new Set());
        }
        tenantIdsByProperty.get(l.property_id)!.add(l.tenant_id);
      }
    }
    for (const [pid, ids] of tenantIdsByProperty) {
      tenantByProperty.set(pid, ids.size);
    }
    for (const t of tenants) {
      const pid = (t as { property_id?: string }).property_id;
      if (pid && !tenantByProperty.has(pid)) {
        tenantByProperty.set(pid, (tenantByProperty.get(pid) ?? 0) + 1);
      }
    }
  } catch (err) {
    console.error('[fetchManagedPropertySidebar] tenant/lease counts failed', err);
  }

  const sidebar: ManagedPropertySidebarItem[] = properties.map((p) => ({
    id: p.id,
    title: p.title,
    totalUnits: p.totalUnits,
    tenantCount: tenantByProperty.get(p.id) ?? 0,
    leaseCount: leaseByProperty.get(p.id) ?? 0,
    paymentCount: leaseByProperty.get(p.id) ?? 0,
  }));

  return { properties, sidebar };
}

/** Sidebar counts for a single property (owned or shared). */
export async function fetchPropertySidebarItem(
  propertyId: string,
  title?: string,
): Promise<ManagedPropertySidebarItem> {
  if (isDemoMode()) {
    const demo = DEMO_MANAGED_PROPERTIES.find((p) => p.id === propertyId);
    return {
      id: propertyId,
      title: title ?? demo?.title ?? 'נכס',
      totalUnits: demo?.totalUnits ?? 0,
      tenantCount: 3,
      leaseCount: 4,
      paymentCount: 4,
    };
  }

  const client = requireSupabase();
  const [{ data: prop }, { data: units }, { data: leases }] = await Promise.all([
    client.from('properties').select('title').eq('id', propertyId).maybeSingle(),
    client.from('property_units').select('id').eq('property_id', propertyId),
    client
      .from('leases')
      .select('id, tenant_id')
      .eq('property_id', propertyId)
      .eq('is_active', true),
  ]);

  const tenantIds = new Set(
    (leases ?? []).map((l) => l.tenant_id as string).filter(Boolean),
  );

  return {
    id: propertyId,
    title: title ?? (prop?.title as string) ?? 'נכס',
    totalUnits: units?.length ?? 0,
    tenantCount: tenantIds.size,
    leaseCount: leases?.length ?? 0,
    paymentCount: leases?.length ?? 0,
  };
}
