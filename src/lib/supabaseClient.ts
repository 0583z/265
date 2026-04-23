import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// --- 🚨 核心类型定义 (全量补齐字段，防止导入组件报错) ---

export type FocusSessionRow = {
  id?: string;
  user_id?: string;
  session_date?: string;
  duration_minutes: number;
  category?: string;
  session_title?: string | null;
  created_at?: string;
};

export type DailyLogRow = {
  id?: string;
  user_id: string;
  log_date?: string;
  summary: string;
  mood_score?: number | null;
  energy_score?: number | null;
  wins?: string | null;      // 🚨 补齐：修复 DailyPunchIn 报错
  blockers?: string | null;  // 🚨 补齐：修复 DailyPunchIn 报错
};

export type UserAwardRow = {
  id?: string;
  user_id: string;
  competition_name: string;
  award_level: string;
  award_date: string;
};

// 🚨 补齐：修复 CompetencyRadar 雷达图的类型报错
export type UserSkillRow = {
  id?: string;
  user_id: string;
  skill_name: string;
  skill_score: number;
  weight?: number;
  created_at?: string;
};

export type UserProfileRow = {
  id: string;
  nickname: string | null;
  major: string | null;
  bio: string | null;
  github_url: string | null;
  skills: string[] | any;
  tech_tags?: string[] | any;
  avatar_url?: string | null;     // 🚨 补齐：修复组队大厅头像
  is_looking_for_team?: boolean;  // 🚨 补齐：修复组队雷达
};

export type UserGrowthStateRow = {
  user_id: string;
  streak_days: number;
  sticker_layout?: any;
};

export type TeamRow = {
  id: string;
  title: string;
  description: string;
  max_members: number;
  leader_id?: string;
  competition_id?: string | null;
  created_at?: string;
  leader?: { nickname?: string | null; avatar_url?: string | null; skills?: any } | null;
  competition?: { name?: string | null } | null;
};

export type HallOfFameCaseRow = {
  id: string;
  project_name: string;
  year: number;
  award_level: string;
  team_intro: string;
  key_to_success: string;
  major: string;
  created_at?: string;
};

// --- 👥 组队系统逻辑 ---

export async function fetchAllTeams(): Promise<TeamRow[]> {
  const { data, error } = await supabaseClient
    .from('teams')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as TeamRow[];
}

export async function createTeam(teamData: any) {
  const { data, error } = await supabaseClient.from('teams').insert([teamData]);
  if (error) throw error;
  return data;
}

export async function applyToTeam(teamId: string, userId: string, message: string) {
  const { error } = await supabaseClient.from('team_applications').insert([{ team_id: teamId, user_id: userId, message, status: 'pending' }]);
  if (error) throw error;
}

export async function inviteTalentToTeam(payload: { team_id: string; invitee_id: string; inviter_id: string; message?: string }) {
  const { error } = await supabaseClient.from('team_invites').insert([payload]);
  if (error) throw error;
}

export async function fetchTalentPool(): Promise<UserProfileRow[]> {
  const { data, error } = await supabaseClient
    .from('user_profiles')
    .select('*')
    .eq('is_looking_for_team', true);
  if (error) return [];
  return (data || []) as UserProfileRow[];
}

export async function toggleTeamSearchStatus(userId: string, status: boolean) {
  const { error } = await supabaseClient.from('user_profiles').update({ is_looking_for_team: status }).eq('id', userId);
  if (error) throw error;
}

// --- 🏆 获奖记录与卷王逻辑 ---

export async function fetchUserAwards(userId: string): Promise<UserAwardRow[]> {
  const { data, error } = await supabaseClient.from('user_awards').select('*').eq('user_id', userId).order('award_date', { ascending: false });
  return (data || []) as UserAwardRow[];
}

export async function insertUserAward(row: UserAwardRow) {
  return await supabaseClient.from('user_awards').insert([row]).select();
}

export async function submitHofApplication(userId: string, reason: string) {
  await supabaseClient.from('hall_of_fame_applications').insert([{ user_id: userId, reason, status: 'pending', applied_at: new Date().toISOString() }]);
}

