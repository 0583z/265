export type AnalyzerMode = 'extract' | 'strategy';

export type IntentDetection = {
  mode: AnalyzerMode;
  /** 用于 UI：是否命中强意图规则（展示「智能适配」提示） */
  autoTuned: boolean;
  reasons: string[];
};

const EXTRACT_RE =
  /(https?:\/\/|www\.[^\s]+|\.(edu|gov|cn|com|org)\b)|公告|简章|赛题|报名|通知|竞赛简介|比赛链接|主办单位|参赛对象|赛程/i;

const STRATEGY_RE =
  /推荐|建议|怎么做|如何|计划|规划|备赛|适合我|选哪个|组队|路线|提升|strategy|roadmap|plan|next step/i;

/**
 * 轻量意图识别：URL/公告类 → 提取；推荐/计划类 → 建议。
 */
export function detectAnalyzerIntent(text: string): IntentDetection {
  const t = text.trim();
  const reasons: string[] = [];

  if (!t) {
    return { mode: 'extract', autoTuned: false, reasons: ['空输入，默认提取'] };
  }

  const wantsExtract = EXTRACT_RE.test(t);
  const wantsStrategy = STRATEGY_RE.test(t);

  if (wantsExtract && wantsStrategy) {
    if (t.length > 400 && /https?:\/\//i.test(t)) {
      reasons.push('长文本且含链接，优先提取结构化赛事信息');
      return { mode: 'extract', autoTuned: true, reasons };
    }
    reasons.push('同时含咨询与链接，优先回答备赛策略');
    return { mode: 'strategy', autoTuned: true, reasons };
  }

  if (wantsExtract) {
    reasons.push('检测到 URL 或公告/赛制类关键词');
    return { mode: 'extract', autoTuned: true, reasons };
  }

  if (wantsStrategy) {
    reasons.push('检测到推荐、计划或方法论类表达');
    return { mode: 'strategy', autoTuned: true, reasons };
  }

  reasons.push('未命中强规则，默认提取模式');
  return { mode: 'extract', autoTuned: false, reasons };
}
