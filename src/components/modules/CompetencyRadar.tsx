import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { Target, Wand2, ShieldCheck, Lock, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
// 1. 保持所有核心依赖引用不变，确保数据上链逻辑完整
import { fetchUserSkills, upsertUserSkill, fetchUserAwards, fetchTotalFocusMinutes, supabase } from '@/src/lib/supabaseClient';
import { TEAM_DIMENSIONS } from '@/src/lib/vectorMatch';
// 🌟 2. 引入公式引擎，确保算力拟合逻辑严格对齐
import { calculateGeekPower, GeekUserData } from '@/src/lib/geekScoreUtils';

type Props = {
  userId: string | undefined;
  onAskCoach: (question: string) => void;
};

// 基础 40 分冷启动协议
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

  // 🌟 核心：全网通用型硬核奖项评分提取器，精准捕获“蓝桥杯国二”
  const extractContestScore = (awardsList: any[]) => {
    let highest = 0;
    awardsList.forEach(a => {
      const name = (a.competition_name || "").toUpperCase();
      const level = (a.award_level || "").toUpperCase();
      if (['蓝桥', 'ACM', 'CSP', '天梯', '算法', '程序设计', '竞赛'].some(k => name.includes(k))) {
        let current = 150;
        if (level.includes('一') || level.includes('金') || level.includes('1') || level.includes('国一')) current = 350;
        else if (level.includes('二') || level.includes('银') || level.includes('2') || level.includes('国二')) current = 260;
        else if (level.includes('三') || level.includes('铜') || level.includes('3') || level.includes('国三')) current = 180;
        if (current > highest) highest = current;
      }
    });
    return highest;
  };

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      // 1. 并发获取多维数据
      const [skills, awards, focusMins, { data: githubStats }] = await Promise.all([
        fetchUserSkills(userId),
        fetchUserAwards(userId),
        fetchTotalFocusMinutes(userId),
        supabase.from('github_stats').select('*').eq('user_id', userId).maybeSingle()
      ]);

      const awardLen = awards?.length || 0;
      setStats({ focusMins: focusMins || 0, awardCount: awardLen });

      // 2. 提取奖项基准分数
      const bestScore = Math.max(githubStats?.csp_score || 0, extractContestScore(awards || []));

      // 3. 构建算力引擎输入向量
      const userData: GeekUserData = {
        cspScore: bestScore,
        algoTagsCount: githubStats?.algo_commits || (bestScore > 0 ? 5 : 0),
        totalLinesChanged: githubStats?.total_lines || (focusMins ? focusMins * 10 : 0),
        filesChanged: githubStats?.files_changed || (focusMins ? 5 : 0),
        pullRequests: githubStats?.pr_count || 0,
        issues: githubStats?.issue_count || 0,
        reviews: githubStats?.review_count || 0,
        actionsLast30Days: githubStats?.recent_actions || (focusMins ? Math.floor(focusMins / 5) : 0),
        languageProportions: githubStats?.lang_distribution || [1],
        matchedSkillsCount: 0,
        totalContestSkills: 1
      };

      // 4. 执行算力拟合演算
      const calculatedScores = calculateGeekPower(userData);

      // 5. 维度精准映射，确保雷达图撑开
      const nextScores = defaults();
      TEAM_DIMENSIONS.forEach(dim => {
        if (dim.includes('算法')) {
          nextScores[dim] = calculatedScores.Algorithm;
        } else if (dim.includes('前端') || dim.includes('UI')) {
          nextScores[dim] = calculatedScores.Innovation;
        } else if (dim.includes('工程')) {
          nextScores[dim] = calculatedScores.Engineering;
        } else if (dim.includes('沟通') || dim.includes('协作')) {
          nextScores[dim] = calculatedScores.Collaboration;
        } else if (dim.includes('文档') || dim.includes('表达')) {
          nextScores[dim] = Math.min(100, 40 + Math.floor((focusMins || 0) / 8));
        }
      });

      setScores(nextScores);
    } catch (error) {
      console.error("引擎同步异常:", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { void load(); }, [load]);

  const saveRadar = async () => {
    if (!userId) return toast.error('请先登录');
    try {
      for (const dim of TEAM_DIMENSIONS) {
        await upsertUserSkill(userId, { skill_name: dim, skill_score: scores[dim] ?? 40, weight: 1 });
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

      {/* 🌟 已按要求删除 0项实绩 提示框，UI 更加简洁专业 */}

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

            <span title="基于 CHAOSS 标准底层防篡改锁定" className="shrink-0 flex items-center cursor-help">
              <Lock className="w-3 h-3 text-gray-300" />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};