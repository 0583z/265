import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, CheckCircle2, Zap, Smile } from 'lucide-react';
import { toast } from 'sonner';
import { upsertDailyLog } from '@/src/lib/supabaseClient';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import type { DailyLogRow } from '@/src/types';

// 🚨 女王大人，已为您新增 theme 属性接收口
export const DailyPunchIn: React.FC<{
  userId: string | undefined;
  theme?: 'light' | 'dark';
}> = ({ userId, theme = 'light' }) => {
  const [content, setContent] = useState('');
  const [analyzedData, setAnalyzedData] = useState<Partial<DailyLogRow> | null>(null);
  const queryClient = useQueryClient();

  const isDark = theme === 'dark';

  // 🚨 完整保留您的本地存档逻辑
  const saveToLocal = (logData: DailyLogRow) => {
    if (!userId) return;
    const localKey = `daily_logs_${userId}`;
    const existing = JSON.parse(localStorage.getItem(localKey) || '[]');
    const updated = [logData, ...existing.filter((l: any) => l.log_date !== logData.log_date)];
    localStorage.setItem(localKey, JSON.stringify(updated));
  };

  const punchMutation = useMutation({
    mutationFn: async (text: string) => {
      if (!userId) throw new Error("User not found");

      const todayStr = format(new Date(), 'yyyy-MM-dd');

      let finalLogData: DailyLogRow = {
        user_id: userId,
        log_date: todayStr,
        summary: text.slice(0, 100),
        mood_score: 8,
        energy_score: 8,
      };

      try {
        const res = await fetch('/api/mentor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode: 'punch', content: text })
        });
        if (res.ok) {
          const { result } = await res.json();
          const cleanJson = result.replace(/```json/g, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(cleanJson);
          finalLogData = { ...finalLogData, ...parsed };
        }
      } catch (e) { console.warn("AI 提取失败", e); }

      saveToLocal(finalLogData);
      try {
        await upsertDailyLog(finalLogData);
      } catch (e) {
        console.error("云端写入失败，数据已保存在本地", e);
      }

      return finalLogData;
    },
    onSuccess: (data) => {
      setAnalyzedData(data);
      setContent('');
      toast.success('打卡成功，女王大人！');
      // 🚨 强制刷新打卡记录，确保日历瞬间亮起
      queryClient.invalidateQueries({ queryKey: ['dailyLogs', userId] });
    }
  });

  return (
    <div className="flex flex-col h-full space-y-6 max-w-lg mx-auto w-full transition-colors duration-300">
      {/* 标题适配 */}
      <div className={`flex items-center gap-2 font-black text-xs uppercase tracking-widest ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>
        <Sparkles className="w-4 h-4" /> 备赛日志助手
      </div>

      {/* 输入框适配 */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="写下今日进度、技术难点或感悟..."
        className={`w-full h-40 border-2 rounded-2xl p-4 font-bold focus:border-fuchsia-500 transition-all resize-none shadow-inner outline-none
          ${isDark ? 'bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400'}`}
      />

      <Button
        onClick={() => punchMutation.mutate(content)}
        disabled={punchMutation.isPending || !content.trim()}
        className="h-14 bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-black rounded-xl shadow-lg transition-all active:scale-95"
      >
        {punchMutation.isPending ? <Loader2 className="animate-spin w-5 h-5 mr-2" /> : <Sparkles className="w-5 h-5 mr-2" />}
        {punchMutation.isPending ? 'AI 神经元提取中...' : 'AI 结构化分析并打卡'}
      </Button>

      {/* AI 提取卡片适配 */}
      {analyzedData && (
        <div className={`border p-5 rounded-2xl animate-in slide-in-from-bottom-4 shadow-xl transition-all
          ${isDark ? 'bg-zinc-950 border-fuchsia-900/50' : 'bg-white border-fuchsia-200'}`}>
          <div className="flex items-center gap-2 text-fuchsia-500 text-[10px] font-black uppercase tracking-widest mb-3">
            <CheckCircle2 className="w-4 h-4" /> AI_DATA_EXTRACTED
          </div>
          <p className={`font-bold text-sm leading-relaxed mb-4 ${isDark ? 'text-zinc-300' : 'text-gray-700'}`}>
            {analyzedData.summary}
          </p>
          <div className="flex gap-3">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-amber-50 border-amber-100'}`}>
              <Smile className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-black text-amber-500">心情: {analyzedData.mood_score}/10</span>
            </div>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-blue-50 border-blue-100'}`}>
              <Zap className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-black text-blue-500">精力: {analyzedData.energy_score}/10</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};