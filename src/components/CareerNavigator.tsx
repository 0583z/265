import React, { useEffect, useMemo, useState } from 'react';
import { Brain, Briefcase, Network, Save, Sparkles, Target } from 'lucide-react';
import { toast } from 'sonner';
import { type Competition } from '../data';
import { useAuth } from '../context/AuthContext';
import { fetchRecentFocusSessions, type FocusSessionRow } from '../lib/supabaseClient';

type CareerNode = {
  role: string;
  skills: string[];
  reason: string;
};

type GraphInsight = {
  id: string;
  title: string;
  competition: string;
  role: string;
  reason: string;
};

const ROLE_GRAPH: CareerNode[] = [
  { role: '量化交易工程师', skills: ['C++', '算法', '数学建模', '优化'], reason: '高性能计算与策略优化能力高度匹配。' },
  { role: '后端架构师', skills: ['C++', '系统设计', '算法', '分布式'], reason: '偏底层与服务稳定性能力贴近后端架构岗位。' },
  { role: '算法工程师', skills: ['Python', '算法', '机器学习', '数学'], reason: '从竞赛算法迁移到模型研发成本更低。' },
  { role: '安全工程师', skills: ['CTF', '加密算法', '渗透测试', '网络'], reason: '攻防实战能力可直接映射安全岗位。' },
  { role: '前端工程师', skills: ['Web', 'UI', '交互设计', 'JavaScript'], reason: '作品呈现与交互实现能力可快速转化。' },
];

const extractSkillTags = (comp: any): string[] => {
  const tags = Array.isArray(comp.techStack) ? comp.techStack : [];
  const extTags = Array.isArray(comp.tags) ? comp.tags : [];
  if (tags.length + extTags.length > 0) return [...tags, ...extTags];
  const name = String(comp.name || '');
  const bag: string[] = [];
  if (name.includes('蓝桥杯')) bag.push('C++', '算法');
  if (name.includes('数学建模')) bag.push('数学建模', '优化', 'Python');
  if (name.includes('信息安全')) bag.push('CTF', '加密算法');
  if (name.includes('计算机设计')) bag.push('Web', 'UI');
  return bag.length > 0 ? bag : ['通用工程能力'];
};

