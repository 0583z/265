import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainCircuit, Send, Loader2, Terminal, User, BookmarkPlus, CheckCircle2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const MODE_OPTIONS = [
  { label: '赛事建议', value: 'suggest' },
  { label: '技术执行', value: 'execute' },
  { label: '备赛计划', value: 'plan' }
] as const;

// 定义聊天消息的结构
interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  modeLabel?: string;
  isStreaming?: boolean;
  saved?: boolean; // 是否已收藏
}

export const DeepSeekAnalyzer: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([{
    id: 'welcome',
    role: 'ai',
    content: '你好，极客！我是你的专属 AI 备赛导师。你可以把冗长的比赛通知发给我，或者直接向我提问关于比赛、技术栈和学习计划的任何问题。',
    modeLabel: '系统提示'
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'suggest' | 'execute' | 'plan'>('suggest');
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // 自动滚动到最新消息
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return toast.error('请输入内容');

    const userMsgId = Date.now().toString();
    const currentInput = input;
    const currentModeLabel = MODE_OPTIONS.find(m => m.value === mode)?.label;
    
    // 1. 插入用户消息
    setMessages(prev => [...prev, { id: userMsgId, role: 'user', content: currentInput }]);
    setInput('');
    setLoading(true);

    const aiMsgId = (Date.now() + 1).toString();
    
    // 2. 预先插入空的 AI 消息准备接收流
    setMessages(prev => [...prev, { 
      id: aiMsgId, 
      role: 'ai', 
      content: '', 
      modeLabel: currentModeLabel, 
      isStreaming: true 
    }]);

    try {
      const response = await fetch('/api/mentor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'analyze', content: currentInput, intent: mode }),
      });

      if (!response.ok) throw new Error('后端请求失败');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error('流加载失败');

      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;
          
          const jsonStr = trimmed.replace('data: ', '').trim();
          if (jsonStr === '[DONE]') continue;
          
          try {
            const data = JSON.parse(jsonStr);
            const chunk = data.choices?.[0]?.delta?.content || '';
            
            // 实时更新当前 AI 消息的内容
            setMessages(prev => prev.map(msg => 
              msg.id === aiMsgId ? { ...msg, content: msg.content + chunk } : msg
            ));
          } catch (e) {
            // 忽略碎片数据
          }
        }
      }
    } catch (err: any) {
      console.error('Frontend Error:', err);
      toast.error('AI 链路中断，请重试');
      setMessages(prev => prev.map(msg => 
        msg.id === aiMsgId ? { ...msg, content: msg.content + '\n\n[网络请求中断，请稍后重试...]' } : msg
      ));
    } finally {
      setMessages(prev => prev.map(msg => 
        msg.id === aiMsgId ? { ...msg, isStreaming: false } : msg
      ));
      setLoading(false);
    }
  };

  // 🚨 核心改造：针对单条气泡的收藏打钩功能
  const handleSaveSpecificMessage = (msgId: string) => {
    const msgToSave = messages.find(m => m.id === msgId);
    if (!msgToSave || !msgToSave.content) return;

    try {
      const saved = JSON.parse(localStorage.getItem('saved_ai_analyses') || '[]');
      const newRecord = {
        id: Date.now(),
        date: new Date().toISOString().split('T')[0],
        modeLabel: msgToSave.modeLabel || '极客对话',
        content: msgToSave.content
      };
      
      localStorage.setItem('saved_ai_analyses', JSON.stringify([newRecord, ...saved]));
      
      // 更新状态：将该消息标记为已保存，改变 UI
      setMessages(prev => prev.map(msg => 
        msg.id === msgId ? { ...msg, saved: true } : msg
      ));
      
      toast.success('该段对话已成功存入【我的档案】✨');
    } catch (e) {
      toast.error('保存失败');
    }
  };

  return (
    <div className="bg-white border-[3px] border-black rounded-[2.5rem] shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] max-w-4xl mx-auto overflow-hidden relative flex flex-col h-[750px]">
      
      {/* 头部 */}
      <div className="p-6 border-b-2 border-gray-100 flex items-center justify-between shrink-0 bg-white z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <BrainCircuit className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black italic tracking-tighter text-black uppercase">DeepSeek Copilot</h2>
            <div className="flex items-center gap-2 mt-1">
              <div className={`w-2 h-2 rounded-full ${loading ? 'bg-amber-500 animate-ping' : 'bg-emerald-500'}`} />
              <span className="text-[10px] font-black uppercase text-zinc-400">Conversational AI Engine v2.0</span>
            </div>
          </div>
        </div>
        <Terminal className="w-6 h-6 text-zinc-200" />
      </div>

      {/* 聊天记录滚动区 */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-50/50">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div 
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              {/* 头像 */}
              <div className="shrink-0 mt-1">
                {msg.role === 'ai' ? (
                  <div className="w-10 h-10 bg-emerald-100 border-2 border-emerald-200 text-emerald-600 rounded-[1rem] flex items-center justify-center">
                    <Sparkles className="w-5 h-5" />
                  </div>
                ) : (
                  <div className="w-10 h-10 bg-zinc-900 text-white rounded-[1rem] flex items-center justify-center shadow-md">
                    <User className="w-5 h-5" />
                  </div>
                )}
              </div>

              {/* 气泡框 */}
              <div className={`max-w-[80%] flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                {msg.role === 'ai' && msg.modeLabel && (
                  <span className="text-[10px] font-black text-gray-400 mb-1 ml-2 uppercase tracking-wider">{msg.modeLabel}</span>
                )}
                
                <div className={`p-5 rounded-[24px] ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white font-bold rounded-tr-sm shadow-md' 
                    : 'bg-white border-2 border-gray-100 text-gray-700 font-medium rounded-tl-sm shadow-sm'
                }`}>
                  <p className="whitespace-pre-wrap leading-relaxed text-sm">
                    {msg.content}
                    {msg.isStreaming && <span className="inline-block w-1.5 h-4 ml-1 bg-emerald-500 animate-pulse align-middle"></span>}
                  </p>
                </div>

                {/* 🚨 单条消息操作栏 (仅对 AI 非加载中且非初始消息显示) */}
                {msg.role === 'ai' && !msg.isStreaming && msg.id !== 'welcome' && (
                  <div className="mt-2 ml-2">
                    <button 
                      onClick={() => !msg.saved && handleSaveSpecificMessage(msg.id)}
                      disabled={msg.saved}
                      className={`flex items-center gap-1.5 text-[11px] font-black px-3 py-1.5 rounded-lg transition-all ${
                        msg.saved 
                          ? 'bg-emerald-50 text-emerald-600 cursor-not-allowed' 
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-900 cursor-pointer'
                      }`}
                    >
                      {msg.saved ? (
                        <><CheckCircle2 className="w-3.5 h-3.5" /> 已存入档案</>
                      ) : (
                        <><BookmarkPlus className="w-3.5 h-3.5" /> 收藏此分析</>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* 底部输入区 */}
      <div className="shrink-0 bg-white p-6 border-t-2 border-gray-100 z-10">
        <div className="flex gap-2 mb-4">
          {MODE_OPTIONS.map(m => (
            <button 
              key={m.value} 
              onClick={() => setMode(m.value)} 
              className={`px-4 py-2 rounded-xl border-2 font-black text-[11px] tracking-widest transition-all ${
                mode === m.value ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-gray-50 border-gray-100 text-gray-400 hover:bg-gray-100'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        
        <div className="relative">
          <textarea 
            value={input} 
            onChange={e => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="粘贴凌乱通知，或追问 AI 细节 (按 Enter 发送)..." 
            className="w-full h-24 bg-gray-50 border-2 border-gray-200 rounded-[1.5rem] py-4 pl-6 pr-20 font-bold text-gray-700 focus:border-blue-500 resize-none shadow-inner outline-none transition-all custom-scrollbar" 
          />
          <Button 
            onClick={handleSend} 
            disabled={loading || !input.trim()} 
            className="absolute right-3 bottom-3 w-12 h-12 rounded-[1rem] bg-blue-600 hover:bg-blue-500 text-white shadow-md disabled:opacity-50 disabled:bg-gray-400 p-0 flex items-center justify-center transition-all"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-0.5" />}
          </Button>
        </div>
      </div>

    </div>
  );
};