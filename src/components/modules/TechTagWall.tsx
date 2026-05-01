import React from 'react';
import { motion } from 'framer-motion';
import { Code2, Github, GitCommit, Library, Terminal } from 'lucide-react';

export interface TechTagWallProps {
    theme?: 'light' | 'dark';
}

const TECH_DATA = [
    { name: 'C++', percent: 45, color: 'bg-blue-500' },
    { name: 'TypeScript', percent: 25, color: 'bg-indigo-500' },
    { name: 'Python', percent: 15, color: 'bg-sky-400' },
    { name: 'HTML/CSS', percent: 10, color: 'bg-cyan-400' },
    { name: 'React', percent: 5, color: 'bg-teal-400' },
];

export const TechTagWall: React.FC<TechTagWallProps> = ({ theme = 'light' }) => {
    const isDark = theme === 'dark';

    // Apple 风格的容器背景色（比纯白/纯黑稍微带一点灰度，用来衬托内部的白/黑卡片）
    const containerBg = isDark ? 'bg-zinc-950' : 'bg-gray-50/50';
    const cardBg = isDark ? 'bg-zinc-900' : 'bg-white';
    const borderColor = isDark ? 'border-zinc-800' : 'border-gray-100';
    const textColor = isDark ? 'text-white' : 'text-slate-900';
    const mutedTextColor = isDark ? 'text-zinc-400' : 'text-slate-500';

    return (
        <div className={`w-full max-w-sm p-4 rounded-[2.5rem] flex flex-col gap-4 border transition-colors duration-500 ${containerBg} ${borderColor}`}>

            {/* 🍱 Bento Box 1: 标题与介绍模块 */}
            <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className={`p-6 rounded-[2rem] border shadow-sm flex flex-col gap-4 ${cardBg} ${borderColor}`}
            >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm
          ${isDark ? 'bg-zinc-800 border-zinc-700 text-blue-400' : 'bg-blue-50 border-blue-100 text-blue-600'}`}>
                    <Code2 className="w-6 h-6" />
                </div>
                <div>
                    <h2 className={`text-xl font-bold tracking-tight mb-1.5 ${textColor}`}>
                        数字标签墙
                    </h2>
                    <p className={`text-xs font-medium leading-relaxed ${mutedTextColor}`}>
                        自动解析 GitHub 仓库，<br />提取您的核心技术基因。
                    </p>
                </div>
            </motion.div>

            {/* 🍱 Bento Box 2: GitHub 数据统计模块 (双列) */}
            <div className="grid grid-cols-2 gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className={`p-5 rounded-[2rem] border shadow-sm flex flex-col justify-between aspect-square ${cardBg} ${borderColor}`}
                >
                    <Library className={`w-5 h-5 ${isDark ? 'text-indigo-400' : 'text-indigo-500'}`} />
                    <div>
                        <div className={`text-2xl font-black tracking-tighter ${textColor}`}>12</div>
                        <div className={`text-[10px] font-bold uppercase tracking-wider ${mutedTextColor}`}>Repositories</div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    className={`p-5 rounded-[2rem] border shadow-sm flex flex-col justify-between aspect-square ${cardBg} ${borderColor}`}
                >
                    <GitCommit className={`w-5 h-5 ${isDark ? 'text-emerald-400' : 'text-emerald-500'}`} />
                    <div>
                        <div className={`text-2xl font-black tracking-tighter ${textColor}`}>1,024</div>
                        <div className={`text-[10px] font-bold uppercase tracking-wider ${mutedTextColor}`}>Total Commits</div>
                    </div>
                </motion.div>
            </div>

            {/* 🍱 Bento Box 3: 技术栈药丸进度条模块 */}
            <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                className={`p-6 rounded-[2rem] border shadow-sm ${cardBg} ${borderColor}`}
            >
                <div className="flex items-center gap-2 mb-5">
                    <Terminal className={`w-4 h-4 ${mutedTextColor}`} />
                    <span className={`text-xs font-bold uppercase tracking-widest ${mutedTextColor}`}>Stack Breakdown</span>
                </div>

                {/* Apple 风格连续进度条 */}
                <div className={`h-3 w-full rounded-full overflow-hidden flex mb-6 ${isDark ? 'bg-zinc-800' : 'bg-gray-100'}`}>
                    {TECH_DATA.map((tech, i) => (
                        <motion.div
                            key={tech.name}
                            initial={{ width: 0 }}
                            animate={{ width: `${tech.percent}%` }}
                            transition={{ duration: 1, delay: 0.5 + i * 0.1, ease: "easeOut" }}
                            className={`h-full ${tech.color} hover:brightness-110 transition-all cursor-pointer border-r border-white/20 last:border-0`}
                            title={`${tech.name} ${tech.percent}%`}
                        />
                    ))}
                </div>

                {/* 极简图例网格 */}
                <div className="grid grid-cols-2 gap-y-3 gap-x-2">
                    {TECH_DATA.map((tech) => (
                        <div key={tech.name} className="flex items-center gap-2">
                            <div className={`w-2.5 h-2.5 rounded-full ${tech.color} shadow-sm`} />
                            <div className="flex flex-col">
                                <span className={`text-[11px] font-bold ${textColor}`}>{tech.name}</span>
                                <span className={`text-[9px] font-medium ${mutedTextColor}`}>{tech.percent}%</span>
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>

        </div>
    );
};