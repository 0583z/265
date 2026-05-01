// src/components/modules/GeekWorkstation.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer, PenLine } from 'lucide-react';
import { DailyPunchIn } from './DailyPunchIn';
import { FocusTimer } from './FocusTimer';

export const GeekWorkstation: React.FC<{
  userId: string | undefined;
  theme?: 'light' | 'dark'
}> = ({ userId, theme = 'light' }) => {
  const [activeTab, setActiveTab] = useState<'focus' | 'punch'>('focus');

  return (
    <div className={`border-2 transition-all duration-300 overflow-hidden shadow-2xl flex flex-col h-full min-h-[600px] 
      ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800 rounded-[2.5rem]' : 'bg-white border-gray-100 rounded-[2.5rem]'}`}>

      <div className={`flex border-b p-3 gap-3 transition-colors duration-300
        ${theme === 'dark' ? 'border-zinc-800 bg-zinc-950/50' : 'border-gray-100 bg-gray-50'}`}>

        <button
          onClick={() => setActiveTab('focus')}
          className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all 
            ${activeTab === 'focus' ? 'bg-emerald-600 text-white shadow-lg' : theme === 'dark' ? 'text-zinc-600 hover:bg-zinc-800' : 'text-gray-400 hover:bg-gray-200'}`}
        >
          <Timer className="w-4 h-4" /> Focus
        </button>

        <button
          onClick={() => setActiveTab('punch')}
          className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all 
            ${activeTab === 'punch' ? 'bg-fuchsia-600 text-white shadow-lg' : theme === 'dark' ? 'text-zinc-600 hover:bg-zinc-800' : 'text-gray-400 hover:bg-gray-200'}`}
        >
          <PenLine className="w-4 h-4" /> Punch
        </button>
      </div>

      <div className="flex-1 p-8 relative flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {activeTab === 'focus' ? (
            <motion.div key="focus" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} className="h-full flex flex-col justify-center">
              {/* 🚨 关键修复：这里必须把 theme 传给 FocusTimer！ */}
              <FocusTimer userId={userId} theme={theme} onSessionComplete={() => setActiveTab('punch')} />
            </motion.div>
          ) : (
            <motion.div key="punch" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="h-full">
              {/* 🚨 关键修复：给女王大人把 theme 传给 DailyPunchIn！ */}
              <DailyPunchIn userId={userId} theme={theme} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="h-1.5 bg-gradient-to-r from-emerald-600 via-fuchsia-600 to-emerald-600 animate-[gradient_3s_linear_infinite] bg-[length:200%_100%]" />
    </div>
  );
};