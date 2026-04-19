import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase 环境变量缺失，请检查 .env 文件');
}

export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
});

export type UserSkillRow = {
  skill_name: string;
  skill_score: number;
  weight: number;
  source?: string;
  updated_at?: string;
};

export type FocusSessionRow = {
  id?: string;
  user_id?: string;
  session_date?: string;
  duration_minutes: number;
  category?: string;
  session_title?: string | null;
  note?: string | null;
  created_at?: string;
};

export type DailyLogRow = {
  id?: string;
  user_id: string;
  log_date?: string;
  mood_score?: number | null;
  energy_score?: number | null;
  summary: string;
  blockers?: string | null;
  wins?: string | null;
};

export type UserProfileRow = {
  id: string;
  nickname: string | null;
  avatar_url: string | null;
  motto: string | null;
  tech_tags: string[] | unknown;
  major?: string | null;
  bio?: string | null;
  github_url?: string | null;
  skills?: string[] | unknown;
  updated_at?: string;
};

export type UserGrowthStateRow = {
  user_id: string;
  exp_algorithm: number;
  exp_dev: number;
  exp_ui: number;
  exp_arch: number;
  streak_days: number;
  last_punch_date?: string | null;
  last_morning_tip_date?: string | null;
  sticker_layout?: unknown;
  updated_at?: string;
};

export type SubscriptionWithCompetition = {
  id: string;
  competition_id: string;
  name: string;
  deadline: string;
  level: string;
  category: string;
};

function parseStringArrayField(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String);
  if (typeof v === 'string') {
    try {
      const j = JSON.parse(v) as unknown;
      return Array.isArray(j) ? j.map(String) : [];
    } catch {
      return [];
    }
  }
  return [];
}

export async function fetchUserProfile(userId: string): Promise<UserProfileRow | null> {
  const { data, error } = await supabaseClient.from('user_profiles').select('*').eq('id', userId).maybeSingle();
  if (error) {
    console.warn('[supabase] fetchUserProfile', error.message);
    return null;
  }
  if (!data) return null;
  const tags = Array.isArray(data.tech_tags) ? data.tech_tags : [];
  const skills = parseStringArrayField((data as UserProfileRow).skills);
  return { ...data, tech_tags: tags as string[], skills } as UserProfileRow;
}

