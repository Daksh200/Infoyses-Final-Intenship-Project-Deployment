// Frontend-only mock API implementation for rules
// Replaces network calls with local mock data so the app works without a backend
import { FraudRule, RuleStatus, TriggerTrend, SeverityDistribution, ConditionHit, TriggeredClaim, RuleLogic, RuleVersion } from '@/types/fraud';
import { mockRules, mockRulePerformance, generateTriggerTrends, generateTriggeredClaims } from '@/data/mockData';

// Helpers
const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));

export const getRules = async (): Promise<FraudRule[]> => {
  await delay(200);
  // Return a shallow copy to avoid mutation side-effects
  return clone(mockRules);
};

export const getRule = async (id: string): Promise<FraudRule> => {
  await delay(150);
  const found = mockRules.find(r => r.id === id || r.ruleId === id);
  if (!found) throw new Error('Rule not found');
  return clone(found);
};

export const createRule = async (rule: Partial<FraudRule>): Promise<FraudRule> => {
  await delay(200);
  const newRule: FraudRule = {
    id: (mockRules.length + 1).toString(),
    ruleId: rule.ruleId || `RL-FAKE-${Date.now()}`,
    name: rule.name || 'New Rule',
    description: rule.description || '',
    category: (rule.category as any) || 'transaction',
    severity: (rule.severity as any) || 'low',
    status: (rule.status as any) || 'inactive',
    triggers24h: 0,
    triggerDelta: 0,
    lastUpdated: 'just now',
    createdBy: rule.createdBy || 'You',
    owner: rule.owner || 'You',
    tags: rule.tags || [],
    conditionSummary: rule.conditionSummary || '',
    logic: rule.logic as any,
    versions: [
      { id: '1', version: 'v1.0', createdAt: 'now', createdBy: 'You', notes: '', isActive: true, isDraft: false },
    ],
    currentVersion: 'v1.0',
  };
  // Do not mutate original mockRules to keep demo stateless; return the new rule as if created
  return newRule;
};

export const updateRule = async (id: string, rule: Partial<FraudRule>): Promise<FraudRule> => {
  await delay(150);
  const existing = mockRules.find(r => r.id === id);
  if (!existing) throw new Error('Rule not found');
  return { ...existing, ...rule } as FraudRule;
};

export const deleteRule = async (id: string): Promise<void> => {
  await delay(100);
  // No-op in mock mode
};

export const updateRuleStatus = async (id: string, status: RuleStatus): Promise<FraudRule> => {
  await delay(120);
  const existing = mockRules.find(r => r.id === id);
  if (!existing) throw new Error('Rule not found');
  return { ...existing, status } as FraudRule;
};

export const getRuleVersions = async (id: string): Promise<RuleVersion[]> => {
  await delay(80);
  const existing = mockRules.find(r => r.id === id);
  return clone(existing?.versions || []);
};

export const updateRuleVersionNotes = async (versionId: string, notes: string): Promise<RuleVersion> => {
  await delay(80);
  // Find in any rule
  const rule = mockRules.find(r => r.versions?.some(v => v.id === versionId));
  const version = rule?.versions?.find(v => v.id === versionId);
  if (!version) throw new Error('Version not found');
  return { ...version, notes };
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
  await delay(100);
  const rule = mockRules.find(r => r.id === ruleId || r.ruleId === ruleId);
  if (!rule) throw new Error('Rule not found');
  const cloned: FraudRule = { ...clone(rule), id: `${Date.now()}`, ruleId: `${rule.ruleId}-CLONE` };
  return cloned;
};

export const publishRule = async (
  ruleId: string,
  payload: { name?: string; description?: string; category?: string; severity?: string; tags?: string[]; conditionSummary?: string; logic: RuleLogic; notes?: string; version?: string }
) => {
  await delay(150);
  const base = mockRules.find(r => r.id === ruleId || r.ruleId === ruleId);
  if (!base) throw new Error('Rule not found');
  return { ...base, ...payload, currentVersion: payload.version || base.currentVersion } as FraudRule;
};