export const CareerNavigator: React.FC<{ competitions: Competition[] }> = ({ competitions }) => {
  const { user } = useAuth();
  const [focusRows, setFocusRows] = useState<FocusSessionRow[]>([]);
  const [memoPool, setMemoPool] = useState<GraphInsight[]>([]);
  const [activePanel, setActivePanel] = useState<'graph' | 'memo' | 'action'>('graph');

  useEffect(() => {
    const load = async () => {
      if (!user?.id) {
        setFocusRows([]);
        return;
      }
      const rows = await fetchRecentFocusSessions(user.id, 180).catch(() => []);
      setFocusRows(rows);
    };
    load();
  }, [user?.id]);

  const statCards = useMemo(() => {
    if (focusRows.length === 0) {
      return [
        { label: '高频打卡技术栈', value: '暂无数据', ratio: 0 },
        { label: '平均日专注时长', value: '-- 分钟', ratio: 0 },
        { label: '双栈能力占比', value: '--%', ratio: 0 },
      ];
    }

    const categoryMap: Record<string, number> = {};
    let total = 0;
    const dayMinutes: Record<string, number> = {};
    const dayCats: Record<string, Set<string>> = {};

    focusRows.forEach((row) => {
      const minutes = Number(row.duration_minutes) || 0;
      total += minutes;
      const cat = row.category || '综合';
      categoryMap[cat] = (categoryMap[cat] || 0) + minutes;
      const day = row.session_date || (row.created_at ? row.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10));
      dayMinutes[day] = (dayMinutes[day] || 0) + minutes;
      if (!dayCats[day]) dayCats[day] = new Set<string>();
      dayCats[day].add(cat);
    });

    const topCats = Object.entries(categoryMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([k]) => k)
      .join(' / ');
    const days = Object.keys(dayMinutes).length || 1;
    const avgDaily = Math.round(total / days);
    const dualDays = Object.values(dayCats).filter((set) => set.size >= 2).length;
    const dualRate = Math.round((dualDays / days) * 100);

    return [
      { label: '高频打卡技术栈', value: topCats || '暂无数据', ratio: Math.min(1, (Object.values(categoryMap).sort((a, b) => b - a)[0] || 0) / Math.max(total, 1)) },
      { label: '平均日专注时长', value: `${avgDaily} 分钟`, ratio: Math.min(1, avgDaily / 240) },
      { label: '双栈能力占比', value: `${dualRate}%`, ratio: dualRate / 100 },
    ];
  }, [focusRows]);

  const topGraphMatches = useMemo(() => {
    const insights: GraphInsight[] = [];
    competitions.slice(0, 8).forEach((comp) => {
      const tags = extractSkillTags(comp);
      const bestMatch = ROLE_GRAPH
        .map((node) => ({
          node,
          score: node.skills.filter((skill) => tags.some((tag) => tag.toLowerCase().includes(skill.toLowerCase()))).length,
        }))
        .sort((a, b) => b.score - a.score)[0];

      if (!bestMatch || bestMatch.score === 0) return;
      insights.push({
        id: `${comp.id}-${bestMatch.node.role}`,
        title: `${comp.name} -> ${bestMatch.node.role}`,
        competition: comp.name,
        role: bestMatch.node.role,
        reason: bestMatch.node.reason,
      });
    });
    if (insights.length > 0) return insights.slice(0, 6);
    return competitions.slice(0, 3).map((comp, idx) => ({
      id: `fallback-${comp.id}-${idx}`,
      title: `${comp.name} -> 算法/工程复合岗位`,
      competition: comp.name,
      role: '算法工程师',
      reason: '该赛事体现了工程实现与问题求解能力，可先映射到算法工程岗位。',
    }));
  }, [competitions]);

  const saveInsight = (item: GraphInsight) => {
    if (memoPool.some((it) => it.id === item.id)) {
      toast.info('该建议已存入图谱');
      return;
    }
    setMemoPool((prev) => [item, ...prev]);
    toast.success('已存入你的职业图谱资产');
  };

  return (
    <div className="bg-white/70 backdrop-blur-md p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
            <Target className="w-7 h-7 text-blue-600" />
            职业转化导航
          </h2>
          <p className="text-sm font-bold text-gray-400 mt-2">竞赛成绩不只看排名，更直接映射到岗位机会。</p>
        </div>
        <span className="text-[10px] px-3 py-2 rounded-xl bg-blue-50 text-blue-600 font-black uppercase tracking-widest">
          Job Conversion
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {statCards.map((item) => (
          <div key={item.label} className="rounded-3xl border border-blue-100 bg-blue-50/40 p-5">
            <div className="text-xs font-black text-blue-600 uppercase tracking-wider">{item.label}</div>
            <div className="text-lg font-black mt-2 text-gray-900">{item.value}</div>
            <div className="mt-4 h-2 rounded-full bg-white overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.round(item.ratio * 100)}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setActivePanel('graph')}
          className={`px-4 py-2 rounded-xl text-xs font-black border transition-all ${activePanel === 'graph' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-white text-gray-500 border-gray-200 hover:border-emerald-200'}`}
        >
          岗位推荐知识图谱
        </button>
        <button
          onClick={() => setActivePanel('memo')}
          className={`px-4 py-2 rounded-xl text-xs font-black border transition-all ${activePanel === 'memo' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white text-gray-500 border-gray-200 hover:border-blue-200'}`}
        >
          AI 建议灵感库
        </button>
        <button
          onClick={() => setActivePanel('action')}
          className={`px-4 py-2 rounded-xl text-xs font-black border transition-all ${activePanel === 'action' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-white text-gray-500 border-gray-200 hover:border-amber-200'}`}
        >
          职业动作清单
        </button>
      </div>

      {activePanel === 'graph' && (
        <div className="rounded-[28px] border border-gray-100 p-6 bg-white">
          <h3 className="text-lg font-black text-gray-900 flex items-center gap-2 mb-4">
            <Network className="w-5 h-5 text-emerald-500" />
            竞赛技能 {'->'} 岗位图谱推荐
          </h3>
          <div className="space-y-4">
            {topGraphMatches.map((item) => (
              <div key={item.id} className="rounded-2xl border border-gray-100 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <div className="font-black text-gray-900">{item.title}</div>
                  <p className="text-xs font-bold text-gray-500 mt-1">{item.reason}</p>
                </div>
                <button
                  onClick={() => saveInsight(item)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-black border border-emerald-100 hover:bg-emerald-100 transition-all"
                >
                  <Save className="w-4 h-4" />
                  存入图谱
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activePanel === 'memo' && (
        <div className="rounded-3xl border border-gray-100 p-6 bg-zinc-950 text-zinc-100">
          <h3 className="font-black flex items-center gap-2">
            <Brain className="w-5 h-5 text-blue-400" />
            AI 建议灵感库
          </h3>
          <p className="text-xs text-zinc-400 font-bold mt-2">点击“存入图谱”后，建议会固化为你的个人职业资产。</p>
          <div className="mt-4 space-y-3">
            {memoPool.length === 0 ? (
              <div className="text-xs text-zinc-500 font-bold">还没有资产，先从上方岗位推荐存一条吧。</div>
            ) : (
              memoPool.map((item) => (
                <div key={item.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                  <div className="text-sm font-black">{item.role}</div>
                  <p className="text-xs text-zinc-400 mt-1">{item.reason}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activePanel === 'action' && (
        <div className="rounded-3xl border border-amber-100 p-6 bg-amber-50/40">
          <h3 className="font-black flex items-center gap-2 text-gray-900">
            <Briefcase className="w-5 h-5 text-amber-600" />
            就业导向动作清单
          </h3>
          <div className="mt-4 space-y-3 text-sm font-bold text-gray-600">
            <div className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-amber-600" /> 先补齐你最弱的一项岗位核心技能。</div>
            <div className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-amber-600" /> 每周至少一次“竞赛成果 {'->'} 项目复盘”归档。</div>
            <div className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-amber-600" /> 把图谱资产同步到简历的“项目能力证明”。</div>
          </div>
        </div>
      )}
    </div>
  );
};
