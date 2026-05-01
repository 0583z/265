import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { differenceInDays, parseISO, subDays, format } from 'date-fns';
import { Search, Clock, Trophy, Code, BookOpen, Atom, ArrowRight, Bell, BellRing, BookmarkCheck, Filter, AlertCircle, CalendarClock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const COMPETITIONS = [
  { id: '1', name: 'CCF CSP 计算机能力认证', category: '工科与IT', level: '国家级', deadline: '2026-03-29', tags: ['算法', 'C++'], icon: Code },
  { id: '21', name: '全国大学生数学建模竞赛', category: '理科基础', level: '国家级', deadline: '2026-09-10', tags: ['数学'], icon: Atom },
  { id: '41', name: '“挑战杯”大学生课外学术竞赛', category: '文商与社科', level: '国家级', deadline: '2026-05-30', tags: ['创新'], icon: BookOpen },
];

const CATEGORIES = ['全部', '工科与IT', '理科基础', '文商与社科'];
const STATUS_FILTERS = ['全部状态', '报名中', '已截止'];

export interface CompetitionListProps {
  competitions?: any[];
  subscribedIds?: string[];
  onToggleSubscription?: (id: string, name: string) => void;
  onItemClick?: (comp: any) => void;
  theme?: 'light' | 'dark'; // 🚨 核心：接收 App.tsx 传下来的主题
}

export const CompetitionList: React.FC<CompetitionListProps> = ({
  competitions: externalComps,
  subscribedIds = [],
  onToggleSubscription,
  onItemClick,
  theme = 'light'
}) => {
  const [activeCategory, setActiveCategory] = useState('全部');
  const [activeStatus, setActiveStatus] = useState('全部状态');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSubscribedOnly, setShowSubscribedOnly] = useState(false);

  const [subModalOpen, setSubModalOpen] = useState(false);
  const [selectedCompForSub, setSelectedCompForSub] = useState<any>(null);
  const [customReminders, setCustomReminders] = useState<Record<string, string>>({});

  useEffect(() => {
    setCustomReminders(JSON.parse(localStorage.getItem('geek_custom_reminders') || '{}'));
  }, []);

  const isDark = theme === 'dark';
  const sourceData = externalComps && externalComps.length > 0 ? externalComps : COMPETITIONS;

  const filteredCompetitions = useMemo(() => {
    return sourceData.filter(comp => {
      let matchCat = activeCategory === '全部';
      if (!matchCat) {
        const cCat = (comp.category || '').toLowerCase();
        const aCat = activeCategory.toLowerCase();
        const mapping: Record<string, string[]> = {
          '工科与it': ['工科', 'it', '计算机', '软件', '电子', '工程', '技术', '程序', '算法'],
          '理科基础': ['理科', '数学', '物理', '化学', '生物', '地理', '基础'],
          '文商与社科': ['文科', '商科', '艺术', '设计', '文商', '社科', '管理', '英语', '翻译']
        };
        const keywords = mapping[aCat] || [];
        matchCat = keywords.some(k => cCat.includes(k)) || cCat.includes(aCat.substring(0, 2));
      }
      const matchSearch = comp.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchSub = showSubscribedOnly ? subscribedIds.includes(comp.id) : true;
      let matchStatus = true;
      if (activeStatus !== '全部状态') {
        const days = differenceInDays(parseISO(comp.deadline || new Date().toISOString()), new Date());
        const isExpired = days < 0;
        if (activeStatus === '报名中') matchStatus = !isExpired;
        if (activeStatus === '已截止') matchStatus = isExpired;
      }
      return matchCat && matchSearch && matchSub && matchStatus;
    }).sort((a, b) => new Date(a.deadline || 0).getTime() - new Date(b.deadline || 0).getTime());
  }, [sourceData, activeCategory, activeStatus, searchQuery, showSubscribedOnly, subscribedIds]);

  const getUrgency = (deadline: string) => {
    if (!deadline) return { text: '未知', color: isDark ? 'text-zinc-500' : 'text-slate-400' };
    const days = differenceInDays(parseISO(deadline), new Date());
    if (days < 0) return { text: '已截止', color: isDark ? 'text-zinc-600' : 'text-slate-500' };
    return { text: `剩 ${days} 天`, color: days <= 7 ? 'text-rose-500 font-black' : 'text-emerald-500 font-black' };
  };

  const handleBellClick = (comp: any) => {
    if (subscribedIds.includes(comp.id)) {
      onToggleSubscription?.(comp.id, comp.name);
      const newRems = { ...customReminders };
      delete newRems[comp.id];
      setCustomReminders(newRems);
      localStorage.setItem('geek_custom_reminders', JSON.stringify(newRems));
    } else {
      setSelectedCompForSub(comp);
      setSubModalOpen(true);
    }
  };

  const confirmSubscription = (daysOffset: number) => {
    if (!selectedCompForSub) return;
    const comp = selectedCompForSub;
    if (daysOffset > 0 && comp.deadline) {
      const targetDate = subDays(parseISO(comp.deadline), daysOffset);
      const formattedDate = format(targetDate, 'yyyy-MM-dd');
      const newRems = { ...customReminders, [comp.id]: formattedDate };
      setCustomReminders(newRems);
      localStorage.setItem('geek_custom_reminders', JSON.stringify(newRems));
    }
    onToggleSubscription?.(comp.id, comp.name);
    setSubModalOpen(false);
    setSelectedCompForSub(null);
  };

  return (
    // 🚨 容器背景适配图一
    <div className={`transition-colors duration-300 p-8 rounded-[40px] border shadow-sm relative ${isDark ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white/50 backdrop-blur-md border-gray-100'}`}>
      <div className="space-y-6">
        {/* 搜索框适配 */}
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索各大赛事..."
            className={`w-full border-2 rounded-2xl py-4 pl-12 pr-4 font-bold outline-none transition-all shadow-sm 
              ${isDark ? 'bg-zinc-900 border-zinc-800 text-white focus:border-blue-500 placeholder:text-zinc-600' : 'bg-white border-slate-100 text-slate-900 focus:border-blue-500'}`}
          />
        </div>

        {/* 分类按钮适配 */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="flex flex-wrap gap-3">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-6 py-3.5 rounded-2xl border-2 font-black text-xs uppercase tracking-widest transition-all 
                  ${activeCategory === cat
                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200'
                    : isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700' : 'bg-white border-slate-100 text-slate-500 hover:border-blue-200'}`}
              >
                {cat}
              </button>
            ))}
          </div>
          <button onClick={() => setShowSubscribedOnly(!showSubscribedOnly)} className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl border-2 font-black text-xs transition-colors ${showSubscribedOnly ? 'bg-rose-50 border-rose-500 text-rose-600' : isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-500' : 'bg-white border-slate-100 text-slate-400'}`}>
            <BookmarkCheck className="w-4 h-4" /> 仅看订阅 ({subscribedIds.length})
          </button>
        </div>

        {/* 状态筛选适配 */}
        <div className="flex items-center gap-3 pt-2">
          <Filter className="w-4 h-4 text-slate-400" />
          {STATUS_FILTERS.map(status => (
            <button
              key={status}
              onClick={() => setActiveStatus(status)}
              className={`px-4 py-1.5 rounded-full font-bold text-[11px] transition-all 
                  ${activeStatus === status
                  ? 'bg-blue-600 text-white'
                  : isDark ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* 🚨 比赛卡片适配 - 解决图一核心问题 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-4">
          <AnimatePresence>
            {filteredCompetitions.map((comp: any) => {
              const urgency = getUrgency(comp.deadline);
              const Icon = comp.icon || Trophy;
              const isSubbed = subscribedIds.includes(comp.id);
              const customRem = customReminders[comp.id];

              return (
                <motion.div
                  layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} key={comp.id}
                  className={`border rounded-[2.5rem] p-8 shadow-sm transition-all flex flex-col group relative overflow-hidden
                    ${isDark ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-700' : 'bg-white border-slate-100 hover:shadow-xl hover:border-blue-100'}`}
                >
                  <button onClick={() => handleBellClick(comp)} className={`absolute top-8 right-8 p-2.5 rounded-xl transition-all z-10 border shadow-sm ${isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-slate-100 hover:scale-110'}`}>
                    {isSubbed ? <BellRing className="w-5 h-5 text-blue-500 animate-pulse" /> : <Bell className="w-5 h-5 text-slate-300" />}
                  </button>
                  <div className={`p-4 rounded-2xl inline-block mb-6 w-fit group-hover:scale-110 transition-transform ${isDark ? 'bg-zinc-800' : 'bg-blue-50'}`}>
                    <Icon className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className={`text-xl font-black mb-4 line-clamp-2 min-h-[3.5rem] leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>{comp.name}</h3>
                  <div className={`mt-auto pt-6 border-t space-y-4 ${isDark ? 'border-zinc-800' : 'border-gray-50'}`}>

                    <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-wider">
                      <div className={`flex items-center gap-2 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                        <Clock className="w-4 h-4" /> DDL：{comp.deadline ? comp.deadline.split('T')[0] : '待定'}
                      </div>
                      <span className={urgency.color}>{urgency.text}</span>
                    </div>

                    {customRem && (
                      <div className={`flex items-center gap-2 text-[10px] font-bold px-3 py-1.5 rounded-lg w-fit border 
                        ${isDark ? 'bg-amber-950/30 text-amber-500 border-amber-900/50' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                        <CalendarClock className="w-3.5 h-3.5" /> 提醒日：{customRem}
                      </div>
                    )}

                    <Button
                      onClick={() => onItemClick?.(comp)}
                      className={`w-full border-2 font-black rounded-2xl h-12 transition-all shadow-sm mt-2
                        ${isDark
                          ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-blue-600 hover:text-white'
                          : 'bg-gray-50 border-gray-100 text-gray-900 hover:bg-blue-600 hover:text-white hover:border-blue-600'}`}
                    >
                      查看详情 <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* 🚨 订阅弹窗适配 */}
      <AnimatePresence>
        {subModalOpen && selectedCompForSub && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={() => setSubModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
              className={`rounded-[32px] p-8 max-w-sm w-full shadow-2xl border ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-100'}`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ${isDark ? 'bg-zinc-800 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                <BellRing className="w-6 h-6" />
              </div>
              <h3 className={`text-xl font-black mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>订阅此赛事</h3>
              <p className={`text-xs font-bold mb-6 ${isDark ? 'text-zinc-500' : 'text-gray-500'}`}>设置您的冲刺提醒日（官方 DDL 也会同步显示）</p>

              <div className="space-y-3">
                {[
                  { d: 7, label: '提前 1 周 (冲刺准备)', bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500/20' },
                  { d: 3, label: '提前 3 天 (最终复盘)', bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/20' },
                  { d: 0, label: '仅官方 DDL 提醒', bg: 'bg-zinc-500/10', text: 'text-zinc-500', border: 'border-zinc-500/20' }
                ].map((opt) => (
                  <Button
                    key={opt.d}
                    onClick={() => confirmSubscription(opt.d)}
                    className={`w-full h-14 font-black rounded-2xl justify-start px-6 border transition-all hover:scale-[1.02] ${opt.bg} ${opt.text} ${opt.border}`}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};