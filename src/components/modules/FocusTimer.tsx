import React, { useState, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw, Clock, Target, Code, Trophy, PenTool, Network } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { supabase } from '@/src/lib/supabase'; // 🚨 统一引用
import { useQueryClient } from '@tanstack/react-query';

const CATEGORIES = [
  { id: '开发', icon: Code },
  { id: '算法', icon: Trophy },
  { id: 'UI', icon: PenTool },
  { id: '架构', icon: Network },
];

export const FocusTimer: React.FC<{
  userId: string | undefined;
  onSessionComplete?: () => void;
  theme?: 'light' | 'dark';
}> = ({ userId, onSessionComplete, theme = 'light' }) => {
  const queryClient = useQueryClient();
  const [targetMin, setTargetMin] = useState(25);
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [sessionTitle, setSessionTitle] = useState('');
  const [selectedCat, setSelectedCat] = useState('开发');

  const isDark = theme === 'dark';

  // 🚨 核心存储逻辑：确保数据流向云端并通知日历刷新
  const save = useCallback(async () => {
    if (!userId) return;
    try {
      const { error } = await supabase.from('focus_sessions').insert([{
        user_id: userId,
        duration_minutes: targetMin,
        category: selectedCat,
        // 修正 2026 年时区问题，确保日期匹配
        session_date: new Date().toLocaleDateString('en-CA'),
        session_title: sessionTitle.trim() || '未命名专注任务'
      }]);

      if (error) throw error;

      // 🚨 关键：通知 React Query 重新拉取日历数据
      await queryClient.invalidateQueries({ queryKey: ['focusSessions', userId] });
      toast.success('专注数据已同步至云端');

      if (onSessionComplete) onSessionComplete();
    } catch (e) {
      console.error(e);
      toast.error('同步失败，请检查网络或数据库配置');
    }
  }, [userId, sessionTitle, targetMin, selectedCat, queryClient, onSessionComplete]);

  useEffect(() => {
    let interval: any = null;
    if (isActive) {
      interval = setInterval(() => {
        if (seconds > 0) setSeconds(s => s - 1);
        else if (minutes > 0) { setMinutes(m => m - 1); setSeconds(59); }
        else {
          setIsActive(false);
          clearInterval(interval);
          save();
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, minutes, seconds, save]);

  return (
    <div className="flex flex-col items-center justify-center space-y-8 w-full max-w-sm mx-auto transition-colors duration-300">
      {/* 分类选择 */}
      <div className={`flex gap-2 w-full p-2 rounded-2xl border ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-gray-100 border-gray-200'}`}>
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => !isActive && setSelectedCat(cat.id)}
            className={`flex-1 py-2 rounded-xl flex flex-col items-center gap-1 transition-all 
              ${selectedCat === cat.id ? 'bg-emerald-600 text-white shadow-lg' : isDark ? 'text-zinc-600' : 'text-gray-400'}`}
          >
            <cat.icon className="w-4 h-4" />
            <span className="text-[8px] font-black">{cat.id}</span>
          </button>
        ))}
      </div>

      {/* 任务标题 */}
      <div className="w-full space-y-2">
        <label className={`text-[10px] font-black uppercase ml-1 flex items-center gap-2 ${isDark ? 'text-zinc-600' : 'text-gray-400'}`}>
          <Target className="w-3" /> Focus_Task
        </label>
        <Input
          value={sessionTitle} onChange={e => setSessionTitle(e.target.value)}
          placeholder="写下任务标题..." disabled={isActive}
          className={`border-2 h-14 rounded-2xl font-bold text-center ${isDark ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-gray-200 text-black'}`}
        />
      </div>

      {/* 倒计时 - 绝对对比度 */}
      <div className={`text-[100px] font-black tabular-nums leading-none tracking-tighter ${isDark ? 'text-white' : 'text-zinc-950'}`}>
        {String(minutes).padStart(2, '0')}<span className="text-emerald-500">:</span>{String(seconds).padStart(2, '0')}
      </div>

      {!isActive && (
        <div className={`w-full flex items-center gap-4 p-4 rounded-2xl border ${isDark ? 'bg-zinc-950/50 border-zinc-800' : 'bg-gray-100/50 border-gray-200'}`}>
          <Clock className={`w-4 ${isDark ? 'text-zinc-500' : 'text-gray-400'}`} />
          <input
            type="range" min="1" max="120" step="5" value={targetMin}
            onChange={e => { const v = parseInt(e.target.value); setTargetMin(v); setMinutes(v); }}
            className="flex-1 accent-emerald-500"
          />
          <span className={`text-xs font-black ${isDark ? 'text-emerald-500' : 'text-emerald-600'}`}>{targetMin}m</span>
        </div>
      )}

      <div className="flex gap-4 w-full">
        <Button onClick={() => setIsActive(!isActive)} className="h-16 flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl shadow-xl">
          {isActive ? <Pause /> : <Play />}
        </Button>
        <Button
          onClick={() => { setIsActive(false); setMinutes(targetMin); setSeconds(0); }}
          variant="outline"
          className={`h-16 w-16 border-2 rounded-2xl ${isDark ? 'border-zinc-800 bg-zinc-950 text-white' : 'border-gray-200 bg-white text-black'}`}
        >
          <RotateCcw />
        </Button>
      </div>
    </div>
  );
};