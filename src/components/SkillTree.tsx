import React, { useEffect, useMemo, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fetchRecentFocusSessions, type FocusSessionRow, type UserGrowthStateRow } from '@/src/lib/supabaseClient';
import { categoryToSkillDimension, type SkillDimension } from '@/src/lib/focusBuckets';

const NODES: { id: SkillDimension; label: string; cx: number; cy: number }[] = [
  { id: 'algorithm', label: '算法', cx: 120, cy: 48 },
  { id: 'dev', label: '开发', cx: 220, cy: 140 },
  { id: 'ui', label: '设计', cx: 40, cy: 140 },
  { id: 'arch', label: '工程化', cx: 120, cy: 220 },
];

function expFor(dim: SkillDimension, g: UserGrowthStateRow | null): number {
  if (!g) return 0;
  switch (dim) {
    case 'algorithm':
      return Number(g.exp_algorithm) || 0;
    case 'dev':
      return Number(g.exp_dev) || 0;
    case 'ui':
      return Number(g.exp_ui) || 0;
    default:
      return Number(g.exp_arch) || 0;
  }
}

/** 0–1 发光强度 */
function glow01(exp: number): number {
  const cap = 5000;
  return Math.min(1, exp / cap);
}

export const SkillTree: React.FC<{ userId: string; growth: UserGrowthStateRow | null }> = ({ userId, growth }) => {
  const [open, setOpen] = useState(false);
  const [dim, setDim] = useState<SkillDimension | null>(null);
  const [rows, setRows] = useState<FocusSessionRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!userId) return;
      setLoading(true);
      try {
        const all = await fetchRecentFocusSessions(userId, 365);
        if (!cancelled) setRows(all);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const filtered = useMemo(() => {
    if (!dim) return [];
    return rows.filter((r) => categoryToSkillDimension(r.category || '') === dim);
  }, [rows, dim]);

  const openDim = (d: SkillDimension) => {
    setDim(d);
    setOpen(true);
  };

  return (
    <section className="rounded-[32px] border-2 border-gray-900 bg-gradient-to-br from-zinc-950 via-zinc-900 to-emerald-950/40 p-8 text-white shadow-[10px_10px_0_0_rgba(0,0,0,1)]">
      <div className="mb-4 text-xs font-black uppercase tracking-[0.25em] text-emerald-400">技能树 · EXP 成长模型</div>
      <p className="mb-6 text-sm font-bold text-zinc-400">
        单次专注经验{' '}
        <span className="font-mono text-emerald-300">E = t × w × (1 + 0.1 × streak)</span>，节点亮度随维度 EXP 提升。
      </p>
      <svg viewBox="0 0 260 260" className="mx-auto h-64 w-full max-w-sm">
        <defs>
          <filter id="glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="6" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <line x1="120" y1="48" x2="40" y2="140" stroke="#3f3f46" strokeWidth="3" />
        <line x1="120" y1="48" x2="220" y2="140" stroke="#3f3f46" strokeWidth="3" />
        <line x1="40" y1="140" x2="120" y2="220" stroke="#3f3f46" strokeWidth="3" />
        <line x1="220" y1="140" x2="120" y2="220" stroke="#3f3f46" strokeWidth="3" />
        {NODES.map((n) => {
          const e = expFor(n.id, growth);
          const g = glow01(e);
          const fill = `rgba(${34 + (1 - g) * 120}, ${197 - (1 - g) * 40}, ${94 + (1 - g) * 60}, ${0.35 + g * 0.65})`;
          const stroke = g > 0.35 ? '#4ade80' : '#52525b';
          return (
            <g key={n.id} className="cursor-pointer" onClick={() => openDim(n.id)} style={{ filter: g > 0.2 ? 'url(#glow)' : undefined }}>
              <circle cx={n.cx} cy={n.cy} r="36" fill={fill} stroke={stroke} strokeWidth="3" />
              <text x={n.cx} y={n.cy - 6} textAnchor="middle" className="fill-white text-[11px] font-black">
                {n.label}
              </text>
              <text x={n.cx} y={n.cy + 12} textAnchor="middle" className="fill-zinc-200 text-[9px] font-mono font-bold">
                {Math.round(e)} EXP
              </text>
            </g>
          );
        })}
      </svg>

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-sm" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-[71] max-h-[80vh] w-[min(94vw,480px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl border-2 border-gray-900 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-2">
              <Dialog.Title className="text-lg font-black text-gray-900">
                {dim === 'algorithm' && '算法 · 历史专注'}
                {dim === 'dev' && '开发 · 历史专注'}
                {dim === 'ui' && '设计 · 历史专注'}
                {dim === 'arch' && '工程化 · 历史专注'}
              </Dialog.Title>
              <Dialog.Close asChild>
                <button type="button" className="rounded-lg p-1 hover:bg-gray-100" aria-label="关闭">
                  <X className="h-5 w-5" />
                </button>
              </Dialog.Close>
            </div>
            <p className="mt-2 text-xs font-bold text-gray-500">按专注分类归入本维度，展示近一年记录。</p>
            <div className="mt-4 space-y-2">
              {loading ? (
                <p className="text-sm font-bold text-gray-400">加载中…</p>
              ) : filtered.length === 0 ? (
                <p className="text-sm font-bold text-gray-400">暂无该维度专注记录，去极客中心开一局番茄吧。</p>
              ) : (
                filtered.slice(0, 40).map((f) => (
                  <div key={f.id || `${f.session_date}-${f.session_title}`} className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-xs font-bold text-gray-800">
                    <div className="text-blue-600">{f.session_title || f.note || '未命名'}</div>
                    <div className="mt-1 text-gray-500">
                      {f.session_date} · {f.duration_minutes} min · {f.category}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="mt-6 flex justify-end">
              <Button type="button" variant="outline" className="rounded-xl font-black" onClick={() => setOpen(false)}>
                关闭
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </section>
  );
};
