import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { differenceInDays, format, parseISO } from 'date-fns';
import { Search, Clock, Trophy, Code, BookOpen, Atom, ArrowRight, Bell, BellRing, BookmarkCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

// 本地兜底赛事
export const COMPETITIONS = [
  { id: '1', name: 'CCF CSP 计算机能力认证', category: '工科与IT', level: '国家级', deadline: '2026-03-29', tags: ['算法', 'C++'], icon: Code },
  { id: '21', name: '全国大学生数学建模竞赛', category: '理科基础', level: '国家级', deadline: '2026-09-10', tags: ['数学'], icon: Atom },
  { id: '41', name: '“挑战杯”大学生课外学术竞赛', category: '文商与社科', level: '国家级', deadline: '2026-05-30', tags: ['创新'], icon: BookOpen },
];

const CATEGORIES = ['全部', '工科与IT', '理科基础', '文商与社科'];

export interface CompetitionListProps {
  competitions?: any[];
  subscribedIds?: string[];
  onToggleSubscription?: (id: string, name: string) => void;
  onItemClick?: (comp: any) => void;
}

export const CompetitionList: React.FC<CompetitionListProps> = ({ 
  competitions: externalComps, 
  subscribedIds = [], 
  onToggleSubscription, 
  onItemClick 
}) => {
  const [activeCategory, setActiveCategory] = useState('全部');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSubscribedOnly, setShowSubscribedOnly] = useState(false);

  const sourceData = externalComps && externalComps.length > 0 ? externalComps : COMPETITIONS;

  // 🚨 核心逻辑：极其鲁棒的模糊分类匹配 (解决分类不显示问题)
  const filteredCompetitions = useMemo(() => {
    return sourceData.filter(comp => {
      // 1. 处理分类
      let matchCat = activeCategory === '全部';
      if (!matchCat) {
        const cCat = (comp.category || '').toLowerCase();
        const aCat = activeCategory.toLowerCase();
        
        // 映射逻辑：比如 Supabase 里的 "工科" 应该属于 "工科与IT"
        const mapping: Record<string, string[]> = {
          '工科与it': ['工科', 'it', '计算机', '软件', '电子', '工程', '技术', '程序', '算法'],
          '理科基础': ['理科', '数学', '物理', '化学', '生物', '地理', '基础'],
          '文商与社科': ['文科', '商科', '艺术', '设计', '文商', '社科', '管理', '英语', '翻译']
        };
        
        const keywords = mapping[aCat] || [];
        matchCat = keywords.some(k => cCat.includes(k)) || cCat.includes(aCat.substring(0, 2));
      }

      // 2. 处理搜索
      const matchSearch = comp.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      // 3. 处理订阅过滤
      const matchSub = showSubscribedOnly ? subscribedIds.includes(comp.id) : true;
      
      return matchCat && matchSearch && matchSub;
    }).sort((a, b) => {
      if (!a.deadline || !b.deadline) return 0;
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    });
  }, [sourceData, activeCategory, searchQuery, showSubscribedOnly, subscribedIds]);

  const getUrgency = (deadline: string) => {
    if (!deadline) return { text: '未知', color: 'text-slate-400' };
    const days = differenceInDays(parseISO(deadline), new Date());
    if (days < 0) return { text: '已截止', color: 'text-slate-500' };
    return { text: `剩 ${days} 天`, color: days <= 7 ? 'text-rose-600 font-black' : 'text-emerald-600 font-black' };
  };

  return (
    <div className="bg-white/50 backdrop-blur-md p-8 rounded-[40px] border border-gray-100 shadow-sm">
      <div className="space-y-10">
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="搜索各大赛事..." className="w-full bg-white border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-4 font-bold outline-none focus:border-blue-500 transition-all shadow-sm" />
        </div>

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="flex flex-wrap gap-3">
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-6 py-3.5 rounded-2xl border-2 font-black text-xs uppercase tracking-widest transition-all ${activeCategory === cat ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white border-slate-100 text-slate-500 hover:border-blue-200'}`}>{cat}</button>
            ))}
          </div>
          <button onClick={() => setShowSubscribedOnly(!showSubscribedOnly)} className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl border-2 font-black text-xs ${showSubscribedOnly ? 'bg-rose-50 border-rose-500 text-rose-600' : 'bg-white border-slate-100 text-slate-400'}`}>
            <BookmarkCheck className="w-4 h-4" /> 仅看订阅 ({subscribedIds.length})
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence>
            {filteredCompetitions.map((comp: any) => {
              const urgency = getUrgency(comp.deadline);
              const Icon = comp.icon || Trophy;
              const isSubbed = subscribedIds.includes(comp.id);

              return (
                <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} key={comp.id} className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all flex flex-col group relative">
                  <button onClick={() => onToggleSubscription?.(comp.id, comp.name)} className="absolute top-8 right-8 p-2.5 rounded-xl transition-all z-10 bg-white border border-slate-100 hover:scale-110">
                    {isSubbed ? <BellRing className="w-5 h-5 text-blue-500 animate-pulse" /> : <Bell className="w-5 h-5 text-slate-300" />}
                  </button>
                  <div className="p-4 rounded-2xl bg-blue-50 inline-block mb-6 w-fit group-hover:scale-110 transition-transform"><Icon className="w-8 h-8 text-blue-600" /></div>
                  <h3 className="text-xl font-black text-gray-900 mb-4 line-clamp-2 min-h-[3.5rem] leading-tight">{comp.name}</h3>
                  <div className="mt-auto pt-6 border-t border-gray-50 space-y-6">
                    <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-wider">
                      <div className="flex items-center gap-2 text-slate-400"><Clock className="w-4 h-4" /> {comp.deadline ? comp.deadline.split('T')[0] : '待定'}</div>
                      <span className={urgency.color}>{urgency.text}</span>
                    </div>
                    {/* 🚨 修复：确保按钮点击触发详情跳转 */}
                    <Button 
                      onClick={() => onItemClick?.(comp)} 
                      className="w-full bg-gray-50 border-2 border-gray-100 text-gray-900 font-black rounded-2xl h-14 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shadow-sm"
                    >
                      查看赛事详情 <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
        {filteredCompetitions.length === 0 && (
          <div className="py-20 text-center border-2 border-dashed border-gray-100 rounded-[40px] bg-gray-50/30">
            <Trophy className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 font-bold italic">该分类下暂无匹配赛事，试试切换其他标签？</p>
          </div>
        )}
      </div>
    </div>
  );
};