export async function upsertUserProfile(row: {
  id: string;
  nickname?: string | null;
  avatar_url?: string | null;
  motto?: string | null;
  tech_tags?: string[];
  major?: string | null;
  bio?: string | null;
  github_url?: string | null;
  skills?: string[];
}) {
  const { error } = await supabaseClient.from('user_profiles').upsert(
    {
      id: row.id,
      nickname: row.nickname ?? null,
      avatar_url: row.avatar_url ?? null,
      motto: row.motto ?? null,
      tech_tags: row.tech_tags ?? [],
      major: row.major ?? null,
      bio: row.bio ?? null,
      github_url: row.github_url ?? null,
      skills: row.skills ?? [],
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' },
  );
  if (error) throw error;
}

export async function fetchUserGrowthState(userId: string): Promise<UserGrowthStateRow | null> {
  const { data, error } = await supabaseClient.from('user_growth_state').select('*').eq('user_id', userId).maybeSingle();
  if (error) {
    console.warn('[supabase] fetchUserGrowthState', error.message);
    return null;
  }
  if (!data) return null;
  return data as UserGrowthStateRow;
}

export async function fetchSubscriptionsWithCompetitions(userId: string): Promise<SubscriptionWithCompetition[]> {
  const { data, error } = await supabaseClient
    .from('subscriptions')
    .select(
      `
      id,
      competition_id,
      competitions ( name, deadline, level, category )
    `,
    )
    .eq('user_id', userId);

  if (error) {
    console.warn('[supabase] fetchSubscriptionsWithCompetitions', error.message);
    return [];
  }

  type Comp = { name: string; deadline: string; level: string; category: string };
  const rows = (data || []) as {
    id: string;
    competition_id: string;
    competitions: Comp | Comp[] | null;
  }[];

  return rows.map((r) => {
    const c = Array.isArray(r.competitions) ? r.competitions[0] : r.competitions;
    return {
      id: r.id,
      competition_id: r.competition_id,
      name: c?.name || '赛事',
      deadline: c?.deadline || '',
      level: c?.level || '',
      category: c?.category || '',
    };
  });
}

export async function fetchFocusSessionsBetween(userId: string, startIso: string, endIso: string): Promise<FocusSessionRow[]> {
  const { data, error } = await supabaseClient
    .from('focus_sessions')
    .select('id, duration_minutes, category, session_title, note, session_date, created_at')
    .eq('user_id', userId)
    .gte('session_date', startIso)
    .lte('session_date', endIso)
    .order('session_date', { ascending: true });

  if (error) {
    console.warn('[supabase] fetchFocusSessionsBetween', error.message);
    return [];
  }
  return (data || []) as FocusSessionRow[];
}

export async function fetchDailyLogsBetween(userId: string, startIso: string, endIso: string): Promise<DailyLogRow[]> {
  const { data, error } = await supabaseClient
    .from('daily_logs')
    .select('log_date, mood_score, energy_score, summary, blockers, wins')
    .eq('user_id', userId)
    .gte('log_date', startIso)
    .lte('log_date', endIso)
    .order('log_date', { ascending: true });

  if (error) {
    console.warn('[supabase] fetchDailyLogsBetween', error.message);
    return [];
  }
  return (data || []).map((r) => ({ ...r, user_id: userId })) as DailyLogRow[];
}

export async function fetchUserSkills(userId: string): Promise<UserSkillRow[]> {
  const { data, error } = await supabaseClient
    .from('user_skills')
    .select('skill_name, skill_score, weight, source, updated_at')
    .eq('user_id', userId);

  if (error) {
    console.warn('[supabase] fetchUserSkills', error.message);
    return [];
  }
  return (data || []) as UserSkillRow[];
}

export async function fetchTotalFocusMinutes(userId: string): Promise<number> {
  const { data, error } = await supabaseClient.from('focus_sessions').select('duration_minutes').eq('user_id', userId);
  if (error) {
    console.warn('[supabase] fetchTotalFocusMinutes', error.message);
    return 0;
  }
  return (data || []).reduce((a, r: { duration_minutes?: number | null }) => a + (Number(r.duration_minutes) || 0), 0);
}

export async function fetchRecentFocusSessions(userId: string, days = 14): Promise<FocusSessionRow[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const iso = since.toISOString().slice(0, 10);

  const { data, error } = await supabaseClient
    .from('focus_sessions')
    .select('id, duration_minutes, category, session_title, note, session_date, created_at')
    .eq('user_id', userId)
    .gte('session_date', iso)
    .order('created_at', { ascending: false })
    .limit(80);

  if (error) {
    console.warn('[supabase] fetchRecentFocusSessions', error.message);
    return [];
  }
  return (data || []) as FocusSessionRow[];
}

/** 某日专注记录（按 session_date 与 created_at 落在当日） */
export async function fetchFocusSessionsForDate(userId: string, dayIso: string): Promise<FocusSessionRow[]> {
  const { data, error } = await supabaseClient
    .from('focus_sessions')
    .select('id, duration_minutes, category, session_title, note, session_date, created_at')
    .eq('user_id', userId)
    .eq('session_date', dayIso)
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('[supabase] fetchFocusSessionsForDate', error.message);
    return [];
  }
  return (data || []) as FocusSessionRow[];
}