export async function fetchHallOfFameCases(limit = 9, offset = 0): Promise<HallOfFameCaseRow[]> {
  const { data, error } = await supabaseClient
    .from('hall_of_fame_cases')
    .select('*')
    .order('year', { ascending: false })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw error;
  return (data || []) as HallOfFameCaseRow[];
}

// --- 👤 用户档案与能力数据 ---

export async function fetchUserProfile(userId: string): Promise<UserProfileRow | null> {
  const { data } = await supabaseClient.from('user_profiles').select('*').eq('id', userId).maybeSingle();
  return data as UserProfileRow;
}

export async function upsertUserProfile(row: any) {
  await supabaseClient.from('user_profiles').upsert(row, { onConflict: 'id' });
}

// 🚨 修复：雷达图查询应指向 user_skills 表，并且返回 UserSkillRow[]
export async function fetchUserSkills(userId: string): Promise<UserSkillRow[]> {
  const { data, error } = await supabaseClient
    .from('user_skills')
    .select('*')
    .eq('user_id', userId);
  if (error) return [];
  return (data || []) as UserSkillRow[];
}

// 🚨 补齐：修复雷达图点击“固化画像”时的写入报错
export async function upsertUserSkill(userId: string, row: { skill_name: string, skill_score: number, weight?: number }) {
  const { error } = await supabaseClient.from('user_skills').upsert(
    { user_id: userId, ...row },
    { onConflict: 'user_id,skill_name' }
  );
  if (error) throw error;
}

export async function searchAiMemoriesRag(userId: string, query: string) {
  const { data } = await supabaseClient.from('focus_sessions').select('*').eq('user_id', userId).limit(5);
  return data || [];
}

export function buildUserContextMarkdown(params: { skills: any[]; focus: FocusSessionRow[]; logs: DailyLogRow[]; }) {
  const { skills, focus, logs } = params;
  const total = focus.reduce((a, b) => a + (Number(b.duration_minutes) || 0), 0);
  return `### 极客档案\n- 技能: ${Array.isArray(skills) ? skills.join(', ') : '尚未添加'}\n- 专注时长: ${total}min\n- 备赛日志: ${logs.length}篇`;
}

// --- ⏱️ 专注与时长逻辑 ---

export async function fetchTotalFocusMinutes(userId: string): Promise<number> {
  const { data } = await supabaseClient.from('focus_sessions').select('duration_minutes').eq('user_id', userId);
  return (data || []).reduce((acc, row) => acc + (Number(row.duration_minutes) || 0), 0);
}

export async function fetchRecentFocusSessions(userId: string, limit = 45): Promise<FocusSessionRow[]> {
  const { data } = await supabaseClient.from('focus_sessions').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(limit);
  return (data || []) as FocusSessionRow[];
}

export async function fetchRecentDailyLogs(userId: string, limit = 45): Promise<DailyLogRow[]> {
  const { data } = await supabaseClient.from('daily_logs').select('*').eq('user_id', userId).order('log_date', { ascending: false }).limit(limit);
  return (data || []) as DailyLogRow[];
}

export async function fetchUserGrowthState(userId: string): Promise<UserGrowthStateRow | null> {
  const { data } = await supabaseClient.from('user_growth_state').select('*').eq('user_id', userId).maybeSingle();
  return data as UserGrowthStateRow;
}

export async function upsertDailyLog(row: DailyLogRow) {
  await supabaseClient.from('daily_logs').upsert(row, { onConflict: 'user_id,log_date' });
}

export async function fetchSubscriptionsWithCompetitions(userId: string) {
  const { data } = await supabaseClient.from('subscriptions').select(`id, competition_id, competitions ( name, deadline, level, category )`).eq('user_id', userId);
  return (data || []).map((r: any) => ({
    id: r.id,
    competition_id: r.competition_id,
    name: r.competitions?.name || '未知',
    deadline: r.competitions?.deadline || '',
    level: r.competitions?.level || '',
    category: r.competitions?.category || ''
  }));
}