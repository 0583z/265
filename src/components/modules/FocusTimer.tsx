import React, { useState, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw, Clock, Target, Code, Trophy, PenTool, Network } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { supabaseClient } from '@/src/lib/supabaseClient';

const CATEGORIES = [
  { id: '开发', icon: Code },
  { id: '算法', icon: Trophy },
  { id: 'UI', icon: PenTool },
  { id: '架构', icon: Network },
];

export const FocusTimer: React.FC<{ userId: string | undefined; onSessionComplete?: () => void }> = ({ userId, onSessionComplete }) => {
  const [targetMin, setTargetMin] = useState(25);
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [sessionTitle, setSessionTitle] = useState('');
  const [selectedCat, setSelectedCat] = useState('开发');

  const save = useCallback(async () => {
    if (!userId) return;
    try {
      const { error } = await supabaseClient.from('focus_sessions').insert([{
        user_id: userId,
        duration_minutes: targetMin,
        category: selectedCat,
        session_date: new Date().toISOString().slice(0, 10),
        session_title: sessionTitle.trim() || null
      }]);
      if (error) throw error;
      toast.success('记录成功');
      if (onSessionComplete) onSessionComplete();
    } catch (e) { toast.error('同步失败'); }
  }, [userId, sessionTitle, targetMin, selectedCat, onSessionComplete]);

  useEffect(() => {
    let interval: any = null;
    if (isActive) {
      interval = setInterval(() => {
        if (seconds > 0) setSeconds(s => s - 1);
        else if (minutes > 0) { setMinutes(m => m - 1); setSeconds(59); }
        else { setIsActive(false); clearInterval(interval); save(); }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, minutes, seconds, save]);

  return (
    <div className="flex flex-col items-center justify-center space-y-8 w-full max-w-sm mx-auto">
      <div className="flex gap-2 w-full justify-between bg-zinc-950 p-2 rounded-2xl border border-zinc-800">
        {CATEGORIES.map(cat => (
          <button key={cat.id} onClick={() => !isActive && setSelectedCat(cat.id)} className={`flex-1 py-2 rounded-xl flex flex-col items-center gap-1 transition-all ${selectedCat === cat.id ? 'bg-emerald-600 text-white shadow-lg' : 'text-zinc-600 hover:text-zinc-400'}`}>
            <cat.icon className="w-4 h-4" />
            <span className="text-[8px] font-black">{cat.id}</span>
          </button>
        ))}
      </div>
      <div className="w-full space-y-2">
        <label className="text-[10px] font-black text-zinc-600 uppercase ml-1 flex items-center gap-2"><Target className="w-3" /> Focus_Task</label>
        <Input value={sessionTitle} onChange={e => setSessionTitle(e.target.value)} placeholder="写下任务标题..." disabled={isActive} className="bg-zinc-950 border-2 border-zinc-800 h-14 rounded-2xl text-white font-bold text-center" />
      </div>
      <div className="text-[100px] font-black text-white tabular-nums leading-none tracking-tighter">
        {String(minutes).padStart(2, '0')}<span className={`${isActive ? 'animate-pulse' : ''} text-emerald-500`}>:</span>{String(seconds).padStart(2, '0')}
      </div>
      {!isActive && (
        <div className="w-full flex items-center gap-4 bg-zinc-950/50 p-4 rounded-2xl border border-zinc-800">
          <Clock className="w-4 text-zinc-500" />
          <input type="range" min="1" max="120" step="5" value={targetMin} onChange={e => { const v = parseInt(e.target.value); setTargetMin(v); setMinutes(v); }} className="flex-1 accent-emerald-500 h-1 bg-zinc-800 appearance-none cursor-pointer" />
          <span className="text-xs font-black text-emerald-500 w-8">{targetMin}m</span>
        </div>
      )}
      <div className="flex gap-4 w-full">
        <Button onClick={() => setIsActive(!isActive)} className="h-16 flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl shadow-xl">{isActive ? <Pause /> : <Play />}</Button>
        <Button onClick={() => { setIsActive(false); setMinutes(targetMin); setSeconds(0); }} variant="outline" className="h-16 w-16 border-2 border-zinc-800 rounded-2xl"><RotateCcw /></Button>
      </div>
    </div>
  );
};