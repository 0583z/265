import React, { useState, useEffect } from 'react';
import { CompetitionList, COMPETITIONS } from './components/CompetitionList'; 
import { HallOfFameCard } from './components/HallOfFameCard';
import { Competition, hallOfFame } from './data';
import { Toaster, toast } from 'sonner';
import { 
  Trophy, Home, User, Bell, Sparkles, X, Calendar, 
  Target, ExternalLink, FileText, Copy, Check, LogOut, Users 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as Dialog from '@radix-ui/react-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from './context/AuthContext';
import { AuthModal } from './components/AuthModal';
import { supabase } from './lib/supabase';
import { differenceInDays, parseISO } from 'date-fns';

import { AIAssistant } from './components/AIAssistant';
import { ProfileView } from './components/ProfileView';
import { NotificationCenter } from './components/NotificationCenter';
import { GeekCenter } from './components/GeekCenter';
import { TeamupHub } from './components/TeamupHub'; // 🚨 确保你已经创建了这个组件
import { CareerNavigator } from './components/CareerNavigator';
import { fetchHallOfFameCases, type HallOfFameCaseRow } from './lib/supabaseClient';

export default function App() {
  // 🚨 状态管理：增加了 teamup 标签
  const [activeTab, setActiveTab] = useState<'home' | 'hall' | 'profile' | 'geek' | 'teamup' | 'career'>('home');
  const [selectedComp, setSelectedComp] = useState<Competition | null>(null);
  const [showPortfolio, setShowPortfolio] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [aiCoachDraft, setAiCoachDraft] = useState<string | null>(null);
  const [dbCompetitions, setDbCompetitions] = useState<Competition[]>([]);
  const [userSubscriptions, setUserSubscriptions] = useState<string[]>([]);
  const [isCopied, setIsCopied] = useState(false);
  const [hallCases, setHallCases] = useState<HallOfFameCaseRow[]>([]);
  const [hallLoading, setHallLoading] = useState(false);
  const [hallOffset, setHallOffset] = useState(0);
  const HALL_PAGE_SIZE = 9;
  const publicHallCases: HallOfFameCaseRow[] = hallOfFame.map((h) => ({
    id: `public-${h.id}`,
    project_name: h.projectName,
    year: h.year,
    award_level: h.awardLevel,
    team_intro: h.teamIntro,
    key_to_success: h.keyToSuccess,
    major: h.major,
  }));

  const { user, isAuthenticated, logout, loading: authLoading } = useAuth();
  const allCompetitions = dbCompetitions.length > 0 ? dbCompetitions : COMPETITIONS;

  // 1. 获取赛事数据
  const fetchCompetitions = async () => {
    try {
      const { data } = await supabase.from('competitions').select('*').order('created_at', { ascending: false });
      if (data) setDbCompetitions(data as any);
    } catch (err) {
      console.error('Fetch competitions error:', err);
    }
  };

  // 2. 获取订阅数据
  const fetchSubscriptions = async () => {
    if (!isAuthenticated || !user?.id) return;
    try {
      const { data } = await supabase.from('subscriptions').select('competition_id').eq('user_id', user.id);
      if (data) setUserSubscriptions(data.map((s: any) => s.competition_id));
    } catch (err) {
      console.error('Fetch subscriptions error:', err);
    }
  };

  useEffect(() => {
    fetchCompetitions();
  }, []);

  const loadMoreHallCases = async (reset = false) => {
    setHallLoading(true);
    try {
      const nextOffset = reset ? 0 : hallOffset;
      const rows = await fetchHallOfFameCases(HALL_PAGE_SIZE, nextOffset);
      if (reset) {
        setHallCases(rows);
      } else {
        setHallCases((prev) => [...prev, ...rows]);
      }
      setHallOffset(nextOffset + rows.length);
    } catch (e) {
      if (reset) setHallCases([]);
    } finally {
      setHallLoading(false);
    }
  };

  const mergedHallCases = React.useMemo(() => {
    const dbMapped = hallCases;
    const seen = new Set<string>();
    const merged: HallOfFameCaseRow[] = [];
    [...dbMapped, ...publicHallCases].forEach((item) => {
      const key = `${item.project_name}-${item.year}`;
      if (seen.has(key)) return;
      seen.add(key);
      merged.push(item);
    });
    return merged;
  }, [hallCases]);

  useEffect(() => {
    if (isAuthenticated) fetchSubscriptions();
    else setUserSubscriptions([]);
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    if (activeTab === 'hall' && hallCases.length === 0 && !hallLoading) {
      loadMoreHallCases(true);
    }
  }, [activeTab]);

  // 3. 订阅/取消订阅逻辑
  const handleToggleSubscription = async (compId: string, compName?: string) => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    const already = userSubscriptions.includes(compId);
    try {
      if (already) {
        await supabase.from('subscriptions').delete().eq('user_id', user!.id).eq('competition_id', compId);
        setUserSubscriptions(prev => prev.filter(id => id !== compId));
        toast.info(`已取消订阅: ${compName || ''}`);
      } else {
        await supabase.from('subscriptions').insert([{ user_id: user!.id, competition_id: compId }]);
        setUserSubscriptions(prev => [...prev, compId]);
        toast.success(`✅ 成功订阅 ${compName || ''}`);
      }
    } catch (e) {
      toast.error('操作失败，请重试');
    }
  };

  // 4. 极客能力档案 Markdown 生成
  const generateMarkdown = () => {
    return `# ${user?.username || '极客同学'} | 极客能力档案\n\n## 👤 极客画像\n- **开发者 ID**: ${user?.username || '未定义'}\n- **同步邮箱**: ${user?.email || '未绑定'}\n\n## 🏅 实战成果与荣誉\n- 数据同步中...\n\n--- \n*Generated by GEEK HUB 2026*`;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generateMarkdown());
    setIsCopied(true);
    toast.success('能力档案已复制到剪贴板');
    setTimeout(() => setIsCopied(false), 2000);
  };

  // 5. 渲染主内容区域
  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="space-y-16">
            {/* @ts-ignore */}
            <AIAssistant 
              onSuccess={() => setActiveTab('home')} 
              externalDraft={aiCoachDraft} 
              onExternalDraftConsumed={() => setAiCoachDraft(null)} 
            />
            <CompetitionList 
              competitions={allCompetitions} 
              subscribedIds={userSubscriptions} 
              onToggleSubscription={handleToggleSubscription} 
              onItemClick={(comp) => setSelectedComp(comp)} 
            />
          </div>
        );
      case 'career':
        return <CareerNavigator competitions={allCompetitions} />;
      case 'hall':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {mergedHallCases.map((h) => (
                <HallOfFameCard
                  key={h.id}
                  entry={{
                    id: h.id,
                    projectName: h.project_name,
                    year: h.year,
                    awardLevel: h.award_level,
                    teamIntro: h.team_intro,
                    keyToSuccess: h.key_to_success,
                    major: h.major,
                  }}
                  onClick={() => {}}
                />
              ))}
            </div>
            <div className="flex justify-center">
              <Button onClick={() => loadMoreHallCases(false)} disabled={hallLoading} className="rounded-2xl px-8">
                {hallLoading ? '加载中...' : '加载更多案例'}
              </Button>
            </div>
          </div>
        );
      case 'teamup': // 🚨 组队枢纽标签页
        return <TeamupHub />;
      case 'profile':
        return (
          <ProfileView 
            competitions={allCompetitions} 
            subscribedIds={userSubscriptions} 
            onGeneratePortfolio={() => setShowPortfolio(true)} 
            onOpenGeekCenter={() => setActiveTab('geek')} 
          />
        );
      case 'geek':
        return <GeekCenter competitions={allCompetitions} subscribedIds={userSubscriptions} />;
      default:
        return null;
    }
  };

  if (authLoading) return <div className="h-screen bg-zinc-950 flex items-center justify-center text-white italic">GEEK_LOADING...</div>;

  return (
    <div className={(activeTab === 'geek' || activeTab === 'teamup') ? 'min-h-screen bg-zinc-950 text-zinc-100' : 'min-h-screen bg-[#FDFDFF] text-gray-900'}>
      <Toaster position="top-center" richColors />
      
      {/* 导航栏 */}
      <nav className={`sticky top-0 z-50 backdrop-blur-xl h-20 border-b ${(activeTab === 'geek' || activeTab === 'teamup') ? 'border-zinc-800 bg-zinc-950/90' : 'border-gray-100 bg-white/80'}`}>
        <div className="max-w-7xl mx-auto h-full px-6 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('home')}>
            <Trophy className="w-6 h-6 text-blue-600 shadow-blue-200" />
            <span className="text-lg font-black italic tracking-tighter">GEEK HUB</span>
          </div>
          
          <div className="hidden md:flex gap-8 font-bold text-sm uppercase tracking-widest">
            <button onClick={() => setActiveTab('home')} className={activeTab === 'home' ? 'text-blue-600' : 'hover:text-blue-500'}>探索竞赛</button>
            <button onClick={() => setActiveTab('career')} className={activeTab === 'career' ? 'text-emerald-500' : 'hover:text-blue-500'}>职业导航</button>
            <button onClick={() => setActiveTab('teamup')} className={activeTab === 'teamup' ? 'text-fuchsia-500' : 'hover:text-blue-500'}>组队枢纽</button>
            <button onClick={() => setActiveTab('hall')} className={activeTab === 'hall' ? 'text-blue-600' : 'hover:text-blue-500'}>卷王榜</button>
            <button onClick={() => setActiveTab('profile')} className={activeTab === 'profile' ? 'text-blue-600' : 'hover:text-blue-500'}>我的档案</button>
            <button onClick={() => setActiveTab('geek')} className={activeTab === 'geek' ? 'text-emerald-500' : 'hover:text-blue-500'}>极客中心</button>
          </div>

          <div className="flex items-center gap-4">
            <NotificationCenter />
            {isAuthenticated ? (
              <div className="flex gap-4 items-center">
                <div onClick={() => setActiveTab('profile')} className="px-3 py-1 border border-gray-200 rounded-full font-bold cursor-pointer hover:bg-gray-50 transition-colors">
                  {user?.username}
                </div>
                <LogOut className="w-5 h-5 cursor-pointer text-gray-400 hover:text-red-500 transition-colors" onClick={() => logout()} />
              </div>
            ) : (
              <Button onClick={() => setShowAuthModal(true)} className="bg-blue-600 text-white rounded-xl px-6">登录 / 注册</Button>
            )}
          </div>
        </div>
      </nav>

      {/* 主内容 */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {renderContent()}
      </main>

      {/* 极客能力档案预览弹窗 */}
      <Dialog.Root open={showPortfolio} onOpenChange={setShowPortfolio}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] animate-in fade-in" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95%] max-w-2xl bg-white rounded-[40px] shadow-2xl z-[101] overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
              <div>
                <Dialog.Title className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                  <FileText className="w-6 h-6 text-blue-600" /> 极客能力档案预览
                </Dialog.Title>
                <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">COMPETENCY DOSSIER PREVIEW</p>
              </div>
              <Dialog.Close className="p-2 hover:bg-white rounded-full transition-all"><X className="w-5 h-5 text-gray-400" /></Dialog.Close>
            </div>
            <div className="p-8 overflow-y-auto bg-white">
              <div className="bg-zinc-900 rounded-3xl p-8 relative group">
                <button onClick={copyToClipboard} className="absolute right-6 top-6 bg-white/10 hover:bg-white/20 text-white/70 hover:text-white p-2.5 rounded-xl border border-white/10 flex items-center gap-2 text-xs font-bold transition-all">
                  {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  {isCopied ? '已成功导出' : '复制档案代码'}
                </button>
                <pre className="text-emerald-400 font-mono text-sm overflow-x-auto whitespace-pre-wrap leading-relaxed">
                  {generateMarkdown()}
                </pre>
              </div>
            </div>
            <div className="p-8 bg-gray-50/50 border-t border-gray-50 flex gap-4">
              <Button onClick={copyToClipboard} className="flex-1 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black shadow-lg shadow-blue-100 flex items-center justify-center gap-3">
                <Copy className="w-5 h-5" /> 确认并复制档案内容
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* 赛事详情弹窗 */}
      <Dialog.Root open={!!selectedComp} onOpenChange={(open) => !open && setSelectedComp(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-white rounded-[40px] shadow-2xl z-[101] p-10 overflow-hidden">
            {selectedComp && (
              <div className="space-y-6">
                <Badge className="bg-blue-50 text-blue-600 border-none px-3 py-1 uppercase text-[10px] font-black">{selectedComp.level}</Badge>
                <Dialog.Title className="text-2xl font-black leading-tight text-gray-900">{selectedComp.name}</Dialog.Title>
                <div className="p-4 bg-slate-50 rounded-2xl flex items-center gap-4">
                   <div className="p-2 bg-white rounded-xl shadow-sm"><Calendar className="text-blue-600 w-5 h-5" /></div>
                   <div>
                     <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">截止日期</div>
                     <div className="font-bold text-gray-900">{selectedComp.deadline.split('T')[0]}</div>
                   </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button className="flex-1 bg-blue-600 hover:bg-blue-700 h-14 rounded-2xl font-black text-white shadow-lg shadow-blue-100" onClick={() => window.open((selectedComp as any).registrationUrl || '#', '_blank')}>
                    前往官网报名
                  </Button>
                  <Button variant="outline" className={`w-14 h-14 p-0 rounded-2xl border-2 transition-all ${userSubscriptions.includes(selectedComp.id) ? 'text-red-500 border-red-100 bg-red-50 hover:bg-red-100' : 'text-gray-400 border-gray-100 hover:border-blue-200'}`} onClick={() => handleToggleSubscription(selectedComp.id, selectedComp.name)}>
                    <Bell className={`w-6 h-6 ${userSubscriptions.includes(selectedComp.id) ? 'fill-current' : ''}`} />
                  </Button>
                </div>
              </div>
            )}
            <Dialog.Close className="absolute top-6 right-6 text-slate-300 hover:text-slate-900 transition-colors"><X /></Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <AuthModal isOpen={showAuthModal} onOpenChange={setShowAuthModal} />
    </div>
  );
}