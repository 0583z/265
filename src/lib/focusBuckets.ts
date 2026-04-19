/** 专注分类 → 技能树四大维度（与成长 EXP 维度一致） */
export type SkillDimension = 'algorithm' | 'dev' | 'ui' | 'arch';

export function bucketCategory(raw: string): '算法' | '开发' | 'UI' | '文档' | '综合' {
  const c = raw || '';
  if (/算法|acm|csp|刷题|数据结构/i.test(c)) return '算法';
  if (/ui|设计|figma|界面|视觉|前端/i.test(c)) return 'UI';
  if (/文档|论文|写作|latex|报告/i.test(c)) return '文档';
  if (/开发|工程|后端|全栈|dev|deploy|api/i.test(c)) return '开发';
  return '综合';
}

export function categoryToSkillDimension(category: string): SkillDimension {
  const b = bucketCategory(category);
  if (b === '算法') return 'algorithm';
  if (b === '开发') return 'dev';
  if (b === 'UI') return 'ui';
  return 'arch';
}

export function difficultyWeight(category: string): number {
  const b = bucketCategory(category);
  const map: Record<typeof b, number> = {
    算法: 1.25,
    开发: 1.1,
    UI: 1.0,
    文档: 1.05,
    综合: 1.0,
  };
  return map[b];
}