export async function fetchDailyLogForDate(userId: string, dayIso: string): Promise<DailyLogRow | null> {
  const { data, error } = await supabaseClient
    .from('daily_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('log_date', dayIso)
    .maybeSingle();

  if (error) {
    console.warn('[supabase] fetchDailyLogForDate', error.message);
    return null;
  }
  return data as DailyLogRow | null;
}

export async function fetchRecentDailyLogs(userId: string, limit = 10): Promise<DailyLogRow[]> {
  const { data, error } = await supabaseClient
    .from('daily_logs')
    .select('log_date, mood_score, energy_score, summary, blockers, wins')
    .eq('user_id', userId)
    .order('log_date', { ascending: false })
    .limit(limit);

  if (error) {
    console.warn('[supabase] fetchRecentDailyLogs', error.message);
    return [];
  }
  return (data || []) as DailyLogRow[];
}

export async function insertFocusSession(row: FocusSessionRow) {
  const { data, error } = await supabaseClient.from('focus_sessions').insert([row]).select('id').single();
  if (error) throw error;
  return data;
}

export async function upsertDailyLog(row: DailyLogRow) {
  const { data, error } = await supabaseClient
    .from('daily_logs')
    .upsert(row, { onConflict: 'user_id,log_date' })
    .select('id')
    .single();
  if (error) throw error;
  return data;
}

export async function upsertUserSkill(
  userId: string,
  skill: Pick<UserSkillRow, 'skill_name' | 'skill_score' | 'weight'>,
) {
  const { error } = await supabaseClient.from('user_skills').upsert(
    {
      user_id: userId,
      skill_name: skill.skill_name,
      skill_score: skill.skill_score,
      weight: skill.weight ?? 1,
      source: 'radar',
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,skill_name' },
  );
  if (error) throw error;
}

export type AiMemoryHit = {
  id: string;
  topic: string;
  content: string;
  similarity: number;
  created_at: string;
};

/** 关键词记忆检索（服务端 geek_memory_entries + 匹配打分） */
export async function searchAiMemoriesRag(
  accessToken: string,
  query: string,
  opts?: { match_threshold?: number; match_count?: number },
): Promise<AiMemoryHit[]> {
  const q = query.trim();
  if (!q) return [];
  try {
    const res = await fetch('/api/ai/memory/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        query: q.slice(0, 2000),
        match_threshold: opts?.match_threshold,
        match_count: opts?.match_count,
      }),
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { matches?: AiMemoryHit[] };
    return json.matches || [];
  } catch {
    return [];
  }
}

/** 写入关键词记忆（DeepSeek 侧无向量，仅存文本供检索） */
export async function persistAiMemory(accessToken: string, topic: string, content: string): Promise<boolean> {
  try {
    const res = await fetch('/api/ai/memory', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        topic: topic.slice(0, 200),
        content: content.slice(0, 8000),
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * 组装给大模型的「能力画像 + 学习节奏」上下文（Markdown）。
 */
export function buildUserContextMarkdown(params: {
  skills: UserSkillRow[];
  focus: FocusSessionRow[];
  logs: DailyLogRow[];
  memoryTopics?: string[];
  vectorMemories?: AiMemoryHit[];
}): string {
  const { skills, focus, logs, memoryTopics, vectorMemories } = params;
  const lines: string[] = [];

  if (skills.length) {
    lines.push('### 能力雷达（user_skills）');
    skills.forEach((s) => {
      lines.push(`- ${s.skill_name}: ${s.skill_score} 分（权重 ${s.weight}）`);
    });
  } else {
    lines.push('### 能力雷达');
    lines.push('- 暂无结构化雷达数据，请结合通用 CS 备赛路径回答。');
  }

  if (focus.length) {
    const totalMin = focus.reduce((a, r) => a + (r.duration_minutes || 0), 0);
    lines.push(`### 最近专注（约 ${totalMin} 分钟，来自 focus_sessions）`);
    focus.slice(0, 8).forEach((r) => {
      const title = r.session_title || r.note || '未命名专注';
      lines.push(`- ${r.session_date || ''} · ${title} · ${r.duration_minutes}min · ${r.category || 'focus'}`);
    });
  } else {
    lines.push('### 最近专注');
    lines.push('- 最近两周无番茄/深度工作记录，可温和提醒保持节奏。');
  }

  if (logs.length) {
    lines.push('### 最近打卡摘要（daily_logs）');
    logs.slice(0, 5).forEach((l) => {
      lines.push(
        `- ${l.log_date || ''} 心情${l.mood_score ?? '-'} / 精力${l.energy_score ?? '-'}：${l.summary?.slice(0, 120) || ''}`,
      );
    });
  } else {
    lines.push('### 最近打卡');
    lines.push('- 最近无结构化日志，可询问用户是否拖延或需要拆解任务。');
  }

  if (memoryTopics?.length) {
    lines.push('### 长期记忆主题（本轮对话提炼）');
    memoryTopics.forEach((t) => lines.push(`- ${t}`));
  }

  if (vectorMemories?.length) {
    lines.push('### 关键词命中的历史记忆（geek_memory_entries）');
    vectorMemories.forEach((m) => {
      const pct = Math.round((m.similarity || 0) * 100);
      lines.push(`- [${m.topic}] 匹配度约 ${pct}%：${(m.content || '').slice(0, 280)}`);
    });
  }

  return lines.join('\n');
}
