/**
 * 将技能名映射到统一维度向量（0–100），用于「黄金搭档」互补度计算。
 */
export const TEAM_DIMENSIONS = ['算法', '前端/UI', '工程交付', '文档表达', '沟通协作'] as const;

export type TeamVector = Record<(typeof TEAM_DIMENSIONS)[number], number>;

export function skillsToTeamVector(
  rows: { skill_name: string; skill_score: number }[],
  fallback = 50,
): TeamVector {
  const base = Object.fromEntries(TEAM_DIMENSIONS.map((d) => [d, fallback])) as TeamVector;
  for (const row of rows) {
    const key = TEAM_DIMENSIONS.find((d) => row.skill_name.includes(d) || d.includes(row.skill_name));
    if (key) base[key] = Number(row.skill_score);
  }
  return base;
}

function vecValues(v: TeamVector): number[] {
  return TEAM_DIMENSIONS.map((d) => v[d] / 100);
}

/**
 * 互补分数：一方强维度对齐另一方弱维度时得分高（0–1）。
 */
export function complementarityScore(a: TeamVector, b: TeamVector): number {
  const av = vecValues(a);
  const bv = vecValues(b);
  let s = 0;
  for (let i = 0; i < av.length; i++) {
    s += av[i] * (1 - bv[i]);
    s += bv[i] * (1 - av[i]);
  }
  return s / (2 * av.length);
}

/** 与余弦相似度等价的点积（已归一化向量） */
export function cosineSimilarity(a: TeamVector, b: TeamVector): number {
  const av = vecValues(a);
  const bv = vecValues(b);
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < av.length; i++) {
    dot += av[i] * bv[i];
    na += av[i] * av[i];
    nb += bv[i] * bv[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb) || 1;
  return dot / denom;
}
