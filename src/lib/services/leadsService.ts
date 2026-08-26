import { DEMO_CLIENTS, DEMO_LEADS } from '../../data/demoData';
import type { Client, Lead, LeadStatus } from '../../types/domain';
import { loadNotificationPrefs } from '../notificationPrefs';
import { showBrowserNotification } from '../pushNotifications';
import { createNotification } from './notificationsService';
import { isDemoMode, requireSupabase, ServiceError, throwIfError } from './serviceHelpers';

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

export async function createLead(
  brokerId: string,
  payload: { full_name: string; phone: string; source?: string; property_title?: string },
): Promise<string> {
  if (isDemoMode()) {
    const id = `lead-${Date.now()}`;
    DEMO_LEADS.unshift({
      id,
      broker_id: brokerId,
      full_name: payload.full_name,
      phone: payload.phone,
      source: payload.source,
      property_title: payload.property_title,
      status: 'new',
      created_at: new Date().toISOString(),
    });
    await notifyLeadCreated(brokerId, payload.full_name, payload.property_title);
    return id;
  }

  const client = requireSupabase();
  const { data, error } = await client
    .from('leads')
    .insert({
      broker_id: brokerId,
      full_name: payload.full_name,
      phone: payload.phone,
      source: payload.source,
      status: 'new',
    })
    .select('id')
    .single();
  throwIfError(error);
  if (!data) throw new ServiceError('Lead insert returned no data');

  await notifyLeadCreated(brokerId, payload.full_name, payload.property_title);
  return data.id as string;
}

async function notifyLeadCreated(
  brokerId: string,
  leadName: string,
  propertyTitle?: string,
): Promise<void> {
  const prefs = loadNotificationPrefs();
  if (!prefs.leadAlerts) return;

  const message = propertyTitle
    ? `${leadName} השאיר/ה פרטים לגבי ${propertyTitle}`
    : `${leadName} השאיר/ה פרטים — ליד חדש`;

  const notification = await createNotification({
    userId: brokerId,
    type: 'lead',
    title: 'ליד חדש',
    message,
    severity: 'info',
    link: '/broker/leads',
  });

  if (notification && prefs.pushEnabled) {
    showBrowserNotification({
      title: notification.title,
      body: notification.message,
      tag: notification.id,
      url: '/broker/leads',
      type: 'lead',
    });
  }
}

export async function createClient(
  brokerId: string,
  payload: { full_name: string; type: Client['type']; phone?: string; email?: string },
): Promise<string> {
  if (isDemoMode()) {
    const id = `client-${Date.now()}`;
    DEMO_CLIENTS.unshift({
      id,
      broker_id: brokerId,
      full_name: payload.full_name,
      type: payload.type,
      phone: payload.phone,
      email: payload.email,
      created_at: new Date().toISOString(),
    });
    return id;
  }

  const client = requireSupabase();
  const { data, error } = await client
    .from('clients')
    .insert({
      broker_id: brokerId,
      full_name: payload.full_name,
      type: payload.type,
      phone: payload.phone,
      email: payload.email,
    })
    .select('id')
    .single();
  throwIfError(error);
  if (!data) throw new ServiceError('Client insert returned no data');
  return data.id as string;
}

export async function updateClient(
  id: string,
  payload: { full_name?: string; type?: Client['type']; phone?: string; email?: string },
): Promise<void> {
  if (isDemoMode()) {
    const clientRow = DEMO_CLIENTS.find((c) => c.id === id);
    if (clientRow) Object.assign(clientRow, payload);
    return;
  }

  const client = requireSupabase();
  const { error } = await client
    .from('clients')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id);
  throwIfError(error);
}

export async function updateLead(
  id: string,
  payload: { full_name?: string; phone?: string; source?: string; status?: LeadStatus },
): Promise<void> {
  if (isDemoMode()) {
    const lead = DEMO_LEADS.find((l) => l.id === id);
    if (lead) Object.assign(lead, payload);
    return;
  }

  const client = requireSupabase();
  const { error } = await client
    .from('leads')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id);
  throwIfError(error);
}

export async function updateLeadStatus(id: string, status: LeadStatus): Promise<void> {
  if (isDemoMode()) {
    const lead = DEMO_LEADS.find((l) => l.id === id);
    if (lead) lead.status = status;
    return;
  }

  const client = requireSupabase();
  const { error } = await client
    .from('leads')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);
  throwIfError(error);
}
