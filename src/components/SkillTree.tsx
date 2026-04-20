import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Code, PenTool, Network } from 'lucide-react';
import { type FocusSessionRow } from '../lib/supabaseClient';

interface SkillTreeProps {
  focusSessions?: FocusSessionRow[];
  streakDays?: number;
  userId?: string; 
  growth?: any;
}

const SKILL_NODES = [
  { id: 'dev', label: '基础开发', icon: Code, x: 50, y: 80, category: '开发', maxExp: 500 },
  { id: 'uiux', label: 'UI/UX', icon: PenTool, x: 20, y: 40, category: 'UI', maxExp: 300 },
  { id: 'algo', label: '算法逻辑', icon: Trophy, x: 80, y: 40, category: '算法', maxExp: 600 },
  { id: 'arch', label: '系统架构', icon: Network, x: 50, y: 10, category: '架构', maxExp: 800 },
];

const SKILL_PATHS = [{s:'dev',t:'uiux'}, {s:'dev',t:'algo'}, {s:'algo',t:'arch'}, {s:'uiux',t:'arch'}];

export const SkillTree: React.FC<SkillTreeProps> = ({ focusSessions = [], streakDays = 1 }) => {
  const expData = useMemo(() => {
    const map: Record<string, number> = { 开发: 0, UI: 0, 算法: 0, 架构: 0, 综合: 0 };
    focusSessions.forEach(s => {
      const earned = Math.round((s.duration_minutes || 0) * 1.2 * (1 + 0.1 * streakDays));
      const cat = s.category || '综合';
      if (map[cat] !== undefined) map[cat] += earned;
    });
    return map;
  }, [focusSessions, streakDays]);

  return (
    <div className="relative w-full h-full min-h-[360px] flex items-center justify-center overflow-hidden">
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
        {SKILL_PATHS.map((p, i) => {
          const s = SKILL_NODES.find(n => n.id === p.s)!;
          const t = SKILL_NODES.find(n => n.id === p.t)!;
          const active = expData[s.category] > 20 && expData[t.category] > 20;
          return (
            <motion.line key={i} x1={`${s.x}%`} y1={`${s.y}%`} x2={`${t.x}%`} y2={`${t.y}%`}
              stroke={active ? '#10B981' : '#3F3F46'} strokeWidth={active ? 2 : 1}
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
            />
          );
        })}
      </svg>
      {SKILL_NODES.map((node) => {
        const exp = expData[node.category] || 0;
        const progress = Math.min((exp / node.maxExp) * 100, 100);
        return (
          <div key={node.id} className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center" style={{ left: `${node.x}%`, top: `${node.y}%` }}>
            <div className={`w-11 h-11 rounded-2xl border-2 flex items-center justify-center bg-zinc-900 z-10 transition-all ${exp > 0 ? 'border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : 'border-zinc-800'}`}>
              <node.icon className={`w-5 h-5 ${exp > 0 ? 'text-emerald-400' : 'text-zinc-700'}`} />
              <svg className="absolute -inset-2 w-15 h-15 -rotate-90">
                <circle cx="30" cy="30" r="26" fill="none" stroke="#10B981" strokeWidth="2" strokeDasharray="163" strokeDashoffset={163 - (163 * progress) / 100} className="transition-all duration-1000" />
              </svg>
            </div>
            <span className="mt-5 text-[9px] font-black text-white italic tracking-tighter">{node.label}</span>
            <span className="text-[8px] text-zinc-600 font-bold">{exp} EXP</span>
          </div>
        );
      })}
    </div>
  );
};