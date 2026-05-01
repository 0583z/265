import React, { useMemo, useState } from 'react';
import { addDays, eachDayOfInterval, format, isSameMonth, startOfMonth, endOfMonth, differenceInCalendarDays, subMonths, addMonths, parseISO } from 'date-fns';
import {
  CalendarDays,
  Flame,
  Zap,
  ChevronLeft,
  ChevronRight,
  PenLine,
  Target,
  Trophy,
  XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
// 🚨 从您的统一图纸库引入类型
import { type FocusSessionRow, type DailyLogRow } from '@/src/types';

interface LearningCalendarProps {
  userId: string | undefined;
  sessions: FocusSessionRow[];
  logs?: DailyLogRow[];
  competitions?: any[];
  subscribedIds?: string[];
  theme?: 'light' | 'dark';
}

export const LearningCalendar: React.FC<LearningCalendarProps> = ({
  userId, // 🚨 必须接收 userId 来读取本地缓存
  sessions,
  logs = [],
  competitions = [],
  subscribedIds = [],
  theme = 'light'
}) => {
  const [cursor, setCursor] = useState(() => new Date());
  // 🚨 使用 format 确保和打卡组件完全一致的 YYYY-MM-DD 格式，避免时区偏移
  const [selectedDate, setSelectedDate] = useState<string | null>(format(new Date(), 'yyyy-MM-dd'));

  const isDark = theme === 'dark';

  // 🚨 极致严谨的数据聚合逻辑（双保险闭环）
  const { focusMin14d, dateMap } = useMemo(() => {
    const today = new Date();
    const map: Record<string, {
      total: number;
      titles: string[];
      log: DailyLogRow | null;
      deadlines: string[]
    }> = {};
    let sum14d = 0;

    // 1. 解析专注会话
    (sessions || []).forEach(s => {
      if (!s.session_date) return;
      const dStr = s.session_date.split('T')[0];
      if (!map[dStr]) map[dStr] = { total: 0, titles: [], log: null, deadlines: [] };

      const dur = Number(s.duration_minutes) || 0;
      map[dStr].total += dur;
      if (s.session_title && !map[dStr].titles.includes(s.session_title)) map[dStr].titles.push(s.session_title);
      if (differenceInCalendarDays(today, parseISO(dStr)) <= 14) sum14d += dur;
    });

    // 2. 解析云端打卡日志
    (logs || []).forEach(l => {
      if (!l.log_date) return;
      const dStr = l.log_date.split('T')[0];
      if (!map[dStr]) map[dStr] = { total: 0, titles: [], log: null, deadlines: [] };
      map[dStr].log = l;
    });

    // 🚨 核心修复：读取本地 localStorage 兜底！女王大人的本地缓存闭环！
    if (userId) {
      try {
        const localKey = `daily_logs_${userId}`;
        const localLogs = JSON.parse(localStorage.getItem(localKey) || '[]');
        localLogs.forEach((l: DailyLogRow) => {
          if (!l.log_date) return;
          const dStr = l.log_date.split('T')[0];
          if (!map[dStr]) map[dStr] = { total: 0, titles: [], log: null, deadlines: [] };
          // 🚨 本地数据最新，如果有，直接补充或覆盖
          map[dStr].log = l;
        });
      } catch (e) {
        console.error("读取本地日志缓存失败", e);
      }
    }

    // 3. 解析赛事 DDL
    subscribedIds.forEach(id => {
      const comp = competitions.find(c => String(c.id) === String(id));
      if (comp && comp.deadline) {
        const ddlStr = comp.deadline.split('T')[0];
        if (!map[ddlStr]) map[ddlStr] = { total: 0, titles: [], log: null, deadlines: [] };
        if (!map[ddlStr].deadlines.includes(comp.name)) map[ddlStr].deadlines.push(comp.name);
      }
    });

    return { focusMin14d: sum14d, dateMap: map };
  }, [sessions, logs, competitions, subscribedIds, userId]); // 依赖中加入 userId

  const pressure = Math.min(100, Math.round((1 - (focusMin14d / 630)) * 40 + 30));
  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);

  const days = eachDayOfInterval({
    start: addDays(monthStart, -((monthStart.getDay() + 6) % 7)),
    end: addDays(monthEnd, (7 - ((monthEnd.getDay() + 6) % 7) - 1) % 7)
  });

  const activeData = selectedDate ? dateMap[selectedDate] : null;

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* 📅 日历主卡片 */}
      <div className={`border-2 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden transition-all duration-500
        ${isDark ? 'bg-zinc-900 border-zinc-800 shadow-black/40' : 'bg-white border-gray-100 shadow-gray-200/50'}`}>

        <div className={`absolute top-0 right-0 w-40 h-40 blur-3xl rounded-full opacity-20 ${isDark ? 'bg-emerald-500' : 'bg-emerald-400'}`} />

        <div className="flex items-center justify-between mb-8 relative z-10">
          <div className={`text-[11px] font-black flex items-center gap-2 tracking-[0.2em] ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>
            <CalendarDays className="w-4 h-4 text-emerald-500" /> STATUS_GRID_v2
          </div>
          <div className={`flex items-center gap-3 p-1.5 rounded-2xl border ${isDark ? 'bg-zinc-950/50 border-zinc-800' : 'bg-gray-50 border-gray-100'}`}>
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-emerald-500/10" onClick={() => setCursor(subMonths(cursor, 1))}><ChevronLeft className="w-4" /></Button>
            <span className={`text-xs font-black min-w-[80px] text-center italic ${isDark ? 'text-zinc-300' : 'text-gray-900'}`}>{format(cursor, 'yyyy . MM')}</span>
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-emerald-500/10" onClick={() => setCursor(addMonths(cursor, 1))}><ChevronRight className="w-4" /></Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8 relative z-10">
          <div className={`p-5 rounded-3xl border ${isDark ? 'bg-zinc-950/50 border-zinc-800' : 'bg-gray-50/50 border-gray-100'}`}>
            <div className={`text-[9px] font-black uppercase mb-2 tracking-tighter ${isDark ? 'text-zinc-600' : 'text-gray-400'}`}>Pressure_Index</div>
            <div className="flex items-center gap-3">
              <Flame className={`w-5 h-5 ${pressure > 70 ? 'text-orange-500 animate-pulse' : 'text-amber-500'}`} />
              <span className={`text-2xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{pressure}%</span>
            </div>
          </div>
          <div className={`p-5 rounded-3xl border ${isDark ? 'bg-zinc-950/50 border-zinc-800' : 'bg-gray-50/50 border-gray-100'}`}>
            <div className={`text-[9px] font-black uppercase mb-2 tracking-tighter ${isDark ? 'text-zinc-600' : 'text-gray-400'}`}>Rolling_14D</div>
            <div className="flex items-center gap-3 text-emerald-500">
              <Zap className="w-5 h-5 fill-current" />
              <span className="text-2xl font-black">{focusMin14d}m</span>
            </div>
          </div>
        </div>

        {/* 网格渲染 */}
        <div className="grid grid-cols-7 gap-2 relative z-10">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
            <div key={i} className={`text-[10px] font-black text-center mb-2 ${isDark ? 'text-zinc-700' : 'text-gray-300'}`}>{d}</div>
          ))}
          {days.map(day => {
            const dStr = format(day, 'yyyy-MM-dd');
            const data = dateMap[dStr];
            const isToday = dStr === format(new Date(), 'yyyy-MM-dd');

            let heatStyle = isDark ? 'bg-zinc-800/20 border-zinc-800/30' : 'bg-gray-100/50 border-gray-100';
            if (data?.total > 0) heatStyle = 'bg-emerald-500/20 border-emerald-500/30 text-emerald-500';
            if (data?.total > 120) heatStyle = 'bg-emerald-500/50 border-emerald-400 text-white';
            if (data?.total > 240) heatStyle = 'bg-emerald-500 border-emerald-300 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]';

            return (
              <motion.div
                key={dStr} onClick={() => setSelectedDate(dStr)} whileHover={{ scale: 1.1 }}
                className={`aspect-square rounded-xl flex flex-col items-center justify-center cursor-pointer border-2 relative transition-all duration-200 ${heatStyle} 
                  ${selectedDate === dStr ? 'ring-2 ring-fuchsia-500 border-fuchsia-500 z-20' : ''} 
                  ${isToday ? 'after:content-[""] after:absolute after:top-1 after:right-1 after:w-1.5 after:h-1.5 after:bg-blue-500 after:rounded-full' : ''}`}
              >
                <span className={`text-[10px] font-black ${isSameMonth(day, cursor) ? '' : 'opacity-20'}`}>{format(day, 'd')}</span>
                {/* 🚨 只要有打卡记录，必出紫点！ */}
                {data?.log && <div className="absolute bottom-1.5 w-1 h-1 rounded-full bg-fuchsia-500" />}
                {data?.deadlines.length > 0 && <div className="absolute -top-1.5 -right-1 px-1 bg-rose-600 text-[6px] text-white rounded-sm font-black animate-bounce shadow-lg">DDL</div>}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* 📋 详情面板 */}
      <AnimatePresence mode="wait">
        {selectedDate && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
            className={`border-2 rounded-[2.5rem] p-7 space-y-6 shadow-2xl relative transition-all duration-300
              ${isDark ? 'bg-zinc-900 border-zinc-800 shadow-black/60' : 'bg-white border-gray-100 shadow-gray-100'}`}
          >
            <div className={`flex justify-between items-center border-b pb-4 ${isDark ? 'border-zinc-800' : 'border-gray-50'}`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${isDark ? 'bg-zinc-800' : 'bg-gray-50'}`}><PenLine className="w-4 h-4 text-fuchsia-500" /></div>
                <span className={`text-xs font-black tracking-widest ${isDark ? 'text-zinc-400' : 'text-gray-400'}`}>{selectedDate.replace(/-/g, ' . ')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-3 h-3 text-emerald-500" />
                <span className="text-sm font-black italic text-emerald-500">{activeData?.total || 0}m</span>
              </div>
            </div>

            {activeData?.deadlines && activeData.deadlines.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-rose-500 text-[10px] font-black uppercase tracking-widest"><Trophy className="w-3 h-3" /> Competition_Deadlines</div>
                <div className="grid gap-2">
                  {activeData.deadlines.map((name, i) => (
                    <motion.div
                      key={i} initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.1 }}
                      className={`p-4 rounded-2xl border-l-4 font-bold text-xs flex items-center justify-between
                        ${isDark ? 'bg-rose-500/5 border-rose-500/40 text-rose-100' : 'bg-rose-50 border-rose-200 text-rose-700'}`}
                    >
                      <span>{name}</span>
                      <Target className="w-3 h-3 opacity-40" />
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {activeData?.titles && activeData.titles.length > 0 && (
              <div className="space-y-3">
                <div className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-zinc-600' : 'text-gray-400'}`}>Focus_Sessions</div>
                <div className="space-y-2">
                  {activeData.titles.map((t, i) => (
                    <div key={i} className={`text-xs font-bold flex items-start gap-3 p-1 ${isDark ? 'text-zinc-300' : 'text-gray-600'}`}>
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1.5 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                      <span className="leading-relaxed">{t}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 🚨 这里渲染您的打卡内容 */}
            {activeData?.log && (
              <div className="pt-4 border-t border-zinc-800/30">
                <div className="flex items-center gap-2 mb-3 text-fuchsia-500 text-[10px] font-black uppercase"><PenLine className="w-3 h-3" /> Daily_Reflection</div>
                <div className={`p-5 rounded-2xl border relative italic font-medium text-xs leading-loose
                  ${isDark ? 'bg-zinc-950/40 border-zinc-800 text-zinc-400' : 'bg-gray-50/50 border-gray-100 text-gray-500'}`}>
                  <span className="absolute -top-3 left-4 text-2xl font-serif text-fuchsia-500/20">“</span>
                  {activeData.log.summary}
                </div>
              </div>
            )}

            {/* 当本地和云端都没有数据时才显示 */}
            {(!activeData || (activeData.total === 0 && activeData.titles.length === 0 && !activeData.log && activeData.deadlines.length === 0)) && (
              <div className="py-10 flex flex-col items-center justify-center opacity-30">
                <XCircle className="w-8 h-8 mb-2" />
                <p className="text-[10px] font-black uppercase tracking-widest italic">System_Idle_No_Logs</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};