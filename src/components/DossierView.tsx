import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ShieldCheck, TerminalSquare, Briefcase, Activity,
    Trophy, GitCommit, Target, Zap, Lock, ChevronLeft
} from 'lucide-react';
import { UserAvatar } from './UserAvatar';
import { CompetencyRadar } from './modules/CompetencyRadar';
import { TechTagWall } from './modules/TechTagWall';
import { GeekActivityBoard } from './modules/GeekActivityBoard';

export const DossierView: React.FC = () => {
    const { userId } = useParams<{ userId: string }>();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const mode = searchParams.get('mode') || 'geek';
    const proofHash = searchParams.get('hash') || 'UNVERIFIED_HASH';

    const [loading, setLoading] = useState(true);
    const [dossierData, setDossierData] = useState<any>(null);

    const isGeekMode = mode === 'geek';
    const theme = {
        bg: isGeekMode ? 'bg-zinc-950' : 'bg-gray-50',
        textMain: isGeekMode ? 'text-zinc-100' : 'text-gray-900',
        textMuted: isGeekMode ? 'text-zinc-500' : 'text-gray-500',
        cardBg: isGeekMode ? 'bg-zinc-900/80 backdrop-blur-xl border-zinc-800' : 'bg-white/80 backdrop-blur-xl border-gray-100',
        accent: isGeekMode ? 'text-blue-500 bg-blue-500/10 border-blue-500/20' : 'text-emerald-600 bg-emerald-50 border-emerald-100',
        glow: isGeekMode ? 'bg-blue-500/20' : 'bg-emerald-500/10'
    };

    useEffect(() => {
        setTimeout(() => {
            setDossierData({
                full_name: '匿名极客',
                title: isGeekMode ? 'Full-Stack Engineer & Algorithm Specialist' : 'Product Manager & Technical Architect',
                bio: '专注于构建高并发底层架构与极致的用户体验。',
                stats: { focusMin: 1024, commits: 3500, awards: 12 }
            });
            setLoading(false);
        }, 1200);
    }, [userId, isGeekMode]);

    if (loading) {
        return (
            <div className={`min-h-screen flex flex-col items-center justify-center ${theme.bg}`}>
                <Zap className={`w-8 h-8 animate-pulse ${isGeekMode ? 'text-blue-500' : 'text-emerald-500'}`} />
                <p className={`mt-4 text-xs font-bold tracking-widest uppercase ${theme.textMuted}`}>Decrypting Digital Dossier...</p>
            </div>
        );
    }

    return (
        <div className={`min-h-screen relative overflow-x-hidden selection:bg-blue-500/30 transition-colors duration-1000 ${theme.bg} ${theme.textMain}`}>

            <div className={`fixed top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] pointer-events-none ${theme.glow}`} />
            <div className={`fixed bottom-[-20%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[100px] pointer-events-none ${theme.glow}`} />

            <button
                onClick={() => navigate('/')}
                className={`fixed top-8 left-8 z-50 p-3 rounded-full border shadow-sm transition-all hover:scale-105 backdrop-blur-md cursor-pointer
          ${isGeekMode ? 'bg-zinc-800/50 border-zinc-700 text-zinc-300' : 'bg-white/50 border-gray-200 text-gray-600'}`}
            >
                <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="max-w-5xl mx-auto px-6 py-20 relative z-10 space-y-12 animate-in fade-in slide-in-from-bottom-12 duration-1000">

                <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 pb-12 border-b border-opacity-10 border-current">
                    <div className="flex items-center gap-8">
                        <UserAvatar name={dossierData.full_name} size="xl" className="w-24 h-24 shadow-2xl" />
                        <div className="space-y-2">
                            <h1 className="text-4xl md:text-5xl font-black tracking-tight">{dossierData.full_name}</h1>
                            <p className={`text-sm md:text-base font-bold tracking-widest uppercase flex items-center gap-2 ${theme.textMuted}`}>
                                {isGeekMode ? <TerminalSquare className="w-4 h-4" /> : <Briefcase className="w-4 h-4" />}
                                {dossierData.title}
                            </p>
                        </div>
                    </div>

                    <div className={`flex flex-col items-end p-4 rounded-2xl border ${theme.cardBg}`}>
                        <div className="flex items-center gap-2 mb-2">
                            <ShieldCheck className="w-5 h-5 text-emerald-500" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Verified Asset</span>
                        </div>
                        <span className={`text-[10px] font-mono opacity-50`}>PROOF_HASH</span>
                        <span className={`text-xs font-mono font-bold mt-0.5 select-all ${isGeekMode ? 'text-blue-400' : 'text-gray-900'}`}>
                            {proofHash}
                        </span>
                    </div>
                </header>

                <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className={`p-8 rounded-[2rem] border shadow-xl flex flex-col justify-between ${theme.cardBg}`}>
                        <Activity className={`w-8 h-8 mb-6 ${isGeekMode ? 'text-blue-400' : 'text-emerald-500'}`} />
                        <div>
                            <div className="text-4xl font-black tracking-tighter mb-1">{dossierData.stats.focusMin}<span className="text-lg opacity-50 ml-1">m</span></div>
                            <div className={`text-[10px] font-bold uppercase tracking-widest ${theme.textMuted}`}>Deep Work Verified</div>
                        </div>
                    </div>
                    <div className={`p-8 rounded-[2rem] border shadow-xl flex flex-col justify-between ${theme.cardBg}`}>
                        <GitCommit className={`w-8 h-8 mb-6 ${isGeekMode ? 'text-indigo-400' : 'text-teal-500'}`} />
                        <div>
                            <div className="text-4xl font-black tracking-tighter mb-1">{dossierData.stats.commits}</div>
                            <div className={`text-[10px] font-bold uppercase tracking-widest ${theme.textMuted}`}>GitHub Contributions</div>
                        </div>
                    </div>
                    <div className={`p-8 rounded-[2rem] border shadow-xl flex flex-col justify-between ${theme.cardBg}`}>
                        <Trophy className={`w-8 h-8 mb-6 text-amber-500`} />
                        <div>
                            <div className="text-4xl font-black tracking-tighter mb-1">{dossierData.stats.awards}</div>
                            <div className={`text-[10px] font-bold uppercase tracking-widest ${theme.textMuted}`}>Professional Awards</div>
                        </div>
                    </div>
                </section>

                <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {isGeekMode ? (
                        <>
                            <div className={`lg:col-span-8 p-8 rounded-[2.5rem] border shadow-xl pointer-events-none ${theme.cardBg}`}>
                                <h3 className="text-xl font-black mb-8 flex items-center gap-3"><TerminalSquare className="w-6 h-6 text-blue-500" /> Core Algorithms & Stack</h3>
                                <TechTagWall theme={isGeekMode ? 'dark' : 'light'} />
                            </div>
                            <div className={`lg:col-span-4 p-8 rounded-[2.5rem] border shadow-xl flex flex-col justify-center pointer-events-none ${theme.cardBg}`}>
                                <h3 className="text-xl font-black mb-6 flex items-center gap-3"><Target className="w-6 h-6 text-indigo-500" /> Competency Matrix</h3>
                                {/* 🚨 修复点 1：显式传入空回调函数 */}
                                <CompetencyRadar userId={userId} onAskCoach={(dim: any) => { }} />
                            </div>
                        </>
                    ) : (
                        <>
                            <div className={`lg:col-span-5 p-8 rounded-[2.5rem] border shadow-xl flex flex-col justify-center pointer-events-none ${theme.cardBg}`}>
                                <h3 className="text-xl font-black mb-6 flex items-center gap-3"><Target className="w-6 h-6 text-emerald-500" /> Product & Management Matrix</h3>
                                {/* 🚨 修复点 2：显式传入空回调函数 */}
                                <CompetencyRadar userId={userId} onAskCoach={(dim: any) => { }} />
                            </div>
                            <div className={`lg:col-span-7 p-8 rounded-[2.5rem] border shadow-xl pointer-events-none ${theme.cardBg}`}>
                                <h3 className="text-xl font-black mb-8 flex items-center gap-3"><Activity className="w-6 h-6 text-teal-500" /> Execution Heatmap</h3>
                                <GeekActivityBoard userId={userId} />
                            </div>
                        </>
                    )}
                </section>

                <footer className={`mt-20 pt-10 border-t border-opacity-10 border-current flex flex-col items-center justify-center text-center space-y-4`}>
                    <Lock className={`w-6 h-6 opacity-40`} />
                    <p className={`text-[10px] font-bold uppercase tracking-widest ${theme.textMuted}`}>
                        This Dossier is cryptographically signed and generated by GeekHub V6.0<br />
                        Unauthorized replication is prohibited.
                    </p>
                </footer>

            </div>
        </div>
    );
};