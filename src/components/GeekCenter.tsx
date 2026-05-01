// src/components/GeekCenter.tsx
import React from 'react';
import { useAuth } from '@/src/context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { fetchRecentFocusSessions, fetchRecentDailyLogs } from '@/src/lib/supabaseClient';
import { LearningCalendar } from './modules/LearningCalendar';
import { GeekWorkstation } from './modules/GeekWorkstation';
import type { Competition } from '@/src/types';

export const GeekCenter: React.FC<{
  competitions?: Competition[],
  subscribedIds?: string[],
  theme: 'light' | 'dark'
}> = ({ competitions = [], subscribedIds = [], theme }) => {
  const { user } = useAuth();

  const { data: radarRows = [] } = useQuery({
    queryKey: ['focusSessions', user?.id],
    queryFn: () => fetchRecentFocusSessions(user!.id, 45),
    enabled: !!user?.id,
  });

  const { data: dailyLogs = [] } = useQuery({
    queryKey: ['dailyLogs', user?.id],
    queryFn: () => fetchRecentDailyLogs(user!.id, 45),
    enabled: !!user?.id,
  });

  if (!user) return null;

  return (
    <div className={`min-h-screen p-8 transition-colors duration-300 ${theme === 'dark' ? 'bg-zinc-950 text-zinc-100' : 'bg-white text-gray-900'}`}>
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 h-full">
          <GeekWorkstation userId={user.id} theme={theme} />
        </div>
        <div className="lg:col-span-4 h-full">
          {/* 🚨 女王大人特批：使用 as any 强行镇压类型冲突 */}
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