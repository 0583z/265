import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  User, Mail, GraduationCap, Github, Edit3, Trophy, Calendar, Sparkles, X, Plus, FileText, Bell, Clock, ShieldCheck,
  Send, Check, BrainCircuit, Search, Filter, ChevronRight, Copy, Maximize2, Trash2, Target, Mic, Star, Zap, CheckCircle2, Circle, ListTodo, Bot, Lock, Fingerprint, Activity, Code2, Link2, FolderGit2, Briefcase, TerminalSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import {
  fetchUserProfile, upsertUserProfile, fetchUserAwards, insertUserAward,
  submitHofApplication, fetchTotalFocusMinutes, type UserAwardRow
} from '../lib/supabaseClient';
import { UserAvatar } from './UserAvatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import * as Dialog from '@radix-ui/react-dialog';

// 引入模块
import { CompetencyRadar } from './modules/CompetencyRadar';
import { GeekActivityBoard } from './modules/GeekActivityBoard';
import { VoiceInterviewCabin } from './modules/VoiceInterviewCabin';
import { TechTagWall } from './modules/TechTagWall';

// --- 类型定义 ---
interface TodoItem { id: string; text: string; completed: boolean; }
interface Message { role: 'user' | 'ai'; content: string; }
interface AIAnalysis { id: number; date: string; modeLabel: string; content: string; }

// --- 💡 修复版：AI 备赛严厉私教 ---
const AITutor: React.FC<{ onAddTodo: (content: string) => void, externalPrompt?: string, promptId?: number }> = ({ onAddTodo, externalPrompt, promptId }) => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([{ role: 'ai', content: "你好，极客！我是你的私教。我会监督你的备赛进度并进行‘全链路确权’存证。" }]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // 🚨 修复没反应的问题：监听 promptId (时间戳)，只要点击就会触发，不管字符串是否一样
  useEffect(() => {
    if (externalPrompt && promptId) {
      handleSend(externalPrompt);
    }
  }, [promptId]);

  const handleSend = (text?: string) => {
    const content = text || input;
    if (!content.trim()) return;

    setMessages(prev => [...prev, { role: 'user', content }]);
    setInput("");

    setTimeout(() => {
      let reply = '';
      const query = content.toLowerCase();

      // 🚨 本地智能大脑：自动识别并给出专业排版的回复
      if (query.includes('算法')) {
        reply = "🤖 极客私教分析完成：【算法】维度 (当前评估：40%)\n\n您的算法基础已经入门，但应对高阶比赛还需系统性突破。行动计划如下：\n\n1. 专项突破：本周攻克「动态规划」与「图论」，在 LeetCode 完成 10 道中等真题。\n2. 实战检验：报名最近一次的 CCF CSP 认证，以 200 分为首期目标。\n3. 资产沉淀：开启【确权模式】记录每次提交。系统将自动为您加权。";
      } else if (query.includes('前端') || query.includes('ui')) {
        reply = "🤖 极客私教分析完成：【前端/UI】维度 (当前评估：40%)\n\n您已具备基础视图构建能力，下一步应向「前端工程化」进阶：\n\n1. 源码拆解：阅读 Vue3/React 核心源码，理解响应式原理与 Diff 算法。\n2. 最佳实践：在下个项目中引入 TypeScript + TailwindCSS。\n3. 资产沉淀：将个人组件打包发布至 npm，并在本平台进行【成果确权】。";
      } else if (query.includes('工程交付')) {
        reply = "🤖 极客私教分析完成：【工程交付】维度 (当前评估：40%)\n\n告别“能跑就行”，是走向资深极客的必经之路：\n\n1. 规范先行：为您的仓库配置 ESLint、Prettier 和 Husky 提交拦截。\n2. 自动化部署：尝试使用 GitHub Actions 编写 CI/CD 脚本。\n3. 架构思维：实践微服务部署方案，提升系统高可用性。";
      } else {
        const match = content.match(/【(.*?)】/);
        const skill = match ? match[1] : '综合';
        reply = `🤖 极客私教分析完成：【${skill}】维度 (当前评估：40%)\n\n为您定制以下进阶指南：\n\n1. 规范先行：梳理现有技术栈，查漏补缺。\n2. 团队基建：参与开源社区协作，形成标准化开发契约。\n3. 资产沉淀：在极客情报站补全您的实战项目复盘报告。`;
      }

      setMessages(prev => [...prev, { role: 'ai', content: reply }]);
    }, 800);
  };

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  return (
    <div className="bg-white border border-gray-100 rounded-[2rem] shadow-sm flex flex-col h-[480px] overflow-hidden transition-all hover:shadow-md">
      <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between bg-white/50 backdrop-blur-sm z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center shadow-sm"><Bot className="w-5 h-5 text-white" /></div>
          <div><h3 className="text-sm font-bold text-gray-900 tracking-tight">AI 备赛私教</h3><p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">Always Active</p></div>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50/50 rounded-full border border-blue-100/50">
          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" /><span className="text-[10px] font-bold text-blue-600 tracking-wider">CONNECTED</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-gray-50/30">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm whitespace-pre-wrap ${m.role === 'user' ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-white text-gray-800 border border-gray-100 rounded-tl-sm'}`}>
              {m.content}
              {m.role === 'ai' && i > 0 && (<button onClick={() => onAddTodo(m.content)} className="mt-3 block text-[11px] font-bold text-blue-500 hover:text-blue-700 transition-colors">+ 提取为待办任务</button>)}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>
      <div className="p-4 bg-white border-t border-gray-50 flex gap-3 items-center">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              if (e.nativeEvent.isComposing) return;
              e.preventDefault();
              handleSend();
            }
          }}
          className="flex-1 px-5 py-3.5 bg-gray-100/50 border border-transparent focus:border-gray-200 focus:bg-white rounded-2xl text-sm outline-none transition-all placeholder:text-gray-400 font-medium"
          placeholder="输入备赛困惑..."
        />
        <button onClick={() => handleSend()} className="p-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-sm transition-all active:scale-95"><Send className="w-5 h-5" /></button>
      </div>
    </div>
  );
};

