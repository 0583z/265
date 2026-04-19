import React, { useEffect, useState } from 'react';
import { Users, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import * as Dialog from '@radix-ui/react-dialog';
import { fetchUserSkills } from '@/src/lib/supabaseClient';
import {
  TEAM_DIMENSIONS,
  complementarityScore,
  cosineSimilarity,
  skillsToTeamVector,
  type TeamVector,
} from '@/src/lib/vectorMatch';

type Props = {
  userId: string | undefined;
};

const POOL: { id: string; name: string; tag: string; vector: TeamVector }[] = [
  {
    id: 'p1',
    name: '算法特攻 · 阿诚',
    tag: 'ACM / CSP 提高级',
    vector: { 算法: 92, '前端/UI': 35, 工程交付: 62, 文档表达: 40, 沟通协作: 48 },
  },
  {
    id: 'p2',
    name: '全栈视觉 · 小林',
    tag: 'React / 交互设计',
    vector: { 算法: 38, '前端/UI': 94, 工程交付: 78, 文档表达: 70, 沟通协作: 66 },
  },
  {
    id: 'p3',
    name: '工程交付 · 老魏',
    tag: 'DevOps / 后端',
    vector: { 算法: 55, '前端/UI': 48, 工程交付: 90, 文档表达: 58, 沟通协作: 72 },
  },
];

export const SmartTeamMatch: React.FC<Props> = ({ userId }) => {
  const [open, setOpen] = useState(false);
  const [pick, setPick] = useState<(typeof POOL)[number] | null>(null);
  const [scores, setScores] = useState({ comp: 0, cos: 0 });

  const runMatch = async () => {
    if (!userId) return;
    const rows = await fetchUserSkills(userId);
    const userVec = skillsToTeamVector(rows, 52);

    let best = POOL[0];
    let bestComp = 0;
    let bestCos = 0;
    for (const p of POOL) {
      const c = complementarityScore(userVec, p.vector);
      const cos = cosineSimilarity(userVec, p.vector);
      if (c > bestComp) {
        bestComp = c;
        bestCos = cos;
        best = p;
      }
    }
    setScores({ comp: bestComp, cos: bestCos });
    setPick(best);
    if (bestComp >= 0.52) {
      setOpen(true);
    }
  };

  useEffect(() => {
    if (!userId) return;
    void (async () => {
      const rows = await fetchUserSkills(userId);
      if (rows.length < 2) return;
      const userVec = skillsToTeamVector(rows, 52);
      let bestComp = 0;
      let best = POOL[0];
      for (const p of POOL) {
        const c = complementarityScore(userVec, p.vector);
        if (c > bestComp) {
          bestComp = c;
          best = p;
        }
      }
      if (bestComp >= 0.58) {
        setPick(best);
        setScores({ comp: bestComp, cos: cosineSimilarity(userVec, best.vector) });
        setOpen(true);
      }
    })();
  }, [userId]);

  return (
    <div className="rounded-[28px] border-2 border-gray-900 bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-3">
      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-500">
        <Users className="w-4 h-4" />
        SmartTeamMatch
      </div>
      <p className="text-[11px] font-bold text-gray-500 leading-relaxed">
        将你的 user_skills 雷达投影到统一五维向量，与示例极客池做互补度（向量空间）匹配；算法强 + 前端强会自动触发「黄金搭档」弹窗。
      </p>
      <Button className="w-full h-11 rounded-xl font-black bg-indigo-600" onClick={() => void runMatch()}>
        <Sparkles className="w-4 h-4 mr-2" />
        立即匹配搭档池
      </Button>

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 z-[120]" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-[121] w-[90%] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border-2 border-gray-900 bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <Dialog.Title className="text-lg font-black flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              黄金搭档推荐
            </Dialog.Title>
            <p className="mt-2 text-sm font-bold text-gray-600">
              基于向量互补度（{TEAM_DIMENSIONS.join(' / ')}），我们找到与你技能结构最互补的示例队友：
            </p>
            {pick && (
              <div className="mt-4 p-4 rounded-xl bg-amber-50 border-2 border-amber-900">
                <div className="text-base font-black">{pick.name}</div>
                <div className="text-xs font-bold text-amber-800 mt-1">{pick.tag}</div>
                <div className="mt-3 text-[11px] font-mono font-bold text-gray-700">
                  互补度 {scores.comp.toFixed(3)} · 余弦相似 {scores.cos.toFixed(3)}
                </div>
              </div>
            )}
            <Dialog.Close asChild>
              <Button className="mt-6 w-full h-11 rounded-xl font-black">收下，开冲</Button>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
};
