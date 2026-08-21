import { DEMO_CLIENTS, DEMO_LEADS } from '../../data/demoData';
import type { Client, Lead, LeadStatus } from '../../types/domain';
import { isDemoMode, requireSupabase, throwIfError } from './serviceHelpers';

export async function fetchLeads(brokerId?: string): Promise<Lead[]> {
  if (isDemoMode()) return DEMO_LEADS;

  const client = requireSupabase();
  let query = client
    .from('leads')
    .select('*, properties(title)')
    .order('created_at', { ascending: false });

  if (brokerId) query = query.eq('broker_id', brokerId);

  const { data, error } = await query;
  throwIfError(error);

  return (data ?? []).map((row) => ({
    id: row.id,
    broker_id: row.broker_id,
    property_id: row.property_id ?? undefined,
    property_title: (row.properties as { title?: string } | null)?.title,
    full_name: row.full_name,
    phone: row.phone,
    status: row.status as LeadStatus,
    source: row.source ?? undefined,
    created_at: row.created_at,
  }));
}

export async function fetchClients(brokerId?: string): Promise<Client[]> {
  if (isDemoMode()) return DEMO_CLIENTS;

  const client = requireSupabase();
  let query = client.from('clients').select('*').order('created_at', { ascending: false });
  if (brokerId) query = query.eq('broker_id', brokerId);

  const { data, error } = await query;
  throwIfError(error);

  return (data ?? []).map((row) => ({
    id: row.id,
    broker_id: row.broker_id,
    full_name: row.full_name,
    type: row.type,
    email: row.email ?? undefined,
    phone: row.phone ?? undefined,
    budget_min: row.budget_min ?? undefined,
    budget_max: row.budget_max ?? undefined,
    preferred_cities: row.preferred_cities ?? undefined,
    created_at: row.created_at,
  }));
}

export async function updateLeadStatus(id: string, status: LeadStatus): Promise<void> {
  if (isDemoMode()) return;

  const client = requireSupabase();
  const { error } = await client
    .from('leads')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);
  throwIfError(error);
}
