import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { fetchUserSkills, upsertUserSkill, type UserSkillRow } from '@/src/lib/supabaseClient';
import { TEAM_DIMENSIONS } from '@/src/lib/vectorMatch';

type Props = {
  userId: string | undefined;
  onAskCoach: (question: string) => void;
};

const defaults = (): Record<string, number> =>
  Object.fromEntries(TEAM_DIMENSIONS.map((d) => [d, 55])) as Record<string, number>;

export const CompetencyRadar: React.FC<Props> = ({ userId, onAskCoach }) => {
  const [scores, setScores] = useState<Record<string, number>>(defaults());
  const [loading, setLoading] = useState(false);

  const chartData = useMemo(
    () => TEAM_DIMENSIONS.map((dim) => ({ subject: dim, value: scores[dim] ?? 50, fullMark: 100 })),
    [scores],
  );

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const rows = await fetchUserSkills(userId);
      const next = defaults();
      for (const r of rows) {
        const dim = TEAM_DIMENSIONS.find((d) => r.skill_name === d || r.skill_name.includes(d));
        if (dim) next[dim] = Number(r.skill_score);
      }
      setScores(next);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const saveRadar = async () => {
    if (!userId) {
      toast.error('请先登录');
      return;
    }
    try {
      for (const dim of TEAM_DIMENSIONS) {
        await upsertUserSkill(userId, {
          skill_name: dim,
          skill_score: scores[dim] ?? 50,
          weight: 1,
        });
      }
      toast.success('雷达已同步到 Supabase (user_skills)');
    } catch (e: any) {
      toast.error(e?.message || '保存失败');
    }
  };

  const handleDimClick = (dim: string) => {
    onAskCoach(`我该如何提升「${dim}」这方面的能力？请结合我的雷达图给出四周行动计划。`);
  };

  return (
    <div className="rounded-[28px] border-2 border-gray-900 bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-500">
          <Target className="w-4 h-4" />
          CompetencyRadar
        </div>
        <Button size="sm" className="rounded-lg font-black text-xs h-8" onClick={() => void saveRadar()}>
          保存雷达
        </Button>
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
            <PolarGrid stroke="#e5e7eb" />
            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fontWeight: 800 }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
            <Radar name="能力" dataKey="value" stroke="#2563eb" fill="#3b82f6" fillOpacity={0.35} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {TEAM_DIMENSIONS.map((dim) => (
          <div key={dim} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleDimClick(dim)}
              className="text-[11px] font-black text-blue-600 underline-offset-2 hover:underline shrink-0"
            >
              问 AI
            </button>
            <input
              type="range"
              min={10}
              max={100}
              value={scores[dim] ?? 50}
              onChange={(e) => setScores((s) => ({ ...s, [dim]: Number(e.target.value) }))}
              className="flex-1 accent-blue-600"
            />
            <span className="text-xs font-black w-8 text-right">{scores[dim]}</span>
          </div>
        ))}
      </div>
      {loading && <p className="text-[10px] font-bold text-gray-400">正在同步云端雷达…</p>}
    </div>
  );
};
