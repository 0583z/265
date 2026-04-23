import React, { useState, useEffect, useMemo } from 'react';
import { 
  User, Mail, GraduationCap, Github, Edit3, Trophy, ExternalLink, 
  Calendar, Sparkles, X, Plus, FileText, Bell, Clock, ShieldCheck, 
  Send, Check, BrainCircuit, Search, Filter, ChevronRight, Copy, Maximize2, Trash2, Target, Mic 
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

// 引入模块组件
import { CompetencyRadar } from './modules/CompetencyRadar';
import { GeekActivityBoard } from './modules/GeekActivityBoard';
import { SkillUniverse3D } from './modules/SkillUniverse3D';
// 🚨 引入刚才写好的语音面试舱组件
import { VoiceInterviewCabin } from './modules/VoiceInterviewCabin';

export const ProfileView: React.FC<{
  competitions: any[];
  subscribedIds: string[];
  onGeneratePortfolio: () => void;
  onOpenGeekCenter?: () => void;
}> = ({ competitions, subscribedIds, onGeneratePortfolio, onOpenGeekCenter }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [awards, setAwards] = useState<UserAwardRow[]>([]);
  const [totalMin, setTotalMin] = useState(0);
  
  const [profile, setProfile] = useState<any>({ full_name: '', major: '', bio: '', skills: [], github_url: '' });

  const [showAwardModal, setShowAwardModal] = useState(false);
  const [showHofModal, setShowHofModal] = useState(false);
  const [newAward, setNewAward] = useState({ name: '', level: '', date: '' });
  const [hofReason, setHofReason] = useState('');
  
  // AI 档案搜索、筛选与抽屉状态
  const [savedAiAnalyses, setSavedAiAnalyses] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTag, setFilterTag] = useState('全部');
  const [selectedAnalysis, setSelectedAnalysis] = useState<any | null>(null);

  // 🚨 新增：语音面试舱开关状态
  const [isCabinOpen, setIsCabinOpen] = useState(false);

  const mySubscribedComps = competitions.filter(c => subscribedIds.includes(c.id));

  const loadAll = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [prof, awardList, mins] = await Promise.all([
        fetchUserProfile(user.id),
        fetchUserAwards(user.id),
        fetchTotalFocusMinutes(user.id)
      ]);
      if (prof) setProfile({ 
        full_name: prof.nickname || user.username, 
        major: prof.major || '', 
        bio: prof.bio || '', 
        skills: Array.isArray(prof.skills) ? prof.skills : [], 
        github_url: prof.github_url || '' 
      });
      setAwards(awardList);
      setTotalMin(mins);
      
      setSavedAiAnalyses(JSON.parse(localStorage.getItem('saved_ai_analyses') || '[]'));
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { loadAll(); }, [user?.id]);

  const filteredAnalyses = useMemo(() => {
    return savedAiAnalyses.filter(item => {
      const matchSearch = item.content.toLowerCase().includes(searchQuery.toLowerCase());
      const matchTag = filterTag === '全部' || item.modeLabel === filterTag;
      return matchSearch && matchTag;
    });
  }, [savedAiAnalyses, searchQuery, filterTag]);

  const handleSaveProfile = async () => {
    if (!user?.id) return;
    try {
      await upsertUserProfile({ id: user.id, nickname: profile.full_name, major: profile.major, bio: profile.bio, github_url: profile.github_url, skills: profile.skills });
      setIsEditing(false);
      toast.success('极客档案同步成功 ✨');
    } catch (e) { toast.error('保存失败，请检查网络'); }
  };

  const handleAddAward = async () => {
    if (!newAward.name || !newAward.level) return toast.error('请填写完整信息');
    const dateVal = newAward.date || new Date().toISOString().slice(0,10);
    
    const tempAward: UserAwardRow = { 
      id: String(Date.now()), 
      user_id: user!.id, 
      competition_name: newAward.name, 
      award_level: newAward.level, 
      award_date: dateVal 
    };
    
    setAwards(prev => [tempAward, ...prev]);
    setShowAwardModal(false);
    setNewAward({ name: '', level: '', date: '' });
    
    try {
      await insertUserAward({ user_id: user!.id, competition_name: tempAward.competition_name, award_level: tempAward.award_level, award_date: dateVal });
      toast.success('荣誉录入成功');
    } catch (e) { 
      toast.error('网络原因录入失败，请重试'); 
      loadAll(); 
    }
  };

  const handleApplyHof = async () => {
    if (hofReason.length < 10) return toast.error('申请理由请至少10个字');
    try {
      await submitHofApplication(user!.id, hofReason);
      toast.success('申请已提交，请等待审核');
      setShowHofModal(false);
      setHofReason('');
    } catch (e) { toast.error('提交失败'); }
  };

  const handleCopyContent = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('内容已复制到剪贴板');
  };

  const handleDeleteSavedAnalysis = (id: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updatedAnalyses = savedAiAnalyses.filter((item: any) => item.id !== id);
    setSavedAiAnalyses(updatedAnalyses);
    localStorage.setItem('saved_ai_analyses', JSON.stringify(updatedAnalyses));
    toast.success('已移除该条 AI 档案');
    if (selectedAnalysis && selectedAnalysis.id === id) {
      setSelectedAnalysis(null);
    }
  };

  if (loading) return <div className="py-20 text-center font-black text-gray-400 italic">LOADING GEEK_DOSSIER...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20 animate-in fade-in slide-in-from-bottom-6 duration-700">
      
      {/* 1. 顶部档案卡片 */}
      <div className="bg-white rounded-[40px] p-8 sm:p-12 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-50 rounded-full blur-3xl opacity-40"></div>
        <UserAvatar name={profile.full_name} size="xl" />
        <div className="flex-1 space-y-6 relative z-10 text-center md:text-left w-full">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1 w-full">
              {isEditing ? (
                <input 
                  autoFocus value={profile.full_name} onChange={e => setProfile({...profile, full_name: e.target.value})}
                  className="text-4xl font-black text-gray-900 bg-blue-50/50 border-b-2 border-blue-500 outline-none w-full italic tracking-tight px-2 rounded-t-lg"
                  placeholder="输入你的极客代号..."
                />
              ) : (
                <h1 className="text-4xl font-black text-gray-900 italic tracking-tight">{profile.full_name || '匿名极客'}</h1>
              )}
              <p className="text-sm font-bold text-gray-400 mt-2 flex items-center justify-center md:justify-start gap-2"><Mail className="w-3.5 h-3.5 text-blue-500" /> {user?.email}</p>
            </div>
            <div className="flex gap-3">
              {isEditing ? (
                <>
                  <Button onClick={() => setIsEditing(false)} variant="outline" className="rounded-2xl h-12 px-4 border-gray-200 text-gray-400 font-bold">取消</Button>
                  <Button onClick={handleSaveProfile} className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl h-12 w-12 flex items-center justify-center shadow-lg shadow-emerald-100"><Check className="w-6 h-6" /></Button>
                </>
              ) : (
                <>
                  <Button onClick={() => setShowHofModal(true)} className="bg-amber-500 text-white rounded-2xl h-12 px-6 font-black shadow-lg shadow-amber-100 transition-all active:scale-95"><ShieldCheck className="w-4 h-4 mr-2" /> 申请卷王榜</Button>
                  <Button onClick={() => setIsEditing(true)} className="bg-zinc-950 text-white rounded-2xl h-12 w-12 flex items-center justify-center shadow-xl hover:bg-black transition-colors"><Edit3 className="w-5 h-5" /></Button>
                </>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-4 justify-center md:justify-start">
             <div className="bg-blue-50 px-4 py-2 rounded-xl border border-blue-100 text-sm font-bold text-blue-600 flex items-center gap-2 min-w-[120px]">
               <GraduationCap className="w-4 h-4" /> 
               {isEditing ? (
                 <input value={profile.major} onChange={e => setProfile({...profile, major: e.target.value})} className="bg-transparent border-none outline-none w-full placeholder:text-blue-300" placeholder="填写专业..." />
               ) : (profile.major || '未填专业')}
             </div>
             <div className="bg-zinc-50 px-4 py-2 rounded-xl border border-zinc-100 text-sm font-bold text-zinc-500 flex items-center gap-2"><FileText className="w-4 h-4" /> 专注时长: {totalMin}m</div>
          </div>
        </div>
      </div>

      {/* 2. 极客数字战力画像 (雷达图) */}
      <div className="space-y-6">
        <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
          <Target className="w-7 h-7 text-blue-500" /> 
          极客数字战力画像
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CompetencyRadar 
            userId={user?.id} 
            onAskCoach={(q) => toast.info('正在唤起 AI 教练，分析此项短板...')} 
          />
          <div className="bg-blue-50/30 rounded-[32px] border-2 border-dashed border-blue-100 p-8 flex flex-col justify-center text-center">
            <div className="w-16 h-16 bg-blue-100 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-blue-900 mb-3">雷达引擎自动运转中</h3>
            <p className="text-sm font-bold text-blue-600/70 leading-relaxed max-w-xs mx-auto">
              左侧的极客雷达由底层算法自动加密生成。<br/><br/>
              多去【极客中心】打卡专注，多录入【获奖成就】，你的六边形战力就会随之自动突破！
            </p>
          </div>
        </div>
      </div>

      {/* 3. 高阶数据看板 (热力图与趋势图) */}
      <GeekActivityBoard userId={user?.id} />

      {/* 4. AI 解析档案（卡片墙 + 搜索 + 语音舱唤醒入口） */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* 🚨 这里加入了启动语音舱的按钮 */}
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3"><BrainCircuit className="w-7 h-7 text-emerald-500" /> AI 备赛助手记录</h2>
            <Button 
              onClick={() => setIsCabinOpen(true)}
              className="h-9 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs shadow-[0_0_15px_rgba(147,51,234,0.4)] flex items-center gap-2 transition-all hover:scale-105"
            >
              <Mic className="w-3.5 h-3.5" /> 启动语音面试舱
            </Button>
          </div>

          <div className="flex items-center gap-3 bg-gray-100/50 p-1.5 rounded-2xl border border-gray-100">
             <div className="relative">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
               <input 
                 type="text" 
                 placeholder="搜索历史记录..." 
                 value={searchQuery}
                 onChange={e => setSearchQuery(e.target.value)}
                 className="bg-white border-none rounded-xl py-2 pl-9 pr-4 text-xs font-bold outline-none w-40 focus:w-56 transition-all"
               />
             </div>
             <div className="h-6 w-[1px] bg-gray-200 mx-1"></div>
             <select 
               value={filterTag} 
               onChange={e => setFilterTag(e.target.value)}
               className="bg-transparent border-none text-[11px] font-black text-gray-500 outline-none pr-2 cursor-pointer"
             >
               {['全部', '赛事建议', '技术执行', '备赛计划'].map(t => <option key={t} value={t}>{t}</option>)}
             </select>
          </div>
        </div>

        {filteredAnalyses.length === 0 ? (
          <div className="py-12 text-center border-2 border-dashed border-gray-100 rounded-[32px] bg-gray-50/30">
            <p className="text-gray-400 font-bold italic">未找到匹配的 AI 解析记录。</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {filteredAnalyses.map((analysis) => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  layoutId={`card-${analysis.id}`}
                  key={analysis.id} 
                  onClick={() => setSelectedAnalysis(analysis)}
                  className="bg-white p-6 rounded-[28px] border border-gray-100 shadow-sm hover:shadow-xl hover:border-emerald-200 transition-all cursor-pointer group relative overflow-hidden flex flex-col"
                >
                  <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-50 rounded-bl-[40px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                    <Maximize2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-black text-emerald-600 bg-emerald-100/50 px-2.5 py-1 rounded-full">{analysis.modeLabel || 'AI 建议'}</span>
                    <span className="text-[10px] font-bold text-gray-300">{analysis.date}</span>
                  </div>
                  <p className="text-xs font-bold text-gray-600 line-clamp-3 leading-relaxed mb-4 flex-1">{analysis.content}</p>
                  
                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center text-[10px] font-black text-emerald-500 gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      查看详细解析 <ChevronRight className="w-3 h-3" />
                    </div>
                    <button 
                      onClick={(e) => handleDeleteSavedAnalysis(analysis.id, e)}
                      className="p-2 bg-rose-50 text-rose-500 rounded-full opacity-0 group-hover:opacity-100 hover:bg-rose-100 hover:scale-110 transition-all"
                      title="删除记录"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* 5. 荣誉实绩 */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3"><Trophy className="w-7 h-7 text-yellow-500" /> 实战成果与荣誉</h2>
          <Button onClick={() => setShowAwardModal(true)} className="bg-blue-600 text-white rounded-2xl font-bold px-6 h-11 flex items-center gap-2 shadow-lg shadow-blue-100"><Plus className="w-5 h-5" /> 录入新成就</Button>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {awards.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-gray-100 rounded-[32px] p-16 text-center"><p className="text-gray-400 font-bold italic">暂无正式记录。点击上方按钮开始录入！</p></div>
          ) : (
            awards.map((award, idx) => (
              <div key={award.id || idx} className="bg-white p-6 rounded-[28px] border border-gray-100 shadow-sm flex items-center gap-6 group hover:border-blue-300 transition-all">
                <div className="w-14 h-14 bg-yellow-50 rounded-2xl flex items-center justify-center"><Trophy className="w-7 h-7 text-yellow-600" /></div>
                <div className="flex-1"><h3 className="font-black text-gray-900 text-lg">{award.competition_name}</h3><div className="flex items-center gap-4 mt-1"><span className="text-xs font-black text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full uppercase">{award.award_level}</span><span className="text-xs font-bold text-gray-400 flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {award.award_date}</span></div></div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 6. 正在备赛 */}
      <div className="space-y-6">
        <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3"><Sparkles className="w-7 h-7 text-blue-500" /> 正在备赛 / 订阅赛事</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {mySubscribedComps.length === 0 ? (
            <div className="col-span-full bg-blue-50/30 border-2 border-dashed border-blue-100 rounded-[32px] p-10 text-center text-blue-500 font-bold">还没有订阅任何赛事。</div>
          ) : (
            mySubscribedComps.map(comp => (
              <div key={comp.id} className="bg-white p-6 rounded-[28px] border border-gray-100 shadow-sm flex flex-col gap-4 group hover:shadow-md transition-all">
                <div className="flex justify-between items-start"><span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full uppercase">{comp.level}</span><Bell className="w-4 h-4 text-blue-500" /></div>
                <h4 className="font-black text-gray-900 text-md line-clamp-2">{comp.name}</h4>
                <div className="text-[11px] font-bold text-gray-400 bg-gray-50 px-2.5 py-1 rounded-lg flex items-center gap-2 w-fit"><Clock className="w-3.5 h-3.5 text-rose-500" /> 截止：{comp.deadline?.split('T')[0]}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 7. 3D 技能宇宙图 */}
      <div className="space-y-6 pt-6 mb-12">
        <SkillUniverse3D />
      </div>

      {/* 8. 底部操作 */}
      <div className="bg-zinc-950 rounded-[40px] p-10 text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden">
        <div className="space-y-2 relative z-10"><h2 className="text-2xl font-black italic uppercase tracking-tighter">导出极客能力档案</h2><p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Digital Competency Dossier v4.0</p></div>
        <div className="flex gap-4 relative z-10 w-full md:w-auto">
          <Button onClick={onOpenGeekCenter} className="flex-1 md:flex-none bg-zinc-800 hover:bg-zinc-700 text-white rounded-2xl h-14 px-8 font-black">前往极客中心</Button>
          <Button onClick={onGeneratePortfolio} className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-500 text-white rounded-2xl h-14 px-10 font-black shadow-xl flex items-center gap-3"><FileText className="w-5 h-5" /> 立即生成档案</Button>
        </div>
      </div>

      {/* --- 📦 弹窗区：抽屉详情 --- */}
      <AnimatePresence>
        {selectedAnalysis && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedAnalysis(null)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200]"
            />
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-xl bg-white shadow-2xl z-[201] p-10 flex flex-col"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                    <BrainCircuit className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-gray-900">{selectedAnalysis.modeLabel || 'AI 解析详情'}</h3>
                    <p className="text-[10px] font-bold text-gray-400 flex items-center gap-1 uppercase"><Calendar className="w-3 h-3" /> Recorded on {selectedAnalysis.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                   <button 
                     onClick={() => handleDeleteSavedAnalysis(selectedAnalysis.id)}
                     className="p-3 bg-gray-50 text-gray-500 rounded-xl hover:bg-rose-50 hover:text-rose-600 transition-colors"
                     title="删除此记录"
                   >
                     <Trash2 className="w-5 h-5" />
                   </button>
                   <button 
                     onClick={() => handleCopyContent(selectedAnalysis.content)}
                     className="p-3 bg-gray-50 text-gray-500 rounded-xl hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                     title="复制内容"
                   >
                     <Copy className="w-5 h-5" />
                   </button>
                   <button 
                     onClick={() => setSelectedAnalysis(null)}
                     className="p-3 bg-gray-50 text-gray-500 rounded-xl hover:bg-zinc-200 hover:text-zinc-900 transition-colors"
                     title="关闭抽屉"
                   >
                     <X className="w-5 h-5" />
                   </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar pr-4">
                 <div className="bg-zinc-50 rounded-[32px] p-8 border border-zinc-100">
                    <p className="text-sm font-medium text-zinc-700 leading-loose whitespace-pre-wrap">
                      {selectedAnalysis.content}
                    </p>
                 </div>
              </div>
              
              <div className="mt-8 pt-8 border-t border-gray-100">
                <Button 
                  onClick={() => setSelectedAnalysis(null)} 
                  className="w-full h-14 bg-zinc-950 text-white rounded-2xl font-black"
                >
                  关闭预览
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* --- 📦 弹窗区：荣誉与卷王榜 --- */}
      <Dialog.Root open={showAwardModal} onOpenChange={setShowAwardModal}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100]" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-white rounded-[32px] p-10 shadow-2xl z-[101] animate-in zoom-in-95">
            <Dialog.Title className="text-2xl font-black mb-6 flex items-center gap-3"><Trophy className="text-yellow-500 w-8 h-8" /> 录入成就</Dialog.Title>
            <div className="space-y-4">
              <Input value={newAward.name} onChange={e => setNewAward({...newAward, name: e.target.value})} placeholder="赛事全称" className="h-14 rounded-2xl border-2 font-bold" />
              <Input value={newAward.level} onChange={e => setNewAward({...newAward, level: e.target.value})} placeholder="获奖等级" className="h-14 rounded-2xl border-2 font-bold" />
              <Input type="date" value={newAward.date} onChange={e => setNewAward({...newAward, date: e.target.value})} className="h-14 rounded-2xl border-2 font-bold" />
              <Button onClick={handleAddAward} className="w-full h-16 bg-blue-600 text-white font-black rounded-2xl mt-4">确认存入</Button>
            </div>
            <Dialog.Close className="absolute top-6 right-6 p-2 text-gray-300 hover:text-gray-900"><X /></Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root open={showHofModal} onOpenChange={setShowHofModal}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100]" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-white rounded-[32px] p-10 shadow-2xl z-[101]">
            <Dialog.Title className="text-2xl font-black mb-4 flex items-center gap-3 text-amber-600"><ShieldCheck /> 申请卷王榜</Dialog.Title>
            <textarea value={hofReason} onChange={e => setHofReason(e.target.value)} placeholder="写下你的申请理由..." className="w-full h-40 p-5 bg-gray-50 rounded-[24px] border-2 outline-none font-medium mb-4" />
            <Button onClick={handleApplyHof} className="w-full h-16 bg-amber-50 text-white font-black rounded-2xl flex items-center justify-center gap-3"><Send className="w-5 h-5" /> 提交申请</Button>
            <Dialog.Close className="absolute top-6 right-6 p-2 text-gray-300 hover:text-gray-900"><X /></Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* 🚨 新增：语音面试舱全屏弹窗 */}
      <VoiceInterviewCabin isOpen={isCabinOpen} onClose={() => setIsCabinOpen(false)} />

    </div>
  );
};