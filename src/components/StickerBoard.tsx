import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { supabaseClient } from '@/src/lib/supabaseClient';

export type StickerLayoutItem = {
  id: string;
  achievementId: string;
  x: number;
  y: number;
  rotate: number;
};

const DEFS: Record<string, { label: string; emoji: string }> = {
  focus_600: { label: '专注 10h+', emoji: '⏱' },
  csp_sub: { label: 'CSP 备战中', emoji: '🏅' },
};

function parseLayout(raw: unknown): StickerLayoutItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((r, i) => {
      const o = r as Record<string, unknown>;
      return {
        id: String(o.id || `st-${i}`),
        achievementId: String(o.achievementId || ''),
        x: Number(o.x) || 0,
        y: Number(o.y) || 0,
        rotate: Number(o.rotate) || 0,
      };
    })
    .filter((x) => x.achievementId);
}

export const StickerBoard: React.FC<{
  userId: string;
  unlockedIds: string[];
  initialLayout: unknown;
}> = ({ userId, unlockedIds, initialLayout }) => {
  const [items, setItems] = useState<StickerLayoutItem[]>([]);

  const mergeLayout = useCallback(
    (raw: unknown, unlocked: string[]) => {
      const parsed = parseLayout(raw);
      const byAch = new Map(parsed.map((p) => [p.achievementId, p]));
      const next: StickerLayoutItem[] = [];
      unlocked.forEach((achId, idx) => {
        const existing = byAch.get(achId);
        if (existing) next.push(existing);
        else
          next.push({
            id: `st-${achId}`,
            achievementId: achId,
            x: 24 + idx * 96,
            y: 40 + (idx % 2) * 48,
            rotate: (idx % 2 === 0 ? -4 : 6) as number,
          });
      });
      setItems(next);
    },
    [],
  );

  useEffect(() => {
    mergeLayout(initialLayout, unlockedIds);
  }, [initialLayout, unlockedIds, mergeLayout]);

  const persist = useCallback(
    async (layout: StickerLayoutItem[]) => {
      const { data: row } = await supabaseClient.from('user_growth_state').select('*').eq('user_id', userId).maybeSingle();
      const payload = {
        user_id: userId,
        exp_algorithm: Number(row?.exp_algorithm) || 0,
        exp_dev: Number(row?.exp_dev) || 0,
        exp_ui: Number(row?.exp_ui) || 0,
        exp_arch: Number(row?.exp_arch) || 0,
        streak_days: Number(row?.streak_days) || 0,
        sticker_layout: layout,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabaseClient.from('user_growth_state').upsert(payload, { onConflict: 'user_id' });
      if (error) console.warn('[sticker] save', error.message);
    },
    [userId],
  );

  const defsList = useMemo(() => items.filter((it) => DEFS[it.achievementId]), [items]);

  return (
    <section className="rounded-[32px] border-2 border-dashed border-fuchsia-400/60 bg-gradient-to-br from-fuchsia-950/20 via-white to-emerald-50 p-6">
      <div className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-fuchsia-600">咕卡拼贴 · 极客名片</div>
      <p className="mb-4 text-xs font-bold text-gray-500">拖拽贴纸摆放位置，松手自动保存。成就解锁后会出现新贴纸。</p>
      <div className="relative h-[300px] overflow-hidden rounded-3xl border-2 border-gray-900 bg-[repeating-linear-gradient(135deg,#fafafa_0,#fafafa_8px,#f4f4f5_8px,#f4f4f5_16px)] shadow-inner">
        {defsList.length === 0 ? (
          <div className="flex h-full items-center justify-center p-6 text-center text-sm font-bold text-gray-400">
            继续专注与备赛，解锁你的第一枚数字贴纸。
          </div>
        ) : (
          defsList.map((it) => {
            const d = DEFS[it.achievementId];
            if (!d) return null;
            return (
              <motion.div
                key={it.id}
                drag
                dragMomentum={false}
                dragElastic={0.12}
                animate={{ x: it.x, y: it.y, rotate: it.rotate }}
                className="absolute left-0 top-0 z-[2] cursor-grab select-none rounded-2xl border-2 border-gray-900 bg-white px-4 py-3 text-center text-xs font-black shadow-[6px_6px_0_0_rgba(0,0,0,1)] active:cursor-grabbing"
                onDragEnd={(_, info) => {
                  setItems((prev) => {
                    const nx = prev.map((p) =>
                      p.id === it.id
                        ? {
                            ...p,
                            x: p.x + info.offset.x,
                            y: p.y + info.offset.y,
                            rotate: p.rotate + (Math.abs(info.velocity.x) > 900 ? (info.velocity.x > 0 ? 5 : -5) : 0),
                          }
                        : p,
                    );
                    void persist(nx);
                    return nx;
                  });
                }}
                whileTap={{ scale: 1.05 }}
              >
                <div className="text-2xl">{d.emoji}</div>
                <div className="mt-1 max-w-[120px] leading-tight">{d.label}</div>
              </motion.div>
            );
          })
        )}
      </div>
    </section>
  );
};
