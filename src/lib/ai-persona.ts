export type SkillRadarItem = {
  skill_name: string;
  skill_score: number;
  weight: number;
};

export type UserPreference = {
  preferTracks?: string[];
  avoidTracks?: string[];
  targetGoal?: '保研' | '就业' | '通用';
  learningStyle?: '实战' | '理论' | '混合';
  /** CCF CSP 相关经历：影响算法类赛事权重 */
  ccfCspLevel?: 'none' | 'prep' | 'certified';
  /** 主语言栈偏好 */
  primaryLang?: 'cpp' | 'java' | 'mixed';
};

export type MemorySignal = {
  topic: string;
  confidence: number;
  reason: string;
};

export type RecommendationWeights = {
  deadlineUrgency: number;
  skillFit: number;
  preferenceMatch: number;
  growthPotential: number;
};

export type PersonaOutput = {
  memorySignals: MemorySignal[];
  weights: RecommendationWeights;
};

const DEFAULT_WEIGHTS: RecommendationWeights = {
  deadlineUrgency: 0.25,
  skillFit: 0.35,
  preferenceMatch: 0.2,
  growthPotential: 0.2,
};

const CSP_KEYWORDS = /ccf|csp|csps|信息学|noip|ioi|蓝桥杯|算法竞赛|数据结构/i;
const CSP_CERT_KEYWORDS = /csp\s*-(j|s)\s*[一二]等|提高级|入门级.*认证|证书|获奖/i;

/**
 * 从个人简介、打卡摘要中推断 CCF / CSP 经历强度。
 */
export function detectCcfCspExperience(...texts: string[]): 'none' | 'prep' | 'certified' {
  const blob = texts.filter(Boolean).join('\n');
  if (!blob.trim()) return 'none';
  if (CSP_CERT_KEYWORDS.test(blob)) return 'certified';
  if (CSP_KEYWORDS.test(blob)) return 'prep';
  return 'none';
}

/**
 * 从技能标签与雷达维度推断 C++ / Java 偏好。
 */
export function detectLangPreference(skillNames: string[]): 'cpp' | 'java' | 'mixed' {
  const blob = skillNames.join(' ').toLowerCase();
  const cpp = /c\+\+|cpp|g\+\+|clang|算法|cspf/i.test(blob);
  const java = /\bjava\b|spring|jvm|\bkotlin\b/i.test(blob);
  if (cpp && java) return 'mixed';
  if (cpp) return 'cpp';
  if (java) return 'java';
  return 'mixed';
}

function clampWeight(value: number): number {
  if (value < 0.05) return 0.05;
  if (value > 0.7) return 0.7;
  return Number(value.toFixed(3));
}

function normalizeWeights(weights: RecommendationWeights): RecommendationWeights {
  const sum =
    weights.deadlineUrgency +
    weights.skillFit +
    weights.preferenceMatch +
    weights.growthPotential;

  if (sum <= 0) return DEFAULT_WEIGHTS;

  return {
    deadlineUrgency: Number((weights.deadlineUrgency / sum).toFixed(3)),
    skillFit: Number((weights.skillFit / sum).toFixed(3)),
    preferenceMatch: Number((weights.preferenceMatch / sum).toFixed(3)),
    growthPotential: Number((weights.growthPotential / sum).toFixed(3)),
  };
}

/**
 * 从历史对话中提炼记忆主题，供 ai_memory 入库前使用。
 */
