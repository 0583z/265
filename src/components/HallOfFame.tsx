import React, { useState, useMemo } from 'react';
import { 
  Trophy, Search, Code, Layers, 
  ChevronRight, Star, Award, Share2, Github, X as LucideX
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// 模拟的高质量获奖成果数据
const awardsData = [
  {
    id: '1',
    title: '基于 WebGL 的高维竞赛数据可视化系统',
    competition: '全国大学生计算机设计大赛 (4C)',
    level: '国家级一等奖',
    year: '2025',
    category: '软件应用与开发',
    tags: ['React', 'Three.js', 'Supabase'],
    author: '极客 0x42',
    description: '本项目通过 3D 拓扑结构直观展示了全国近 10 年竞赛数据的关联性，解决了信息孤岛问题。',
    github: 'https://github.com/example/project1',
    rank: 1
  },
  {
    id: '2',
    title: '智能备赛语音交互助手 (VoicePilot)',
    competition: '中国高校计算机大赛 (C4)',
    level: '国家级二等奖',
    year: '2025',
    category: '人工智能',
    tags: ['Next.js', 'DeepSeek', 'WebRTC'],
    author: 'CodeWitch',
    description: '利用大模型流式对话与语音合成技术，模拟真实面试环境，提升学生备赛效率。',
    github: 'https://github.com/example/project2',
    rank: 2
  },
  {
    id: '3',
    title: '分布式算法模拟教学平台',
    competition: '蓝桥杯全国软件和信息技术专业人才大赛',
    level: '省一等奖',
    year: '2024',
    category: '软件开发',
    tags: ['Java', 'Spring Cloud', 'Redis'],
    author: 'TechExplorer',
    description: '将抽象的 Paxos/Raft 算法过程可视化，支持多节点并发模拟。',
    github: 'https://github.com/example/project3',
    rank: 3
  }
];

// 🚨 修正：去掉了容易引发报错的显式 JSX 返回类型，让 TS 自动推导
export const HallOfFame = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAward, setSelectedAward] = useState<any | null>(null);

  const filteredAwards = useMemo(() => {
    return awardsData.filter(item => 
      item.title.includes(searchQuery) || 
      item.competition.includes(searchQuery) ||
      item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [searchQuery]);

  const recommendedAwards = useMemo(() => {
    if (!selectedAward) return [];
    return awardsData.filter(item => 
      item.id !== selectedAward.id && 
      (item.competition === selectedAward.competition || item.category === selectedAward.category)
    ).slice(0, 2);
  }, [selectedAward]);

  return (
    <div className="space-y-8 p-4">
      {/* 1. 顶部搜索与标题 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-white italic tracking-tighter flex items-center gap-3">
            <Trophy className="w-8 h-8 text-yellow-500" />
            精品成果卷王榜
          </h2>
          <p className="text-sm font-bold text-zinc-500 mt-1 uppercase tracking-widest">Global Competition Achievement Archive</p>
        </div>
        
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-yellow-500 transition-colors" />
          <input 
            type="text"
            placeholder="搜索作品、赛事或技术栈..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 pr-6 py-4 bg-zinc-900 border-2 border-zinc-800 rounded-2xl w-full md:w-80 outline-none focus:border-yellow-500 focus:bg-zinc-900 text-white transition-all font-bold shadow-sm"
          />
        </div>
      </div>

      {/* 2. 成果列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredAwards.map((award) => (
            <motion.div 
              layout
              key={award.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={() => setSelectedAward(award)}
              className="group bg-zinc-900 rounded-[32px] border border-zinc-800 p-6 shadow-sm hover:shadow-xl hover:border-zinc-700 transition-all cursor-pointer relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/5 rounded-bl-[40px] -mr-4 -mt-4 flex items-center justify-center opacity-40 group-hover:opacity-100 transition-opacity">
                 <span className="text-4xl font-black text-yellow-500 opacity-10">#0{award.rank}</span>
              </div>

              <Badge className="mb-4 bg-yellow-500/10 text-yellow-500 border-none font-black px-3 py-1 rounded-full uppercase text-[10px]">
                {award.level}
              </Badge>
              <h3 className="text-xl font-black text-white leading-tight mb-3 line-clamp-2">{award.title}</h3>
              <p className="text-xs font-bold text-zinc-500 mb-6 flex items-center gap-1">
                <Award className="w-3.5 h-3.5" /> {award.competition}
              </p>
              
              <div className="flex flex-wrap gap-2">
                {award.tags.slice(0, 3).map(tag => (
                  <span key={tag} className="text-[10px] font-black bg-zinc-800 text-zinc-500 px-2 py-1 rounded-lg">#{tag}</span>
                ))}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* 3. 成果详情抽屉 */}
      <AnimatePresence>
        {selectedAward && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedAward(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-[500]"
            />
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 h-full w-full max-w-2xl bg-zinc-950 shadow-2xl z-[501] overflow-y-auto p-10 custom-scrollbar text-white border-l border-zinc-800"
            >
              <div className="flex justify-between items-start mb-10">
                <div className="space-y-4">
                   <div className="flex items-center gap-3">
                     <div className="w-12 h-12 bg-yellow-500 text-black rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-500/20">
                        <Trophy className="w-6 h-6" />
                     </div>
                     <span className="text-xs font-black text-yellow-500 tracking-widest uppercase bg-yellow-500/10 px-3 py-1 rounded-full border border-yellow-500/20">
                       {selectedAward.level} 获得者
                     </span>
                   </div>
                   <h2 className="text-3xl font-black text-white italic tracking-tight leading-tight">
                     {selectedAward.title}
                   </h2>
                </div>
                <button onClick={() => setSelectedAward(null)} className="p-3 bg-zinc-900 rounded-2xl hover:bg-zinc-800 transition-colors text-zinc-400">
                  <LucideX className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-8">
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-zinc-900 p-6 rounded-[24px] border border-zinc-800">
                    <p className="text-[10px] font-black text-zinc-500 uppercase mb-1">所属赛事</p>
                    <p className="font-bold text-white text-sm">{selectedAward.competition}</p>
                  </div>
                  <div className="bg-zinc-900 p-6 rounded-[24px] border border-zinc-800">
                    <p className="text-[10px] font-black text-zinc-500 uppercase mb-1">作品作者</p>
                    <p className="font-bold text-white text-sm">{selectedAward.author}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-black text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-500" /> 作品简介
                  </h4>
                  <p className="text-zinc-400 text-sm leading-relaxed font-medium">
                    {selectedAward.description}
                  </p>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-black text-white flex items-center gap-2">
                    <Code className="w-4 h-4 text-emerald-500" /> 技术架构
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedAward.tags.map((tag: string) => (
                      <Badge key={tag} className="px-4 py-2 border-2 border-emerald-500/20 text-emerald-500 font-bold rounded-xl bg-emerald-500/5">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4 pt-4 border-t border-zinc-800">
                  <Button className="flex-1 h-14 bg-white text-black hover:bg-zinc-200 rounded-2xl font-black gap-2">
                    <Github className="w-5 h-5" /> 查看源码 (GitHub)
                  </Button>
                  <Button variant="outline" className="w-14 h-14 rounded-2xl border-2 border-zinc-800 bg-transparent text-white hover:bg-zinc-800">
                    <Share2 className="w-5 h-5" />
                  </Button>
                </div>

                <div className="space-y-6 pt-10">
                  <h4 className="text-sm font-black text-white italic flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-500" /> 同赛道其他精品成果推荐
                  </h4>
                  <div className="grid grid-cols-1 gap-4">
                    {recommendedAwards.length > 0 ? recommendedAwards.map((rec: any) => (
                      <div 
                        key={rec.id} 
                        onClick={() => setSelectedAward(rec)}
                        className="p-4 border-2 border-dashed border-zinc-800 rounded-[24px] hover:border-yellow-500/50 hover:bg-yellow-500/5 transition-all flex items-center justify-between group cursor-pointer"
                      >
                        <div>
                          <p className="text-[11px] font-black text-yellow-500 uppercase">{rec.level}</p>
                          <p className="text-sm font-bold text-white group-hover:text-yellow-500 transition-colors">{rec.title}</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:translate-x-1 transition-transform" />
                      </div>
                    )) : (
                      <p className="text-xs font-bold text-zinc-500 italic">暂无同类型相关推荐。</p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};