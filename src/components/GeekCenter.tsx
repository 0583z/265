import React, { useEffect } from 'react'; // 🚨 1. 引入 useEffect
import { useAuth } from '@/src/context/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query'; // 🚨 2. 引入 useQueryClient
import { fetchRecentFocusSessions, fetchRecentDailyLogs, supabase } from '@/src/lib/supabaseClient'; // 🚨 3. 确保引入了 supabase 实例
import { LearningCalendar } from './modules/LearningCalendar';
import { GeekWorkstation } from './modules/GeekWorkstation';
import type { Competition } from '@/src/types';

export const GeekCenter: React.FC<{
  competitions?: Competition[],
  subscribedIds?: string[],
  theme: 'light' | 'dark'
}> = ({ competitions = [], subscribedIds = [], theme }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient(); // 🚨 4. 获取 queryClient 实例，用于手动刷新

  // --- 原有的查询逻辑 ---
  const { data: radarRows = [] } = useQuery({
    queryKey: ['focusSessions', user?.id],
    queryFn: () => fetchRecentFocusSessions(user!.id, 45), // ⚠️ 提示：这里的 45 是条数限制，如果记录消失，可以考虑调大
    enabled: !!user?.id,
  });

  const { data: dailyLogs = [] } = useQuery({
    queryKey: ['dailyLogs', user?.id],
    queryFn: () => fetchRecentDailyLogs(user!.id, 45),
    enabled: !!user?.id,
  });

  // 🚨 5. 核心：添加实时监听逻辑
  useEffect(() => {
    if (!user?.id) return;

    // 开启实时频道
    const channel = supabase
      .channel('geek-realtime-sync')
      .on(
        'postgres_changes',
        {
          event: '*', // 监听所有变化（插入、更新、删除）
          schema: 'public',
          table: 'daily_logs', // 对应您的打卡日志表
          filter: `user_id=eq.${user.id}`
        },
        () => {
          // 只要数据库变了，就命令 React Query 重新抓取日志
          queryClient.invalidateQueries({ queryKey: ['dailyLogs', user.id] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'focus_sessions', // 对应您的专注会话表
          filter: `user_id=eq.${user.id}`
        },
        () => {
          // 重新抓取专注数据
          queryClient.invalidateQueries({ queryKey: ['focusSessions', user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel); // 组件卸载时断开
    };
  }, [user?.id, queryClient]);

  if (!user) return null;

  // --- 下面保持不变 ---
  return (
    <div className={`min-h-screen p-8 transition-colors duration-300 ${theme === 'dark' ? 'bg-zinc-950 text-zinc-100' : 'bg-white text-gray-900'}`}>
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 h-full">
          <GeekWorkstation userId={user.id} theme={theme} />
        </div>
        <div className="lg:col-span-4 h-full">
          <LearningCalendar
            userId={user.id}
            sessions={radarRows as any}
            logs={dailyLogs as any}
            competitions={competitions}
            subscribedIds={subscribedIds}
            theme={theme}
          />
        </div>
      </div>
    </div>
  );
};