// --- 💡 待办行动清单 ---
const TodoTable: React.FC<{ todos: TodoItem[]; onToggle: (id: string) => void; onDelete: (id: string) => void; onAdd: (text: string) => void; }> = ({ todos, onToggle, onDelete, onAdd }) => {
  const [newTodo, setNewTodo] = useState("");
  const handleAdd = () => { if (!newTodo.trim()) return; onAdd(newTodo.trim()); setNewTodo(""); };

  return (
    <div className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-sm h-[480px] flex flex-col transition-all hover:shadow-md">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center border border-emerald-100/50"><ListTodo className="w-5 h-5" /></div>
          <div><h3 className="text-sm font-bold text-gray-900 tracking-tight">待办存证</h3><p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">Action Items</p></div>
        </div>
        <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full">{todos.filter(t => !t.completed).length} Pending</span>
      </div>
      <div className="flex gap-2 mb-6">
        <input value={newTodo} onChange={(e) => setNewTodo(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { if (e.nativeEvent.isComposing) return; e.preventDefault(); handleAdd(); } }} placeholder="手动添加自定义待办..." className="flex-1 px-5 py-3.5 bg-gray-100/50 border border-transparent focus:bg-white focus:border-gray-200 rounded-2xl text-sm font-medium text-gray-800 outline-none transition-all placeholder:text-gray-400" />
        <button onClick={handleAdd} className="p-3.5 bg-gray-900 hover:bg-gray-800 text-white rounded-2xl shadow-sm transition-all active:scale-95 shrink-0"><Plus className="w-5 h-5" /></button>
      </div>
      <div className="space-y-2.5 overflow-y-auto flex-1 pr-2 custom-scrollbar">
        <AnimatePresence initial={false}>
          {todos.map((t) => (
            <motion.div layout initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.9 }} key={t.id} className={`flex items-center gap-3 p-3.5 rounded-2xl transition-all border ${t.completed ? 'bg-gray-50/50 border-transparent opacity-60' : 'bg-white border-gray-100 hover:border-gray-200 shadow-sm'}`}>
              <button onClick={() => onToggle(t.id)} className={`transition-all ${t.completed ? 'text-emerald-500' : 'text-gray-300 hover:text-emerald-400'}`}>{t.completed ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}</button>
              <p className={`text-sm font-medium flex-1 truncate ${t.completed ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{t.text}</p>
              <button onClick={() => onDelete(t.id)} className="text-gray-300 hover:text-red-500 transition-colors p-1"><Trash2 className="w-4 h-4" /></button>
            </motion.div>
          ))}
        </AnimatePresence>
        {todos.length === 0 && <div className="flex flex-col items-center justify-center h-full opacity-40 pt-4 pb-4"><ListTodo className="w-10 h-10 mb-3 text-gray-300" /><p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">All Caught Up</p></div>}
      </div>
    </div>
  );
};

// --- 🚀 主页面组件 ---
export const ProfileView: React.FC<{ competitions: any[]; subscribedIds: string[]; onGeneratePortfolio: () => void; onOpenGeekCenter?: () => void; }> = ({ competitions, subscribedIds, onGeneratePortfolio, onOpenGeekCenter }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [awards, setAwards] = useState<UserAwardRow[]>([]);
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [totalMin, setTotalMin] = useState(0);
  const [profile, setProfile] = useState<any>({ full_name: '', major: '', bio: '', skills: [], github_url: '' });
  const [fingerprint, setFingerprint] = useState("");

  const [newAward, setNewAward] = useState({ name: '', level: '', date: '', github_repo: '' });
  const [showAwardModal, setShowAwardModal] = useState(false);
  const [showHofModal, setShowHofModal] = useState(false);

  const [showExportModal, setShowExportModal] = useState(false);
  const [exportMode, setExportMode] = useState<'geek' | 'pm'>('geek');
  const [exportExpiry, setExportExpiry] = useState<'72h' | '7d' | 'never'>('72h');
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  const [hasCopied, setHasCopied] = useState(false);

  const [radarAiQuery, setRadarAiQuery] = useState({ text: "", ts: 0 });
  const [isCabinOpen, setIsCabinOpen] = useState(false);

  const [isSyncingGh, setIsSyncingGh] = useState(false);
  const [ghEvidence, setGhActivity] = useState<{ sha: string, repo: string, time: string } | null>(null);
  const [ghTopLangs, setGhTopLangs] = useState<{ name: string, percent: number }[]>([]);
  const [ghAllRepos, setGhAllRepos] = useState<any[]>([]);

  const processGitHubData = (events: any, repos: any) => {
    if (Array.isArray(repos) && repos.length > 0) {
      setGhAllRepos(repos);
      const langs: any = {}; let total = 0;
      repos.slice(0, 20).forEach((r: any) => { if (r.language) { langs[r.language] = (langs[r.language] || 0) + 1; total++; } });
      if (total > 0) setGhTopLangs(Object.entries(langs).sort((a: any, b: any) => b[1] - a[1]).map(([n, c]: any) => ({ name: n, percent: Math.round((c / total) * 100) })).slice(0, 5));
      else setGhTopLangs([]);
    } else { setGhAllRepos([]); setGhTopLangs([]); }
    const push = Array.isArray(events) && events.find((e: any) => e.type === 'PushEvent');
    if (push) setGhActivity({ sha: push.payload.head.slice(0, 8), repo: push.repo.name, time: push.created_at });
    else setGhActivity(null);
  };

  const syncGitHubData = async (url: string) => {
    if (!url || !url.includes('github.com')) return;
    const username = url.split('/').filter(Boolean).pop();
    if (!username) return;
    const cacheKey = `gh_cache_${username}`;
    const cachedDataStr = localStorage.getItem(cacheKey);

    if (cachedDataStr) {
      try { const { timestamp, events, repos } = JSON.parse(cachedDataStr); if (Date.now() - timestamp < 300000) { processGitHubData(events, repos); return; } } catch (e) { console.error(e); }
    }
    setIsSyncingGh(true);
    try {
      const [evRes, reposRes] = await Promise.all([fetch(`https://api.github.com/users/${username}/events/public`), fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=100`)]);
      if (evRes.status === 403 || reposRes.status === 403) {
        toast.info("GitHub 数据读取中 (本地快照)");
        if (cachedDataStr) { const { events, repos } = JSON.parse(cachedDataStr); processGitHubData(events, repos); } return;
      }
      if (!evRes.ok || !reposRes.ok) throw new Error("API Request Failed");
      const events = await evRes.json(); const repos = await reposRes.json();
      localStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), events, repos }));
      processGitHubData(events, repos);
    } catch (e) { if (cachedDataStr) { const { events, repos } = JSON.parse(cachedDataStr); processGitHubData(events, repos); } } finally { setIsSyncingGh(false); }
  };

  const generateFingerprint = async () => {
    const meta = `${user?.id}-${totalMin}-${awards.length}-${ghEvidence?.sha || '0'}`;
    const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(meta));
    setFingerprint(Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join(''));
  };

  useEffect(() => { generateFingerprint(); }, [awards, totalMin, ghEvidence]);

  const loadAll = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const localProfStr = localStorage.getItem(`geek_profile_${user.id}`);
      let currentProfile = { full_name: '', major: '', bio: '', skills: [], github_url: '' };
      if (localProfStr) { currentProfile = JSON.parse(localProfStr); setProfile(currentProfile); if (currentProfile.github_url) syncGitHubData(currentProfile.github_url); }
      const localAwardsStr = localStorage.getItem(`awards_${user.id}`); if (localAwardsStr) setAwards(JSON.parse(localAwardsStr));
      const localTodosStr = localStorage.getItem(`todos_${user.id}`); if (localTodosStr) setTodos(JSON.parse(localTodosStr));

      const [prof, awardList, mins] = await Promise.all([fetchUserProfile(user.id).catch(() => null), fetchUserAwards(user.id).catch(() => []), fetchTotalFocusMinutes(user.id).catch(() => 0)]);
      if (prof) {
        const remoteProf = { full_name: prof.nickname || currentProfile.full_name || user.username, major: prof.major || currentProfile.major || '', bio: prof.bio || currentProfile.bio || '', skills: Array.isArray(prof.skills) ? prof.skills : currentProfile.skills || [], github_url: prof.github_url || currentProfile.github_url || '' };
        setProfile(remoteProf); localStorage.setItem(`geek_profile_${user.id}`, JSON.stringify(remoteProf));
        if (remoteProf.github_url && remoteProf.github_url !== currentProfile.github_url) syncGitHubData(remoteProf.github_url);
      }
      if (awardList && awardList.length > 0) { setAwards(awardList); localStorage.setItem(`awards_${user.id}`, JSON.stringify(awardList)); }
      setTotalMin(mins || 0);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { loadAll(); }, [user?.id]);

  const safeUpdateTodos = (newTodos: TodoItem[]) => { setTodos(newTodos); if (user?.id) localStorage.setItem(`todos_${user.id}`, JSON.stringify(newTodos)); };

  const handleRadarAsk = (dim: string) => {
    let skill = dim;
    if (dim.includes('我该如何提升')) {
      const match = dim.match(/「(.*?)」/);
      if (match) skill = match[1];
    }
    const cleanPrompt = `请结合我的极客雷达图，为我制定一份关于【${skill}】维度的专项提升计划。`;
    setRadarAiQuery({ text: cleanPrompt, ts: Date.now() });
    toast.success(`正在为私教提取【${skill}】维度数据...`);
  };

  const handleAddAward = async () => {
    if (!newAward.name || !newAward.level) return toast.error('信息不全');
    const tempUI: UserAwardRow = { id: String(Date.now()), user_id: user!.id, competition_name: newAward.name, award_level: newAward.level, award_date: newAward.date || new Date().toISOString().slice(0, 10) };
    const newAwardsList = [tempUI, ...awards]; setAwards(newAwardsList);
    if (user?.id) localStorage.setItem(`awards_${user.id}`, JSON.stringify(newAwardsList));
    setShowAwardModal(false); setNewAward({ name: '', level: '', date: '', github_repo: '' }); toast.success('成就已录入，数字确权更新中');
    try { await insertUserAward({ user_id: tempUI.user_id, competition_name: tempUI.competition_name, award_level: tempUI.award_level, award_date: tempUI.award_date! }); }
    catch (e) { console.error("DB Insert Error", e); toast.info('云端同步稍有延迟，数据已安全存入本地确权库'); }
  };

  const handleDeleteAward = (id: string) => {
    const newAwardsList = awards.filter(a => a.id !== id); setAwards(newAwardsList);
    if (user?.id) localStorage.setItem(`awards_${user.id}`, JSON.stringify(newAwardsList)); toast.success('已移除成就，指纹已重绘');
  };

  const handleGenerateLink = () => {
    setIsGeneratingLink(true);
    setTimeout(() => {
      const mockHash = Math.random().toString(36).substring(2, 10);
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const myDomain = isLocalhost ? window.location.origin : 'https://www.comp-hub.fun';
      setGeneratedLink(`${myDomain}/dossier/${user?.id || 'demo'}?mode=${exportMode}&hash=${mockHash}`);
      setIsGeneratingLink(false);
      toast.success('千人千面档案已铸造！');
    }, 1500);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink);
    setHasCopied(true);
    toast.success('链接已复制到剪贴板！');
    setTimeout(() => setHasCopied(false), 2000);
  };

  if (loading) return <div className="py-20 text-center font-bold text-gray-400 italic animate-pulse">LOADING_DATA_SAFE...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-24 animate-in fade-in slide-in-from-bottom-6 duration-700">

      {/* 🍱 Bento 1: 苹果风顶部名片 */}
      <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden transition-all hover:shadow-md">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 rounded-full blur-3xl"></div>
        <UserAvatar name={profile.full_name} size="xl" className="w-24 h-24 shadow-sm border border-gray-50" />
        <div className="flex-1 space-y-5 relative z-10 w-full text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1">
              {isEditing ? <input autoFocus value={profile.full_name} onChange={e => setProfile({ ...profile, full_name: e.target.value })} className="text-3xl font-black text-gray-900 bg-gray-50 outline-none w-full px-4 py-2 rounded-xl text-center md:text-left" />
                : <h1 className="text-3xl font-black text-gray-900 tracking-tight">{profile.full_name || '匿名极客'}</h1>}
              <p className="text-sm font-medium text-gray-400 mt-2 flex items-center justify-center md:justify-start gap-2"><Mail className="w-4 h-4 text-gray-300" /> {user?.email}</p>
            </div>
            <div className="flex gap-3">
              {isEditing ? (
                <><Button onClick={() => setIsEditing(false)} variant="outline" className="rounded-2xl h-11 font-bold">取消</Button>
                  <Button onClick={async () => {
                    try { localStorage.setItem(`geek_profile_${user!.id}`, JSON.stringify(profile)); await upsertUserProfile({ id: user!.id, nickname: profile.full_name, major: profile.major, bio: profile.bio, github_url: profile.github_url, skills: profile.skills }); toast.success('配置已保存'); } catch (e) { toast.error('已暂存本地'); }
                    setIsEditing(false); if (profile.github_url) syncGitHubData(profile.github_url);
                  }} className="bg-emerald-500 text-white rounded-2xl h-11"><Check className="w-5 h-5" /></Button></>
              ) : <><Button onClick={() => setShowAwardModal(true)} className="bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-2xl h-11 px-6 shadow-lg shadow-amber-200/50 transition-all active:scale-95">
                <Star className="w-4 h-4 mr-2" /> 成果收录</Button><Button onClick={() => setIsEditing(true)} className="bg-gray-900 text-white rounded-2xl h-11 w-11 flex justify-center p-0"><Edit3 className="w-4 h-4" /></Button></>}
            </div>
          </div>
          <div className="flex flex-wrap gap-3 justify-center md:justify-start">
            <div className="bg-gray-50 px-4 py-2 rounded-full border border-gray-100 text-xs font-bold text-gray-600 flex items-center gap-2"><GraduationCap className="w-4 h-4 text-gray-400" /> {isEditing ? <input value={profile.major} onChange={e => setProfile({ ...profile, major: e.target.value })} className="bg-transparent border-none outline-none w-24 border-b border-gray-300" placeholder="填写专业" /> : (profile.major || '未填专业')}</div>
            <div className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 transition-all ${isEditing ? 'bg-white border-2 border-blue-400 shadow-sm' : (profile.github_url ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-400')}`}>
              <Github className={`w-4 h-4 ${isSyncingGh ? 'animate-spin' : ''}`} />
              {isEditing ? <input value={profile.github_url} onChange={e => setProfile({ ...profile, github_url: e.target.value })} className="bg-transparent border-none outline-none w-48 text-gray-900 placeholder:text-gray-300" placeholder="填写 GitHub 链接..." /> : (profile.github_url ? "GitHub: 已激活" : "未关联 GitHub")}
            </div>
            <div className="bg-gray-50 px-4 py-2 rounded-full border border-gray-100 text-xs font-bold text-gray-600 flex items-center gap-2"><Clock className="w-4 h-4 text-gray-400" /> 专注: {totalMin}m</div>
          </div>
        </div>
      </div>

      {/* 🍱 Bento 2: 战力画像区 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 flex flex-col justify-center">
          <CompetencyRadar userId={user?.id} onAskCoach={(dim) => handleRadarAsk(dim)} />
        </div>
        <div className="lg:col-span-5 flex justify-center">
          <TechTagWall theme="light" />
        </div>
      </div>

      {/* 🍱 Bento 3: 活跃看板区 */}
      <GeekActivityBoard userId={user?.id} />

      {/* 🍱 Bento 4: AI 私教与 Todo区 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <AITutor onAddTodo={(c) => safeUpdateTodos([{ id: Date.now().toString(), text: c, completed: false }, ...todos])} externalPrompt={radarAiQuery.text} promptId={radarAiQuery.ts} />
        </div>
        <div className="lg:col-span-5">
          <TodoTable todos={todos} onToggle={(id) => safeUpdateTodos(todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t))} onDelete={(id) => safeUpdateTodos(todos.filter(t => t.id !== id))} onAdd={(text) => safeUpdateTodos([{ id: Date.now().toString(), text, completed: false }, ...todos])} />
        </div>
      </div>

      {/* 🍱 Bento 5: 荣誉实绩宫格区 */}
      <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 space-y-6 transition-all hover:shadow-md">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2"><Trophy className="w-6 h-6 text-yellow-500" /> 荣誉实绩库</h2>
          <Button onClick={() => setShowAwardModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold px-5 h-10 text-sm shadow-sm transition-all active:scale-95"><Plus className="w-4 h-4 mr-1.5" /> 录入成就</Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {awards.map((award, idx) => (
              <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} key={award.id || idx} className="bg-gray-50/50 p-5 rounded-[1.5rem] border border-gray-100 shadow-sm flex flex-col gap-4 group hover:bg-white hover:border-blue-100 hover:shadow-md transition-all relative">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 bg-yellow-100 text-yellow-600 rounded-[1rem] flex items-center justify-center shrink-0 border border-yellow-200/50"><Trophy className="w-5 h-5" /></div>
                  <button onClick={() => handleDeleteAward(award.id!)} className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></button>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base leading-snug line-clamp-2">{award.competition_name}</h3>
                  <div className="flex items-center gap-3 mt-3">
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-full uppercase tracking-wider">{award.award_level}</span>
                    <span className="text-[11px] font-medium text-gray-500 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {award.award_date}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        {awards.length === 0 && <div className="bg-gray-50 border border-dashed border-gray-200 rounded-[2rem] p-12 text-center text-gray-400 font-medium text-sm">暂无赛事记录，快去斩获第一块奖牌吧！</div>}
      </div>

      {/* 🍱 Bento 6: 苹果安全岛风格（合并版确权黑卡） */}
      <div className="bg-zinc-900 rounded-[2.5rem] p-8 md:p-10 text-white shadow-xl relative overflow-hidden flex flex-col lg:flex-row gap-10 items-center justify-between border border-zinc-800">
        <div className="absolute top-1/2 -translate-y-1/2 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px]" />

        <div className="flex items-center gap-6 relative z-10 w-full lg:w-auto">
          <div className="w-20 h-20 bg-zinc-800 rounded-[1.5rem] border border-zinc-700 flex items-center justify-center relative shrink-0 shadow-inner">
            <Fingerprint className="w-10 h-10 text-blue-400" />
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }} className="absolute -inset-1.5 border border-dashed border-blue-500/20 rounded-[1.8rem]" />
          </div>
          <div>
            <h4 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">行为确权激活 <ShieldCheck className="w-5 h-5 text-emerald-400" /></h4>
            <p className="text-xs font-medium text-zinc-500 mt-1 uppercase tracking-widest">Asset Verification Active</p>
            <div className="mt-3 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 font-mono text-[10px] text-blue-400/80 break-all w-full max-w-[280px]">
              {fingerprint || "GEN_SIG_WAITING..."}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 relative z-10 w-full lg:w-auto border-t lg:border-t-0 lg:border-l border-zinc-800 pt-8 lg:pt-0 lg:pl-10">
          <div className="text-center sm:text-left mr-0 sm:mr-4">
            <h2 className="text-lg font-bold tracking-tight text-zinc-100">导出数字档案</h2>
            <p className="text-zinc-500 text-[10px] font-medium uppercase tracking-widest mt-1">Dossier v6.0</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={onOpenGeekCenter} className="bg-zinc-800 hover:bg-zinc-700 text-white h-12 rounded-2xl font-bold px-6 transition-all">控制中心</Button>
            <Button onClick={() => { setShowExportModal(true); setGeneratedLink(''); }} className="bg-blue-600 hover:bg-blue-500 text-white h-12 rounded-2xl font-bold px-6 shadow-lg shadow-blue-900/20 transition-all active:scale-95">
              <Lock className="w-4 h-4 mr-2" /> 立即签发
            </Button>
          </div>
        </div>
      </div>

      {/* --- 🎁 录入成就弹窗 --- */}
      <Dialog.Root open={showAwardModal} onOpenChange={setShowAwardModal}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-white rounded-[2rem] p-8 shadow-2xl z-[101] animate-in zoom-in-95">
            <Dialog.Title className="text-xl font-bold mb-6 flex items-center gap-3 text-gray-900"><Trophy className="text-yellow-500 w-7 h-7" /> 录入成就</Dialog.Title>
            <div className="space-y-4">
              <Input value={newAward.name} onChange={e => setNewAward({ ...newAward, name: e.target.value })} placeholder="赛事全称 (必填)" className="h-14 rounded-2xl border-gray-200 bg-gray-50 focus:bg-white font-medium text-sm" />
              <Input value={newAward.level} onChange={e => setNewAward({ ...newAward, level: e.target.value })} placeholder="获奖等级 (必填)" className="h-14 rounded-2xl border-gray-200 bg-gray-50 focus:bg-white font-medium text-sm" />
              <Input type="date" value={newAward.date} onChange={e => setNewAward({ ...newAward, date: e.target.value })} className="h-14 rounded-2xl border-gray-200 bg-gray-50 focus:bg-white font-medium px-4 text-sm" />
              <div className="pt-4 border-t border-gray-100 mt-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-3 flex items-center gap-2 tracking-widest"><FolderGit2 className="w-3.5 h-3.5" /> 附加确权证据 (可选)</p>
                {ghAllRepos.length > 0 ? (
                  <select value={newAward.github_repo} onChange={e => setNewAward({ ...newAward, github_repo: e.target.value })} className="h-14 w-full rounded-2xl border border-gray-200 font-medium px-4 outline-none focus:border-blue-500 bg-gray-50 hover:bg-white text-gray-700 transition-all cursor-pointer text-sm">
                    <option value="">点击选择您的 GitHub 仓库...</option>
                    {ghAllRepos.map(r => (<option key={r.id} value={r.name}>{r.name}</option>))}
                  </select>
                ) : (
                  <Input value={newAward.github_repo} onChange={e => setNewAward({ ...newAward, github_repo: e.target.value })} placeholder={profile.github_url ? "可手动输入链接..." : "未关联 GitHub，手动输入..."} className="h-14 rounded-2xl border-gray-200 font-medium bg-gray-50 text-sm" />
                )}
              </div>
              <Button onClick={handleAddAward} className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl mt-4 shadow-md transition-all active:scale-95">确认录入</Button>
            </div>
            <Dialog.Close className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 transition-colors"><X className="w-5 h-5" /></Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* --- 🎁 新增：千人千面·动态档案签发台 (Apple Bento 风格) --- */}
      <Dialog.Root open={showExportModal} onOpenChange={setShowExportModal}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-lg bg-white rounded-[2rem] p-8 shadow-2xl z-[101] animate-in zoom-in-95 flex flex-col gap-6">

            <div className="flex items-center justify-between">
              <div>
                <Dialog.Title className="text-xl font-black tracking-tight text-gray-900 flex items-center gap-2"><Lock className="w-5 h-5 text-blue-600" /> 签发动态数字档案</Dialog.Title>
                <p className="text-xs font-medium text-gray-400 mt-1 uppercase tracking-widest">Dynamic Dossier Configuration</p>
              </div>
              <Dialog.Close className="p-2 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-900 transition-colors"><X className="w-5 h-5" /></Dialog.Close>
            </div>

            <div className="space-y-5">
              {/* 视角选择 */}
              <div className="space-y-3">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">1. 选择呈现视角模式</span>
                <div className="grid grid-cols-2 gap-3">
                  <div onClick={() => setExportMode('geek')} className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${exportMode === 'geek' ? 'border-blue-500 bg-blue-50/50 shadow-sm' : 'border-gray-100 hover:border-gray-200'}`}>
                    <TerminalSquare className={`w-6 h-6 mb-2 ${exportMode === 'geek' ? 'text-blue-600' : 'text-gray-400'}`} />
                    <h4 className={`text-sm font-bold ${exportMode === 'geek' ? 'text-blue-900' : 'text-gray-700'}`}>硬核极客模式</h4>
                    <p className={`text-[10px] mt-1 ${exportMode === 'geek' ? 'text-blue-600' : 'text-gray-400'}`}>突出 GitHub 热力与算法底层能力</p>
                  </div>
                  <div onClick={() => setExportMode('pm')} className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${exportMode === 'pm' ? 'border-emerald-500 bg-emerald-50/50 shadow-sm' : 'border-gray-100 hover:border-gray-200'}`}>
                    <Briefcase className={`w-6 h-6 mb-2 ${exportMode === 'pm' ? 'text-emerald-600' : 'text-gray-400'}`} />
                    <h4 className={`text-sm font-bold ${exportMode === 'pm' ? 'text-emerald-900' : 'text-gray-700'}`}>全局产品模式</h4>
                    <p className={`text-[10px] mt-1 ${exportMode === 'pm' ? 'text-emerald-600' : 'text-gray-400'}`}>放大项目复盘、统筹与架构思维</p>
                  </div>
                </div>
              </div>

              {/* 过期时间选择 */}
              <div className="space-y-3">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">2. 访客雷达与阅后即焚</span>
                <div className="flex bg-gray-50 p-1 rounded-2xl border border-gray-100">
                  {(['72h', '7d', 'never'] as const).map(time => (
                    <button key={time} onClick={() => setExportExpiry(time)} className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${exportExpiry === time ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
                      {time === '72h' ? '72小时后失效' : time === '7d' ? '7天后失效' : '永久有效'}
                    </button>
                  ))}
                </div>
              </div>

              {/* 生成按钮 & 结果呈现 */}
              {!generatedLink ? (
                <Button onClick={handleGenerateLink} disabled={isGeneratingLink} className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-black text-sm rounded-2xl mt-2 shadow-lg shadow-blue-600/20 transition-all">
                  {isGeneratingLink ? <><Zap className="w-4 h-4 mr-2 animate-pulse" /> 上链确权中...</> : <><Sparkles className="w-4 h-4 mr-2" /> ⚡️ 铸造专属链接</>}
                </Button>
              ) : (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 flex items-center justify-between gap-4 mt-2">
                  <div className="flex-1 overflow-hidden">
                    <p className="text-[10px] font-mono text-zinc-500 mb-1">LINK_GENERATED</p>
                    <p className="text-xs font-mono text-blue-400 truncate select-all">{generatedLink}</p>
                  </div>
                  <button onClick={copyToClipboard} className={`p-3 rounded-xl transition-all shrink-0 ${hasCopied ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 hover:bg-zinc-700 text-white'}`}>
                    {hasCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </motion.div>
              )}
            </div>

          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <VoiceInterviewCabin isOpen={isCabinOpen} onClose={() => setIsCabinOpen(false)} />
    </div>
  );
};