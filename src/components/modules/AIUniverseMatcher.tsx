import React, { useState } from 'react';
import { Sparkles, Zap, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

import { fetchAllGeekProfiles } from '../../lib/supabaseClient';

export const AIUniverseMatcher: React.FC = () => {
    const [isMatching, setIsMatching] = useState(false);
    const [clusters, setClusters] = useState<Record<string, any[]> | null>(null);

    const [allGeeks, setAllGeeks] = useState<any[]>([]);
    const [selectedGeek, setSelectedGeek] = useState<any>(null);

    // 🚀 [完善项1] 新增状态：控制邀请按钮的 loading 状态
    const [isInviting, setIsInviting] = useState(false);

    const handleAIMatch = async () => {
        setIsMatching(true);
        toast.loading("正在同步 Supabase 云端极客画像...", { id: "ai-hub-match" });

        try {
            const dbGeeks = await fetchAllGeekProfiles();
            console.log("📊 [Supabase] 成功拉取极客总数:", dbGeeks?.length || 0);

            if (!dbGeeks || dbGeeks.length === 0) {
                throw new Error("数据库空空如也，请检查数据");
            }

            setAllGeeks(dbGeeks);

            const payload = {
                geeks: dbGeeks.map((g: any) => ({
                    user_id: g.id,
                    username: g.username,
                    algorithm_score: Number(g.algorithm_score) || 0,
                    engineering_score: Number(g.engineering_score) || 0,
                    product_score: Number(g.product_score) || 0,
                    focus_hours: Number(g.focus_hours) || 0
                }))
            };

            try {
                // 🚨 修正 1：强制使用 localhost，规避 127.0.0.1 带来的底层网络拦截死结
                const response = await fetch('http://localhost:8000/api/v1/cluster_match', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) throw new Error("Python 后端响应异常");

                const data = await response.json();
                setTimeout(() => {
                    setClusters(data.clusters);
                    toast.success("AI 云端星系聚类完成！", { id: "ai-hub-match" });
                    setIsMatching(false);
                }, 1200);

            } catch (backendError) {
                console.warn("⚠️ Python 后端失联，自动切换为前端本地备用聚类算法！", backendError);

                setTimeout(() => {
                    const fallbackClusters: Record<string, any[]> = {
                        "🌌 算法原力星系": [],
                        "🛠️ 架构铸造星系": [],
                        "🧭 商业引航星系": []
                    };

                    dbGeeks.forEach((g: any) => {
                        const algo = Number(g.algorithm_score) || 0;
                        const eng = Number(g.engineering_score) || 0;
                        const prod = Number(g.product_score) || 0;
                        const max = Math.max(algo, eng, prod);

                        if (max === algo && algo > 0) {
                            fallbackClusters["🌌 算法原力星系"].push({ user_id: g.id, username: g.username });
                        } else if (max === eng && eng > 0) {
                            fallbackClusters["🛠️ 架构铸造星系"].push({ user_id: g.id, username: g.username });
                        } else {
                            fallbackClusters["🧭 商业引航星系"].push({ user_id: g.id, username: g.username });
                        }
                    });

                    setClusters(fallbackClusters);
                    toast.success("已启用本地备用 AI 引擎完成匹配！", { id: "ai-hub-match" });
                    setIsMatching(false);
                }, 1500);
            }

        } catch (e: any) {
            console.error("❌ 匹配流程异常:", e);
            toast.error(e.message || "连接失败", { id: "ai-hub-match" });
            setIsMatching(false);
        }
    };

    // 🚀 [完善项1] 新增函数：处理发送邀请的闭环逻辑 (幽灵按钮模拟)
    const handleInvite = (username: string) => {
        setIsInviting(true);
        const invitePromise = new Promise(resolve => setTimeout(resolve, 1500));

        toast.promise(invitePromise, {
            loading: `正在向极客 [${username}] 发送星际加密邀请函...`,
            success: `✅ 邀请已成功送达！请等待对方回应。`,
            error: '信号中断，发送失败',
        });

        invitePromise.then(() => {
            setIsInviting(false);
            // 邀请发送成功后，稍作延迟自动关闭弹窗，极致顺滑
            setTimeout(() => {
                setSelectedGeek(null);
            }, 800);
        });
    };

    return (
        <div className="bg-zinc-900 rounded-[2rem] p-6 border border-zinc-800 shadow-2xl relative overflow-hidden min-h-[400px]">
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-blue-500/20 blur-3xl rounded-full"></div>

            <div className="relative z-10 space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-white font-black text-lg flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-blue-400" /> AI 人才雷达
                    </h3>
                    <button
                        onClick={handleAIMatch}
                        disabled={isMatching}
                        className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all active:scale-90 disabled:opacity-50"
                    >
                        <Zap className={`w-4 h-4 ${isMatching ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                <AnimatePresence mode="wait">
                    {!clusters ? (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="py-10 text-center space-y-3"
                        >
                            <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center mx-auto">
                                <Globe className="w-6 h-6 text-zinc-600" />
                            </div>
                            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">点击上方闪电开启 AI 匹配</p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="results"
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            className="space-y-4 relative"
                        >
                            {Object.entries(clusters).map(([galaxy, members]) => (
                                <div key={galaxy} className="space-y-2">
                                    <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-tighter opacity-70">{galaxy}</h4>

                                    {/* 🚨 修正 2：加入了 custom-scrollbar 激活您的赛博朋克滚动条 */}
                                    <div className="grid grid-cols-2 gap-2 max-h-[160px] overflow-y-auto custom-scrollbar pr-1">
                                        {members.map((m: any) => (
                                            <div
                                                key={m.user_id}
                                                onClick={() => {
                                                    const fullInfo = allGeeks.find(g => g.id === m.user_id);
                                                    setSelectedGeek(fullInfo || m);
                                                }}
                                                className="bg-zinc-800/50 border border-zinc-700 p-2 rounded-lg text-[11px] font-bold text-zinc-300 truncate cursor-pointer hover:bg-blue-600 hover:text-white hover:scale-[1.02] transition-all active:scale-95"
                                            >
                                                {m.username}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            <button
                                onClick={() => setClusters(null)}
                                className="w-full py-2 mt-4 text-[10px] font-black text-zinc-500 hover:text-white uppercase tracking-widest transition-colors"
                            >
                                重置匹配雷达
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* 极客详细信息弹窗 (Modal) */}
            <AnimatePresence>
                {selectedGeek && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="absolute inset-0 z-50 bg-zinc-900/95 backdrop-blur-md p-6 flex flex-col justify-center items-center rounded-[2rem]"
                    >
                        <div className="w-full max-w-sm bg-zinc-800 border border-zinc-700 p-6 rounded-2xl shadow-2xl relative">
                            {/* 关闭按钮 */}
                            <button
                                onClick={() => setSelectedGeek(null)}
                                className="absolute top-4 right-4 w-6 h-6 bg-zinc-700 hover:bg-zinc-600 rounded-full text-zinc-300 text-xs flex items-center justify-center transition-colors"
                            >
                                ✕
                            </button>

                            <h4 className="text-xl font-black text-white mb-1">{selectedGeek.username}</h4>
                            <p className="text-[10px] text-zinc-400 font-mono mb-6">ID: {selectedGeek.id?.split('-')[0] || 'Unknown'}</p>

                            {/* 能力雷达条 */}
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between items-center text-[10px] font-bold mb-1">
                                        <span className="text-zinc-400 uppercase tracking-wider">算法原力</span>
                                        <span className="text-blue-400">{selectedGeek.algorithm_score || 0}</span>
                                    </div>
                                    <div className="w-full bg-zinc-900 rounded-full h-1.5">
                                        <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${selectedGeek.algorithm_score || 0}%` }}></div>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between items-center text-[10px] font-bold mb-1">
                                        <span className="text-zinc-400 uppercase tracking-wider">工程铸造</span>
                                        <span className="text-emerald-400">{selectedGeek.engineering_score || 0}</span>
                                    </div>
                                    <div className="w-full bg-zinc-900 rounded-full h-1.5">
                                        <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${selectedGeek.engineering_score || 0}%` }}></div>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between items-center text-[10px] font-bold mb-1">
                                        <span className="text-zinc-400 uppercase tracking-wider">商业引航</span>
                                        <span className="text-amber-400">{selectedGeek.product_score || 0}</span>
                                    </div>
                                    <div className="w-full bg-zinc-900 rounded-full h-1.5">
                                        <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${selectedGeek.product_score || 0}%` }}></div>
                                    </div>
                                </div>

                                <div className="pt-2 border-t border-zinc-700/50">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-zinc-500 font-bold">闭关专注时长</span>
                                        <span className="text-purple-400 font-black">{selectedGeek.focus_hours || 0} <span className="text-[10px] font-normal">小时</span></span>
                                    </div>
                                </div>
                            </div>

                            {/* 🚀 [完善项1] 升级后的交互按钮 */}
                            <button
                                onClick={() => handleInvite(selectedGeek.username)}
                                disabled={isInviting}
                                className="w-full mt-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-colors shadow-lg shadow-blue-900/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isInviting ? (
                                    <>
                                        <Zap className="w-4 h-4 animate-spin" />
                                        信号发送中...
                                    </>
                                ) : (
                                    "发送组队邀请"
                                )}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};