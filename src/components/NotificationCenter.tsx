import React from 'react';
import * as Popover from '@radix-ui/react-popover';
import { Bell, Check, Trash2, Calendar, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'deadline' | 'system';
  is_read: number;
  created_at: string;
}

export function NotificationCenter() {
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const { isAuthenticated, user } = useAuth();
  const [loading, setLoading] = React.useState(false);

  const fetchNotifications = async () => {
    if (!isAuthenticated || !user?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setNotifications((data || []) as Notification[]);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase.from('notifications').update({ is_read: 1 }).eq('id', id);
      if (error) throw error;
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, is_read: 1 } : n)
      );
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <Popover.Root onOpenChange={(open) => open && fetchNotifications()}>
      <Popover.Trigger asChild>
        <button className="p-2.5 bg-gray-50 rounded-full text-gray-400 hover:text-gray-900 transition-colors relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
          )}
        </button>
      </Popover.Trigger>
      
      <Popover.Portal>
        <Popover.Content 
          className="z-[100] w-80 sm:w-96 bg-white rounded-[24px] shadow-2xl border border-gray-100 p-0 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right"
          align="end"
          sideOffset={8}
        >
          <div className="p-4 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">通知中心</h3>
            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
              {unreadCount} 条未读
            </span>
          </div>

          <div className="max-h-[70vh] overflow-y-auto no-scrollbar">
            {loading ? (
              <div className="p-12 flex flex-col items-center justify-center gap-2">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">加载中...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Bell className="w-6 h-6 text-gray-200" />
                </div>
                <p className="text-sm font-bold text-gray-400">暂无任何通知</p>
                <p className="text-[10px] text-gray-300 mt-1">订阅感兴趣的赛事，我们将在截止前提醒你</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                <AnimatePresence initial={false}>
                  {notifications.map((n) => (
                    <motion.div 
                      key={n.id} 
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className={`p-4 hover:bg-gray-50 transition-colors relative group ${!n.is_read ? 'bg-blue-50/30' : ''}`}
                    >
                      <div className="flex gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          n.type === 'deadline' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
                        }`}>
                          {n.type === 'deadline' ? <AlertTriangle className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <h4 className="text-xs font-black text-gray-900 truncate">{n.title}</h4>
                            <span className="text-[9px] font-bold text-gray-300 whitespace-nowrap">
                              {new Date(n.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-500 font-medium leading-relaxed mb-2">
                            {n.message}
                          </p>
                          {!n.is_read && (
                            <button 
                              onClick={() => markAsRead(n.id)}
                              className="text-[10px] font-black text-blue-600 hover:text-blue-700 flex items-center gap-1"
                            >
                              <Check className="w-3 h-3" />
                              标为已读
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
          
          <div className="p-3 bg-gray-50/50 border-t border-gray-100 text-center">
            <button className="text-[10px] font-black text-gray-400 hover:text-gray-900 uppercase tracking-widest transition-colors">
              查看全部历史
            </button>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
