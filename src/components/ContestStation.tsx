import React, { useState, useEffect } from 'react';
import {
    Trophy, Flame, ArrowUpRight, Code, Github, Globe,
    AlertCircle, Zap, BookOpen, Target, Cpu, Activity, Database, CheckCircle, TrendingUp
} from 'lucide-react';
import { motion } from 'framer-motion';

interface GeekDossier {
    honors: { name: string; type: string }[];
    repos: string[];
    learningLogs: string[];
    rawSkills: string[];
}

interface ContestStationProps {
    userAssets: GeekDossier;
    subscribedCompetitions: any[];
}

export const ContestStation: React.FC<ContestStationProps> = ({ userAssets, subscribedCompetitions }) => {
    const [matchingResults, setMatchingResults] = useState<Record<string, { total: number; breakdown: any }>>({});

    useEffect(() => {
        const runDeepAnalysis = () => {
            const results: Record<string, { total: number; breakdown: any }> = {};

            subscribedCompetitions.forEach(comp => {
                const reqs = comp.requirements || [];

                // --- 核心加权算法 ---
                // 1. 荣誉背书 (35%): 是否有类似赛事的获奖记录（如 CSP 认证对算法赛的加成）
                const honorMatch = userAssets.honors.some(h =>
                    reqs.some((r: string) => h.name.toLowerCase().includes(r.toLowerCase()))
                ) ? 35 : 0;

                // 2. 源码沉淀 (30%): GitHub 仓库中是否有匹配的代码资产
                const repoMatchCount = reqs.filter((r: string) =>
                    userAssets.repos.some(repo => repo.includes(r.toLowerCase()))
                ).length;
                const repoScore = reqs.length > 0 ? (repoMatchCount / reqs.length) * 30 : 0;

                // 3. 学习深度 (20%): 学习记录中是否有源码拆解等深度分析行为（如 Xiaomi Notes 项目）
                const learningMatch = userAssets.learningLogs.some(log =>
                    reqs.some((r: string) => log.toLowerCase().includes(r.toLowerCase()))
                ) ? 20 : 0;

                // 4. 基础意向 (15%): 只要订阅即代表开启备赛状态
                const baseScore = 15;

                const total = Math.min(Math.round(honorMatch + repoScore + learningMatch + baseScore), 99);

                results[comp.id] = {
                    total,
                    breakdown: { honorMatch, repoScore, learningMatch }
                };
            });
            setMatchingResults(results);
        };

        runDeepAnalysis();
    }, [userAssets, subscribedCompetitions]);

    return (
        <div className="p-8 space-y-12">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-black text-gray-900 tracking-tighter flex items-center gap-3">
                    <Database className="w-8 h-8 text-blue-600" /> 极客资产备赛看板
                </h2>
            </div>

            <div className="bg-[#B0B8C1] rounded-[3.5rem] p-12 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 p-8 opacity-20 pointer-events-none">
                    <Flame className="w-80 h-80 text-[#8E97A1]" strokeWidth={1} />
                </div>

                <div className="space-y-16 relative z-10">
                    {subscribedCompetitions.map((comp) => {
                        const data = matchingResults[comp.id] || { total: 15, breakdown: {} };

                        return (
                            <div key={comp.id} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                                <div className="lg:col-span-7 space-y-6">
                                    <div className="flex justify-between items-end">
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3">
                                                <span className="px-3 py-1 bg-black/40 text-white text-[10px] font-black rounded-full uppercase">{comp.type}</span>
                                                <h3 className="text-2xl font-black text-white">{comp.name}</h3>
                                            </div>
                                            {/* 实时诊断标签 */}
                                            <div className="flex gap-2">
                                                {comp.requirements.map((req: string) => {
                                                    const isMatched = userAssets.repos.some(r => r.includes(req.toLowerCase())) ||
                                                        userAssets.rawSkills.includes(req.toLowerCase());
                                                    return (
                                                        <span key={req} className={`text-[9px] font-black px-2 py-1 rounded border transition-colors ${isMatched ? 'bg-emerald-500/20 text-emerald-100 border-emerald-500/30' : 'bg-white/5 text-white/30 border-white/5'
                                                            }`}>
                                                            {isMatched ? '✓' : '○'} {req}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-4xl font-black text-white italic">{data.total}%</span>
                                        </div>
                                    </div>

                                    {/* 发光进度条 */}
                                    <div className="h-4 bg-black/20 rounded-full p-1 backdrop-blur-md">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${data.total}%` }}
                                            transition={{ duration: 1.5 }}
                                            className={`h-full rounded-full relative transition-colors ${data.total > 70 ? 'bg-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.6)]' : 'bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.6)]'
                                                }`}
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                                        </motion.div>
                                    </div>
                                </div>

                                {/* 资源猎场：基于资产短板的智能推荐 */}
                                <div className="lg:col-span-5 bg-white/10 backdrop-blur-xl rounded-[2.5rem] p-6 border border-white/10">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-[10px] font-black text-white/60 uppercase tracking-widest flex items-center gap-2">
                                            <Zap className="w-3 h-3 text-yellow-400 fill-yellow-400" /> 实战资源猎场
                                        </h4>
                                        {data.breakdown.learningMatch === 0 && (
                                            <span className="text-[8px] font-black text-orange-300 bg-orange-500/20 px-2 py-0.5 rounded">建议补充源码拆解</span>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <a
                                            href={`https://github.com/search?q=${encodeURIComponent(comp.name)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-3 bg-white/5 rounded-xl flex items-center justify-between group cursor-pointer hover:bg-white/10 transition-all"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Github className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
                                                <span className="text-xs font-bold text-white/90 group-hover:text-white transition-colors">参考类似项目源码</span>
                                            </div>
                                            <ArrowUpRight className="w-4 h-4 text-white/20 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                                        </a>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};