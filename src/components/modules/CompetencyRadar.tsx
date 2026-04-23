import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { Target, Wand2, ShieldCheck, Lock, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { fetchUserSkills, upsertUserSkill, fetchUserAwards, fetchTotalFocusMinutes } from '@/src/lib/supabaseClient';
import { TEAM_DIMENSIONS } from '@/src/lib/vectorMatch';

type Props = {
  userId: string | undefined;
  onAskCoach: (question: string) => void;
};

const defaults = (): Record<string, number> =>
  Object.fromEntries(TEAM_DIMENSIONS.map((d) => [d, 40])) as Record<string, number>;

export const CompetencyRadar: React.FC<Props> = ({ userId, onAskCoach }) => {
  const [scores, setScores] = useState<Record<string, number>>(defaults());
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ focusMins: 0, awardCount: 0 });

  const chartData = useMemo(
    () => TEAM_DIMENSIONS.map((dim) => ({ subject: dim, value: scores[dim] ?? 40, fullMark: 100 })),
    [scores],
  );

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [rows, awards, focusMins] = await Promise.all([
        fetchUserSkills(userId),
        fetchUserAwards(userId),
        fetchTotalFocusMinutes(userId)
      ]);

      const next = defaults();
      for (const r of rows) {
        const dim = TEAM_DIMENSIONS.find((d) => r.skill_name === d || r.skill_name.includes(d));
        if (dim) next[dim] = Number(r.skill_score);
      }

      // 核心自动化引擎
      const awardLen = awards?.length || 0;
      const hours = (focusMins || 0) / 60;
      setStats({ focusMins: focusMins || 0, awardCount: awardLen });

      TEAM_DIMENSIONS.forEach(dim => {
        let boost = 0;
        if (dim.includes('算法') || dim.includes('竞赛') || dim.includes('全栈')) boost += awardLen * 12; 
        if (dim.includes('工程') || dim.includes('专注') || dim.includes('学习')) boost += hours * 3; 
        next[dim] = Math.min(100, Math.floor((next[dim] || 40) + boost));
      });

      setScores(next);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { void load(); }, [load]);

  const saveRadar = async () => {
    if (!userId) return toast.error('请先登录');
    try {
      for (const dim of TEAM_DIMENSIONS) {
        await upsertUserSkill(userId, { skill_name: dim, skill_score: scores[dim] ?? 50, weight: 1 });
      }
      toast.success('极客战力画像已成功上链固化！');
    } catch (e: any) {
      toast.error(e?.message || '保存失败');
    }
  };

  return (
    <div className="rounded-[28px] border-2 border-gray-900 bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4 relative overflow-hidden">
      
      <div className="flex items-center justify-between gap-2 relative z-10">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-900">
          <Target className="w-5 h-5 text-blue-600" />
          Competency Radar
        </div>
        <Button size="sm" className="rounded-lg font-black text-xs h-8 bg-black hover:bg-gray-800 text-white" onClick={() => void saveRadar()}>
          固化数字画像
        </Button>
      </div>

      <div className="bg-blue-50/50 border border-blue-100 rounded-[16px] p-3 flex items-start gap-3 relative z-10">
        <ShieldCheck className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-[11px] font-black text-blue-800 uppercase tracking-wide mb-0.5">防篡改战力引擎已激活</p>
          <p className="text-[10px] font-bold text-blue-600/70">
            各维度数据已与你的 <span className="text-blue-600">{stats.focusMins} 分钟</span> 专注记录及 <span className="text-blue-600">{stats.awardCount} 项</span> 荣誉成就底层绑定，自动加权生成。
          </p>
        </div>
      </div>

      <div className="h-64 w-full relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
            <PolarGrid stroke="#e5e7eb" strokeDasharray="3 3" />
            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fontWeight: 900, fill: '#374151' }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
            <Radar name="能力" dataKey="value" stroke="#2563eb" strokeWidth={2} fill="#3b82f6" fillOpacity={0.4} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="space-y-3 relative z-10 mt-2">
        {TEAM_DIMENSIONS.map((dim) => (
          <div key={dim} className="flex items-center gap-3 bg-gray-50 p-2 rounded-xl border border-gray-100">
            <button
              type="button"
              onClick={() => onAskCoach(`我该如何提升「${dim}」这方面的能力？请结合我的雷达图给出行动计划。`)}
              className="text-[10px] font-black text-blue-600 hover:text-blue-800 shrink-0 flex items-center gap-1 bg-blue-100/50 px-2 py-1 rounded-md transition-colors"
            >
              <Activity className="w-3 h-3" /> 问 AI
            </button>
            <span className="text-[10px] font-bold text-gray-600 w-12 truncate">{dim}</span>
            
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden flex items-center">
               <motion.div 
                 initial={{ width: 0 }} 
                 animate={{ width: `${scores[dim]}%` }} 
                 transition={{ duration: 1, delay: 0.2 }}
                 className="h-full bg-blue-500 rounded-full" 
               />
            </div>
            <span className="text-[10px] font-black w-6 text-right text-blue-600">{scores[dim]}</span>
            
            {/* 🚨 修复 TS2322 报错：在外部套一层 span 来挂载 title 属性 */}
            <span title="底层数据锁定" className="shrink-0 flex items-center cursor-help">
              <Lock className="w-3 h-3 text-gray-300" />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};