import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  User, 
  Mail, 
  MapPin, 
  Award, 
  Edit3, 
  Save, 
  X, 
  Github, 
  ExternalLink, 
  GraduationCap, 
  Sparkles,
  Plus,
  Trash2,
  FileText,
  Calendar
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  fetchUserProfile,
  upsertUserProfile,
  fetchSubscriptionsWithCompetitions,
  fetchUserGrowthState,
  fetchTotalFocusMinutes,
  type UserGrowthStateRow,
} from '../lib/supabaseClient';
import { SkillTree } from './SkillTree';
import { StickerBoard } from './StickerBoard';
import { UserAvatar } from './UserAvatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
interface AwardEntry {
  id: string;
  competition_name: string;
  award_level: string;
  date: string;
}

interface ProfileData {
  full_name: string;
  major: string;
  bio: string;
  skills: string[];
  github_url: string;
}

interface SubscriptionEntry {
  id: string;
  competition_id: string;
  name: string;
  deadline: string;
  level: string;
  category: string;
}

export const ProfileView: React.FC<{
  onGeneratePortfolio: () => void;
  onRequestAiCoach?: (prompt: string) => void;
  onOpenGeekCenter?: () => void;
}> = ({ onGeneratePortfolio, onRequestAiCoach, onOpenGeekCenter }) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [growth, setGrowth] = useState<UserGrowthStateRow | null>(null);
  const [totalFocusMin, setTotalFocusMin] = useState(0);
  
  const [profile, setProfile] = useState<ProfileData>({
    full_name: '',
    major: '',
    bio: '',
    skills: [],
    github_url: ''
  });

  const [awards, setAwards] = useState<AwardEntry[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionEntry[]>([]);
  const [newSkill, setNewSkill] = useState('');

  useEffect(() => {
    const fetchProfileAll = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        const [prof, subs, growthRow, totalMin] = await Promise.all([
          fetchUserProfile(user.id),
          fetchSubscriptionsWithCompetitions(user.id),
          fetchUserGrowthState(user.id),
          fetchTotalFocusMinutes(user.id),
        ]);

        setGrowth(growthRow);
        setTotalFocusMin(totalMin);

        if (prof) {
          setProfile({
            full_name: prof.nickname || user.username || '',
            major: prof.major || '',
            bio: prof.bio || '',
            skills: Array.isArray(prof.skills) ? (prof.skills as string[]) : [],
            github_url: prof.github_url || '',
          });
        } else {
          setProfile((prev) => ({ ...prev, full_name: user.username || '' }));
        }

        setSubscriptions(
          subs.map((s) => ({
            id: s.id,
            competition_id: s.competition_id,
            name: s.name,
            deadline: s.deadline,
            level: s.level,
            category: s.category,
          })),
        );
        setAwards([]);
      } catch (err: unknown) {
        console.error('Error fetching profile data:', err);
        const msg = err instanceof Error ? err.message : '未知错误';
        toast.error('获取个人资料失败: ' + msg);
      } finally {
        setLoading(false);
      }
    };

    void fetchProfileAll();
  }, [user?.id, user?.username]);

  const handleSave = async () => {
    if (!user?.id) return;
    setSaving(true);

    try {
      const existing = await fetchUserProfile(user.id);
      await upsertUserProfile({
        id: user.id,
        nickname: profile.full_name || null,
        major: profile.major || null,
        bio: profile.bio || null,
        github_url: profile.github_url || null,
        skills: profile.skills,
        motto: existing?.motto ?? null,
        avatar_url: existing?.avatar_url ?? null,
        tech_tags: Array.isArray(existing?.tech_tags) ? (existing!.tech_tags as string[]) : [],
      });

      setIsEditing(false);
      toast.success('资料已更新 ✨');
    } catch (err: unknown) {
      console.error('Save error:', err);
      toast.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const addSkill = () => {
    if (newSkill && !profile.skills.includes(newSkill)) {
      setProfile({ ...profile, skills: [...profile.skills, newSkill] });
      setNewSkill('');
    }
  };

  const removeSkill = (skill: string) => {
    setProfile({ ...profile, skills: profile.skills.filter(s => s !== skill) });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Loading Profile...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto py-20 bg-white rounded-[40px] border border-gray-100 shadow-sm text-center px-8">
        <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <User className="w-10 h-10 text-blue-600" />
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">欢迎来到极客档案</h2>
        <p className="text-gray-400 font-medium mb-8">请先登录，开启你的竞赛作品集之旅</p>
        <div className="flex justify-center">
          <div className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-blue-100 italic">
            请点击右上角登录/注册 🚀
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
      {/* Header Profile Card */}
      <div className="relative bg-white rounded-[40px] p-8 sm:p-12 shadow-2xl shadow-blue-500/5 border border-gray-100 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-50"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-50 rounded-full blur-3xl -ml-24 -mb-24 opacity-50"></div>
        
        <div className="relative flex flex-col md:flex-row items-start md:items-center gap-8">
          <div className="relative group">
            <UserAvatar 
              name={profile.full_name || user?.username || 'G'} 
              size="xl"
            />
            {isEditing && (
              <div className="absolute inset-0 bg-black/40 rounded-[32px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                <Edit3 className="w-6 h-6 text-white" />
              </div>
            )}
          </div>

          <div className="flex-1 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                {isEditing ? (
                  <Input 
                    value={profile.full_name} 
                    onChange={e => setProfile({...profile, full_name: e.target.value})}
                    placeholder="你的极客真名"
                    className="text-2xl font-black h-12 bg-gray-50 border-none px-4 rounded-xl focus-visible:ring-blue-600/20"
                  />
                ) : (
                  <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight italic">
                    {profile.full_name || user?.username}
                  </h1>
                )}
                <div className="flex items-center gap-3 mt-2 text-gray-400 font-bold text-sm tracking-wide uppercase">
                  <Mail className="w-4 h-4 text-blue-500" />
                  {user?.email}
                </div>
              </div>

              <div className="hidden sm:flex gap-2">
                {isEditing ? (
                  <>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsEditing(false)}
                      className="rounded-xl px-4 font-bold border-gray-200"
                    >
                      取消
                    </Button>
                    <Button 
                      disabled={saving}
                      onClick={handleSave}
                      className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 font-black shadow-lg shadow-blue-200"
                    >
                      {saving ? '保存中...' : '保存修改'}
                    </Button>
                  </>
                ) : (
                  <Button 
                    onClick={() => setIsEditing(true)}
                    className="bg-gray-900 hover:bg-black text-white rounded-xl px-6 font-black flex items-center gap-2 shadow-xl shadow-gray-200"
                  >
                    <Edit3 className="w-4 h-4" />
                    修改档案
                  </Button>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm font-bold text-gray-500">
              <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                <GraduationCap className="w-4 h-4 text-indigo-500" />
                {isEditing ? (
                  <input 
                    value={profile.major} 
                    onChange={e => setProfile({...profile, major: e.target.value})}
                    placeholder="填入你的专业"
                    className="bg-transparent border-none outline-none focus:ring-0 w-32"
                  />
                ) : (
                  profile.major || '未填专业'
                )}
              </div>
              <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                <Github className="w-4 h-4 text-gray-900" />
                {isEditing ? (
                  <input 
                    value={profile.github_url} 
                    onChange={e => setProfile({...profile, github_url: e.target.value})}
                    placeholder="Github 主页链接"
                    className="bg-transparent border-none outline-none focus:ring-0 w-32"
                  />
                ) : (
                  profile.github_url ? 'GitHub 已关联' : '未关联 GitHub'
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bio Section */}
        <div className="mt-10 pt-10 border-t border-gray-50">
          <div className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4">
            <User className="w-3 h-3" />
            个人简介 / BIO
          </div>
          {isEditing ? (
            <textarea 
              value={profile.bio}
              onChange={e => setProfile({...profile, bio: e.target.value})}
              placeholder="介绍一下你的极客背景和竞赛热情..."
              className="w-full h-24 p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-600/10 text-gray-700 font-medium resize-none"
            />
          ) : (
            <p className="text-gray-600 text-lg font-medium leading-relaxed max-w-2xl">
              {profile.bio || '这位极客还没留下任何介绍。是在默默钻研算法吗？🧪'}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <SkillTree userId={user.id} growth={growth} />
        <StickerBoard
          userId={user.id}
          unlockedIds={[
            ...(totalFocusMin >= 600 ? ['focus_600'] : []),
            ...(subscriptions.some((s) => /csp|ccf|计算机软件能力/i.test(s.name)) ? ['csp_sub'] : []),
          ]}
          initialLayout={growth?.sticker_layout}
        />
      </div>

      <section className="rounded-[32px] border-2 border-gray-900 bg-gradient-to-br from-violet-50 via-white to-emerald-50/40 p-8 shadow-[8px_8px_0_0_rgba(0,0,0,1)]">
        <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-violet-600" />
          极客中心 · 深度工作台
        </h2>
        <p className="mt-2 text-sm font-bold text-gray-500 max-w-xl leading-relaxed">
          番茄钟、拼贴风联动日历、由专注分类聚合的能力雷达、user_profiles 档案与打卡已集中在顶部导航「极客中心」。
        </p>
        <Button
          type="button"
          onClick={() => onOpenGeekCenter?.()}
          className="mt-6 h-12 rounded-2xl bg-gray-900 px-8 font-black text-white shadow-lg hover:bg-black"
        >
          前往极客中心
        </Button>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Awards & Honors */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-gray-900 flex items-center gap-3">
              <Trophy className="w-6 h-6 text-yellow-500" />
              荣誉与获奖记录
            </h2>
            <Button variant="outline" className="rounded-xl border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-widest px-3">
              管理记录
            </Button>
          </div>

          <div className="space-y-4">
            {awards.length === 0 ? (
              <div className="bg-white border-2 border-dashed border-gray-100 rounded-[32px] p-12 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="w-8 h-8 text-gray-200" />
                </div>
                <p className="text-gray-400 font-bold mb-4 italic">暂无荣誉记录，开启你的第一场比赛吧！</p>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 font-bold">
                  添加荣誉
                </Button>
              </div>
            ) : (
              awards.map((award) => (
                <div key={award.id} className="bg-white p-6 rounded-[28px] border border-gray-100 shadow-sm flex items-center gap-6 group hover:shadow-lg hover:shadow-blue-500/5 transition-all">
                  <div className="w-14 h-14 bg-yellow-50 rounded-2xl flex items-center justify-center shrink-0">
                    <Trophy className="w-7 h-7 text-yellow-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-black text-gray-900">{award.competition_name}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs font-black text-yellow-600 bg-yellow-50 px-2.5 py-1 rounded-full uppercase tracking-tighter">
                        {award.award_level}
                      </span>
                      <span className="text-xs font-bold text-gray-400">{award.date}</span>
                    </div>
                  </div>
                  <ExternalLink className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-colors" />
                </div>
              ))
            )}
          </div>

          {/* Subscriptions Section */}
          <div className="pt-8">
            <h2 className="text-xl font-black text-gray-900 flex items-center gap-3 mb-6">
              <Sparkles className="w-6 h-6 text-blue-500" />
              正在备赛 / 订阅赛事
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {subscriptions.length === 0 ? (
                <div className="col-span-full bg-blue-50/50 border-2 border-dashed border-blue-100 rounded-[32px] p-8 text-center text-blue-500 font-bold italic text-sm">
                  还没有订阅任何赛事。在首页发现并订阅感兴趣的比赛吧！
                </div>
              ) : (
                subscriptions.map(sub => (
                  <div key={sub.id} className="bg-white p-5 rounded-[28px] border border-gray-100 shadow-sm flex flex-col gap-3 group hover:border-blue-200 transition-all">
                    <div className="flex justify-between items-start">
                      <div className="flex gap-2">
                        <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase">{sub.level}</span>
                        <span className="text-[10px] font-black text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full uppercase">{sub.category}</span>
                      </div>
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                    </div>
                    <h4 className="font-black text-gray-900 text-sm line-clamp-1">{sub.name}</h4>
                    <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400">
                      <Calendar className="w-3.5 h-3.5" />
                      截止：{sub.deadline ? sub.deadline.split('T')[0] : '未知'}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Skills Bento */}
        <div className="space-y-6">
           <h2 className="text-xl font-black text-gray-900 flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-purple-500" />
            核心技能
          </h2>
          <div className="bg-white p-6 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
            <div className="flex flex-wrap gap-2">
              {profile.skills.map(skill => (
                <div 
                  key={skill} 
                  className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 group"
                >
                  {skill}
                  {isEditing && (
                    <button onClick={() => removeSkill(skill)} className="text-indigo-300 hover:text-indigo-600">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
              {profile.skills.length === 0 && <p className="text-xs font-bold text-gray-300 italic px-2">尚未添加技能...</p>}
            </div>

            {isEditing && (
              <div className="flex gap-2">
                <input 
                  value={newSkill}
                  onChange={e => setNewSkill(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && addSkill()}
                  placeholder="添加技能..."
                  className="flex-1 h-10 px-4 bg-gray-50 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-600/10"
                />
                <button 
                  onClick={addSkill}
                  className="w-10 h-10 bg-gray-900 text-white rounded-xl flex items-center justify-center shadow-lg shadow-gray-200 active:scale-95 transition-transform"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            )}

            <div className="pt-6 border-t border-gray-50">
              <Button 
                onClick={onGeneratePortfolio}
                className="w-full h-14 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-[24px] font-black text-sm uppercase tracking-widest flex items-center gap-3 shadow-xl shadow-blue-200 hover:scale-[1.02] transition-transform active:scale-[0.98]"
              >
                <FileText className="w-5 h-5" />
                生成作品集
              </Button>
              <p className="text-[10px] text-center text-gray-400 font-bold mt-4 uppercase tracking-[0.2em]">
                One-Click Portfolio Generator
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
