import React, { useEffect, useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Activity, Flame, Zap, Sparkles, Users, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { subDays, format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { toast } from 'sonner';
import { fetchRecentFocusSessions, fetchRecentDailyLogs, type FocusSessionRow, type DailyLogRow } from '../../lib/supabaseClient';

export const GeekActivityBoard: React.FC<{ userId?: string }> = ({ userId }) => {
  const [focusSessions, setFocusSessions] = useState<FocusSessionRow[]>([]);
  const [dailyLogs, setDailyLogs] = useState<DailyLogRow[]>([]);
  const [loading, setLoading] = useState(true);

  // 🚀 新增：AI 聚类相关状态
  const [isMatching, setIsMatching] = useState(false);
  const [clusters, setClusters] = useState<any>(null);

  // 1. 挂载时拉取真实数据库数据
  useEffect(() => {
    const loadData = async () => {
      if (!userId) return;
      setLoading(true);
      try {
        const [focusData, logsData] = await Promise.all([
          fetchRecentFocusSessions(userId, 500),
          fetchRecentDailyLogs(userId, 500)
        ]);
        setFocusSessions(focusData);
        setDailyLogs(logsData);
      } catch (e) {
        console.error('获取极客活跃数据失败:', e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [userId]);

  // --- 🧠 核心逻辑：调用后台 Python AI 引擎 ---
  const handleAIMatch = async () => {
    setIsMatching(true);
    toast.loading("AI 正在解析您的全栈行为特征并进行 K-Means 聚类...", { id: "ai-match" });

    // 构造发送给后端的数据（这里模拟了一组大厅数据 + 您的真实数据对比）
    const matchPayload = {
      geeks: [
        {
          user_id: userId || "me",
          username: "我 (当前用户)",
          algorithm_score: 85, // 这里的逻辑可以根据您实际的 focusSessions 数量动态计算
          engineering_score: 90,
          product_score: 75,
          focus_hours: Number(total7DaysHours)
        },
        { user_id: "u1", username: "Algo_Expert", algorithm_score: 98, engineering_score: 40, product_score: 30, focus_hours: 15 },
        { user_id: "u2", username: "Product_Lead", algorithm_score: 40, engineering_score: 50, product_score: 95, focus_hours: 8 },
        { user_id: "u3", username: "Infra_Dev", algorithm_score: 70, engineering_score: 92, product_score: 45, focus_hours: 22 },
      ]
    };

    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/cluster_match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(matchPayload)
      });

      if (!response.ok) throw new Error();
      const data = await response.json();

      setClusters(data.clusters);
      toast.success("AI 星系拓扑构建成功！", { id: "ai-match" });
    } catch (error) {
      toast.error("AI 引擎连接异常，请检查 Python 服务是否开启", { id: "ai-match" });
    } finally {
      setIsMatching(false);
    }
  };

  // 2. 核心算法：计算近 7 天的真实趋势数据
  const trendData = useMemo(() => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayName = format(date, 'EEEE', { locale: zhCN }).replace('星期', '周');

      const dayFocus = focusSessions
        .filter(f => (f.created_at?.startsWith(dateStr) || f.session_date?.startsWith(dateStr)))
        .reduce((sum, f) => sum + (Number(f.duration_minutes) || 0), 0);

      const dayLogsCount = dailyLogs.filter(l => l.log_date?.startsWith(dateStr)).length;
      const dayCode = dayLogsCount * 45;

      data.push({
        day: i === 0 ? '今日' : dayName,
        focus: dayFocus,
        code: dayCode,
        fullDate: dateStr
      });
    }
    return data;
  }, [focusSessions, dailyLogs]);

  const total7DaysHours = useMemo(() => {
    const totalMins = trendData.reduce((sum, d) => sum + d.focus + d.code, 0);
    return (totalMins / 60).toFixed(1);
  }, [trendData]);

  const heatmapData = useMemo(() => {
    const data = [];
    for (let i = 83; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayFocus = focusSessions
        .filter(f => (f.created_at?.startsWith(dateStr) || f.session_date?.startsWith(dateStr)))
        .reduce((sum, f) => sum + (Number(f.duration_minutes) || 0), 0);
      const dayLogsCount = dailyLogs.filter(l => l.log_date?.startsWith(dateStr)).length;
      const totalMins = dayFocus + dayLogsCount * 30;

      let level = 0;
      if (totalMins > 0 && totalMins <= 30) level = 1;
      else if (totalMins > 30 && totalMins <= 90) level = 2;
      else if (totalMins > 90 && totalMins <= 180) level = 3;
      else if (totalMins > 180) level = 4;

      data.push({ id: i, date: dateStr, level, totalMins });
    }
    return data;
  }, [focusSessions, dailyLogs]);

  const currentStreak = useMemo(() => {
    let streak = 0;
    for (let i = 0; i < 84; i++) {
      const dateStr = format(subDays(new Date(), i), 'yyyy-MM-dd');
      const hasActivity =
        focusSessions.some(f => f.created_at?.startsWith(dateStr) || f.session_date?.startsWith(dateStr)) ||
        dailyLogs.some(l => l.log_date?.startsWith(dateStr));
      if (hasActivity) streak++;
      else if (i > 0) break;
    }
    return streak;
  }, [focusSessions, dailyLogs]);

  const getColor = (level: number) => {
    switch (level) {
      case 1: return 'bg-emerald-200';
      case 2: return 'bg-emerald-400';
      case 3: return 'bg-emerald-600';
      case 4: return 'bg-emerald-800';
      default: return 'bg-slate-100/10';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
          <Flame className="w-7 h-7 text-rose-500" />
          高阶数据分析与活跃度
        </h2>


      </div>

      {/* 🌌 AI 聚类结果展示区 (仅在有数据时显示) */}
      <AnimatePresence>
        {clusters && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
          >
            {Object.entries(clusters).map(([name, members]: any) => (
              <div key={name} className="bg-blue-50/50 border border-blue-100 p-5 rounded-[2rem] space-y-3">
                <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{name}</h4>
                <div className="flex flex-wrap gap-2">
                  {members.map((m: any) => (
                    <span key={m.user_id} className="px-3 py-1 bg-white border border-blue-100 rounded-lg text-xs font-bold text-gray-700 shadow-sm">
                      {m.username}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 原有的模块 1 和 模块 2 完全保留 */}
        <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-lg transition-all">
          {loading && <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-20 flex items-center justify-center font-black text-blue-500 animate-pulse">解析真实数据中...</div>}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-500" /> 近 7 日活跃趋势
              </h3>
              <p className="text-xs font-bold text-gray-400 mt-1">Focus & Practise Contributions</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-blue-600">{total7DaysHours}<span className="text-sm text-gray-400 ml-1">hrs</span></span>
            </div>
          </div>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorFocus" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} /><stop offset="95%" stopColor="#3b82f6" stopOpacity={0} /></linearGradient>
                  <linearGradient id="colorCode" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.4} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }} />
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', fontWeight: 'bold' }} />
                <Area type="monotone" name="备赛专注 (分钟)" dataKey="focus" stroke="#3b82f6" strokeWidth={3} fill="url(#colorFocus)" />
                <Area type="monotone" name="实战产出评估" dataKey="code" stroke="#10b981" strokeWidth={3} fill="url(#colorCode)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-zinc-950 rounded-[32px] p-8 shadow-xl relative overflow-hidden flex flex-col justify-between group">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/20 blur-3xl rounded-full pointer-events-none"></div>
          <div className="flex items-center justify-between mb-6 relative z-10">
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2"><Zap className="w-5 h-5 text-emerald-400" /> 极客真实热力图</h3>
              <p className="text-xs font-bold text-zinc-400 mt-1">Geek Contribution Matrix</p>
            </div>
            <div className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-black border border-emerald-500/30">🔥 {currentStreak} Days Streak</div>
          </div>
          <div className="flex-1 flex items-center justify-center relative z-10 overflow-x-auto pb-2">
            <div className="flex gap-2">
              {Array.from({ length: 12 }).map((_, colIndex) => (
                <div key={`col-${colIndex}`} className="flex flex-col gap-2">
                  {Array.from({ length: 7 }).map((_, rowIndex) => {
                    const block = heatmapData[colIndex * 7 + rowIndex];
                    if (!block) return null;
                    return (
                      <motion.div
                        key={block.id}
                        className={`w-4 h-4 sm:w-5 sm:h-5 rounded-[4px] sm:rounded-md cursor-pointer hover:scale-125 transition-all ${getColor(block.level)}`}
                        title={`${block.date} | 活跃: ${block.totalMins}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
          <div className="mt-6 flex items-center justify-end gap-2 text-[10px] font-bold text-zinc-400 relative z-10">
            <span>摸鱼</span>
            {[0, 1, 2, 3, 4].map(l => <div key={l} className={`w-3 h-3 rounded-sm ${l === 0 ? 'bg-slate-100/10' : getColor(l)}`}></div>)}
            <span>卷王</span>
          </div>
        </div>
      </div>
    </div>
  );
};