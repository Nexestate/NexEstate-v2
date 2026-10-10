import { isDemoMode, requireSupabase, ServiceError, throwIfError } from './serviceHelpers';

export type SupportTicketStatus = 'open' | 'in_progress' | 'resolved';
export type SupportTicketPriority = 'low' | 'medium' | 'high';

export interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  message: string;
  status: SupportTicketStatus;
  priority: SupportTicketPriority;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  user_name?: string;
  user_email?: string;
}

export async function createSupportTicket(
  userId: string,
  payload: { subject: string; message: string; priority?: SupportTicketPriority },
): Promise<SupportTicket> {
  if (!payload.subject.trim() || !payload.message.trim()) {
    throw new ServiceError('נא למלא נושא והודעה');
  }

  if (isDemoMode()) {
    return {
      id: `ticket-${Date.now()}`,
      user_id: userId,
      subject: payload.subject,
      message: payload.message,
      status: 'open',
      priority: payload.priority ?? 'medium',
      admin_notes: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  const client = requireSupabase();
  const { data, error } = await client
    .from('support_tickets')
    .insert({
      user_id: userId,
      subject: payload.subject.trim(),
      message: payload.message.trim(),
      priority: payload.priority ?? 'medium',
    })
    .select('*')
    .single();

  throwIfError(error);
  return data as unknown as SupportTicket;
}

export async function fetchMySupportTickets(userId: string): Promise<SupportTicket[]> {
  if (isDemoMode()) return [];

  const client = requireSupabase();
  const { data, error } = await client
    .from('support_tickets')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  throwIfError(error);
  return (data ?? []) as SupportTicket[];
}

export async function fetchAdminSupportTickets(search?: string): Promise<SupportTicket[]> {
  if (isDemoMode()) return [];

  const client = requireSupabase();
  const { data, error } = await client
    .from('support_tickets')
    .select('*, profiles(full_name, email)')
    .order('created_at', { ascending: false })
    .limit(500);

  throwIfError(error);

  const rows = (data ?? []).map((row: Record<string, unknown>) => {
    const profile = row.profiles as { full_name?: string; email?: string } | null;
    const { profiles: _p, ...rest } = row;
    const ticket = rest as unknown as SupportTicket;
    return {
      ...ticket,
      user_name: profile?.full_name,
      user_email: profile?.email,
    };
  });

  const q = search?.trim();
  if (!q) return rows;

  return rows.filter(
    (t) =>
      t.subject.includes(q) ||
      t.message.includes(q) ||
      t.user_name?.includes(q) ||
      t.user_email?.toLowerCase().includes(q.toLowerCase()),
  );
}

export async function updateSupportTicketStatus(
  ticketId: string,
  updates: { status?: SupportTicketStatus; admin_notes?: string | null },
): Promise<void> {
  if (isDemoMode()) return;

  const client = requireSupabase();
  const { error } = await client
    .from('support_tickets')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', ticketId);

  throwIfError(error);
}
