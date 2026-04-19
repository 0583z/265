import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, addMonths, subMonths } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { motion } from 'motion/react';
import { Sparkles, Save, Loader2, AlertCircle, StickyNote, Zap, FileText, Copy, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useAuth } from '@/src/context/AuthContext';
import {
  fetchDailyLogForDate,
  fetchDailyLogsBetween,
  fetchFocusSessionsBetween,
  fetchFocusSessionsForDate,
  fetchRecentFocusSessions,
  fetchUserProfile,
  upsertUserProfile,
  type FocusSessionRow,
  type DailyLogRow,
} from '@/src/lib/supabaseClient';
import { bucketCategory } from '@/src/lib/focusBuckets';
import { FocusTimer } from './modules/FocusTimer';
import { DailyPunchIn } from './modules/DailyPunchIn';
import * as Dialog from '@radix-ui/react-dialog';

const COLLAGE_KEY = 'geek_dashboard_collage_v1';
type DeckPos = { x: number; y: number };
type DeckState = { profile: DeckPos; radar: DeckPos; timer: DeckPos };

function loadDeck(): DeckState {
  try {
    const raw = localStorage.getItem(COLLAGE_KEY);
    if (raw) return JSON.parse(raw) as DeckState;
  } catch {
    /* ignore */
  }
  return { profile: { x: 8, y: 8 }, radar: { x: 8, y: 400 }, timer: { x: 8, y: 820 } };
}

const RADAR_BUCKETS = ['算法', '开发', 'UI', '文档', '综合'] as const;

function buildRadarFromFocus(rows: FocusSessionRow[]) {
  const sums: Record<string, number> = Object.fromEntries(RADAR_BUCKETS.map((b) => [b, 0])) as Record<
    string,
    number
  >;
  for (const r of rows) {
    const b = bucketCategory(r.category || '');
    sums[b] += r.duration_minutes || 0;
  }
  const max = Math.max(...Object.values(sums), 1);
  return RADAR_BUCKETS.map((subject) => ({
    subject,
    value: Math.min(100, Math.round((sums[subject] / max) * 100)),
  }));
}

