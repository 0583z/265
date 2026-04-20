import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Sparkles, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabaseClient } from '../lib/supabaseClient';
import {
  applyToTeam,
  createTeam,
  fetchAllTeams,
  fetchTalentPool,
  inviteTalentToTeam,
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
  const [invitedTalentIds, setInvitedTalentIds] = useState<string[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTeam, setNewTeam] = useState({ title: '', description: '', max_members: 4 });
  const [sessionUid, setSessionUid] = useState<string | null>(null);

  const explainDbError = (err: any, fallback: string) => {
    const msg = String(err?.message || err || '');
    if (msg.includes('row-level security')) return '权限策略拒绝：请在 Supabase 执行修复 SQL（teams / team_applications / team_invites 的 RLS）。';
    if (msg.includes('does not exist') || msg.includes('relation')) return '缺少数据库表：请先创建 teams、team_applications、team_invites。';
    if (msg.includes('null value in column "leader_id"')) return 'teams.leader_id 没有默认值，请重新执行 hotfix SQL（含 alter column default auth.uid()）。';
    if (msg.includes('invalid input syntax')) return '数据类型不匹配：请执行强制重建 teams 结构 SQL。';
    if (msg.includes('duplicate key')) return '检测到重复主键/唯一键冲突，请执行强制重建 teams 结构 SQL。';
    return fallback;
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [teamsData, talentsData] = await Promise.all([fetchAllTeams(), fetchTalentPool()]);
      setTeams(teamsData);
      setTalents(talentsData);
    } catch (e) {
      console.error(e);
      toast.error(explainDbError(e, '数据同步失败，请检查数据库表与权限'));
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
    if (!uid) return toast.error('请先登录 Supabase 账号后发布招募');
    if (!newTeam.title.trim() || !newTeam.description.trim()) return toast.error('请填写完整招募信息');
    setCreating(true);
    try {
      await createTeam({
        title: newTeam.title.trim(),
        description: newTeam.description.trim(),
        max_members: Number(newTeam.max_members) || 4
      });
      toast.success('招募发布成功');
      setShowCreateForm(false);
      setNewTeam({ title: '', description: '', max_members: 4 });
      await loadData();
    } catch (e: any) {
      console.error('create team error:', e);
      toast.error(explainDbError(e, '发布失败，请检查 teams 表和策略'));
    } finally {
      setCreating(false);
    }
  };

  const handleApplyJoin = async (teamId: string, teamTitle: string) => {
    const uid = sessionUid || user?.id;
    if (!uid) return toast.error('请先登录后申请加入');
    try {
      await applyToTeam(teamId, uid, '我希望加入团队并承担实际开发任务。');
      setAppliedTeamIds((prev) => (prev.includes(teamId) ? prev : [...prev, teamId]));
      toast.success(`已发送申请到「${teamTitle}」`);
    } catch (e: any) {
      toast.error(explainDbError(e, '申请失败，请检查 team_applications 表和策略'));
    }
  };

  const handleInviteTalent = async (talentId: string, nickname: string | null) => {
    const uid = sessionUid || user?.id;
    if (!uid) return toast.error('请先登录后邀约');
    const myTeam = teams.find((team) => team.leader_id === uid);
    if (!myTeam) return toast.info('请先发布一个队伍，再邀请人才加入');
    try {
      await inviteTalentToTeam({
        team_id: myTeam.id,
        invitee_id: talentId,
        inviter_id: uid,
        message: '我们正在冲刺赛事，期待你加入补齐关键能力。'
      });
      setInvitedTalentIds((prev) => (prev.includes(talentId) ? prev : [...prev, talentId]));
      toast.success(`已发送邀约给 ${nickname || '该同学'}`);
    } catch (e: any) {
      toast.error(explainDbError(e, '邀约失败，请检查 team_invites 表和策略'));
    }
  };

  const getSkillMap = (text: string) => {
    const lower = text.toLowerCase();
    return {
      algo: lower.includes('算法') || lower.includes('c++') || lower.includes('python'),
      ui: lower.includes('ui') || lower.includes('设计') || lower.includes('前端'),
      backend: lower.includes('后端') || lower.includes('架构') || lower.includes('服务'),
    };
  };

  const getComplement = (team: any) => {
    const source = `${team.title || ''} ${team.description || ''}`;
    const map = getSkillMap(source);
    const algorithmScore = map.algo ? 90 : 45;
    const uiScore = map.ui ? 80 : 10;
    const backendScore = map.backend ? 85 : 40;
    const minScore = Math.min(algorithmScore, uiScore, backendScore);
    const maxScore = Math.max(algorithmScore, uiScore, backendScore);
    const complementRate = Math.max(15, 100 - (maxScore - minScore));

    let suggestion = '建议补充具备跨栈协作能力的同学。';
    if (uiScore <= algorithmScore && uiScore <= backendScore) suggestion = '该队目前算法值高，UI 值偏低，建议加入 UI/前端同学。';
    else if (algorithmScore <= uiScore && algorithmScore <= backendScore) suggestion = '该队视觉与工程较强，建议补充算法优化方向成员。';
    else if (backendScore <= algorithmScore && backendScore <= uiScore) suggestion = '建议补充后端架构同学，提升交付稳定性。';

    return { algorithmScore, uiScore, backendScore, complementRate, suggestion };
  };

  if (loading) return <div className="py-20 text-center font-black text-zinc-500 animate-pulse uppercase">Geek_Syncing...</div>;
  const publicTeams = teams.filter((team) => team.leader_id !== (sessionUid || user?.id));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-700">
      <div className="lg:col-span-8 space-y-6">
        <div className="flex items-center justify-between bg-zinc-900 p-8 rounded-[32px] border border-zinc-800">
          <div>
            <h2 className="text-2xl font-black text-white italic flex items-center gap-3">
              <Users className="text-blue-500" /> 组队大厅
            </h2>
            <p className="text-xs text-zinc-500 font-bold mt-1">QUEST & SQUAD BOARD</p>
          </div>
          <Button onClick={() => setShowCreateForm((v) => !v)} className="bg-blue-600 text-white rounded-2xl px-6 h-12 font-black">
            <Plus className="w-4 h-4 mr-2" />
            发布招募
          </Button>
        </div>

        {showCreateForm && (
          <div className="bg-zinc-900 p-6 rounded-[24px] border border-zinc-800 space-y-4">
            <input
              value={newTeam.title}
              onChange={(e) => setNewTeam((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="队伍标题（例如：蓝桥杯后端冲刺队）"
              className="w-full h-12 rounded-xl bg-zinc-950 border border-zinc-800 px-4 text-sm font-bold text-white outline-none"
            />
            <textarea
              value={newTeam.description}
              onChange={(e) => setNewTeam((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="招募描述（说明当前技能与缺口）"
              className="w-full h-24 rounded-xl bg-zinc-950 border border-zinc-800 px-4 py-3 text-sm font-bold text-white outline-none resize-none"
            />
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-zinc-500">人数上限</span>
              <input
                type="number"
                min={2}
                max={10}
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
          {teams.length === 0 && (
            <div className="bg-zinc-900 p-10 rounded-[32px] border border-zinc-800 text-center text-zinc-500 font-bold">
              暂无可加入队伍。你可以先发布你的第一个招募。
            </div>
          )}
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
                <div className="text-[11px] font-bold text-zinc-400 flex items-center gap-4">
                  <span>算法 {fit.algorithmScore}</span>
                  <span>UI {fit.uiScore}</span>
                  <span>后端 {fit.backendScore}</span>
                </div>
                <p className="mt-3 text-[11px] font-bold text-amber-300">{fit.suggestion}</p>
              </div>
              <div className="flex justify-between items-center pt-6 border-t border-zinc-800">
                <span className="text-xs font-bold text-zinc-500">队长: {team.leader?.nickname}</span>
                <Button
                  onClick={() => handleApplyJoin(team.id, team.title)}
                  className="bg-white text-black rounded-xl h-10 px-6 font-black text-xs"
                >
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

      <div className="lg:col-span-4">
        <div className="bg-zinc-950 p-8 rounded-[40px] border border-zinc-900">
          <h2 className="text-xl font-black italic flex items-center gap-2 mb-8 text-white">
            <Sparkles className="text-blue-500" /> 人才雷达
          </h2>
          <div className="space-y-3 mb-6">
            <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">公开招募雷达</div>
            {publicTeams.length === 0 ? (
              <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl text-xs text-zinc-500 font-bold">
                目前还没有其他同学发布公开招募。
              </div>
            ) : (
              publicTeams.slice(0, 3).map((team) => (
                <div key={`radar-${team.id}`} className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl">
                  <div className="text-xs font-black text-white line-clamp-1">{team.title}</div>
                  <p className="text-[10px] text-zinc-500 mt-1 line-clamp-2">{team.description}</p>
                  <Button
                    onClick={() => handleApplyJoin(team.id, team.title)}
                    className="w-full mt-3 bg-zinc-800 hover:bg-blue-600 h-8 rounded-xl text-[10px] font-black text-white transition-all"
                  >
                    申请该招募
                  </Button>
                </div>
              ))
            )}
          </div>
          <div className="space-y-4">
            {talents.length === 0 && (
              <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-3xl text-xs text-zinc-500 font-bold">
                暂无人开放组队状态，请稍后刷新或引导同学在档案中开启组队。
              </div>
            )}
            {talents.map(talent => (
              <div key={talent.id} className="bg-zinc-900 border border-zinc-800 p-5 rounded-3xl">
                <h4 className="text-sm font-black text-white">{talent.nickname}</h4>
                <p className="text-[10px] font-bold text-zinc-500 uppercase mb-4">{talent.major}</p>
                <Button
                  onClick={() => handleInviteTalent(talent.id, talent.nickname)}
                  className="w-full bg-zinc-800 hover:bg-blue-600 h-9 rounded-xl text-[10px] font-black text-white transition-all"
                >
                  {invitedTalentIds.includes(talent.id) ? '已邀约' : '邀约组队'}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};