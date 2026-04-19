import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/src/context/AuthContext';
import {
  buildUserContextMarkdown,
  fetchRecentDailyLogs,
  fetchRecentFocusSessions,
  fetchUserSkills,
  searchAiMemoriesRag,
  supabaseClient,
} from '@/src/lib/supabaseClient';

type MentorCard = { title: string; body: string; footer?: string };

type MentorContextValue = {
  notifyFocusComplete: (p: { title: string; category: string; durationMinutes: number }) => Promise<void>;
  notifyPunchComplete: (p: { summary: string }) => Promise<void>;
};

const MentorContext = createContext<MentorContextValue | null>(null);

export function useMentor(): MentorContextValue {
  const v = useContext(MentorContext);
  if (!v) {
    return {
      notifyFocusComplete: async () => {},
      notifyPunchComplete: async () => {},
    };
  }
  return v;
}

export const MentorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [card, setCard] = useState<MentorCard | null>(null);

  const showCard = useCallback((c: MentorCard) => {
    setCard(c);
    setOpen(true);
  }, []);

  const runMorningOnce = useCallback(async () => {
    if (!user?.id) return;
    const today = new Date().toISOString().slice(0, 10);
    const k = `geek_morning_tip_${user.id}`;
    if (typeof localStorage !== 'undefined' && localStorage.getItem(k) === today) return;

    const { data: sess } = await supabaseClient.auth.getSession();
    const token = sess.session?.access_token;
    if (!token) return;

    try {
      const [skills, focus, logs] = await Promise.all([
        fetchUserSkills(user.id),
        fetchRecentFocusSessions(user.id, 21),
        fetchRecentDailyLogs(user.id, 10),
      ]);
      const md = buildUserContextMarkdown({ skills, focus, logs });

      const res = await fetch('/api/mentor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'morning', contextMarkdown: md }),
      });
      const data = (await res.json()) as { title?: string; body?: string; challenge?: string; error?: string };
      if (!res.ok) throw new Error(data.error || `早报 ${res.status}`);
      if (data.title && data.body) {
        showCard({
          title: data.title,
          body: data.body,
          footer: data.challenge ? `今日挑战：${data.challenge}` : undefined,
        });
        localStorage.setItem(k, today);
      }
    } catch (e) {
      console.warn('[mentor] morning', e);
    }
  }, [user?.id, showCard]);

  useEffect(() => {
    void runMorningOnce();
  }, [runMorningOnce]);

  const notifyFocusComplete = useCallback(
    async (p: { title: string; category: string; durationMinutes: number }) => {
      try {
        const { data: sess } = await supabaseClient.auth.getSession();
        const token = sess.session?.access_token;
        let memoryBlock = '（无）';
        if (token) {
          const hits = await searchAiMemoriesRag(token, `${p.title} ${p.category}`, { match_count: 5 });
          if (hits.length) {
            memoryBlock = hits.map((h) => `- [${h.topic}] ${(h.content || '').slice(0, 220)}`).join('\n');
          }
        }

        const res = await fetch('/api/mentor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: 'proactive',
            title: p.title,
            category: p.category,
            durationMinutes: p.durationMinutes,
            memoryBlock,
          }),
        });
        const data = (await res.json()) as { title?: string; body?: string; followUp?: string; error?: string };
        if (!res.ok) throw new Error(data.error || `导师 ${res.status}`);
        if (data.title && data.body) {
          showCard({
            title: data.title,
            body: data.body,
            footer: data.followUp,
          });
        }
      } catch (e) {
        console.warn('[mentor] proactive focus', e);
      }
    },
    [showCard],
  );

  const notifyPunchComplete = useCallback(
    async (p: { summary: string }) => {
      try {
        const { data: sess } = await supabaseClient.auth.getSession();
        const token = sess.session?.access_token;
        let memoryBlock = '（无）';
        if (token) {
          const hits = await searchAiMemoriesRag(token, p.summary, { match_count: 5 });
          if (hits.length) {
            memoryBlock = hits.map((h) => `- [${h.topic}] ${(h.content || '').slice(0, 220)}`).join('\n');
          }
        }

        const res = await fetch('/api/mentor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: 'proactive',
            title: '今日打卡',
            category: '综合',
            durationMinutes: 0,
            memoryBlock: `打卡摘要：${p.summary.slice(0, 800)}\n\n${memoryBlock}`,
          }),
        });
        const data = (await res.json()) as { title?: string; body?: string; followUp?: string; error?: string };
        if (!res.ok) throw new Error(data.error || `导师 ${res.status}`);
        if (data.title && data.body) {
          showCard({
            title: data.title,
            body: data.body,
            footer: data.followUp,
          });
        }
      } catch (e) {
        console.warn('[mentor] proactive punch', e);
      }
    },
    [showCard],
  );

  const value = useMemo(
    () => ({
      notifyFocusComplete,
      notifyPunchComplete,
    }),
    [notifyFocusComplete, notifyPunchComplete],
  );

  return (
    <MentorContext.Provider value={value}>
      {children}
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-[90] w-[min(92vw,420px)] -translate-x-1/2 -translate-y-1/2 rounded-3xl border-2 border-zinc-800 bg-zinc-950 p-6 text-zinc-100 shadow-[12px_12px_0_0_#18181b]">
            <div className="flex items-start justify-between gap-3">
              <Dialog.Title className="text-lg font-black text-emerald-300">{card?.title}</Dialog.Title>
              <Dialog.Close asChild>
                <button type="button" className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-800 hover:text-white" aria-label="关闭">
                  <X className="h-5 w-5" />
                </button>
              </Dialog.Close>
            </div>
            <Dialog.Description className="mt-3 text-sm font-bold leading-relaxed text-zinc-300">
              {card?.body}
            </Dialog.Description>
            {card?.footer ? (
              <div className="mt-4 rounded-2xl border border-emerald-500/40 bg-emerald-950/40 p-3 text-xs font-bold text-emerald-100">
                {card.footer}
              </div>
            ) : null}
            <div className="mt-6 flex justify-end">
              <Button type="button" className="rounded-xl bg-emerald-600 font-black" onClick={() => setOpen(false)}>
                知道了
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </MentorContext.Provider>
  );
};
