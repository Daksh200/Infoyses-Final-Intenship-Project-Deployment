// Frontend-only mock API implementation for rules
// Replaces network calls with local mock data so the app works without a backend
import { FraudRule, RuleStatus, TriggerTrend, SeverityDistribution, ConditionHit, TriggeredClaim, RuleLogic, RuleVersion } from '@/types/fraud';
import { mockRules, mockRulePerformance, generateTriggerTrends, generateTriggeredClaims } from '@/data/mockData';

// Helpers
const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));

// localStorage-backed store so the demo persists in the browser
const STORAGE_KEY = 'fraud_rules';

const normalizeRule = (raw: any): FraudRule => {
  const ownerName = raw.ownerName ?? raw.owner ?? raw.createdBy ?? 'You';
  const ruleId = raw.ruleId ?? raw.rule_id ?? `RL-${Date.now()}`;
  const versions = (raw.versions || []).map((v: any, idx: number) => ({
    id: v.id?.toString() ?? String(idx + 1),
    version: v.version ?? 'v1.0',
    createdAt: v.createdAt ?? 'now',
    createdBy: v.createdBy ?? ownerName,
    notes: v.notes ?? '',
    isActive: v.isActive ?? (raw.currentVersion ? v.version === raw.currentVersion : idx === 0),
    isDraft: v.isDraft ?? false,
    logic_snapshot: v.logic_snapshot ?? raw.logic ?? { groups: [] },
  }));

  return {
    id: raw.id?.toString() ?? `${Date.now()}`,
    ruleId,
    name: raw.name ?? 'Untitled Rule',
    description: raw.description ?? '',
    category: raw.category ?? 'transaction',
    severity: raw.severity ?? 'medium',
    status: raw.status ?? 'draft',
    triggers24h: Number(raw.triggers24h ?? 0),
    triggerDelta: Number(raw.triggerDelta ?? 0),
    lastUpdated: raw.lastUpdated ?? 'just now',
    createdBy: raw.createdBy ?? ownerName,
    ownerName,
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    logic: raw.logic ?? { groups: [] },
    versions,
    currentVersion: raw.currentVersion ?? (versions[0]?.version ?? 'v1.0'),
    conditionSummary: raw.conditionSummary ?? '',
  } as FraudRule;
};

const loadRules = (): FraudRule[] => {
  try {
    const fromLs = localStorage.getItem(STORAGE_KEY);
    if (fromLs) {
      const parsed = JSON.parse(fromLs);
      return parsed.map((r: any) => normalizeRule(r));
    }
  } catch {}
  // First run: seed with mockRules (normalized) and persist
  const seeded = mockRules.map(r => normalizeRule(r));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
  return seeded;
};

const saveRules = (rules: FraudRule[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rules));
};

export const getRules = async (): Promise<FraudRule[]> => {
  await delay(120);
  return clone(loadRules());
};

export const getRule = async (id: string): Promise<FraudRule> => {
  await delay(100);
  const found = loadRules().find(r => r.id === id || r.ruleId === id);
  if (!found) throw new Error('Rule not found');
  return clone(found);
};

export const createRule = async (rule: any): Promise<FraudRule> => {
  await delay(150);
  const all = loadRules();
  const ownerName = rule.ownerName ?? rule.owner ?? 'You';
  const logic = rule.logic ?? { groups: [] };
  const newId = `${Date.now()}`;
  const newRule: FraudRule = normalizeRule({
    id: newId,
    ruleId: rule.ruleId ?? rule.rule_id ?? `RL-${newId}`,
    name: rule.name ?? 'New Rule',
    description: rule.description ?? '',
    category: rule.category ?? 'transaction',
    severity: rule.severity ?? 'medium',
    status: rule.status ?? 'draft',
    triggers24h: 0,
    triggerDelta: 0,
    lastUpdated: 'just now',
    createdBy: 'You',
    ownerName,
    tags: Array.isArray(rule.tags) ? rule.tags : [],
    conditionSummary: rule.conditionSummary ?? '',
    logic,
    versions: [
      { id: '1', version: 'v1.0', createdAt: 'now', createdBy: 'You', notes: '', isActive: true, isDraft: rule.status === 'draft', logic_snapshot: logic },
    ],
    currentVersion: 'v1.0',
  });
  const updated = [newRule, ...all];
  saveRules(updated);
  return clone(newRule);
};

export const updateRule = async (id: string, patch: Partial<FraudRule>): Promise<FraudRule> => {
  await delay(120);
  const all = loadRules();
  const idx = all.findIndex(r => r.id === id);
  if (idx === -1) throw new Error('Rule not found');
  const merged = normalizeRule({ ...all[idx], ...patch, lastUpdated: 'just now' });
  all[idx] = merged;
  saveRules(all);
  return clone(merged);
};

export const deleteRule = async (id: string): Promise<void> => {
  await delay(80);
  const all = loadRules().filter(r => r.id !== id);
  saveRules(all);
};

export const updateRuleStatus = async (id: string, status: RuleStatus): Promise<FraudRule> => {
  await delay(80);
  const all = loadRules();
  const idx = all.findIndex(r => r.id === id);
  if (idx === -1) throw new Error('Rule not found');
  all[idx] = { ...all[idx], status, lastUpdated: 'just now' } as FraudRule;
  saveRules(all);
  return clone(all[idx]);
};