export const GeekCenter: React.FC = () => {
  const { user } = useAuth();
  const [cursor, setCursor] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [focusDay, setFocusDay] = useState<FocusSessionRow[]>([]);
  const [logDay, setLogDay] = useState<DailyLogRow | null>(null);
  const [radarRows, setRadarRows] = useState<FocusSessionRow[]>([]);

  const [nick, setNick] = useState('');
  const [motto, setMotto] = useState('');
  const [avatar, setAvatar] = useState('');
  const [tagsInput, setTagsInput] = useState('TypeScript, 算法, 设计');

  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [dayLoading, setDayLoading] = useState(false);
  const [dayError, setDayError] = useState<string | null>(null);

  const deckRef = useRef<HTMLDivElement>(null);
  const [deck, setDeck] = useState<DeckState>(() => loadDeck());
  const [monthOpen, setMonthOpen] = useState(false);
  const [monthMd, setMonthMd] = useState('');
  const [monthLoading, setMonthLoading] = useState(false);

  const persistDeck = useCallback((next: DeckState) => {
    setDeck(next);
    try {
      localStorage.setItem(COLLAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, []);

  const genMonthReport = useCallback(async () => {
    if (!user?.id) return;
    setMonthLoading(true);
    try {
      const s = format(startOfMonth(cursor), 'yyyy-MM-dd');
      const e = format(endOfMonth(cursor), 'yyyy-MM-dd');
      const [ff, ll] = await Promise.all([
        fetchFocusSessionsBetween(user.id, s, e),
        fetchDailyLogsBetween(user.id, s, e),
      ]);
      const title = format(cursor, 'yyyy 年 M 月', { locale: zhCN });
      const lines: string[] = [`# ${title} 备赛原始数据`, '', '## 专注记录 (focus_sessions)'];
      for (const r of ff.slice(0, 220)) {
        lines.push(
          `- ${r.session_date} · ${r.session_title || r.note || '未命名'} · ${r.duration_minutes} min · ${r.category || ''}`,
        );
      }
      lines.push('', '## 打卡日志 (daily_logs)');
      for (const r of ll.slice(0, 160)) {
        lines.push(
          `- ${r.log_date} 心情${r.mood_score ?? '-'} / 精力${r.energy_score ?? '-'}：${(r.summary || '').slice(0, 500)}`,
        );
      }
      const res = await fetch('/api/mentor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'monthly', monthLabel: title, contextMarkdown: lines.join('\n') }),
      });
      const data = (await res.json()) as { markdown?: string; error?: string };
      if (!res.ok) throw new Error(data.error || `月报 ${res.status}`);
      setMonthMd(data.markdown || '');
      setMonthOpen(true);
      toast.success('备赛月报已生成');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : '生成失败');
    } finally {
      setMonthLoading(false);
    }
  }, [user?.id, cursor]);

  const loadProfile = useCallback(async () => {
    if (!user?.id) {
      setProfileLoading(false);
      return;
    }
    setProfileLoading(true);
    setProfileError(null);
    try {
      const p = await fetchUserProfile(user.id);
      if (p) {
        setNick(p.nickname || '');
        setMotto(p.motto || '');
        setAvatar(p.avatar_url || '');
        const t = Array.isArray(p.tech_tags) ? (p.tech_tags as string[]).join(', ') : '';
        if (t) setTagsInput(t);
      }
    } catch (e: unknown) {
      setProfileError(e instanceof Error ? e.message : '加载档案失败');
    } finally {
      setProfileLoading(false);
    }
  }, [user?.id]);

  const loadRadar = useCallback(async () => {
    if (!user?.id) return;
    try {
      const rows = await fetchRecentFocusSessions(user.id, 30);
      setRadarRows(rows);
    } catch {
      setRadarRows([]);
    }
  }, [user?.id]);

  const loadDay = useCallback(async () => {
    if (!user?.id) return;
    setDayLoading(true);
    setDayError(null);
    try {
      const [f, l] = await Promise.all([
        fetchFocusSessionsForDate(user.id, selectedDay),
        fetchDailyLogForDate(user.id, selectedDay),
      ]);
      setFocusDay(f);
      setLogDay(l);
    } catch (e: unknown) {
      setDayError(e instanceof Error ? e.message : '加载当日数据失败');
    } finally {
      setDayLoading(false);
    }
  }, [user?.id, selectedDay]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    void loadRadar();
  }, [loadRadar]);

  useEffect(() => {
    void loadDay();
  }, [loadDay]);

  const radarData = useMemo(() => buildRadarFromFocus(radarRows), [radarRows]);

  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);
  const gridStart = new Date(monthStart);
  gridStart.setDate(monthStart.getDate() - ((monthStart.getDay() + 6) % 7));
  const gridEnd = new Date(monthEnd);
  gridEnd.setDate(monthEnd.getDate() + ((7 - ((monthEnd.getDay() + 6) % 7)) % 7));
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const saveProfile = async () => {
    if (!user?.id) return;
    setProfileSaving(true);
    setProfileError(null);
    try {
      const tags = tagsInput
        .split(/[,，]/)
        .map((s) => s.trim())
        .filter(Boolean);
      await upsertUserProfile({
        id: user.id,
        nickname: nick || null,
        motto: motto || null,
        avatar_url: avatar || null,
        tech_tags: tags,
      });
      toast.success('极客档案已保存');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '保存失败';
      setProfileError(msg);
      toast.error(msg);
    } finally {
      setProfileSaving(false);
    }
  };

  const tape = (deg: number) => ({
    transform: `rotate(${deg}deg)`,
  });

  if (!user) {
    return (
      <div className="rounded-3xl border-2 border-dashed border-zinc-600 bg-zinc-900/60 p-12 text-center text-zinc-400 font-bold">
        请先登录后进入极客中心
      </div>
    );
  }

  return (
    <div className="space-y-8 text-zinc-100">
      <header className="relative overflow-hidden rounded-[2rem] border-2 border-zinc-700 bg-gradient-to-br from-violet-950/80 via-zinc-950 to-emerald-950/50 p-8 shadow-[12px_12px_0_0_#18181b]">
        <div
          className="pointer-events-none absolute -right-6 top-4 h-24 w-32 rounded-sm bg-amber-400/90 opacity-90 shadow-md"
          style={tape(6)}
        />
        <div
          className="pointer-events-none absolute left-8 top-2 h-8 w-28 rounded-sm bg-pink-500/80"
          style={tape(-3)}
        />
        <h1 className="text-3xl font-black tracking-tight text-white drop-shadow-sm">极客中心 · Geek HQ</h1>
        <p className="mt-2 max-w-xl text-sm font-bold text-zinc-400">
          深色拼贴风工作台：档案、番茄钟、能力雷达（由专注分类聚合）、联动日历。
        </p>
      </header>

      <div
        ref={deckRef}
        className="relative mx-auto min-h-[1240px] max-w-5xl rounded-[2rem] border-2 border-dashed border-zinc-700/80 bg-zinc-950/20 p-4 sm:p-6"
      >
        <p className="mb-4 text-center text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 sm:text-left">
          极客拼贴工作台 · 拖拽三张主卡片自由排版（位置保存在本机）
        </p>

        <motion.section
          className="absolute z-10 w-[min(380px,calc(100vw-3rem))] space-y-4 rounded-3xl border-2 border-zinc-700 bg-zinc-900/90 p-6 shadow-[8px_8px_0_0_#27272a]"
          animate={{ x: deck.profile.x, y: deck.profile.y }}
          drag
          dragConstraints={deckRef}
          dragMomentum={false}
          dragElastic={0.08}
          onDragEnd={(_, info) =>
            persistDeck({
              ...deck,
              profile: { x: deck.profile.x + info.offset.x, y: deck.profile.y + info.offset.y },
            })
          }
        >
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-fuchsia-400">
            <StickyNote className="h-4 w-4" />
            极客档案 / user_profiles
          </div>
          {profileLoading ? (
            <div className="flex items-center gap-2 py-8 text-zinc-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              加载中…
            </div>
          ) : (
            <>
              {profileError && (
                <div className="flex items-center gap-2 rounded-xl border border-red-500/50 bg-red-950/40 p-3 text-xs font-bold text-red-300">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {profileError}
                </div>
              )}
              <label className="block text-[10px] font-black uppercase text-zinc-500">昵称</label>
              <Input
                value={nick}
                onChange={(e) => setNick(e.target.value)}
                className="border-2 border-zinc-600 bg-zinc-950 font-bold text-white"
              />
              <label className="block text-[10px] font-black uppercase text-zinc-500">头像 URL</label>
              <Input
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                className="border-2 border-zinc-600 bg-zinc-950 font-bold text-white"
              />
              <label className="block text-[10px] font-black uppercase text-zinc-500">座右铭</label>
              <Input
                value={motto}
                onChange={(e) => setMotto(e.target.value)}
                className="border-2 border-zinc-600 bg-zinc-950 font-bold text-white"
              />
              <label className="block text-[10px] font-black uppercase text-zinc-500">Tech tags（逗号分隔 → JSONB）</label>
              <Input
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="border-2 border-zinc-600 bg-zinc-950 font-bold text-white"
              />
              <Button
                onClick={() => void saveProfile()}
                disabled={profileSaving}
                className="w-full h-11 rounded-xl border-2 border-zinc-900 bg-fuchsia-600 font-black hover:bg-fuchsia-500"
              >
                {profileSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                保存档案
              </Button>
            </>
          )}
        </motion.section>

        <motion.section
          className="absolute z-10 w-[min(380px,calc(100vw-3rem))] space-y-4 rounded-3xl border-2 border-zinc-700 bg-zinc-900/90 p-6 shadow-[8px_8px_0_0_#22c55e55]"
          animate={{ x: deck.radar.x, y: deck.radar.y }}
          drag
          dragConstraints={deckRef}
          dragMomentum={false}
          dragElastic={0.08}
          onDragEnd={(_, info) =>
            persistDeck({
              ...deck,
              radar: { x: deck.radar.x + info.offset.x, y: deck.radar.y + info.offset.y },
            })
          }
        >
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-emerald-400">
            <Zap className="h-4 w-4" />
            能力雷达（近 30 日 focus_sessions 分类聚合）
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="72%" data={radarData}>
                <PolarGrid stroke="#3f3f46" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#a1a1aa', fontSize: 11, fontWeight: 800 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="投入" dataKey="value" stroke="#a855f7" fill="#c084fc" fillOpacity={0.35} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </motion.section>

        <motion.div
          className="absolute z-10 w-[min(380px,calc(100vw-3rem))] space-y-4"
          animate={{ x: deck.timer.x, y: deck.timer.y }}
          drag
          dragConstraints={deckRef}
          dragMomentum={false}
          dragElastic={0.08}
          onDragEnd={(_, info) =>
            persistDeck({
              ...deck,
              timer: { x: deck.timer.x + info.offset.x, y: deck.timer.y + info.offset.y },
            })
          }
        >
          <FocusTimer
            userId={user.id}
            variant="dark"
            category="算法"
            enableConfetti
            onSaved={() => {
              void loadRadar();
              void loadDay();
            }}
          />
        </motion.div>
      </div>

      <section className="rounded-3xl border-2 border-zinc-700 bg-zinc-900/80 p-6 shadow-[8px_8px_0_0_#6366f155]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-indigo-400">
            <Sparkles className="h-4 w-4" />
            联动学习日历
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 border-2 border-zinc-600 bg-zinc-950 text-xs font-black text-zinc-200"
              onClick={() => setCursor(subMonths(cursor, 1))}
            >
              上月
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 border-2 border-zinc-600 bg-zinc-950 text-xs font-black text-zinc-200"
              onClick={() => setCursor(addMonths(cursor, 1))}
            >
              下月
            </Button>
            <Button
              size="sm"
              className="h-8 border-2 border-emerald-500 bg-emerald-700 text-xs font-black text-white hover:bg-emerald-600"
              disabled={monthLoading}
              onClick={() => void genMonthReport()}
            >
              {monthLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="mr-1 h-3.5 w-3.5" />}
              生成备赛月报
            </Button>
          </div>
        </div>
        <div className="text-lg font-black text-white">{format(cursor, 'yyyy 年 M 月', { locale: zhCN })}</div>
        <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[10px] font-black uppercase text-zinc-500">
          {['一', '二', '三', '四', '五', '六', '日'].map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {days.map((day) => {
            const iso = format(day, 'yyyy-MM-dd');
            const inMonth = isSameMonth(day, cursor);
            const sel = iso === selectedDay;
            return (
              <button
                key={iso}
                type="button"
                onClick={() => setSelectedDay(iso)}
                className={`aspect-square rounded-lg border-2 text-[11px] font-black transition ${
                  sel
                    ? 'border-fuchsia-400 bg-fuchsia-600/30 text-white'
                    : inMonth
                      ? 'border-zinc-700 bg-zinc-950 text-zinc-200 hover:border-zinc-500'
                      : 'border-zinc-800 bg-zinc-950/40 text-zinc-600'
                }`}
              >
                {format(day, 'd')}
              </button>
            );
          })}
        </div>

        <div className="mt-6 rounded-2xl border-2 border-dashed border-zinc-600 bg-black/30 p-4">
          <div className="text-sm font-black text-fuchsia-300">选中日期 · {selectedDay}</div>
          {dayLoading ? (
            <div className="mt-4 flex items-center gap-2 text-zinc-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              加载当日数据…
            </div>
          ) : dayError ? (
            <div className="mt-4 flex items-center gap-2 text-sm font-bold text-red-400">
              <AlertCircle className="h-4 w-4" />
              {dayError}
            </div>
          ) : (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <div className="mb-2 text-[10px] font-black uppercase text-zinc-500">专注清单</div>
                {focusDay.length === 0 ? (
                  <p className="text-xs font-bold text-zinc-500">当日无专注记录</p>
                ) : (
                  <ul className="space-y-2 text-xs font-bold">
                    {focusDay.map((f) => (
                      <li key={f.id || `${f.session_title}-${f.created_at}`} className="rounded-lg bg-zinc-950/80 p-2">
                        <span className="text-fuchsia-400">{f.session_title || f.note || '未命名'}</span>
                        <span className="text-zinc-500"> · {f.duration_minutes}min · {f.category}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <div className="mb-2 text-[10px] font-black uppercase text-zinc-500">打卡心得</div>
                {!logDay ? (
                  <p className="text-xs font-bold text-zinc-500">当日无打卡</p>
                ) : (
                  <div className="rounded-lg bg-zinc-950/80 p-3 text-xs leading-relaxed text-zinc-300">
                    <div className="mb-1 text-[10px] text-zinc-500">
                      心情 {logDay.mood_score ?? '-'} / 精力 {logDay.energy_score ?? '-'}
                    </div>
                    {logDay.summary}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="rounded-3xl border-2 border-zinc-700 bg-zinc-900/60 p-6 shadow-[8px_8px_0_0_#14b8a655]">
        <div className="mb-4 text-xs font-black uppercase tracking-widest text-teal-400">每日打卡 · daily_logs</div>
        <div className="rounded-2xl border border-zinc-700 bg-black/20 p-4">
          <DailyPunchIn userId={user.id} />
        </div>
      </section>

      <Dialog.Root open={monthOpen} onOpenChange={setMonthOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-[61] max-h-[85vh] w-[min(96vw,720px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl border-2 border-zinc-700 bg-zinc-950 p-6 text-zinc-100 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <Dialog.Title className="text-lg font-black text-white">备赛月报 · Markdown</Dialog.Title>
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-800 hover:text-white"
                  aria-label="关闭"
                >
                  <X className="h-5 w-5" />
                </button>
              </Dialog.Close>
            </div>
            <p className="mt-2 text-xs font-bold text-zinc-500">由 DeepSeek 基于当月 focus_sessions 与 daily_logs 润色生成，可直接粘贴到简历或说明书。</p>
            <div className="mt-4 max-h-[55vh] overflow-y-auto whitespace-pre-wrap rounded-2xl border border-zinc-700 bg-black/40 p-4 text-xs font-bold leading-relaxed text-zinc-200">
              {monthMd || '（空）'}
            </div>
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                className="border-zinc-600 font-black text-zinc-200"
                onClick={() => {
                  void navigator.clipboard.writeText(monthMd).then(() => toast.success('已复制 Markdown'));
                }}
              >
                <Copy className="mr-2 h-4 w-4" />
                复制
              </Button>
              <Button type="button" className="bg-emerald-600 font-black hover:bg-emerald-500" onClick={() => setMonthOpen(false)}>
                关闭
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
};
