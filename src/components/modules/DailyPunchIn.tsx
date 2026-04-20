import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, CheckCircle2, Zap, Smile } from 'lucide-react';
import { toast } from 'sonner';
import { upsertDailyLog, type DailyLogRow } from '@/src/lib/supabaseClient';

export const DailyPunchIn: React.FC<{ userId: string | undefined; onDataChange?: () => void }> = ({ userId, onDataChange }) => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [analyzedData, setAnalyzedData] = useState<Partial<DailyLogRow> | null>(null);

  const handlePunch = async () => {
    if (!content.trim()) return toast.error('写点今日进度或感悟吧');
    if (!userId) return;

    setLoading(true);
    setAnalyzedData(null); // 清空上次的结果
    try {
      // 1. 调用 AI 获取结构化 JSON
      const res = await fetch('/api/mentor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'punch', content })
      });
      if (!res.ok) throw new Error('AI 分析失败');
      const { result } = await res.json();
      
      // 2. 清洗 JSON 字符串
      const cleanJson = result.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);

      const logData: DailyLogRow = {
        user_id: userId,
        log_date: new Date().toISOString().slice(0, 10),
        summary: parsed.summary || content.slice(0, 100),
        mood_score: parsed.mood_score || 8,
        energy_score: parsed.energy_score || 8,
        wins: parsed.wins || '',
        blockers: parsed.blockers || ''
      };

      // 3. 落库
      await upsertDailyLog(logData);
      
      // 4. 显示给用户看，并刷新日历
      setAnalyzedData(logData);
      toast.success('打卡成功，AI 已提炼核心数据');
      setContent('');
      if (onDataChange) onDataChange();

    } catch (e: any) {
      console.error(e);
      // 如果 AI 故障，兜底直接存纯文本
      await upsertDailyLog({ user_id: userId, log_date: new Date().toISOString().slice(0, 10), summary: content.slice(0, 100) });
      toast.success('文本已保存（AI 提取暂时不可用）');
      setContent('');
      if (onDataChange) onDataChange();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-6 max-w-lg mx-auto w-full">
      <div className="flex items-center gap-2 text-zinc-400 font-black text-xs uppercase tracking-widest">
        <Sparkles className="w-4 h-4" /> 备赛日志助手
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="写下今日进度、技术难点或感悟..."
        className="w-full h-40 bg-zinc-950 border-2 border-zinc-800 rounded-2xl p-4 font-bold text-white focus:border-fuchsia-500 transition-all resize-none shadow-inner outline-none"
      />

      <Button 
        onClick={handlePunch} 
        disabled={loading || !content.trim()} 
        className="h-14 bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-black rounded-xl shadow-lg active:scale-95 transition-all"
      >
        {loading ? <Loader2 className="animate-spin w-5 h-5 mr-2" /> : <Sparkles className="w-5 h-5 mr-2" />}
        {loading ? 'AI 神经元提取中...' : 'AI 结构化分析并打卡'}
      </Button>

      {/* 🚨 AI 分析结果明文展示给用户 */}
      {analyzedData && (
        <div className="bg-zinc-950 border border-fuchsia-900/50 p-5 rounded-2xl animate-in slide-in-from-bottom-4 shadow-xl">
          <div className="flex items-center gap-2 text-fuchsia-400 text-[10px] font-black uppercase tracking-widest mb-3">
            <CheckCircle2 className="w-4 h-4" /> AI_DATA_EXTRACTED
          </div>
          <p className="text-zinc-300 font-bold text-sm leading-relaxed mb-4">{analyzedData.summary}</p>
          <div className="flex gap-3">
            <div className="flex items-center gap-1.5 bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-800">
              <Smile className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-black text-amber-400">心情: {analyzedData.mood_score}/10</span>
            </div>
            <div className="flex items-center gap-1.5 bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-800">
              <Zap className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-black text-blue-400">精力: {analyzedData.energy_score}/10</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};