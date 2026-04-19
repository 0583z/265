import React, { useEffect, useRef, useState } from 'react';
import { Timer, Play, Square, Sparkles, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { supabaseClient } from '@/src/lib/supabaseClient';
import { applyFocusExpAfterSession } from '@/src/lib/growthModel';
import { useMentor } from '@/src/context/MentorContext';

type Props = {
  userId: string | undefined;
  variant?: 'light' | 'dark';
  /** 写入 focus_sessions.category */
  category?: string;
  enableConfetti?: boolean;
  onSaved?: () => void;
};

const PRESETS = [15, 25, 45];
const CATS = ['算法', '开发', 'UI', '综合', '文档'] as const;

export const FocusTimer: React.FC<Props> = ({
  userId,
  variant = 'light',
  category: initialCat = '算法',
  enableConfetti,
  onSaved,
}) => {
  const [minutes, setMinutes] = useState(25);
  const [title, setTitle] = useState('算法刷题 / 项目开发');
  const [category, setCategory] = useState<string>(initialCat);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [running, setRunning] = useState(false);
  const [aiReview, setAiReview] = useState('');
  const [persistLoading, setPersistLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const { notifyFocusComplete } = useMentor();

  const minutesRef = useRef(minutes);
  const titleRef = useRef(title);
  const userIdRef = useRef(userId);
  const categoryRef = useRef(category);
  minutesRef.current = minutes;
  titleRef.current = title;
  userIdRef.current = userId;
  categoryRef.current = category;

  const tickRef = useRef<number | null>(null);

  const clearTick = () => {
    if (tickRef.current != null) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
  };

  const persistAndReview = async (completed: boolean, remainingSeconds: number) => {
    const uid = userIdRef.current;
    if (!uid) return;
    const total = minutesRef.current * 60;
    const spentSec = completed ? total : Math.max(0, total - remainingSeconds);
    const spentMin = Math.max(1, Math.round(spentSec / 60));

    setPersistLoading(true);
    setApiError(null);
    try {
      const { data: sess } = await supabaseClient.auth.getSession();
      if (!sess.session) throw new Error('未登录');

      const sessionDate = new Date().toISOString().slice(0, 10);
      const durationSaved = completed ? minutesRef.current : spentMin;
      const { error } = await supabaseClient.from('focus_sessions').insert([
        {
          user_id: uid,
          duration_minutes: durationSaved,
          category: categoryRef.current || '综合',
          session_date: sessionDate,
          session_title: titleRef.current,
          note: completed ? '番茄完成' : '番茄中断',
        },
      ]);
      if (error) throw error;

      await applyFocusExpAfterSession(uid, durationSaved, categoryRef.current || '综合');
      if (completed) {
        void notifyFocusComplete({
          title: titleRef.current,
          category: categoryRef.current || '综合',
          durationMinutes: durationSaved,
        });
      }

      if (completed && enableConfetti) {
        confetti({ particleCount: 130, spread: 72, origin: { y: 0.65 }, scalar: 1.05 });
        setTimeout(() => confetti({ particleCount: 60, angle: 60, spread: 55, origin: { x: 0 } }), 200);
        setTimeout(() => confetti({ particleCount: 60, angle: 120, spread: 55, origin: { x: 1 } }), 400);
      }

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText: `专注主题：${titleRef.current}`,
          mode: 'focus_review',
          durationMinutes: completed ? minutesRef.current : spentMin,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as { error?: string }).error || `点评接口 ${res.status}`);
      if ((data as { review?: string }).review) {
        setAiReview((data as { review: string }).review);
        toast.success('极客点评已生成');
      }
      onSaved?.();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '保存或点评失败';
      setApiError(msg);
      toast.error(msg);
    } finally {
      setPersistLoading(false);
    }
  };

  useEffect(() => {
    if (!running) {
      clearTick();
      return;
    }
    tickRef.current = window.setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearTick();
          setRunning(false);
          queueMicrotask(() => void persistAndReview(true, 0));
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return clearTick;
  }, [running]);

  const start = () => {
    if (!userId) {
      toast.error('请先登录后再使用番茄钟');
      return;
    }
    setSecondsLeft(minutes * 60);
    setRunning(true);
    setAiReview('');
    setApiError(null);
  };

  const manualStop = () => {
    clearTick();
    setRunning(false);
    const remain = secondsLeft;
    setSecondsLeft(0);
    if (remain > 0 && remain < minutes * 60) {
      void persistAndReview(false, remain);
    }
  };

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');

  const dark = variant === 'dark';
  const box = dark
    ? 'rounded-[28px] border-2 border-zinc-600 bg-zinc-900/90 p-6 shadow-[8px_8px_0_0_#52525b] space-y-4'
    : 'rounded-[28px] border-2 border-gray-900 bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4';
  const labelCls = dark ? 'text-zinc-500' : 'text-gray-500';
  const inputCls = dark
    ? 'font-bold border-2 border-zinc-600 bg-zinc-950 text-white rounded-xl'
    : 'font-bold border-2 border-gray-900 rounded-xl';

  return (
    <div className={box}>
      <div className={`flex items-center gap-2 text-xs font-black uppercase tracking-widest ${labelCls}`}>
        <Timer className="w-4 h-4" />
        FocusTimer · 番茄钟
      </div>
      <Input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} placeholder="本次专注标题" />
      <div className="flex flex-wrap gap-2">
        <span className={`self-center text-[10px] font-black uppercase ${labelCls}`}>分类</span>
        {CATS.map((c) => (
          <button
            key={c}
            type="button"
            disabled={running}
            onClick={() => setCategory(c)}
            className={`rounded-full border-2 px-2.5 py-1 text-[10px] font-black ${
              dark
                ? category === c
                  ? 'border-fuchsia-400 bg-fuchsia-700/40 text-fuchsia-100'
                  : 'border-zinc-700 bg-zinc-950 text-zinc-400'
                : category === c
                  ? 'border-gray-900 bg-blue-600 text-white'
                  : 'border-gray-900 bg-gray-50'
            }`}
          >
            {c}
          </button>
        ))}
      </div>
      <div className="flex gap-2 flex-wrap">
        {PRESETS.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => !running && setMinutes(m)}
            className={`rounded-full border-2 px-3 py-1.5 text-xs font-black ${
              dark
                ? minutes === m
                  ? 'border-fuchsia-400 bg-fuchsia-600 text-white'
                  : 'border-zinc-700 bg-zinc-950 text-zinc-300'
                : minutes === m
                  ? 'border-gray-900 bg-blue-600 text-white'
                  : 'border-gray-900 bg-gray-50'
            }`}
          >
            {m} min
          </button>
        ))}
      </div>
      <div className={`text-center text-5xl font-black tabular-nums tracking-tight ${dark ? 'text-white' : ''}`}>
        {mm}:{ss}
      </div>
      {persistLoading && (
        <div className={`flex items-center justify-center gap-2 text-xs font-bold ${dark ? 'text-zinc-400' : 'text-gray-500'}`}>
          <Loader2 className="h-4 w-4 animate-spin" />
          正在同步数据库并请求 DeepSeek 点评…
        </div>
      )}
      {apiError && (
        <div
          className={`flex items-center gap-2 rounded-xl border-2 p-3 text-xs font-bold ${
            dark ? 'border-red-500/60 bg-red-950/50 text-red-200' : 'border-red-800 bg-red-50 text-red-900'
          }`}
        >
          {apiError}
        </div>
      )}
      <div className="flex gap-3">
        {!running ? (
          <Button
            onClick={start}
            disabled={persistLoading}
            className={`h-12 flex-1 rounded-xl font-black ${dark ? 'bg-fuchsia-600 hover:bg-fuchsia-500' : 'bg-blue-600'}`}
          >
            <Play className="mr-2 h-4 w-4" />
            开始
          </Button>
        ) : (
          <Button
            onClick={manualStop}
            variant="outline"
            disabled={persistLoading}
            className={`h-12 flex-1 rounded-xl border-2 font-black ${dark ? 'border-zinc-500 text-zinc-100' : 'border-gray-900'}`}
          >
            <Square className="mr-2 h-4 w-4" />
            结束并保存
          </Button>
        )}
      </div>
      {aiReview && (
        <div
          className={`flex gap-2 rounded-xl border-2 p-4 text-sm font-bold ${
            dark ? 'border-indigo-500/60 bg-indigo-950/50 text-indigo-100' : 'border-indigo-900 bg-indigo-50 text-indigo-950'
          }`}
        >
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <div className={`mb-1 text-[10px] uppercase tracking-widest ${dark ? 'text-indigo-300' : 'text-indigo-600'}`}>
              极客点评
            </div>
            {aiReview}
          </div>
        </div>
      )}
    </div>
  );
};
