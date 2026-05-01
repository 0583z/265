import { ContestStation } from './components/ContestStation';
import React, { useState, useEffect } from 'react';
import { CompetitionList, COMPETITIONS } from './components/CompetitionList';
import { HallOfFame } from './components/HallOfFame';
import type { Competition } from '@/src/types';
import { Toaster, toast } from 'sonner';
import {
  Trophy, User, Bell, X, Calendar,
  FileText, Copy, Check, LogOut, Users, Briefcase, LayoutGrid, Plus, Globe, LockKeyhole,
  Sun, Moon, Lock, Github, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as Dialog from '@radix-ui/react-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from './context/AuthContext';
import { AuthModal } from './components/AuthModal';
import { supabase } from './lib/supabase';

import { AIAssistant } from './components/AIAssistant';
import { ProfileView } from './components/ProfileView';
import { NotificationCenter } from './components/NotificationCenter';
import { GeekCenter } from './components/GeekCenter';
import { TeamupHub } from './components/TeamupHub';
import { CareerNavigator } from './components/CareerNavigator';

// 🚨 路由引擎核心组件与咱们新建的展示页
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { DossierView } from './components/DossierView';

// 导航栏配置 (已更名为：竞赛情报站)
const NAV_TABS = [
  { id: 'home', label: '探索竞赛', color: 'text-blue-600' },
  { id: 'career', label: '职业导航', color: 'text-emerald-500' },
  { id: 'teamup', label: '组队枢纽', color: 'text-fuchsia-500' },
  { id: 'hall', label: '竞赛情报站', color: 'text-yellow-500' },
  { id: 'profile', label: '我的档案', color: 'text-blue-600' },
  { id: 'geek', label: '极客中心', color: 'text-emerald-500' }
] as const;

function MainDashboard() {
  const [activeTab, setActiveTab] = useState<'home' | 'hall' | 'profile' | 'geek' | 'teamup' | 'career'>('home');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [selectedComp, setSelectedComp] = useState<Competition | null>(null);
  const [showPortfolio, setShowPortfolio] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // 成果录入状态
  const [showAwardModal, setShowAwardModal] = useState(false);
  const [newAward, setNewAward] = useState({
    name: '', level: '', date: '', type: 'private' as 'private' | 'public', github_repo: ''
  });
  const [userRepos, setUserRepos] = useState<{ name: string, url: string }[]>([]);

  // GitHub 拉取状态
  const [githubId, setGithubId] = useState('');
  const [isFetchingGithub, setIsFetchingGithub] = useState(false);

  const [userHonors, setUserHonors] = useState<any[]>([]);
  const [aiCoachDraft, setAiCoachDraft] = useState<string | null>(null);
  const [dbCompetitions, setDbCompetitions] = useState<Competition[]>([]);
  const [userSubscriptions, setUserSubscriptions] = useState<string[]>([]);
  const [isCopied, setIsCopied] = useState(false);

  const [showAddCompModal, setShowAddCompModal] = useState(false);
  const [newComp, setNewComp] = useState({ name: '', level: '校级/自定义', deadline: '', type: 'private', url: '' });

  const [archiveContent, setArchiveContent] = useState('');
  const [isArchiveLoading, setIsArchiveLoading] = useState(false);

  const { user, isAuthenticated, logout, loading: authLoading } = useAuth();

  const allCompetitions = (dbCompetitions.length > 0 ? dbCompetitions : COMPETITIONS) as any[];

  // 🚀 第一步：构建真实读取的“极客资产网”
  // 此逻辑严格读取您的 Supabase 荣誉、GitHub 仓库和深度学习记录，不再是死数据
  const dynamicUserAssets = {
    // 1. 真实荣誉：提取已确权的成就（如您已通过的 CCF CSP 41次认证）
    honors: userHonors.map(h => ({
      name: h.competition_name || '',
      level: h.award_level || '',
      type: h.competition_name?.toLowerCase().includes('算法') || h.competition_name?.toUpperCase().includes('CSP') ? 'algorithm' : 'project'
    })),

    // 2. 实战代码：直接读取您拉取到的 GitHub 真实仓库名
    repos: userRepos.map(r => r.name.toLowerCase()),

    // 3. 学习记录：识别您对 Xiaomi Notes 等项目的深度源码拆解行为
    learningLogs: userHonors
      .filter(h => h.competition_name?.includes('源码') || h.competition_name?.includes('分析'))
      .map(h => h.competition_name || ''),

    // 4. 基础极客基因：您的核心技术栈快照
    rawSkills: ['java', 'c++', 'python', 'k-means', 'android', 'bfs', 'dfs', 'dynamic programming']
  };

  // GitHub API 报错诊断逻辑
  const fetchRealGithubRepos = async () => {
    if (!githubId.trim()) return toast.error('请输入 GitHub 用户名');
    setIsFetchingGithub(true);
    try {
      const res = await fetch(`https://api.github.com/users/${githubId.trim()}/repos?sort=updated`);
      if (res.status === 403 || res.status === 429) {
        throw new Error('调用太频繁啦！GitHub 限制每小时 60 次，请稍后再试或更换网络 IP');
      }
      if (res.status === 404) {
        throw new Error('未找到该用户，请检查拼写是否正确');
      }
      if (!res.ok) {
        throw new Error(`请求失败，状态码: ${res.status}`);
      }

      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setUserRepos(data.map(repo => ({ name: repo.name, url: repo.html_url })));
        toast.success(`✅ 成功抓取到 ${data.length} 个真实仓库！`);
      } else {
        toast.warning('该用户没有任何公开仓库');
        setUserRepos([]);
      }
    } catch (e: any) {
      toast.error(e.message || '抓取失败，请检查网络连接');
      setUserRepos([]);
    } finally {
      setIsFetchingGithub(false);
    }
  };

  const fetchUserHonors = async () => {
    if (!user?.id) return;
    const { data, error } = await supabase.from('user_honors').select('*').eq('user_id', user.id);
    if (error) {
      console.error('获取成就失败:', error);
      toast.error('拉取档案失败，请检查数据库权限 (RLS)');
    }
    if (data) setUserHonors(data);
  };

  useEffect(() => {
    if (isAuthenticated) fetchUserHonors();
  }, [isAuthenticated, user?.id]);

  const fetchCompetitions = async () => {
    try {
      const { data, error } = await supabase.from('competitions').select('*').order('created_at', { ascending: false });
      let localPrivateComps: any[] = [];
      if (user?.id) {
        const localStr = localStorage.getItem(`private_comps_${user.id}`);
        if (localStr) localPrivateComps = JSON.parse(localStr);
      }
      if (data && !error) {
        setDbCompetitions([...localPrivateComps, ...data] as any);
      } else {
        setDbCompetitions([...localPrivateComps] as any);
      }
    } catch (err) { console.error('Fetch competitions error:', err); }
  };

  const fetchSubscriptions = async () => {
    if (!isAuthenticated || !user?.id) return;
    try {
      const { data } = await supabase.from('subscriptions').select('competition_id').eq('user_id', user.id);
      if (data) setUserSubscriptions(data.map((s: any) => s.competition_id));
    } catch (err) { console.error('Fetch subscriptions error:', err); }
  };

  useEffect(() => { fetchCompetitions(); }, [user?.id]);
  useEffect(() => {
    if (isAuthenticated) fetchSubscriptions();
    else setUserSubscriptions([]);
  }, [isAuthenticated, user?.id]);

  const handleToggleSubscription = async (compId: string, compName?: string) => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    const already = userSubscriptions.includes(compId);
    try {
      if (already) {
        if (!compId.startsWith('private_')) {
          await supabase.from('subscriptions').delete().eq('user_id', user!.id).eq('competition_id', compId);
        }
        setUserSubscriptions(prev => prev.filter(id => id !== compId));
        toast.info(`已取消订阅: ${compName || ''}`);
      } else {
        if (!compId.startsWith('private_')) {
          await supabase.from('subscriptions').insert([{ user_id: user!.id, competition_id: compId }]);
        }
        setUserSubscriptions(prev => [...prev, compId]);
        toast.success(`✅ 成功订阅 ${compName || ''}`);
      }
    } catch (e) { toast.error('操作失败，请重试'); }
  };

  const handleSubmitCustomComp = async () => {
    if (!isAuthenticated || !user?.id) {
      toast.error('请先登录再进行建档操作');
      setShowAddCompModal(false);
      setShowAuthModal(true);
      return;
    }
    if (!newComp.name || !newComp.deadline) return toast.error('请填写赛事名称和截止日期');
    try {
      if (newComp.type === 'private') {
        const privateComp = {
          id: `private_${Date.now()}`,
          name: newComp.name,
          level: newComp.level,
          deadline: newComp.deadline + 'T00:00:00Z',
          description: '【个人私有建档赛事】此赛事仅您自己可见。',
          registrationUrl: newComp.url || '#',
          image_url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80',
          tags: ['个人私有', '自定义']
        };
        setDbCompetitions(prev => [privateComp as any, ...prev]);
        const existingStr = localStorage.getItem(`private_comps_${user.id}`);
        const existingComps = existingStr ? JSON.parse(existingStr) : [];
        localStorage.setItem(`private_comps_${user.id}`, JSON.stringify([privateComp, ...existingComps]));
        toast.success('✨ 已成功创建私有赛事');
      } else {
        const { error } = await supabase.from('competitions_pending').insert([{
          name: newComp.name,
          level: newComp.level,
          deadline: newComp.deadline + 'T00:00:00Z',
          registrationUrl: newComp.url || null,
          created_by: user.id
        }]);
        if (error) throw error;
        toast.success('🚀 公开赛事已成功提交');
      }
      setShowAddCompModal(false);
      setNewComp({ name: '', level: '校级/自定义', deadline: '', type: 'private', url: '' });
    } catch (e: any) { toast.error(`提交失败: ${e.message}`); }
  };

  const handleConfirmAward = async () => {
    if (!newAward.name || !newAward.level) return toast.error('请填写必填项');
    if (!isAuthenticated) return setShowAuthModal(true);
    try {
      const { error } = await supabase.from('user_honors').insert([{
        user_id: user?.id,
        competition_name: newAward.name,
        award_level: newAward.level,
        is_public: newAward.type === 'public',
        github_url: newAward.github_repo,
        status: newAward.type === 'public' ? 'pending' : 'approved'
      }]);
      if (error) throw error;
      toast.success(newAward.type === 'private' ? '🔒 已存入私人档案馆' : '🌐 已提交审核');
      setShowAwardModal(false);
      setNewAward({ name: '', level: '', date: '', type: 'private', github_repo: '' });
      fetchUserHonors();
    } catch (e: any) { toast.error(`录入失败: ${e.message}`); }
  };

  const fetchAndGenerateArchive = async () => {
    if (!user) return;
    setIsArchiveLoading(true);
    let honorsText = '- 暂术记录';
    const { data: honors } = await supabase.from('user_honors').select('*').eq('user_id', user.id);
    if (honors && honors.length > 0) {
      honorsText = honors.map((item: any) => `- 🏆 ${item.competition_name} (${item.award_level || '暂无评级'})`).join('\n');
    }
    const finalMarkdown = `# ${user?.username || '极客同学'} | 极客能力档案\n\n## 🏅 实战成果与荣誉\n${honorsText}\n\n--- \n*Generated by GEEK HUB 2026*`;
    setArchiveContent(finalMarkdown);
    setIsArchiveLoading(false);
  };

  useEffect(() => {
    if (showPortfolio) fetchAndGenerateArchive();
  }, [showPortfolio, user, userHonors]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(archiveContent);
    setIsCopied(true);
    toast.success('能力档案已复制到剪贴板');
    setTimeout(() => setIsCopied(false), 2000);
  };

  const renderContent = () => {
    const AnyAIAssistant = AIAssistant as any;
    switch (activeTab) {
      case 'home':
        return (
          <div className="space-y-8 md:space-y-16">
            <AnyAIAssistant onSuccess={() => setActiveTab('home')} externalDraft={aiCoachDraft} onExternalDraftConsumed={() => setAiCoachDraft(null)} />
            <div className={`flex flex-col sm:flex-row justify-between items-center gap-4 p-6 md:p-8 rounded-[24px] md:rounded-[32px] shadow-sm border relative overflow-hidden ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-100'}`}>
              <div className="z-10 text-center sm:text-left">
                <h3 className={`text-lg md:text-xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>没找到你想参加的比赛？</h3>
                <p className="text-xs md:text-sm font-bold text-gray-400 mt-1 md:mt-2">极客不受规则束缚！您可以手动建档私有赛事。</p>
              </div>
              <Button onClick={() => setShowAddCompModal(true)} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white rounded-xl md:rounded-2xl shadow-lg px-6 h-12 md:h-14 font-black transition-all active:scale-95 z-10 text-xs md:text-sm">
                <Plus className="w-4 h-4 md:w-5 md:h-5 mr-1.5 md:mr-2" /> 自定义建档赛事
              </Button>
            </div>
            <CompetitionList competitions={allCompetitions} subscribedIds={userSubscriptions} onToggleSubscription={handleToggleSubscription} onItemClick={(comp) => setSelectedComp(comp)} />
          </div>
        );
      case 'career':
        return <CareerNavigator competitions={allCompetitions} />;
      case 'hall':
        return (
          <div className="space-y-12">
            <ContestStation
              userAssets={dynamicUserAssets}
              subscribedCompetitions={allCompetitions
                .filter(c => userSubscriptions.includes(c.id))
                .map(c => ({
                  ...c,
                  requirements: c.requirements || (c.tags ? c.tags : []), // 🚨 修复类型冲突
                  type: c.type || '综合赛事'
                }))
              }
            />
            <div className="flex flex-col items-center gap-6 py-12 bg-gray-50 rounded-[3rem] border border-dashed border-gray-200">
              <div className="text-center">
                <h4 className="text-lg font-black text-gray-900">实战匹配度有待提升？</h4>
                <p className="text-xs font-bold text-gray-500 mt-1">录入更多真实成果或关联 GitHub 仓库，让系统更精准地探测机会。</p>
              </div>
              <Button
                onClick={() => { setNewAward(prev => ({ ...prev, type: 'private' })); setShowAwardModal(true); }}
                className="bg-white hover:bg-gray-100 text-gray-900 border border-gray-100 shadow-sm rounded-2xl px-10 h-14 font-black transition-all"
              >
                <Plus className="w-5 h-5 mr-2" /> 录入新成果以刷新情报
              </Button>
            </div>
          </div>
        );
      case 'teamup': return <TeamupHub />;
      case 'profile': return <ProfileView competitions={allCompetitions} subscribedIds={userSubscriptions} onGeneratePortfolio={() => setShowPortfolio(true)} onOpenGeekCenter={() => setActiveTab('geek')} />;
      case 'geek': return <GeekCenter competitions={allCompetitions} subscribedIds={userSubscriptions} theme={theme} />;
      default: return null;
    }
  };

  if (authLoading) return <div className="h-screen bg-zinc-950 flex items-center justify-center text-white italic tracking-widest uppercase">Geek_Loading_System...</div>;

  return (
    <div className={`transition-colors duration-300 ${theme === 'dark' ? 'min-h-screen bg-zinc-950 text-zinc-100' : 'min-h-screen bg-[#FDFDFF] text-gray-900'}`}>
      <style dangerouslySetInnerHTML={{ __html: ".no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }" }} />
      <Toaster position="top-center" richColors />
      <header className={`sticky top-0 z-50 w-full backdrop-blur-xl border-b transition-colors duration-300 ${theme === 'dark' ? 'border-zinc-800 bg-zinc-950/90 text-white' : 'border-gray-100 bg-white/80 text-gray-900'}`}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between h-16 md:h-20">
          <div className="flex items-center gap-2 md:gap-3 cursor-pointer shrink-0" onClick={() => setActiveTab('home')}>
            <Trophy className="w-5 h-5 md:w-6 md:h-6 text-blue-600 shadow-blue-200" />
            <span className="text-lg md:text-xl font-black italic tracking-tighter">GEEK HUB</span>
          </div>
          <nav className="hidden md:flex flex-1 justify-center items-center gap-8 font-bold text-sm uppercase tracking-widest px-8">
            {NAV_TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex items-center transition-colors shrink-0 ${activeTab === tab.id ? tab.color : 'hover:text-blue-500 text-gray-400'}`}>
                {tab.label}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-3 md:gap-4 shrink-0">
            <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className={`p-2 rounded-xl border-2 transition-all ${theme === 'dark' ? 'border-zinc-800 text-yellow-400' : 'border-gray-100 text-gray-400'}`}>
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
            <NotificationCenter />
            {isAuthenticated ? (
              <div className="flex gap-3 md:gap-4 items-center">
                <div onClick={() => setActiveTab('profile')} className={`px-3 md:px-4 py-1.5 border-2 rounded-2xl font-black text-xs cursor-pointer truncate max-w-[150px] ${theme === 'dark' ? 'border-zinc-700 hover:bg-zinc-800' : 'border-gray-100 hover:bg-gray-50'}`}>
                  {user?.username}
                </div>
                <LogOut className="w-4 h-4 md:w-5 md:h-5 cursor-pointer text-gray-400 hover:text-red-500" onClick={() => logout()} />
              </div>
            ) : (
              <Button onClick={() => setShowAuthModal(true)} className="bg-blue-600 text-white rounded-xl px-4 md:px-6 text-xs md:text-sm font-bold shadow-lg shadow-blue-100 h-8 md:h-10">登录 / 注册</Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-12">
        {renderContent()}
      </main>

      {/* --- 弹窗逻辑区 --- */}
      <Dialog.Root open={showAwardModal} onOpenChange={setShowAwardModal}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100]" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-white rounded-[2.5rem] p-8 shadow-2xl z-[101] border border-gray-100 animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-8">
              <Dialog.Title className="text-xl font-black flex items-center gap-2 text-gray-900 uppercase">
                <ShieldCheck className="text-blue-600 w-7 h-7" /> 成果确权录入
              </Dialog.Title>
              <Dialog.Close className="p-2 hover:bg-gray-50 rounded-full text-gray-400 transition-colors"><X className="w-5 h-5" /></Dialog.Close>
            </div>
            <div className="space-y-6">
              <div className="bg-gray-100 p-1.5 rounded-2xl flex gap-1">
                <button onClick={() => setNewAward({ ...newAward, type: 'private' })} className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all ${newAward.type === 'private' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400'}`}>私人存证</button>
                <button onClick={() => setNewAward({ ...newAward, type: 'public' })} className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all ${newAward.type === 'public' ? 'bg-emerald-500 text-white shadow-lg' : 'text-gray-400'}`}>全网公开</button>
              </div>
              <div className="space-y-3">
                <Input value={newAward.name} onChange={e => setNewAward({ ...newAward, name: e.target.value })} placeholder="赛事/项目全称 (必填)" className="h-14 rounded-2xl border-gray-100 bg-gray-50 font-bold" />
                <Input value={newAward.level} onChange={e => setNewAward({ ...newAward, level: e.target.value })} placeholder="获奖等级 (必填)" className="h-14 rounded-2xl border-gray-100 bg-gray-50 font-bold" />
                <div className="pt-4 border-t">
                  <p className="text-[10px] font-black text-gray-400 uppercase mb-3 flex items-center gap-2"><Github className="w-3.5 h-3.5" /> 绑定真实源码仓库</p>
                  <div className="flex gap-2 mb-3">
                    <Input value={githubId} onChange={e => setGithubId(e.target.value)} placeholder="输入 GitHub ID" className="h-10 rounded-xl bg-gray-50 font-bold text-xs" />
                    <Button onClick={fetchRealGithubRepos} disabled={isFetchingGithub} className="h-10 bg-gray-900 text-white rounded-xl text-xs px-4">拉取仓库</Button>
                  </div>
                  <select value={newAward.github_repo} onChange={e => setNewAward({ ...newAward, github_repo: e.target.value })} className="h-14 w-full rounded-2xl border border-gray-100 bg-gray-50 font-bold px-4 text-sm text-gray-700 outline-none">
                    <option value="">{userRepos.length > 0 ? "请选择确权仓库..." : "请先拉取您的 GitHub 仓库"}</option>
                    {userRepos.map(repo => <option key={repo.url} value={repo.url}>{repo.name}</option>)}
                  </select>
                </div>
              </div>
              <Button onClick={handleConfirmAward} className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-xl active:scale-95 transition-all">确认录入</Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root open={showAddCompModal} onOpenChange={setShowAddCompModal}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100]" />
          <Dialog.Content className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-lg rounded-[32px] shadow-2xl z-[101] p-10 ${theme === 'dark' ? 'bg-zinc-900' : 'bg-white'}`}>
            <Dialog.Title className={`text-2xl font-black mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>自定义建档赛事</Dialog.Title>
            <div className="space-y-4">
              <Input value={newComp.name} onChange={e => setNewComp({ ...newComp, name: e.target.value })} placeholder="赛事名称" className="h-14 rounded-xl border-2 font-bold" />
              <Input type="date" value={newComp.deadline} onChange={e => setNewComp({ ...newComp, deadline: e.target.value })} className="h-14 rounded-xl border-2 font-bold" />
              <Button onClick={handleSubmitCustomComp} className="w-full h-14 bg-gray-900 text-white font-black rounded-2xl">确认创建</Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root open={showPortfolio} onOpenChange={setShowPortfolio}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100]" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95%] max-w-2xl bg-white rounded-[40px] shadow-2xl z-[101] overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-8 border-b flex justify-between items-center bg-gray-50/50">
              <Dialog.Title className="text-xl font-black text-gray-900 flex items-center gap-2"><FileText className="text-blue-600" /> 极客档案预览</Dialog.Title>
              <Dialog.Close><X className="w-5 h-5 text-gray-400" /></Dialog.Close>
            </div>
            <div className="p-8 overflow-y-auto bg-white">
              <div className="bg-zinc-900 rounded-3xl p-8 relative border border-zinc-800">
                <button onClick={copyToClipboard} className="absolute right-6 top-6 bg-white/10 text-white/70 p-2.5 rounded-xl border border-white/10 text-xs font-bold">复制代码</button>
                <pre className="text-emerald-400 font-mono text-sm whitespace-pre-wrap">{isArchiveLoading ? '🚀 正在拉取数据...' : archiveContent}</pre>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root open={!!selectedComp} onOpenChange={(open) => !open && setSelectedComp(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-white rounded-[40px] shadow-2xl z-[101] p-10">
            {selectedComp && (
              <div className="space-y-6 text-center">
                <Badge className="bg-blue-50 text-blue-600 px-3 py-1 font-black">{selectedComp.level}</Badge>
                <Dialog.Title className="text-2xl font-black text-gray-900 leading-tight">{selectedComp.name}</Dialog.Title>
                <Button className="w-full bg-blue-600 hover:bg-blue-700 h-14 rounded-2xl font-black text-white" onClick={() => window.open((selectedComp as any).registrationUrl || '#', '_blank')}>前往官网</Button>
              </div>
            )}
            <Dialog.Close className="absolute top-6 right-6 text-slate-300"><X /></Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <AuthModal isOpen={showAuthModal} onOpenChange={setShowAuthModal} />
    </div>
  );
}
export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/dossier/:userId" element={<DossierView />} />
        <Route path="/*" element={<MainDashboard />} />
      </Routes>
    </Router>
  );
}