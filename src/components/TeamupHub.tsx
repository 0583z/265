import { AIUniverseMatcher } from '../components/modules/AIUniverseMatcher';
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabaseClient } from '../lib/supabaseClient';
import {
  applyToTeam,
  createTeam,
  fetchAllTeams,
  fetchTalentPool,
  type TeamRow,
  type UserProfileRow
} from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

export const TeamupHub: React.FC = () => {
  const { user } = useAuth();
  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [talents, setTalents] = useState<UserProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [appliedTeamIds, setAppliedTeamIds] = useState<string[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTeam, setNewTeam] = useState({ title: '', description: '', max_members: 4 });
  const [sessionUid, setSessionUid] = useState<string | null>(null);

  const explainDbError = (err: any, fallback: string) => {
    const msg = String(err?.message || err || '');
    if (msg.includes('row-level security')) return '权限策略拒绝：请修复 RLS。';
    if (msg.includes('does not exist')) return '缺少数据库表。';
    return fallback;
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [teamsData, talentsData] = await Promise.all([fetchAllTeams(), fetchTalentPool()]);
      setTeams(teamsData);
      setTalents(talentsData);
    } catch (e) {
      toast.error(explainDbError(e, '数据同步失败'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    supabaseClient.auth.getUser().then(({ data }) => {
      setSessionUid(data.user?.id || null);
    });
    loadData();
  }, []);

  const handlePublishRecruitment = async () => {
    const uid = sessionUid || user?.id;
    if (!uid) return toast.error('请先登录');
    setCreating(true);
    try {
      await createTeam({
        title: newTeam.title.trim(),
        description: newTeam.description.trim(),
        max_members: Number(newTeam.max_members) || 4
      });
      toast.success('招募发布成功');
      setShowCreateForm(false);
      await loadData();
    } catch (e: any) {
      toast.error(explainDbError(e, '发布失败'));
    } finally {
      setCreating(false);
    }
  };

  const handleApplyJoin = async (teamId: string, teamTitle: string) => {
    const uid = sessionUid || user?.id;
    if (!uid) return toast.error('请先登录');
    try {
      await applyToTeam(teamId, uid, '我希望加入团队并承担开发任务。');
      setAppliedTeamIds((prev) => [...prev, teamId]);
      toast.success(`已申请「${teamTitle}」`);
    } catch (e: any) {
      toast.error(explainDbError(e, '申请失败'));
    }
  };

  const getSkillMap = (text: string) => {
    const lower = text.toLowerCase();
    return {
      algo: lower.includes('算法') || lower.includes('c++') || lower.includes('python'),
      ui: lower.includes('ui') || lower.includes('设计'),
      backend: lower.includes('后端') || lower.includes('架构'),
    };
  };

  const getComplement = (team: any) => {
    const source = `${team.title || ''} ${team.description || ''}`;
    const map = getSkillMap(source);
    const algorithmScore = map.algo ? 90 : 45;
    const uiScore = map.ui ? 80 : 10;
    const backendScore = map.backend ? 85 : 40;
    const complementRate = Math.max(15, 100 - (Math.max(algorithmScore, uiScore, backendScore) - Math.min(algorithmScore, uiScore, backendScore)));

    let suggestion = '建议补充成员。';
    if (uiScore <= algorithmScore && uiScore <= backendScore) suggestion = '该队目前算法值高，建议加入 UI/前端同学。';
    else if (algorithmScore <= uiScore && algorithmScore <= backendScore) suggestion = '该队视觉较强，建议补充算法成员。';

    return { algorithmScore, uiScore, backendScore, complementRate, suggestion };
  };

  if (loading) return <div className="py-20 text-center font-black text-zinc-500 animate-pulse uppercase">Geek_Syncing...</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-700">
      {/* 左侧：组队大厅列表 */}
      <div className="lg:col-span-8 space-y-6">
        <div className="flex items-center justify-between bg-zinc-900 p-8 rounded-[32px] border border-zinc-800">
          <div>
            <h2 className="text-2xl font-black text-white italic flex items-center gap-3">
              <Users className="text-blue-500" /> 组队大厅
            </h2>
            <p className="text-xs text-zinc-500 font-bold mt-1">QUEST & SQUAD BOARD</p>
          </div>
          <Button onClick={() => setShowCreateForm((v) => !v)} className="bg-blue-600 text-white rounded-2xl px-6 h-12 font-black">
            <Plus className="w-4 h-4 mr-2" /> 发布招募
          </Button>
        </div>

        {showCreateForm && (
          <div className="bg-zinc-900 p-6 rounded-[24px] border border-zinc-800 space-y-4">
            <input
              value={newTeam.title}
              onChange={(e) => setNewTeam((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="队伍标题"
              className="w-full h-12 rounded-xl bg-zinc-950 border border-zinc-800 px-4 text-sm font-bold text-white outline-none"
            />
            <textarea
              value={newTeam.description}
              onChange={(e) => setNewTeam((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="招募描述"
              className="w-full h-24 rounded-xl bg-zinc-950 border border-zinc-800 px-4 py-3 text-sm font-bold text-white outline-none resize-none"
            />
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={newTeam.max_members}
                onChange={(e) => setNewTeam((prev) => ({ ...prev, max_members: Number(e.target.value) }))}
                className="w-24 h-10 rounded-xl bg-zinc-950 border border-zinc-800 px-3 text-sm font-bold text-white outline-none"
              />
              <Button onClick={handlePublishRecruitment} disabled={creating} className="ml-auto bg-emerald-600 text-white rounded-xl h-10 px-5 font-black">
                {creating ? '发布中...' : '确认发布'}
              </Button>
            </div>
          </div>
        )}

        <div className="grid gap-4">
          {teams.map(team => (
            <motion.div whileHover={{ y: -4 }} key={team.id} className="bg-zinc-900 p-8 rounded-[32px] border border-zinc-800">
              {(() => {
                const fit = getComplement(team);
                return (
                  <>
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-black text-white">{team.title}</h3>
                      <span className="text-[10px] font-black text-blue-400 bg-blue-400/10 px-2 py-1 rounded-lg">1/{team.max_members}</span>
                    </div>
                    <p className="text-zinc-400 text-sm mb-6">{team.description}</p>
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 mb-5">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">技能互补率</span>
                        <span className="text-sm font-black text-white">{fit.complementRate}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-zinc-800 overflow-hidden mb-3">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${fit.complementRate}%` }} />
                      </div>
                      <p className="mt-3 text-[11px] font-bold text-amber-300">{fit.suggestion}</p>
                    </div>
                    <div className="flex justify-end pt-6 border-t border-zinc-800">
                      <Button onClick={() => handleApplyJoin(team.id, team.title)} className="bg-white text-black rounded-xl h-10 px-6 font-black text-xs">
                        {appliedTeamIds.includes(team.id) ? '已申请' : '申请加入'}
                      </Button>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          ))}
        </div>
      </div>

      {/* 右侧侧边栏：集成 AI 星系匹配引擎 */}
      <div className="lg:col-span-4">
        <AIUniverseMatcher />
      </div>
    </div>
  );
};