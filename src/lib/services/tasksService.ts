import { DEMO_TASKS } from '../../data/demoData';
import type { Task, TaskStatus } from '../../types/domain';
import { isDemoMode, requireSupabase, throwIfError } from './serviceHelpers';

export async function fetchTasks(userId?: string): Promise<Task[]> {
  if (isDemoMode()) return DEMO_TASKS;

  const client = requireSupabase();
  let query = client.from('tasks').select('*').order('due_date');
  if (userId) query = query.eq('user_id', userId);

  const { data, error } = await query;
  throwIfError(error);

  return (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    status: row.status,
    priority: row.priority,
    due_date: row.due_date ?? undefined,
    created_at: row.created_at,
  }));
}

export async function updateTaskStatus(id: string, status: TaskStatus): Promise<void> {
  if (isDemoMode()) return;

  const client = requireSupabase();
  const { error } = await client.from('tasks').update({ status }).eq('id', id);
  throwIfError(error);
}
