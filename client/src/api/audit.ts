// Frontend-only mock API for audit logs so the app works without a backend
export type AuditFilters = {
  page?: number;
  limit?: number;
  action?: string;
  entity_type?: string;
  actor_email?: string;
  entity_id?: string;
  date_from?: string; // ISO
  date_to?: string;   // ISO
};

export type AuditLogItem = {
  id: number;
  created_at: string | null;
  actor_id?: number | null;
  actor_email?: string | null;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  entity_label?: string | null;
  metadata?: any;
};

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

const MOCK_ACTIONS = ['rule.created', 'rule.updated', 'rule.deleted', 'rule.published', 'auth.login'];
const MOCK_ENTITIES = ['rule', 'user', 'system'];

const makeItem = (id: number): AuditLogItem => ({
  id,
  created_at: new Date(Date.now() - id * 3600 * 1000).toISOString(),
  actor_id: id % 3 === 0 ? 1 : 2,
  actor_email: id % 3 === 0 ? 'sarah@example.com' : 'mike@example.com',
  action: MOCK_ACTIONS[id % MOCK_ACTIONS.length],
  entity_type: MOCK_ENTITIES[id % MOCK_ENTITIES.length],
  entity_id: `${1000 + id}`,
  entity_label: `Entity ${id}`,
  metadata: { note: 'Mock entry' },
});

const MOCK_ITEMS: AuditLogItem[] = Array.from({ length: 75 }, (_, i) => makeItem(i + 1));

export const getAuditLogs = async (filters: AuditFilters) => {
  await delay(120);
  const { page = 1, limit = 20, action, entity_type, actor_email, entity_id, date_from, date_to } = filters || {};
  let items = [...MOCK_ITEMS];
  if (action) items = items.filter(i => i.action === action);
  if (entity_type) items = items.filter(i => i.entity_type === entity_type);
  if (actor_email) items = items.filter(i => i.actor_email === actor_email);
  if (entity_id) items = items.filter(i => i.entity_id === entity_id);
  if (date_from) items = items.filter(i => !i.created_at || i.created_at >= date_from);
  if (date_to) items = items.filter(i => !i.created_at || i.created_at <= date_to);
  const total = items.length;
  const start = (page - 1) * limit;
  const paged = items.slice(start, start + limit);
  return { total, items: paged } as { total: number; items: AuditLogItem[] };
};

export const exportAuditLogs = async (filters: AuditFilters) => {
  await delay(150);
  // Build CSV locally from the filtered view
  const { items } = await getAuditLogs(filters);
  const headers = ['id','created_at','actor_email','action','entity_type','entity_id','entity_label'];
  const rows = items.map(i => [i.id, i.created_at, i.actor_email, i.action, i.entity_type, i.entity_id, i.entity_label]);
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'audit-export.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