export const getRuleVersions = async (id: string): Promise<RuleVersion[]> => {
  await delay(60);
  const rule = loadRules().find(r => r.id === id);
  return clone(rule?.versions || []);
};

export const updateRuleVersionNotes = async (versionId: string, notes: string): Promise<RuleVersion> => {
  await delay(60);
  const all = loadRules();
  for (const r of all) {
    const vIdx = r.versions.findIndex(v => v.id === versionId);
    if (vIdx !== -1) {
      const updated = { ...r.versions[vIdx], notes } as RuleVersion;
      r.versions[vIdx] = updated;
      saveRules(all);
      return clone(updated);
    }
  }
  throw new Error('Version not found');
};

export const testRule = async (ruleData: any, payload: any): Promise<any> => {
  await delay(200);
  // Very simple evaluator mock: if payload.amount > 1000 => triggered high
  const amount = Number(payload?.amount ?? 0);
  const triggered = amount > 1000;
  return {
    triggered,
    severity: triggered ? 'high' : 'low',
    reasons: triggered ? ['amount > 1000'] : ['no conditions met'],
  };
};

// Performance API
export const getRuleKpis = async (ruleId: string, days: number) => {
  await delay(120);
  return {
    totalClaimsEvaluated: mockRulePerformance.totalClaimsEvaluated,
    flagsTriggered: mockRulePerformance.flagsTriggered,
    confirmedFraud: mockRulePerformance.confirmedFraud,
    falsePositiveRate: mockRulePerformance.falsePositiveRate,
    hitRate: mockRulePerformance.hitRate,
    lastEvaluated: mockRulePerformance.lastEvaluated,
  };
};

export const getRuleTrends = async (ruleId: string, days: number) => {
  await delay(100);
  return generateTriggerTrends(days);
};

export const getRuleSeverity = async (ruleId: string, days: number) => {
  await delay(90);
  return clone(mockRulePerformance.severityDistribution);
};

export const getRuleConditions = async (ruleId: string, days: number) => {
  await delay(90);
  return clone(mockRulePerformance.conditionHitMap).map((c, idx) => ({
    condition: c.condition,
    percentage: c.percentage,
    rank: idx + 1,
  })) as any as ConditionHit[];
};

export const getTriggeredClaims = async (
  ruleId: string,
  opts: { days: number; severity?: string; decision?: string; page?: number; pageSize?: number; sort?: string }
) => {
  await delay(120);
  const { severity, decision, page = 1, pageSize = 20, sort } = opts;
  let items = generateTriggeredClaims();
  if (severity) items = items.filter(i => i.severity === severity);
  if (decision) items = items.filter(i => i.decision === decision);
  if (sort === 'amount_desc') items = items.sort((a,b) => b.amount - a.amount);
  if (sort === 'amount_asc') items = items.sort((a,b) => a.amount - b.amount);
  const total = items.length;
  const start = (page - 1) * pageSize;
  const paged = items.slice(start, start + pageSize);
  return { total, items: paged } as { total: number; items: TriggeredClaim[] };
};

export const getDecisionCounts = async (ruleId: string, days: number) => {
  await delay(80);
  return { fraud: 56, legitimate: 210, pending: 28 };
};

export const getExecution = async (executionId: string | number) => {
  await delay(80);
  return { id: executionId, status: 'completed', result: 'Mock execution result' } as any;
};

export const cloneRule = async (ruleId: string) => {
  await delay(90);
  const all = loadRules();
  const base = all.find(r => r.id === ruleId || r.ruleId === ruleId);
  if (!base) throw new Error('Rule not found');
  const newId = `${Date.now()}`;
  const cloned: FraudRule = normalizeRule({ ...base, id: newId, ruleId: `${base.ruleId}-CLONE`, name: `${base.name} (Clone)`, lastUpdated: 'just now' });
  const updated = [cloned, ...all];
  saveRules(updated);
  return clone(cloned);
};

export const publishRule = async (
  ruleId: string,
  payload: { name?: string; description?: string; category?: string; severity?: string; tags?: string[]; conditionSummary?: string; logic: RuleLogic; notes?: string; version?: string }
) => {
  await delay(100);
  const all = loadRules();
  const idx = all.findIndex(r => r.id === ruleId || r.ruleId === ruleId);
  if (idx === -1) throw new Error('Rule not found');
  const base = all[idx];
  const nextVersion = payload.version ?? `v${(base.versions.length + 1).toFixed(1)}`;
  const newVersion: RuleVersion = {
    id: `${Date.now()}`,
    version: nextVersion,
    createdAt: 'now',
    createdBy: 'You',
    notes: payload.notes ?? '',
    isActive: true,
    isDraft: false,
    logic_snapshot: payload.logic ?? base.logic,
  };
  const updated: FraudRule = normalizeRule({
    ...base,
    ...payload,
    versions: [newVersion, ...base.versions],
    currentVersion: nextVersion,
    status: 'active',
    lastUpdated: 'just now',
  });
  all[idx] = updated;
  saveRules(all);
  return clone(updated);
};
