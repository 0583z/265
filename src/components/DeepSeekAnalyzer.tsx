import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Sparkles, Loader2, Check, AlertCircle, Terminal, Cpu, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { useAuth } from '@/src/context/AuthContext';
import {
  buildUserContextMarkdown,
  fetchRecentDailyLogs,
  fetchRecentFocusSessions,
  fetchUserSkills,
  persistAiMemory,
  searchAiMemoriesRag,
  supabaseClient,
} from '@/src/lib/supabaseClient';
import { detectAnalyzerIntent } from '@/src/lib/intentDetect';
import {
  buildPersonaProfile,
  detectCcfCspExperience,
  detectLangPreference,
  type UserPreference,
} from '@/src/lib/ai-persona';

export type ExtractedContest = {
  title: string;
  deadline: string;
  category: string;
  link: string;
  description: string;
};

export interface DeepSeekAnalyzerProps {
  onSuccess: (data: ExtractedContest) => void;
  externalDraft?: string | null;
  onExternalDraftConsumed?: () => void;
}

type GrowthPack = { md: string; weights: Record<string, number>; hadVectorHits: boolean };

export const DeepSeekAnalyzer: React.FC<DeepSeekAnalyzerProps> = ({
  onSuccess,
  externalDraft,
  onExternalDraftConsumed,
}) => {
  const { user, isAuthenticated } = useAuth();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [assistantMessage, setAssistantMessage] = useState('');
  const [contextMarkdown, setContextMarkdown] = useState('');
  const [personaWeights, setPersonaWeights] = useState<Record<string, number> | null>(null);
  const [contextReady, setContextReady] = useState(false);
  const [lastIntent, setLastIntent] = useState<ReturnType<typeof detectAnalyzerIntent> | null>(null);
  const [vectorHitsLoaded, setVectorHitsLoaded] = useState(false);
  const [analyzePhase, setAnalyzePhase] = useState<'idle' | 'intent' | 'chat'>('idle');
  const [apiErrorDetail, setApiErrorDetail] = useState<string | null>(null);

  const intent = useMemo(() => detectAnalyzerIntent(input), [input]);

  const loadGrowthContext = useCallback(
    async (conversationSnippet: string): Promise<GrowthPack | null> => {
      if (!user?.id) return null;
      const { data: sessionData } = await supabaseClient.auth.getSession();
      if (!sessionData.session) return null;

      const [skills, focus, logs] = await Promise.all([
        fetchUserSkills(user.id),
        fetchRecentFocusSessions(user.id, 14),
        fetchRecentDailyLogs(user.id, 8),
      ]);

      const logBlob = logs.map((l) => l.summary || '').join('\n');
      const skillNames = skills.map((s) => s.skill_name);
      const pref: UserPreference = {
        ccfCspLevel: detectCcfCspExperience(logBlob),
        primaryLang: detectLangPreference(skillNames),
        targetGoal: '通用',
        learningStyle: '混合',
      };

      const persona = buildPersonaProfile(conversationSnippet || '备赛咨询', pref, skills);

      let vectorMemories: Awaited<ReturnType<typeof searchAiMemoriesRag>> = [];
      const token = sessionData.session.access_token;
      const q = conversationSnippet.trim();
      if (token && q.length > 8) {
        vectorMemories = await searchAiMemoriesRag(token, q, { match_threshold: 0.2, match_count: 6 });
      }

      const md = buildUserContextMarkdown({
        skills,
        focus,
        logs,
        memoryTopics: persona.memorySignals.slice(0, 4).map((m) => m.topic),
        vectorMemories,
      });
      return {
        md,
        weights: persona.weights as Record<string, number>,
        hadVectorHits: vectorMemories.length > 0,
      };
    },
    [user?.id],
  );

  const hydrateContext = useCallback(async () => {
    if (!user?.id) {
      setContextMarkdown('');
      setPersonaWeights(null);
      setContextReady(true);
      return;
    }
    try {
      const pack = await loadGrowthContext('');
      if (pack) {
        setContextMarkdown(pack.md);
        setPersonaWeights(pack.weights);
        setVectorHitsLoaded(pack.hadVectorHits);
      } else {
        setVectorHitsLoaded(false);
      }
    } catch (e) {
      console.warn('Context load skipped', e);
      setVectorHitsLoaded(false);
    } finally {
      setContextReady(true);
    }
  }, [user?.id, loadGrowthContext]);

  useEffect(() => {
    void hydrateContext();
  }, [hydrateContext]);

  useEffect(() => {
    if (!externalDraft?.trim()) return;
    setInput(externalDraft);
    onExternalDraftConsumed?.();
  }, [externalDraft, onExternalDraftConsumed]);

  const handleAnalyze = async () => {
    if (!input.trim()) {
      toast.error('请输入或粘贴内容');
      return;
    }

    const det = detectAnalyzerIntent(input);
    setLastIntent(det);
    setApiErrorDetail(null);

    setLoading(true);
    setAnalyzePhase('intent');
    setStatus('idle');

    try {
      let md = contextMarkdown;
      let weights = personaWeights;
      const fresh = await loadGrowthContext(input);
      if (fresh) {
        md = fresh.md;
        weights = fresh.weights;
        setContextMarkdown(md);
        setPersonaWeights(weights);
        setVectorHitsLoaded(fresh.hadVectorHits);
      }

      let resolvedMode: 'extract' | 'strategy' = det.mode;
      try {
        const intentRes = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rawText: input, mode: 'intent_detect' }),
        });
        const ij = (await intentRes.json()) as {
          analyzerMode?: string;
          intentConfidence?: number;
          error?: string;
        };
        if (intentRes.ok && (ij.analyzerMode === 'strategy' || ij.analyzerMode === 'extract')) {
          if ((ij.intentConfidence ?? 0.55) >= 0.45) {
            resolvedMode = ij.analyzerMode === 'strategy' ? 'strategy' : 'extract';
          }
        }
      } catch {
        /* 保持正则结果 */
      }

      setLastIntent({
        mode: resolvedMode,
        autoTuned: true,
        reasons: [...det.reasons, 'DeepSeek 意图判定已合并'],
      });
      setAnalyzePhase('chat');

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText: input,
          mode: resolvedMode,
          contextMarkdown: md,
          personaWeights: weights || undefined,
        }),
      });

      const data = (await response.json()) as Record<string, unknown>;
      if (!response.ok) {
        const msg = typeof data.error === 'string' ? data.error : `请求失败 (${response.status})`;
        throw new Error(msg);
      }

      if (resolvedMode === 'strategy' && typeof data.strategy === 'string' && data.strategy) {
        setAssistantMessage(data.strategy);
        setStatus('success');
        toast.success('已切换建议模式并生成回答');
        const { data: s2 } = await supabaseClient.auth.getSession();
        const tok2 = s2.session?.access_token;
        if (tok2) {
          void persistAiMemory(
            tok2,
            '备赛策略会话',
            `模型回答：${String(data.strategy).slice(0, 1500)}\n\n用户输入：${input.slice(0, 900)}`,
          );
        }
        return;
      }

      if (typeof data.title === 'string' && data.title) {
        onSuccess(data as ExtractedContest);
        setStatus('success');
        setAssistantMessage('');
        toast.success('AI 提取竞赛数据成功！');
        const { data: s3 } = await supabaseClient.auth.getSession();
        const tok3 = s3.session?.access_token;
        if (tok3) {
          void persistAiMemory(
            tok3,
            '竞赛结构化提取',
            `赛事：${data.title}\n截止：${data.deadline}\n类目：${data.category}\n链接：${data.link}\n简介：${String(data.description || '').slice(0, 800)}`,
          );
        }
        setInput('');
        setTimeout(() => setStatus('idle'), 3000);
      } else {
        throw new Error('未能解析出有效赛事字段，请换一段更完整的公告原文。');
      }
    } catch (error) {
      console.error('AI Error:', error);
      setStatus('error');
      setAssistantMessage('');
      const msg = error instanceof Error ? error.message : '未知错误';
      setApiErrorDetail(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
      setAnalyzePhase('idle');
    }
  };

  const showSmartStrip =
    isAuthenticated &&
    contextReady &&
    input.trim().length > 2 &&
    (intent.autoTuned || intent.mode === 'strategy');

  const displayMode = lastIntent?.mode ?? intent.mode;

  return (
    <div className="bg-white rounded-[32px] p-8 border-2 border-gray-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white border-2 border-gray-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-black text-xl text-gray-900 tracking-tighter uppercase italic">
              DeepSeek AI Analyzer
            </h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                System Ready · 意图自动侦测已启用
              </span>
            </div>
          </div>
        </div>
        <Terminal className="text-gray-200 hidden sm:block" />
      </div>

      <div className="relative group">
        <textarea
          className="w-full h-40 p-5 bg-gray-50 border-2 border-gray-900 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-blue-100 transition-all resize-none placeholder:text-gray-300 font-mono"
          placeholder=">>> 粘贴赛事链接/公告原文，或输入「推荐备赛计划」「怎么做项目」——系统会自动切换模式..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <div className="absolute right-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <kbd className="px-2 py-1 bg-white border border-gray-900 rounded text-[10px] font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            CTRL + V
          </kbd>
        </div>
      </div>

      <AnimatePresence>
        {showSmartStrip && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="mt-4 p-3 rounded-xl border-2 border-emerald-700 bg-emerald-50 text-emerald-900 text-xs font-bold flex flex-col gap-1"
          >
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 shrink-0" />
              <span>智能适配中 · 当前模式：{displayMode === 'strategy' ? '建议模式' : '提取模式'}</span>
            </div>
            <span className="text-[11px] font-semibold text-emerald-800/90 pl-6">
              已加载您的能力画像（雷达 / 专注 / 打卡）
              {vectorHitsLoaded ? ' · 已合并关键词记忆（geek_memory_entries）' : ''}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            <div className="w-6 h-6 rounded-full border border-white bg-blue-500 text-[8px] flex items-center justify-center font-bold text-white uppercase">
              1
            </div>
            <div className="w-6 h-6 rounded-full border border-white bg-blue-600 text-[8px] flex items-center justify-center font-bold text-white uppercase">
              2
            </div>
            <div className="w-6 h-6 rounded-full border border-white bg-blue-700 text-[8px] flex items-center justify-center font-bold text-white uppercase">
              3
            </div>
          </div>
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
            Intent · {displayMode.toUpperCase()}
            {lastIntent?.reasons[0] ? ` · ${lastIntent.reasons[0]}` : ''}
          </span>
        </div>

        <button
          onClick={handleAnalyze}
          disabled={loading || !input.trim()}
          className={`relative group h-14 px-8 rounded-2xl font-black text-sm uppercase tracking-wider transition-all border-2 border-gray-900 overflow-hidden ${
            loading
              ? 'bg-gray-100 cursor-not-allowed'
              : 'bg-blue-600 text-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:translate-x-1 active:shadow-none'
          }`}
        >
          <div className="flex items-center gap-2 relative z-10">
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : status === 'success' ? (
              <Check className="w-5 h-5" />
            ) : (
              <Sparkles className="w-5 h-5" />
            )}
            {loading
              ? analyzePhase === 'intent'
                ? 'DeepSeek 判定意图…'
                : 'DeepSeek 生成中…'
              : status === 'success'
                ? '完成'
                : '开始智能分析'}
          </div>
          {!loading && (
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
          )}
        </button>
      </div>

      <AnimatePresence>
        {assistantMessage && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 p-4 bg-emerald-50 border-2 border-emerald-900 rounded-xl text-emerald-900 text-sm font-bold leading-relaxed"
          >
            AI 建议：{assistantMessage}
          </motion.div>
        )}
        {status === 'error' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 p-4 bg-red-50 border-2 border-red-900 rounded-xl flex items-center gap-3 text-red-900 text-xs font-bold"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>
              系统提示：{apiErrorDetail || '请求失败或服务暂时不可用，请稍后重试。'}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
