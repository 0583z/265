import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare, Bookmark, Trash2, Send,
  Sparkles, User, ListTodo
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export interface DeepSeekAnalyzerProps {
  onSuccess?: () => void;
  externalDraft?: string | null;
  onExternalDraftConsumed?: () => void;
}

export interface ExtractedContest {
  name: string;
  level: string;
  deadline: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  senderName?: string;
}

export const DeepSeekAnalyzer: React.FC<DeepSeekAnalyzerProps> = ({
  externalDraft,
  onExternalDraftConsumed
}) => {
  const { user, isAuthenticated } = useAuth();

  const [view, setView] = useState<'chat' | 'saved'>('chat');
  const [savedItems, setSavedItems] = useState<any[]>([]);

  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      senderName: '系统提示',
      content: '你好，极客。我是专属 AI 备赛导师。底层大模型已通过您的 API Key 成功激活，请发送项目痛点或技术疑惑，我将直接输出实战解决方案。'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, view, isLoading]);

  useEffect(() => {
    if (externalDraft && view === 'chat') {
      let cleanedDraft = externalDraft;

      // 🚨 智能拦截：如果外面传进来的文案带有“帮我分析一下我的【我该如何提升...”这种套娃语病
      // 我们直接在这里洗成干净的 Prompt，无需去改外面组件的代码
      if (cleanedDraft.includes('帮我分析') && cleanedDraft.includes('我该如何提升')) {
        const match = cleanedDraft.match(/「(.*?)」/);
        const skill = match ? match[1] : '核心';
        cleanedDraft = `请结合我的极客雷达图，为我制定一份关于【${skill}】维度（当前进度40%）的专项提升计划。`;
      }

      setInput(cleanedDraft);
      if (onExternalDraftConsumed) onExternalDraftConsumed();
    }
  }, [externalDraft, view, onExternalDraftConsumed]);

  const fetchSavedMemory = async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from('ai_memory')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setSavedItems(data);
      }
    } catch (err) {
      console.error("Fetch saved memory error:", err);
    }
  };

  useEffect(() => {
    if (view === 'saved') {
      fetchSavedMemory();
    }
  }, [view, user?.id]);

  const handleSaveAnalysis = async (content: string) => {
    if (!isAuthenticated || !user?.id) {
      return toast.error('请先登录即可永久收藏 AI 分析！');
    }
    try {
      const autoSummary = content.substring(0, 30) + (content.length > 30 ? '...' : '');

      const { error } = await supabase.from('ai_memory').insert([{
        user_id: user.id,
        content: content,
        summary: autoSummary,
        topic: '赛事建议'
      }]);

      if (error) throw error;
      toast.success('✨ 已成功存入专属灵感库');

      if (view === 'saved') {
        fetchSavedMemory();
      }
    } catch (err: any) {
      toast.error(`收藏失败: ${err.message || '未知错误'}`);
    }
  };

  const handleDeleteSavedItem = async (id: string) => {
    try {
      const { error } = await supabase.from('ai_memory').delete().eq('id', id);
      if (error) throw error;
      setSavedItems(prev => prev.filter(item => item.id !== id));
      toast.success('已移除该记录');
    } catch (err) {
      toast.error('移除失败');
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setIsLoading(true);

    // 🚨 本地智能引擎：专门拦截雷达图的请求，秒回专业分析（不走大模型，避免乱发挥）
    if (userMsg.includes('极客雷达图') && userMsg.includes('专项提升计划')) {
      setTimeout(() => {
        let reply = '';
        if (userMsg.includes('算法')) {
          reply = "🤖 极客私教分析完成：【算法】维度 (当前评估：40%)\n\n您的算法基础已经入门，但要应对高阶比赛还需要系统性突破。以下是为您定制的行动计划：\n\n1. 专项突破 (Weekly)：\n建议本周重点攻克「动态规划」与「图论」，在 LeetCode 或洛谷完成 10 道中等难度真题。\n\n2. 实战检验 (Milestone)：\n建议直接报名最近一次的 CCF CSP 认证，以 200 分为首期目标。\n\n3. 资产沉淀 (Action)：\n在“极客档案”中关联您的 GitHub 算法练习仓库，开启【防篡改专注模式】记录每次提交。这将在未来的资源匹配中为您带来巨大加成。";
        } else if (userMsg.includes('前端') || userMsg.toLowerCase().includes('ui')) {
          reply = "🤖 极客私教分析完成：【前端/UI】维度 (当前评估：40%)\n\n您已经具备了基础的视图构建能力，下一步应向「前端工程化」与「极致体验」进阶：\n\n1. 源码拆解：\n建议阅读 Vue3 或 React 核心源码，理解响应式原理与 Diff 算法。\n\n2. 最佳实践：\n在下个项目中引入 TypeScript + TailwindCSS，并使用 Framer Motion 打磨微交互。\n\n3. 资产沉淀：\n将个人组件库打包发布至 npm，并在本平台进行【成果确权】。";
        } else if (userMsg.includes('工程交付')) {
          reply = "🤖 极客私教分析完成：【工程交付】维度 (当前评估：40%)\n\n告别“能跑就行”，是走向资深极客的必经之路：\n\n1. 规范先行：\n为您的所有 GitHub 仓库配置 ESLint、Prettier 和 Husky 提交拦截。\n\n2. CI/CD 自动化：\n尝试使用 GitHub Actions 编写自动化部署脚本。\n\n3. 架构思维：\n了解并实践微服务架构或 Serverless 部署方案，提升系统的可用性。";
        } else {
          const match = userMsg.match(/【(.*?)】/);
          const skill = match ? match[1] : '综合';
          reply = `🤖 极客私教分析完成：【${skill}】维度 (当前评估：40%)\n\n告别“能跑就行”，走向资深极客：\n\n1. 规范先行：\n配置代码校验规则与提交拦截。\n\n2. 团队基建：\n梳理现有的协作文档，形成标准化 API 契约。\n\n3. 资产沉淀：\n在情报站补全您的实战项目分析报告。`;
        }

        setMessages(prev => [...prev, { role: 'assistant', senderName: '智能分析中枢', content: reply }]);
        setIsLoading(false);
      }, 600);
      return; // 拦截成功，直接返回，不再去请求 DeepSeek API
    }

    // 🚨 真实 API 引擎：常规问题放行，调用 DeepSeek
    try {
      const DEEPSEEK_API_KEY = "sk-08a2dba7a46d45078e79f6a14a32234f";

      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            { role: "system", content: "你是一个专业的极客备赛导师。回答必须精炼、专业，排版清晰。直接给出分为 '专项突破'、'实战检验'、'资产沉淀' 等步骤的行动计划，绝对不要重复用户的原话。" },
            { role: "user", content: userMsg }
          ]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'DeepSeek API 响应异常');
      }

      const data = await response.json();
      const reply = data.choices[0].message.content;

      setMessages(prev => [...prev, {
        role: 'assistant',
        senderName: '智能分析中枢',
        content: reply
      }]);

    } catch (error: any) {
      console.error(error);
      toast.error(`AI 引擎连接异常: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[650px] bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden">

      <div className="px-8 py-5 border-b border-gray-50 flex items-center justify-between bg-white sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-100">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-tighter">
              {view === 'chat' ? 'Conversational AI Engine' : 'Geek Inspiration Vault'}
            </h3>
            <p className="text-[10px] font-bold text-emerald-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              {view === 'chat' ? 'V2.0 LIVE' : 'SYNCED WITH CLOUD'}
            </p>
          </div>
        </div>

        <div className="flex bg-gray-50 p-1 rounded-xl">
          <button
            onClick={() => setView('chat')}
            className={`px-4 py-2 rounded-lg text-[10px] font-black transition-all flex items-center gap-2 ${view === 'chat' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <MessageSquare className="w-3.5 h-3.5" /> 实时对话
          </button>
          <button
            onClick={() => setView('saved')}
            className={`px-4 py-2 rounded-lg text-[10px] font-black transition-all flex items-center gap-2 ${view === 'saved' ? 'bg-white text-orange-500 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Bookmark className="w-3.5 h-3.5" /> 灵感库
          </button>
        </div>
      </div>

      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#F8F9FD] no-scrollbar">
        <AnimatePresence mode="wait">

          {view === 'chat' && (
            <motion.div
              key="chat-view"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-8"
            >
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>

                  {msg.role === 'assistant' && (
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                      <Sparkles className="w-5 h-5 text-emerald-500" />
                    </div>
                  )}

                  <div className={`flex flex-col gap-2 max-w-[75%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    {msg.role === 'assistant' && msg.senderName && (
                      <span className="text-[11px] font-black text-gray-400 pl-1">{msg.senderName}</span>
                    )}

                    <div className={`p-4 rounded-3xl text-sm leading-relaxed font-medium whitespace-pre-wrap ${msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-sm'
                      : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm shadow-sm'
                      }`}>
                      {msg.content}
                    </div>

                    {msg.role === 'assistant' && (
                      <div className="flex items-center gap-2 mt-1">
                        <button
                          onClick={() => handleSaveAnalysis(msg.content)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-[10px] font-black transition-colors"
                        >
                          <Bookmark className="w-3 h-3" /> 收藏分析
                        </button>
                        <button
                          onClick={() => toast.success('已加入待办事项')}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 hover:bg-black text-white rounded-lg text-[10px] font-black transition-colors"
                        >
                          <ListTodo className="w-3 h-3" /> 加入待办
                        </button>
                      </div>
                    )}
                  </div>

                  {msg.role === 'user' && (
                    <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center shrink-0">
                      <User className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-4 justify-start">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5 text-emerald-500 animate-pulse" />
                  </div>
                  <div className="p-4 bg-white border border-gray-100 rounded-3xl rounded-tl-sm shadow-sm flex items-center gap-2">
                    <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce delay-75" />
                    <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce delay-150" />
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {view === 'saved' && (
            <motion.div
              key="saved-view"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-4"
            >
              {savedItems.length > 0 ? savedItems.map((item) => (
                <div key={item.id} className="p-6 bg-white border border-gray-100 rounded-[2rem] shadow-sm hover:shadow-md transition-all group relative">
                  <div className="flex justify-between items-start mb-3">
                    <Badge className="bg-orange-50 text-orange-600 border-none px-3 py-1 text-[10px] font-black">
                      <Bookmark className="w-3 h-3 inline mr-1" /> 收藏建议
                    </Badge>
                    <span className="text-[10px] font-mono text-gray-400">
                      {item.created_at ? item.created_at.split('T')[0] : '刚刚'}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-gray-800 leading-relaxed mb-6 whitespace-pre-wrap">
                    {item.content}
                  </p>

                  <div className="absolute bottom-4 right-6 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button onClick={() => handleDeleteSavedItem(item.id)} variant="ghost" size="sm" className="h-8 rounded-xl text-[10px] font-black text-gray-400 hover:text-red-500 hover:bg-red-50">
                      <Trash2 className="w-3 h-3 mr-1" /> 移除
                    </Button>
                    <Button
                      onClick={() => {
                        setInput(item.content);
                        setView('chat');
                        toast.info('已载入内容，请继续追问');
                      }}
                      size="sm"
                      className="h-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-[10px] font-black text-white shadow-lg shadow-blue-100"
                    >
                      <MessageSquare className="w-3 h-3 mr-1" /> 继续追问
                    </Button>
                  </div>
                </div>
              )) : (
                <div className="h-full flex flex-col items-center justify-center py-32 opacity-60">
                  <div className="w-20 h-20 bg-gray-100 rounded-[2rem] flex items-center justify-center mb-6">
                    <Bookmark className="w-8 h-8 text-gray-400" />
                  </div>
                  <h4 className="text-lg font-black text-gray-900 mb-2">灵感库空空如也</h4>
                  <p className="text-xs font-bold text-gray-500">在对话中点击“收藏分析”，将其永久存入档案。</p>
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {view === 'chat' && (
        <div className="p-6 bg-white border-t border-gray-50">
          <div className="flex items-center gap-3">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  // 🚨 防止中文输入法（拼音打字中）按回车误发送
                  if (e.nativeEvent.isComposing) return;
                  // 🚨 强行拦截表单/换行默认事件，彻底修复页面乱滑
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="输入赛事链接、项目痛点或技术疑惑..."
              className="flex-1 h-14 bg-[#F8F9FD] border-transparent hover:border-blue-500 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-2xl px-6 text-sm font-medium transition-all"
              disabled={isLoading}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="h-14 w-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-xl shadow-blue-500/20 flex-shrink-0 transition-transform active:scale-95"
            >
              <Send className="w-5 h-5 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};