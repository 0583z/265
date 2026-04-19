import React, { useState } from 'react';
import { Mic, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { supabaseClient } from '@/src/lib/supabaseClient';
import { refreshGrowthStreak } from '@/src/lib/growthModel';
import { useMentor } from '@/src/context/MentorContext';

type Props = {
  userId: string | undefined;
};

export const DailyPunchIn: React.FC<Props> = ({ userId }) => {
  const { notifyPunchComplete } = useMentor();
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startVoice = () => {
    const w = window as unknown as {
      SpeechRecognition?: new () => {
        lang: string;
        continuous: boolean;
        interimResults: boolean;
        onstart: (() => void) | null;
        onend: (() => void) | null;
        onerror: (() => void) | null;
        onresult: ((ev: { results: { 0: { 0: { transcript: string } } } }) => void) | null;
        start: () => void;
      };
      webkitSpeechRecognition?: new () => {
        lang: string;
        continuous: boolean;
        interimResults: boolean;
        onstart: (() => void) | null;
        onend: (() => void) | null;
        onerror: (() => void) | null;
        onresult: ((ev: { results: { 0: { 0: { transcript: string } } } }) => void) | null;
        start: () => void;
      };
    };
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) {
      toast.error('当前浏览器不支持语音识别');
      return;
    }
    const rec = new SR();
    rec.lang = 'zh-CN';
    rec.continuous = false;
    rec.interimResults = false;
    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);
    rec.onerror = () => {
      setListening(false);
      toast.error('语音识别失败');
    };
    rec.onresult = (ev) => {
      const said = ev.results[0]?.[0]?.transcript || '';
      if (said) setText((t) => (t ? `${t}\n` : '') + said);
    };
    rec.start();
  };

  const submit = async () => {
    if (!userId) {
      toast.error('请先登录');
      return;
    }
    if (!text.trim()) {
      toast.error('写几句心得吧');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data: sess } = await supabaseClient.auth.getSession();
      if (!sess.session) throw new Error('未登录');

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText: text,
          mode: 'structured_log',
        }),
      });
      const data = (await res.json()) as { summary?: string; error?: string; wins?: string; blockers?: string; mood_score?: number; energy_score?: number };
      if (!res.ok) throw new Error(data.error || `AI 请求失败 (${res.status})`);
      if (!data.summary) throw new Error('AI 未返回结构化字段');

      const logDate = new Date().toISOString().slice(0, 10);
      const { error } = await supabaseClient.from('daily_logs').upsert(
        {
          user_id: userId,
          log_date: logDate,
          summary: data.summary,
          wins: data.wins || '',
          blockers: data.blockers || '',
          mood_score: Number(data.mood_score) || 3,
          energy_score: Number(data.energy_score) || 3,
        },
        { onConflict: 'user_id,log_date' },
      );
      if (error) throw error;
      await refreshGrowthStreak(userId);
      void notifyPunchComplete({ summary: data.summary });
      toast.success('打卡已转为结构化备赛日志');
      setText('');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '提交失败';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-[28px] border-2 border-gray-900 bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-3">
      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-500">
        <FileText className="w-4 h-4" />
        DailyPunchIn
      </div>
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="语音或键盘输入今日备赛心得…"
        className="min-h-[120px] border-2 border-gray-900 rounded-xl font-medium"
      />
      {error && <p className="text-xs font-bold text-red-600">{error}</p>}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1 h-11 rounded-xl font-black border-2 border-gray-900"
          onClick={startVoice}
          disabled={listening || loading}
        >
          <Mic className="w-4 h-4 mr-2" />
          {listening ? '聆听中…' : '语音输入'}
        </Button>
        <Button className="flex-1 h-11 rounded-xl font-black bg-emerald-600" onClick={() => void submit()} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'AI 结构化'}
        </Button>
      </div>
    </div>
  );
};
