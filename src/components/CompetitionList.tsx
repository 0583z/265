import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { differenceInDays, parseISO, subDays, format } from 'date-fns';
import { Search, Clock, Trophy, Code, BookOpen, Atom, ArrowRight, Bell, BellRing, BookmarkCheck, Filter, AlertCircle, CalendarClock } from 'lucide-react';
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
}

export const CompetitionList: React.FC<CompetitionListProps> = ({ 
  competitions: externalComps, 
  subscribedIds = [], 
  onToggleSubscription, 
  onItemClick 
}) => {
  const [activeCategory, setActiveCategory] = useState('全部');
  const [activeStatus, setActiveStatus] = useState('全部状态');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSubscribedOnly, setShowSubscribedOnly] = useState(false);

  // 🚨 订阅冲刺弹窗状态
  const [subModalOpen, setSubModalOpen] = useState(false);
  const [selectedCompForSub, setSelectedCompForSub] = useState<any>(null);
  const [customReminders, setCustomReminders] = useState<Record<string, string>>({});

  useEffect(() => {
    setCustomReminders(JSON.parse(localStorage.getItem('geek_custom_reminders') || '{}'));
  }, []);

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
    if (!deadline) return { text: '未知', color: 'text-slate-400' };
    const days = differenceInDays(parseISO(deadline), new Date());
    if (days < 0) return { text: '已截止', color: 'text-slate-500' };
    return { text: `剩 ${days} 天`, color: days <= 7 ? 'text-rose-600 font-black' : 'text-emerald-600 font-black' };
  };

  // 🚨 处理点击铃铛的逻辑
  const handleBellClick = (comp: any) => {
    if (subscribedIds.includes(comp.id)) {
      // 取消订阅
      onToggleSubscription?.(comp.id, comp.name);
      const newRems = { ...customReminders };
      delete newRems[comp.id];
      setCustomReminders(newRems);
      localStorage.setItem('geek_custom_reminders', JSON.stringify(newRems));
    } else {
      // 弹出自定义冲刺选择框
      setSelectedCompForSub(comp);
      setSubModalOpen(true);
    }
  };

  const confirmSubscription = (daysOffset: number) => {
    if (!selectedCompForSub) return;
    const comp = selectedCompForSub;
    
    // 如果选择了提前冲刺，计算自定义日期
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
    <div className="bg-white/50 backdrop-blur-md p-8 rounded-[40px] border border-gray-100 shadow-sm relative">
      <div className="space-y-6">
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

        <div className="flex items-center gap-3 pt-2">
           <Filter className="w-4 h-4 text-slate-400" />
           {STATUS_FILTERS.map(status => (
             <button key={status} onClick={() => setActiveStatus(status)} className={`px-4 py-1.5 rounded-full font-bold text-[11px] transition-all ${activeStatus === status ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
               {status}
             </button>
           ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-4">
          <AnimatePresence>
            {filteredCompetitions.map((comp: any) => {
              const urgency = getUrgency(comp.deadline);
              const Icon = comp.icon || Trophy;
              const isSubbed = subscribedIds.includes(comp.id);
              const customRem = customReminders[comp.id]; // 是否有自定义提醒

              return (
                <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} key={comp.id} className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all flex flex-col group relative overflow-hidden">
                  <button onClick={() => handleBellClick(comp)} className="absolute top-8 right-8 p-2.5 rounded-xl transition-all z-10 bg-white border border-slate-100 hover:scale-110 shadow-sm">
                    {isSubbed ? <BellRing className="w-5 h-5 text-blue-500 animate-pulse" /> : <Bell className="w-5 h-5 text-slate-300" />}
                  </button>
                  <div className="p-4 rounded-2xl bg-blue-50 inline-block mb-6 w-fit group-hover:scale-110 transition-transform"><Icon className="w-8 h-8 text-blue-600" /></div>
                  <h3 className="text-xl font-black text-gray-900 mb-4 line-clamp-2 min-h-[3.5rem] leading-tight">{comp.name}</h3>
                  <div className="mt-auto pt-6 border-t border-gray-50 space-y-4">
                    
                    {/* 官方时间 */}
                    <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-wider">
                      <div className="flex items-center gap-2 text-slate-400"><Clock className="w-4 h-4" /> 官方 DDL：{comp.deadline ? comp.deadline.split('T')[0] : '待定'}</div>
                      <span className={urgency.color}>{urgency.text}</span>
                    </div>

                    {/* 🚨 自定义冲刺时间显示 */}
                    {customRem && (
                      <div className="flex items-center gap-2 text-[10px] font-bold bg-amber-50 text-amber-600 px-3 py-1.5 rounded-lg w-fit border border-amber-100">
                        <CalendarClock className="w-3.5 h-3.5" /> 专属冲刺提醒日：{customRem}
                      </div>
                    )}

                    <Button 
                      onClick={() => onItemClick?.(comp)} 
                      className="w-full bg-gray-50 border-2 border-gray-100 text-gray-900 font-black rounded-2xl h-12 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shadow-sm mt-2"
                    >
                      查看赛事详情 <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* 🚨 自定义订阅时间弹窗 */}
      <AnimatePresence>
        {subModalOpen && selectedCompForSub && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={() => setSubModalOpen(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-[32px] p-8 max-w-sm w-full shadow-2xl"
            >
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                <BellRing className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-2">订阅此赛事</h3>
              <p className="text-xs font-bold text-gray-500 mb-6">为了更好地备赛，你想在什么时候收到系统的冲刺提醒？（官方日历不受影响）</p>
              
              <div className="space-y-3">
                <Button onClick={() => confirmSubscription(7)} className="w-full h-14 bg-amber-50 hover:bg-amber-100 text-amber-700 font-black rounded-2xl justify-start px-6 border border-amber-200">
                  ⚡ 提前 1 周 (冲刺准备)
                </Button>
                <Button onClick={() => confirmSubscription(3)} className="w-full h-14 bg-blue-50 hover:bg-blue-100 text-blue-700 font-black rounded-2xl justify-start px-6 border border-blue-200">
                  🔥 提前 3 天 (最终复盘)
                </Button>
                <Button onClick={() => confirmSubscription(0)} className="w-full h-14 bg-gray-50 hover:bg-gray-100 text-gray-700 font-black rounded-2xl justify-start px-6 border border-gray-200">
                  📅 仅按官方 DDL 提醒
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};