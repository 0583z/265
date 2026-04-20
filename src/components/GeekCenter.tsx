import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/src/context/AuthContext';
import { fetchRecentFocusSessions, fetchRecentDailyLogs, type FocusSessionRow, type DailyLogRow } from '@/src/lib/supabaseClient';
import { LearningCalendar } from './modules/LearningCalendar';
import { GeekWorkstation } from './modules/GeekWorkstation';

// 🚨 接收全量比赛和订阅名单
export const GeekCenter: React.FC<{ competitions?: any[], subscribedIds?: string[] }> = ({ competitions = [], subscribedIds = [] }) => {
  const { user } = useAuth();
  const [radarRows, setRadarRows] = useState<FocusSessionRow[]>([]);
  const [dailyLogs, setDailyLogs] = useState<DailyLogRow[]>([]); 

  const refreshAllData = useCallback(async () => {
    if (!user?.id) return;
    const rows = await fetchRecentFocusSessions(user.id, 45).catch(() => []);
    setRadarRows(rows);
    const logs = await fetchRecentDailyLogs(user.id, 45).catch(() => []);
    setDailyLogs(logs);
  }, [user?.id]);

  useEffect(() => { refreshAllData(); }, [refreshAllData]);

  if (!user) return <div className="h-screen bg-zinc-950 text-center py-20 text-zinc-500 font-black">Loading...</div>;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 h-full"><GeekWorkstation userId={user.id} onDataChange={refreshAllData} /></div>
        {/* 🚨 传给日历，让它贴上 DDL 标签 */}
        <div className="lg:col-span-4 h-full"><LearningCalendar userId={user.id} sessions={radarRows} logs={dailyLogs} competitions={competitions} subscribedIds={subscribedIds} /></div>
      </div>
    </div>
  );
};