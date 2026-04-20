import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainCircuit, Send, Loader2, AlertCircle, Terminal, Zap, RefreshCcw, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export const DeepSeekAnalyzer: React.FC = () => {
  const [input, setInput] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'suggest' | 'execute' | 'plan'>('suggest');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [result]);

  const handleAnalyze = async () => {
    if (!input.trim()) return toast.error('请输入分析内容');

    setLoading(true);
    setHasStarted(true);
    setResult('');
    setError(null);

    try {
      const response = await fetch('/api/mentor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'analyze', content: input, intent: mode }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || `后端请求失败 (${response.status})`);
      }

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
            const content = data.choices?.[0]?.delta?.content || '';
            setResult(prev => prev + content);
          } catch (e) {
            // 忽略碎片数据
          }
        }
      }
    } catch (err: any) {
      console.error('Frontend Error:', err);
      setError(err.message);
      toast.error('AI 链路中断');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border-[3px] border-black rounded-[2.5rem] p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] max-w-4xl mx-auto overflow-hidden relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <BrainCircuit className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black italic tracking-tighter text-black uppercase">DeepSeek Analyzer</h2>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${loading ? 'bg-amber-500 animate-ping' : 'bg-emerald-500'}`} />
              <span className="text-[10px] font-black uppercase text-zinc-400">Stream Protocol v2.0</span>
            </div>
          </div>
        </div>
        <Terminal className="w-6 h-6 text-zinc-200" />
      </div>

      {/* 🚨 这里的 placeholder 已经修改 */}
      <textarea 
        value={input} 
        onChange={e => setInput(e.target.value)} 
        placeholder="输入你想要知道的问题答案" 
        className="w-full h-40 bg-zinc-50 border-2 border-zinc-200 rounded-[1.5rem] p-6 font-bold text-zinc-700 focus:border-blue-500 mb-6 resize-none shadow-inner outline-none transition-all" 
      />

      {/* Mode Switches */}
      <div className="flex gap-3 mb-6">
        {(['suggest', 'execute', 'plan'] as const).map(m => (
          <button 
            key={m} 
            onClick={() => setMode(m)} 
            className={`flex-1 py-3 rounded-xl border-2 font-black text-[10px] uppercase tracking-widest transition-all ${
              mode === m ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm' : 'bg-zinc-50 border-zinc-100 text-zinc-400'
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Result Card */}
      <AnimatePresence>
        {hasStarted && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }} 
            animate={{ opacity: 1, scale: 1 }} 
            className={`rounded-[2rem] border-2 p-8 mb-6 min-h-[200px] relative shadow-2xl transition-colors ${
              error ? 'bg-rose-50 border-rose-200' : 'bg-zinc-950 border-black'
            }`}
          >
            {error ? (
              <div className="flex flex-col items-center justify-center text-center space-y-4 py-6">
                <AlertCircle className="w-12 h-12 text-rose-500" />
                <div>
                  <p className="font-black text-rose-700 uppercase">分析中断</p>
                  <p className="text-xs font-bold text-rose-600/70 mt-1 max-w-sm">{error}</p>
                </div>
                <Button onClick={handleAnalyze} variant="outline" className="border-rose-200 text-rose-700 hover:bg-rose-100">
                  <RefreshCcw className="w-4 h-4 mr-2" /> 重新尝试连接
                </Button>
              </div>
            ) : (
              <div ref={scrollRef} className="h-72 overflow-y-auto custom-scrollbar pr-4">
                <div className="text-zinc-300 font-mono text-sm leading-relaxed whitespace-pre-wrap selection:bg-blue-500/30">
                  {result}
                  {loading && !result && (
                    <div className="flex items-center gap-3 text-blue-400 font-black italic animate-pulse">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      正在接入神经元网络...
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-end">
        <Button 
          onClick={handleAnalyze} 
          disabled={loading} 
          className="bg-blue-600 hover:bg-blue-500 text-white font-black px-12 h-16 rounded-[1.5rem] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] border-2 border-black active:translate-x-1 active:translate-y-1 active:shadow-none transition-all"
        >
          {loading ? <Loader2 className="animate-spin" /> : '开始智能分析'}
        </Button>
      </div>
    </div>
  );
};