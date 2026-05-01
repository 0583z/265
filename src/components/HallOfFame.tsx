import React, { useState } from 'react';
import { Target, ShieldCheck, Flame, BookOpen, Lock, Globe, ChevronRight, Zap, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// 🚨 接收外部传来的实时 honors 数据
interface Props {
  honors?: any[];
  onOpenAddAward: (mode: 'private' | 'public') => void;
}

export const HallOfFame: React.FC<Props> = ({ honors = [], onOpenAddAward }) => {
  const [viewMode, setViewMode] = useState<'private' | 'public'>('private');
  const [progress] = useState({ xiaomi: 82, neo: 65 });

  // 🚨 核心逻辑：精准过滤，秒级联动
  const displayedAchievements = honors.filter(award =>
    viewMode === 'private' ? award.is_public === false : award.is_public === true
  );

  return (
    <div className="space-y-10 max-w-7xl mx-auto p-4 animate-in fade-in duration-1000">
      <div className="border-b border-gray-200 pb-8 flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-black text-gray-900 italic tracking-tighter flex items-center gap-3">
            <Target className="w-10 h-10 text-blue-600" /> 竞赛情报站
          </h2>
          <p className="text-xs font-bold text-gray-500 mt-2 uppercase tracking-widest flex items-center gap-2">
            Competitive Intelligence Station 3.0
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* 看板 */}
        <div className="lg:col-span-7 bg-gray-400/80 rounded-[2.5rem] border border-gray-200 p-8 relative overflow-hidden group">
          <div className="absolute -top-10 -right-10 opacity-20 group-hover:opacity-40 transition-all"><Flame className="w-48 h-48 text-orange-500" /></div>
          <h3 className="text-xl font-black text-white flex items-center gap-2 mb-8 drop-shadow-sm">实战备赛看板</h3>
          <div className="space-y-8 relative z-10">
            <div className="space-y-3">
              <div className="flex justify-between items-end"><span className="text-sm font-black text-white drop-shadow-sm">Xiaomi Notes 源码深度拆解</span><span className="text-xs font-mono text-blue-500 font-black">{progress.xiaomi}%</span></div>
              <div className="h-3 bg-gray-800 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${progress.xiaomi}%` }} className="h-full bg-blue-600 shadow-[0_0_15px_rgba(59,130,246,0.5)]" /></div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-end"><span className="text-sm font-black text-white drop-shadow-sm">Neo-Design 合规逻辑系统 (C++)</span><span className="text-xs font-mono text-orange-500 font-black">{progress.neo}%</span></div>
              <div className="h-3 bg-gray-800 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${progress.neo}%` }} className="h-full bg-orange-600 shadow-[0_0_15px_rgba(249,115,22,0.5)]" /></div>
            </div>
          </div>
        </div>

        {/* 资源猎场 */}
        <div className="lg:col-span-5 bg-gradient-to-br from-gray-800 to-gray-900 rounded-[2.5rem] border border-gray-700 p-8">
          <h3 className="text-xl font-black text-white flex items-center gap-2 mb-6 tracking-tight">资源猎场</h3>
          <div className="space-y-4">
            <button onClick={() => window.open('https://cspro.org/', '_blank')} className="w-full p-5 bg-gray-900/80 border border-gray-700 rounded-2xl flex items-center justify-between group hover:border-blue-500 transition-all">
              <div className="flex items-center gap-4"><Zap className="w-5 h-5 text-blue-500" /><span className="text-xs font-black text-gray-300">CCF CSP 官方练习系统</span></div>
              <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-blue-500" />
            </button>
            <button onClick={() => window.open('https://github.com/topics/ccf-csp', '_blank')} className="w-full p-5 bg-gray-900/80 border border-gray-700 rounded-2xl flex items-center justify-between group hover:border-emerald-500 transition-all">
              <div className="flex items-center gap-4"><BookOpen className="w-5 h-5 text-emerald-500" /><span className="text-xs font-black text-gray-300">GitHub 竞赛精品复盘库</span></div>
              <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-emerald-500" />
            </button>
          </div>
        </div>

        {/* 录入引导区 */}
        <div className="lg:col-span-12 bg-white rounded-[3.5rem] border border-gray-100 p-12 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-xl text-center lg:text-left">
            <h3 className="text-2xl font-black text-gray-900 flex items-center gap-3"><ShieldCheck className="w-8 h-8 text-emerald-600" /> 成果确权档案录入</h3>
            <p className="text-sm font-bold text-gray-400">私人存档用于面试背书，免审锁定；全网公开用于极客交流，审核共赏。</p>
            <Button onClick={() => onOpenAddAward('private')} className="bg-gray-900 text-white font-black px-10 h-14 rounded-2xl uppercase hover:bg-black transition-colors">立即收录我的成果</Button>
          </div>
          <div className="flex gap-4">
            <div onClick={() => onOpenAddAward('private')} className="p-8 bg-white border-2 border-gray-100 rounded-[2.5rem] shadow-xl w-44 text-center cursor-pointer hover:border-blue-500 transition-all"><Lock className="w-8 h-8 text-blue-500 mx-auto mb-2" /><p className="font-black text-xs text-gray-900">私人存证</p></div>
            <div onClick={() => onOpenAddAward('public')} className="p-8 bg-emerald-600 rounded-[2.5rem] shadow-xl w-44 text-center cursor-pointer hover:bg-emerald-700 transition-all text-white"><Globe className="w-8 h-8 mx-auto mb-2" /><p className="font-black text-xs">面向全网</p></div>
          </div>
        </div>

        {/* 成就展示中心 */}
        <div className="lg:col-span-12 space-y-6 pt-10">
          <div className="flex items-center justify-end border-b border-gray-200 pb-4">
            <div className="flex bg-gray-900 p-1 rounded-xl">
              <button onClick={() => setViewMode('private')} className={`px-6 py-2 rounded-lg text-xs font-black transition-all ${viewMode === 'private' ? 'bg-gray-800 text-blue-400 shadow-sm' : 'text-gray-400'}`}>我的私人存档</button>
              <button onClick={() => setViewMode('public')} className={`px-6 py-2 rounded-lg text-xs font-black transition-all ${viewMode === 'public' ? 'bg-gray-800 text-emerald-400 shadow-sm' : 'text-gray-400'}`}>公共荣誉榜</button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedAchievements.length > 0 ? displayedAchievements.map((award, index) => (
              // 💡 修复点：使用 award.id || index 兜底，防止数据库没建 id 列导致渲染崩溃
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} key={award.id || index} className="p-6 bg-white border-2 border-gray-100 rounded-[2rem] hover:border-blue-500 hover:shadow-xl transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <Badge className={`border-none font-black px-3 py-1 rounded-full text-[9px] ${award.is_public ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                    {award.is_public ? '🌐 PUBLIC' : '🔒 PRIVATE'}
                  </Badge>
                  {/* 💡 修复点：如果数据库没建 created_at，默认显示'已确权' */}
                  <span className="text-gray-400 text-[10px] font-mono">{award.created_at ? award.created_at.split('T')[0] : '已确权'}</span>
                </div>
                <h4 className="text-lg font-black text-gray-900 mb-2 leading-tight">{award.competition_name}</h4>
                <p className="text-xs font-bold text-gray-500 flex items-center gap-1 uppercase tracking-widest"><Trophy className="w-3 h-3 text-yellow-500" /> {award.award_level}</p>
                {award.github_url && (
                  <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center cursor-pointer" onClick={() => window.open(award.github_url, '_blank')}>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest group-hover:text-blue-500 transition-colors">Git Verified</span>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                  </div>
                )}
              </motion.div>
            )) : (
              <div className="lg:col-span-3 py-20 text-center border-2 border-dashed border-gray-300 rounded-[3rem]">
                <p className="text-gray-400 font-bold italic tracking-widest">档案馆暂时空空如也，期待您的首份确权成果</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};