import { supabaseClient } from '@/src/lib/supabaseClient';
import { categoryToSkillDimension, difficultyWeight, type SkillDimension } from '@/src/lib/focusBuckets';

/** E = t × w × (1 + 0.1 × streak)，t 为分钟 */
export function computeFocusExp(tMinutes: number, category: string, streak: number): number {
  const t = Math.max(0, tMinutes);
  const w = difficultyWeight(category);
  const s = Math.max(0, streak);
  return t * w * (1 + 0.1 * s);
}

export async function fetchActivityDateSet(userId: string): Promise<Set<string>> {
  const since = new Date();
  since.setDate(since.getDate() - 400);
  const iso = since.toISOString().slice(0, 10);
  const [fs, dl] = await Promise.all([
    supabaseClient.from('focus_sessions').select('session_date').eq('user_id', userId).gte('session_date', iso),
    supabaseClient.from('daily_logs').select('log_date').eq('user_id', userId).gte('log_date', iso),
  ]);
  const set = new Set<string>();
  (fs.data || []).forEach((r: { session_date?: string | null }) => {
    if (r.session_date) set.add(r.session_date);
  });
  (dl.data || []).forEach((r: { log_date?: string | null }) => {
    if (r.log_date) set.add(r.log_date);
  });
  return set;
}

/** 从今天起连续有打卡或专注的自然日数（含今日） */
export function streakFromDateSet(dates: Set<string>): number {
  const d = new Date();
  let n = 0;
  for (let i = 0; i < 400; i++) {
    const iso = d.toISOString().slice(0, 10);
    if (dates.has(iso)) n++;
    else break;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

type ExpCol = 'exp_algorithm' | 'exp_dev' | 'exp_ui' | 'exp_arch';
const growthCols: Record<SkillDimension, ExpCol> = {
  algorithm: 'exp_algorithm',
  dev: 'exp_dev',
  ui: 'exp_ui',
  arch: 'exp_arch',
};

type GrowthUpsert = {
  user_id: string;
  exp_algorithm: number;
  exp_dev: number;
  exp_ui: number;
  exp_arch: number;
  streak_days: number;
  sticker_layout?: unknown;
  updated_at: string;
};

/** 在 focus_sessions 写入成功后调用：累加 EXP、刷新 streak */
export async function applyFocusExpAfterSession(userId: string, tMinutes: number, category: string): Promise<void> {
  const dates = await fetchActivityDateSet(userId);
  const streak = streakFromDateSet(dates);
  const E = computeFocusExp(tMinutes, category, streak);
  const dim = categoryToSkillDimension(category);
  const col = growthCols[dim];

  const { data: row } = await supabaseClient.from('user_growth_state').select('*').eq('user_id', userId).maybeSingle();

  const base: GrowthUpsert = {
    user_id: userId,
    exp_algorithm: Number(row?.exp_algorithm) || 0,
    exp_dev: Number(row?.exp_dev) || 0,
    exp_ui: Number(row?.exp_ui) || 0,
    exp_arch: Number(row?.exp_arch) || 0,
    streak_days: streak,
    sticker_layout: row?.sticker_layout ?? [],
    updated_at: new Date().toISOString(),
  };

  const k = col;
  base[k] = base[k] + E;

  const { error } = await supabaseClient.from('user_growth_state').upsert(base, { onConflict: 'user_id' });
  if (error) console.warn('[growth] applyFocusExpAfterSession', error.message);
}

/** 打卡后刷新连续天数（不额外加 EXP，避免与专注重复计分） */
export async function refreshGrowthStreak(userId: string): Promise<void> {
  const dates = await fetchActivityDateSet(userId);
  const streak = streakFromDateSet(dates);
  const { data: row } = await supabaseClient.from('user_growth_state').select('*').eq('user_id', userId).maybeSingle();
  const payload: GrowthUpsert = {
    user_id: userId,
    exp_algorithm: Number(row?.exp_algorithm) || 0,
    exp_dev: Number(row?.exp_dev) || 0,
    exp_ui: Number(row?.exp_ui) || 0,
    exp_arch: Number(row?.exp_arch) || 0,
    streak_days: streak,
    sticker_layout: row?.sticker_layout ?? [],
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabaseClient.from('user_growth_state').upsert(payload, { onConflict: 'user_id' });
  if (error) console.warn('[growth] refreshGrowthStreak', error.message);
}
