import React, { useState, useEffect } from 'react';
import { 
  User, Mail, GraduationCap, Github, Edit3, Trophy, ExternalLink, 
  Calendar, Sparkles, X, Plus, FileText, Bell, Clock, ShieldCheck, Send, Check 
} from 'lucide-react';
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
  
  // 个人信息状态
  const [profile, setProfile] = useState<any>({ 
    full_name: '', 
    major: '', 
    bio: '', 
    skills: [], 
    github_url: '' 
  });

  // 弹窗状态
  const [showAwardModal, setShowAwardModal] = useState(false);
  const [showHofModal, setShowHofModal] = useState(false);
  const [newAward, setNewAward] = useState({ name: '', level: '', date: '' });
  const [hofReason, setHofReason] = useState('');

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
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { loadAll(); }, [user?.id]);

  // 🚨 完善后的保存逻辑
  const handleSaveProfile = async () => {
    if (!user?.id) return;
    try {
      await upsertUserProfile({
        id: user.id,
        nickname: profile.full_name,
        major: profile.major,
        bio: profile.bio,
        github_url: profile.github_url,
        skills: profile.skills
      });
      setIsEditing(false);
      toast.success('极客档案同步成功 ✨');
    } catch (e) { 
      toast.error('保存失败，请检查网络'); 
    }
  };

  const handleAddAward = async () => {
    if (!newAward.name || !newAward.level) return toast.error('请填写完整信息');
    try {
      await insertUserAward({ user_id: user!.id, competition_name: newAward.name, award_level: newAward.level, award_date: newAward.date || new Date().toISOString().slice(0,10) });
      toast.success('荣誉录入成功');
      setShowAwardModal(false);
      setNewAward({ name: '', level: '', date: '' });
      loadAll();
    } catch (e) { toast.error('录入失败'); }
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

  if (loading) return <div className="py-20 text-center font-black text-gray-400 italic">LOADING GEEK_DOSSIER...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
      
      {/* 1. 顶部档案卡片 (修复与完善编辑功能) */}
      <div className="bg-white rounded-[40px] p-8 sm:p-12 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-50 rounded-full blur-3xl opacity-40"></div>
        
        <UserAvatar name={profile.full_name} size="xl" />
        
        <div className="flex-1 space-y-6 relative z-10 text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1 w-full">
              {isEditing ? (
                <input 
                  autoFocus
                  value={profile.full_name}
                  onChange={e => setProfile({...profile, full_name: e.target.value})}
                  className="text-4xl font-black text-gray-900 bg-blue-50/50 border-b-2 border-blue-500 outline-none w-full italic tracking-tight px-2 rounded-t-lg"
                  placeholder="输入你的极客代号..."
                />
              ) : (
                <h1 className="text-4xl font-black text-gray-900 italic tracking-tight">
                  {profile.full_name || '匿名极客'}
                </h1>
              )}
              <p className="text-sm font-bold text-gray-400 mt-2 flex items-center justify-center md:justify-start gap-2">
                <Mail className="w-3.5 h-3.5 text-blue-500" /> {user?.email}
              </p>
            </div>

            <div className="flex gap-3">
              {isEditing ? (
                <>
                  <Button 
                    onClick={() => setIsEditing(false)} 
                    variant="outline"
                    className="rounded-2xl h-12 px-4 border-gray-200 text-gray-400 font-bold"
                  >
                    取消
                  </Button>
                  <Button 
                    onClick={handleSaveProfile} 
                    className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl h-12 w-12 flex items-center justify-center shadow-lg shadow-emerald-100"
                  >
                    <Check className="w-6 h-6" />
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    onClick={() => setShowHofModal(true)} 
                    className="bg-amber-500 text-white rounded-2xl h-12 px-6 font-black shadow-lg shadow-amber-100 transition-all active:scale-95"
                  >
                    <ShieldCheck className="w-4 h-4 mr-2" /> 申请卷王榜
                  </Button>
                  <Button 
                    onClick={() => setIsEditing(true)} 
                    className="bg-zinc-950 text-white rounded-2xl h-12 w-12 flex items-center justify-center shadow-xl hover:bg-black transition-colors"
                  >
                    <Edit3 className="w-5 h-5" />
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-4 justify-center md:justify-start">
             <div className="bg-blue-50 px-4 py-2 rounded-xl border border-blue-100 text-sm font-bold text-blue-600 flex items-center gap-2 min-w-[120px]">
               <GraduationCap className="w-4 h-4" /> 
               {isEditing ? (
                 <input 
                   value={profile.major}
                   onChange={e => setProfile({...profile, major: e.target.value})}
                   className="bg-transparent border-none outline-none w-full placeholder:text-blue-300"
                   placeholder="填写专业..."
                 />
               ) : (
                 profile.major || '未填专业'
               )}
             </div>
             <div className="bg-zinc-50 px-4 py-2 rounded-xl border border-zinc-100 text-sm font-bold text-zinc-500 flex items-center gap-2">
               <FileText className="w-4 h-4" /> 专注时长: {totalMin}m
             </div>
          </div>
        </div>
      </div>

      {/* 2. 荣誉实绩 */}
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
              <div key={idx} className="bg-white p-6 rounded-[28px] border border-gray-100 shadow-sm flex items-center gap-6 group hover:border-blue-300 transition-all">
                <div className="w-14 h-14 bg-yellow-50 rounded-2xl flex items-center justify-center"><Trophy className="w-7 h-7 text-yellow-600" /></div>
                <div className="flex-1"><h3 className="font-black text-gray-900 text-lg">{award.competition_name}</h3><div className="flex items-center gap-4 mt-1"><span className="text-xs font-black text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full uppercase">{award.award_level}</span><span className="text-xs font-bold text-gray-400 flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {award.award_date}</span></div></div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 3. 正在备赛 */}
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

      {/* 4. 底部操作 */}
      <div className="bg-zinc-950 rounded-[40px] p-10 text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden">
        <div className="space-y-2 relative z-10"><h2 className="text-2xl font-black italic uppercase tracking-tighter">导出极客能力档案</h2><p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Digital Competency Dossier v4.0</p></div>
        <div className="flex gap-4 relative z-10 w-full md:w-auto">
          <Button onClick={onOpenGeekCenter} className="flex-1 md:flex-none bg-zinc-800 hover:bg-zinc-700 text-white rounded-2xl h-14 px-8 font-black">前往极客中心</Button>
          <Button onClick={onGeneratePortfolio} className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-500 text-white rounded-2xl h-14 px-10 font-black shadow-xl flex items-center gap-3"><FileText className="w-5 h-5" /> 立即生成档案</Button>
        </div>
      </div>

      {/* --- 📦 弹窗区 --- */}
      <Dialog.Root open={showAwardModal} onOpenChange={setShowAwardModal}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100]" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-white rounded-[32px] p-10 shadow-2xl z-[101] animate-in zoom-in-95">
            <Dialog.Title className="text-2xl font-black mb-6 flex items-center gap-3"><Trophy className="text-yellow-500 w-8 h-8" /> 录入成就</Dialog.Title>
            <div className="space-y-4">
              <Input value={newAward.name} onChange={e => setNewAward({...newAward, name: e.target.value})} placeholder="赛事全称" className="h-14 rounded-2xl border-2" />
              <Input value={newAward.level} onChange={e => setNewAward({...newAward, level: e.target.value})} placeholder="获奖等级" className="h-14 rounded-2xl border-2" />
              <Input type="date" value={newAward.date} onChange={e => setNewAward({...newAward, date: e.target.value})} className="h-14 rounded-2xl border-2" />
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

    </div>
  );
};