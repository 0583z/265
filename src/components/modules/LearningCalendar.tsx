import React, { useMemo, useState } from 'react';
import { addDays, eachDayOfInterval, format, isSameMonth, startOfMonth, endOfMonth, differenceInCalendarDays, subMonths, addMonths } from 'date-fns';
import { 
  CalendarDays, 
  Flame, 
  Zap, 
  ChevronLeft, 
  ChevronRight, 
  PenLine, 
  Target, 
  Trophy 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { type FocusSessionRow, type DailyLogRow } from '@/src/lib/supabaseClient';

// 🚨 必须接收 App.tsx 传下来的全量比赛数据和订阅 ID
interface LearningCalendarProps {
  userId: string | undefined;
  sessions: FocusSessionRow[];
  logs?: DailyLogRow[];
  competitions?: any[];      // 所有的比赛字典
  subscribedIds?: string[];  // 用户订阅的 ID 列表
}

export const LearningCalendar: React.FC<LearningCalendarProps> = ({ 
  sessions, 
  logs = [], 
  competitions = [], 
  subscribedIds = [] 
}) => {
  const [cursor, setCursor] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // 🚨 核心逻辑：数据大一统映射
  const { focusMin14d, dateMap } = useMemo(() => {
    const today = new Date();
    const map: Record<string, { 
      total: number; 
      titles: string[]; 
      log: DailyLogRow | null; 
      deadlines: string[] 
    }> = {};
    let sum14d = 0;

    // 1. 处理专注数据 (Heatmap)
    (sessions || []).forEach(s => {
      if (!s.session_date) return;
      if (!map[s.session_date]) map[s.session_date] = { total: 0, titles: [], log: null, deadlines: [] };
      const dur = Number(s.duration_minutes) || 0;
      map[s.session_date].total += dur;
      if (s.session_title && !map[s.session_date].titles.includes(s.session_title)) {
        map[s.session_date].titles.push(s.session_title);
      }
      if (differenceInCalendarDays(today, new Date(s.session_date)) <= 14) sum14d += dur;
    });

    // 2. 处理打卡数据 (Purple Dot)
    (logs || []).forEach(l => {
      if (!l.log_date) return;
      if (!map[l.log_date]) map[l.log_date] = { total: 0, titles: [], log: null, deadlines: [] };
      map[l.log_date].log = l;
    });

    // 3. 🚨 核心修复：处理订阅的 DDL (Red Badge)
    subscribedIds.forEach(id => {
      const comp = competitions.find(c => String(c.id) === String(id));
      if (comp && comp.deadline) {
        // 格式化日期为 YYYY-MM-DD
        const ddlStr = comp.deadline.includes('T') ? comp.deadline.split('T')[0] : comp.deadline;
        if (!map[ddlStr]) map[ddlStr] = { total: 0, titles: [], log: null, deadlines: [] };
        // 避免重复添加
        if (!map[ddlStr].deadlines.includes(comp.name)) {
          map[ddlStr].deadlines.push(comp.name);
        }
      }
    });

    return { focusMin14d: sum14d, dateMap: map };
  }, [sessions, logs, competitions, subscribedIds]);

  const pressure = Math.min(100, Math.round((1 - (focusMin14d / 630)) * 40 + 30));
  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);
  
  // 补齐日历网格
  const days = eachDayOfInterval({
    start: addDays(monthStart, -((monthStart.getDay() + 6) % 7)),
    end: addDays(monthEnd, (7 - ((monthEnd.getDay() + 6) % 7) - 1) % 7)
  });

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="bg-zinc-900 border-2 border-zinc-800 rounded-[2.5rem] p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full" />
        
        {/* 顶部控制栏 */}
        <div className="flex items-center justify-between mb-8 relative z-10">
          <div className="text-[10px] font-black text-zinc-500 flex items-center gap-2 tracking-widest">
            <CalendarDays className="w-4 h-4 text-emerald-500" /> STATUS_GRID
          </div>
          <div className="flex items-center gap-2 bg-zinc-950/50 p-1 rounded-xl border border-zinc-800">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCursor(subMonths(cursor, 1))}><ChevronLeft className="w-4" /></Button>
            <span className="text-[10px] font-black italic text-zinc-300 min-w-[70px] text-center">{format(cursor, 'yyyy.MM')}</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCursor(addMonths(cursor, 1))}><ChevronRight className="w-4" /></Button>
          </div>
        </div>
        
        {/* 统计卡片 */}
        <div className="grid grid-cols-2 gap-4 mb-8 relative z-10">
          <div className="bg-zinc-950/50 p-4 rounded-2xl border border-zinc-800">
            <div className="text-[8px] text-zinc-600 font-black uppercase mb-1">Pressure</div>
            <div className="flex items-center gap-2">
              <Flame className={`w-4 ${pressure > 70 ? 'text-orange-500 animate-pulse' : 'text-amber-500'}`} />
              <span className="text-lg font-black text-white">{pressure}%</span>
            </div>
          </div>
          <div className="bg-zinc-950/50 p-4 rounded-2xl border border-zinc-800">
            <div className="text-[8px] text-zinc-600 font-black uppercase mb-1">14D Total</div>
            <div className="flex items-center gap-2 text-emerald-400">
              <Zap className="w-4" />
              <span className="text-lg font-black">{focusMin14d}m</span>
            </div>
          </div>
        </div>
        
        {/* 日历网格 */}
        <div className="grid grid-cols-7 gap-1.5 relative z-10">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
            <div key={i} className="text-[8px] font-black text-zinc-700 text-center mb-1">{d}</div>
          ))}
          {days.map(day => {
            const dStr = format(day, 'yyyy-MM-dd');
            const data = dateMap[dStr];
            
            // 专注热力图背景色
            let bgColor = 'bg-zinc-800/20 border-zinc-800/30';
            if (data?.total > 0) bgColor = 'bg-emerald-950/30 border-emerald-900/40';
            if (data?.total > 60) bgColor = 'bg-emerald-800/40 border-emerald-700/60';
            if (data?.total > 150) bgColor = 'bg-emerald-500 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]';
            
            const isToday = dStr === format(new Date(), 'yyyy-MM-dd');
            const hasDeadlines = data?.deadlines && data.deadlines.length > 0;

            return (
              <motion.div 
                key={dStr} 
                onClick={() => setSelectedDate(data || hasDeadlines ? dStr : null)} 
                whileHover={{ scale: 1.1 }} 
                className={`aspect-square rounded-lg flex flex-col items-center justify-center cursor-pointer border-2 relative transition-all ${bgColor} 
                  ${isSameMonth(day, cursor) ? 'text-zinc-200' : 'text-zinc-800 opacity-20'} 
                  ${isToday ? 'border-emerald-500 ring-2 ring-emerald-500/20' : ''}
                  ${selectedDate === dStr ? 'ring-2 ring-fuchsia-500 border-fuchsia-500' : ''}`}
              >
                <span className="text-[9px] font-black">{format(day, 'd')}</span>
                
                {/* 🚨 核心：打卡紫色点 */}
                {data?.log && <div className="absolute bottom-1 w-1 h-1 rounded-full bg-fuchsia-500 shadow-[0_0_5px_rgba(217,70,239,0.8)]" />}
                
                {/* 🚨 核心：DDL 红色角标 */}
                {hasDeadlines && (
                  <div className="absolute -top-1.5 -right-1.5 px-1 bg-red-600 text-white rounded-[4px] text-[6px] font-black uppercase shadow-lg border border-red-400 z-20 animate-bounce">
                    DDL
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* 详情浮窗 */}
      <AnimatePresence mode="wait">
        {selectedDate && dateMap[selectedDate] && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: 10 }} 
            className="bg-zinc-900 border-2 border-zinc-800 rounded-[2rem] p-6 space-y-4 shadow-2xl relative"
          >
            <button 
              onClick={() => setSelectedDate(null)}
              className="absolute top-4 right-4 text-zinc-600 hover:text-zinc-400 text-xs font-black"
            >✕</button>
            
            <div className="flex justify-between border-b border-zinc-800 pb-3">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{selectedDate} LOGS</span>
              <span className="text-xs font-black text-emerald-500 italic">{dateMap[selectedDate].total}m Focus</span>
            </div>

            {/* 🚨 DDL 详情渲染 */}
            {dateMap[selectedDate].deadlines.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Target className="w-3 h-3 text-red-500" />
                  <span className="text-[10px] font-black text-red-500 uppercase">赛事截稿日</span>
                </div>
                {dateMap[selectedDate].deadlines.map((name, i) => (
                  <div key={i} className="text-[11px] font-black text-red-100 bg-red-500/10 border border-red-500/20 p-2 rounded-xl flex items-center gap-2">
                    <Trophy className="w-3 h-3 text-red-500" /> {name}
                  </div>
                ))}
              </div>
            )}
            
            {/* 专注任务详情 */}
            {dateMap[selectedDate].titles.length > 0 && (
              <div className="space-y-2">
                <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Tasks</div>
                {dateMap[selectedDate].titles.map((t, i) => (
                  <div key={i} className="text-[11px] font-bold text-zinc-300 flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1 shrink-0" />
                    <span>{t}</span>
                  </div>
                ))}
              </div>
            )}

            {/* 打卡日记详情 */}
            {dateMap[selectedDate].log && (
              <div className="pt-2 border-t border-zinc-800/50">
                <div className="flex items-center gap-2 mb-2">
                  <PenLine className="w-3 h-3 text-fuchsia-500" />
                  <span className="text-[10px] font-black text-fuchsia-500 uppercase">Daily Summary</span>
                </div>
                <p className="text-[11px] font-bold text-zinc-400 leading-relaxed italic bg-zinc-950/50 p-3 rounded-xl border border-zinc-800">
                  “{dateMap[selectedDate].log.summary}”
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};