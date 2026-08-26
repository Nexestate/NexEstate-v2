import { DEMO_TASKS } from '../../data/demoData';
import type { Task, TaskPriority, TaskStatus } from '../../types/domain';
import { isDemoMode, requireSupabase, ServiceError, throwIfError } from './serviceHelpers';

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

export async function createTask(
  userId: string,
  payload: { title: string; priority: TaskPriority; due_date?: string },
): Promise<string> {
  if (isDemoMode()) {
    const id = `task-${Date.now()}`;
    DEMO_TASKS.unshift({
      id,
      title: payload.title,
      status: 'open',
      priority: payload.priority,
      due_date: payload.due_date,
      created_at: new Date().toISOString(),
    });
    return id;
  }

  const client = requireSupabase();
  const { data, error } = await client
    .from('tasks')
    .insert({
      user_id: userId,
      title: payload.title,
      priority: payload.priority,
      due_date: payload.due_date,
      status: 'open',
    })
    .select('id')
    .single();
  throwIfError(error);
  if (!data) throw new ServiceError('Task insert returned no data');
  return data.id as string;
}

export async function updateTask(
  id: string,
  payload: { title?: string; priority?: TaskPriority; due_date?: string; status?: TaskStatus },
): Promise<void> {
  if (isDemoMode()) {
    const task = DEMO_TASKS.find((t) => t.id === id);
    if (task) Object.assign(task, payload);
    return;
  }

  const client = requireSupabase();
  const { error } = await client
    .from('tasks')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id);
  throwIfError(error);
}

export async function updateTaskStatus(id: string, status: TaskStatus): Promise<void> {
  if (isDemoMode()) {
    const task = DEMO_TASKS.find((t) => t.id === id);
    if (task) task.status = status;
    return;
  }

  const client = requireSupabase();
  const { error } = await client.from('tasks').update({ status }).eq('id', id);
  throwIfError(error);
}
