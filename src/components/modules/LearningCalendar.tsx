import React, { useEffect, useMemo, useState } from 'react';
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameMonth,
  startOfMonth,
  differenceInCalendarDays,
  subMonths,
} from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { CalendarDays, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fetchRecentFocusSessions } from '@/src/lib/supabaseClient';

type Props = {
  userId: string | undefined;
};

type ExamNode = { id: string; name: string; date: Date };

const EXAMS_2026: ExamNode[] = [
  { id: 'csp', name: 'CCF CSP-J/S', date: new Date('2026-09-20T00:00:00') },
  { id: 'cumcm', name: '国赛建模', date: new Date('2026-09-11T00:00:00') },
  { id: 'lanqiao', name: '蓝桥杯国赛', date: new Date('2026-06-07T00:00:00') },
];

function computePressureIndex(params: { nextExamDays: number | null; focusMinutes14d: number }): number {
  const { nextExamDays, focusMinutes14d } = params;
  const urgency =
    nextExamDays == null ? 25 : Math.min(95, Math.round(520 / Math.max(1, nextExamDays + 3)));
  const slackGoal = 14 * 45;
  const slack = Math.min(1, focusMinutes14d / slackGoal);
  const laziness = Math.round((1 - slack) * 35);
  return Math.max(12, Math.min(100, Math.round(urgency * 0.55 + laziness + 10)));
}

export const LearningCalendar: React.FC<Props> = ({ userId }) => {
  const [cursor, setCursor] = useState(() => new Date());
  const [focusMin, setFocusMin] = useState(0);

  useEffect(() => {
    if (!userId) return;
    void (async () => {
      const rows = await fetchRecentFocusSessions(userId, 14);
      const sum = rows.reduce((a, r) => a + (r.duration_minutes || 0), 0);
      setFocusMin(sum);
    })();
  }, [userId, cursor]);

  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);
  const gridStart = addDays(monthStart, -((monthStart.getDay() + 6) % 7));
  const gridEnd = addDays(monthEnd, (7 - ((monthEnd.getDay() + 6) % 7) - 1) % 7);
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const nextExam = useMemo(() => {
    const today = new Date();
    const future = EXAMS_2026.filter((e) => e.date >= today).sort((a, b) => a.date.getTime() - b.date.getTime());
    return future[0] ?? null;
  }, []);

  const nextExamDays = nextExam ? differenceInCalendarDays(nextExam.date, new Date()) : null;
  const pressure = computePressureIndex({ nextExamDays, focusMinutes14d: focusMin });

  return (
    <div className="rounded-[28px] border-2 border-gray-900 bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-500">
          <CalendarDays className="w-4 h-4" />
          LearningCalendar
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 text-xs font-black" onClick={() => setCursor(subMonths(cursor, 1))}>
            上月
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs font-black" onClick={() => setCursor(addMonths(cursor, 1))}>
            下月
          </Button>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-lg font-black">{format(cursor, 'yyyy 年 M 月', { locale: zhCN })}</span>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border-2 border-amber-900 text-amber-950">
          <Flame className="w-4 h-4" />
          <span className="text-xs font-black">备赛压力指数 · {pressure}</span>
        </div>
      </div>
      <p className="text-[11px] font-bold text-gray-500 leading-relaxed">
        综合「距下一场关键考试的天数」与「近 14 日专注总时长」估算。考试节点含 CCF CSP-J/S 等示例日期，可按校历自行调整。
      </p>
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black text-gray-400 uppercase">
        {['一', '二', '三', '四', '五', '六', '日'].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const inMonth = isSameMonth(day, cursor);
          const hit = EXAMS_2026.find((e) => format(e.date, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd'));
          return (
            <div
              key={day.toISOString()}
              className={`aspect-square rounded-lg border text-[10px] font-bold flex flex-col items-center justify-center gap-0.5 ${
                inMonth ? 'border-gray-900 bg-gray-50 text-gray-900' : 'border-gray-100 text-gray-300 bg-white'
              } ${hit ? 'bg-rose-50 border-rose-700 text-rose-900' : ''}`}
            >
              <span>{format(day, 'd')}</span>
              {hit && <span className="text-[8px] font-black leading-none text-center px-0.5">{hit.name}</span>}
            </div>
          );
        })}
      </div>
      <div className="text-[10px] font-bold text-gray-400">
        近 14 日专注累计：{focusMin} 分钟（来自 focus_sessions）
      </div>
    </div>
  );
};