export function extractMemorySignals(conversation: string): MemorySignal[] {
  const text = conversation.toLowerCase();
  const signals: MemorySignal[] = [];

  const rules: Array<{ topic: string; keywords: string[]; reason: string }> = [
    { topic: '程序设计', keywords: ['算法', 'acm', '蓝桥杯', '代码', '刷题'], reason: '用户关注算法与编程竞赛' },
    { topic: '数学建模', keywords: ['建模', 'cumcm', 'latex', '论文'], reason: '用户提及建模与论文表达' },
    { topic: '创新创业', keywords: ['互联网+', '创业', '商业计划', '路演'], reason: '用户偏好创新创业赛道' },
    { topic: '时间管理', keywords: ['deadline', '截止', '计划', '番茄钟'], reason: '用户在意截止期和执行节奏' },
    { topic: '保研导向', keywords: ['保研', '推免', '绩点'], reason: '用户目标偏向升学' },
    { topic: '就业导向', keywords: ['实习', '就业', '简历', '面试'], reason: '用户目标偏向就业竞争力' },
    { topic: 'CCF/CSP', keywords: ['ccf', 'csp', 'noip', '信息学'], reason: '用户具备或正在准备 CCF CSP 体系' },
  ];

  for (const rule of rules) {
    const hitCount = rule.keywords.filter((k) => text.includes(k)).length;
    if (hitCount > 0) {
      const confidence = Math.min(0.95, 0.45 + hitCount * 0.15);
      signals.push({
        topic: rule.topic,
        confidence: Number(confidence.toFixed(2)),
        reason: rule.reason,
      });
    }
  }

  return signals.sort((a, b) => b.confidence - a.confidence);
}

/**
 * 根据用户偏好 + 技能雷达，动态调整推荐权重。
 */
export function buildAdaptiveWeights(
  preference: UserPreference,
  radar: SkillRadarItem[],
): RecommendationWeights {
  const weights: RecommendationWeights = { ...DEFAULT_WEIGHTS };

  const avgSkill =
    radar.length > 0
      ? radar.reduce((sum, item) => sum + item.skill_score * (item.weight || 1), 0) /
        radar.reduce((sum, item) => sum + (item.weight || 1), 0)
      : 60;

  if (avgSkill < 55) {
    weights.growthPotential += 0.1;
    weights.skillFit -= 0.05;
  } else if (avgSkill > 80) {
    weights.skillFit += 0.1;
    weights.growthPotential -= 0.05;
  }

  if (preference.targetGoal === '保研') {
    weights.preferenceMatch += 0.08;
    weights.deadlineUrgency += 0.04;
  }

  if (preference.targetGoal === '就业') {
    weights.skillFit += 0.08;
    weights.growthPotential += 0.04;
  }

  if ((preference.preferTracks || []).length > 0) {
    weights.preferenceMatch += 0.08;
  }

  if ((preference.avoidTracks || []).length > 0) {
    weights.preferenceMatch += 0.05;
  }

  if (preference.learningStyle === '实战') {
    weights.skillFit += 0.05;
    weights.deadlineUrgency += 0.03;
  } else if (preference.learningStyle === '理论') {
    weights.growthPotential += 0.05;
  }

  const ccf = preference.ccfCspLevel || 'none';
  if (ccf === 'certified') {
    weights.skillFit += 0.1;
    weights.growthPotential -= 0.04;
  } else if (ccf === 'prep') {
    weights.growthPotential += 0.08;
    weights.deadlineUrgency += 0.04;
  }

  const lang = preference.primaryLang || 'mixed';
  const algoHeavy = radar.some((r) => /算法|程序设计|acm|csp/i.test(r.skill_name) && r.skill_score >= 70);
  if (lang === 'cpp' && algoHeavy) {
    weights.skillFit += 0.05;
  }
  if (lang === 'java' && !algoHeavy) {
    weights.preferenceMatch += 0.05;
    weights.growthPotential += 0.04;
  }

  const clamped: RecommendationWeights = {
    deadlineUrgency: clampWeight(weights.deadlineUrgency),
    skillFit: clampWeight(weights.skillFit),
    preferenceMatch: clampWeight(weights.preferenceMatch),
    growthPotential: clampWeight(weights.growthPotential),
  };

  return normalizeWeights(clamped);
}

/**
 * 面向上层调用的统一输出。
 */
export function buildPersonaProfile(
  conversation: string,
  preference: UserPreference,
  radar: SkillRadarItem[],
): PersonaOutput {
  return {
    memorySignals: extractMemorySignals(conversation),
    weights: buildAdaptiveWeights(preference, radar),
  };
}

