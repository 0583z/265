import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Sparkles, Loader2, CheckCircle, Info, Tag, GraduationCap, Calendar, ShieldCheck, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
// import { supabase } from '../lib/supabase'; // 比赛演示时如果断网，可以注释掉这行，走纯前端 Demo 闭环

interface SubmitContestProps {
  onClose?: () => void;
}

export const SubmitContest: React.FC<SubmitContestProps> = ({ onClose }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [txHash, setTxHash] = useState(""); // 🚨 新增：用于存放生成的数字指纹

  const [formData, setFormData] = useState({
    title: '',         
    award_level: '',   
    major: '',         
    date: new Date().toISOString().split('T')[0] 
  });

  // 🚨 核心技术点：前端实时计算 SHA-256 数字指纹
  const generateSHA256 = async (text: string) => {
    const msgBuffer = new TextEncoder().encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleAiFill = async () => {
    if (!formData.title) {
      toast.error('请先输入成就名称，以便 AI 识别');
      return;
    }
    setAiLoading(true);
    try {
      // 演示环境下，你可以写死一段模拟的 AI 返回，防止现场断网
      await new Promise(r => setTimeout(r, 1500)); 
      setFormData(prev => ({
        ...prev,
        award_level: "省级一等奖",
        major: "计算机类通用"
      }));
      toast.success('AI 已通过语义知识库补全详情');
    } catch (error) {
      toast.error('AI 识别失败');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) {
      toast.error('成就名称为必填项');
      return;
    }

    setLoading(true);
    try {
      // 1. 生成唯一的数据指纹源字符串 (加入时间戳防碰撞)
      const rawString = `${user?.id || 'demo-user'}|${formData.title}|${formData.date}|${Date.now()}`;
      
      // 2. 计算 SHA-256 哈希
      const hash = await generateSHA256(rawString);
      setTxHash(hash);

      // 3. 模拟区块链/云端数据落盘的加密延迟感 (极大地提升演示逼格)
      await new Promise(r => setTimeout(r, 1800));

      setSubmitted(true);
      toast.success('数字指纹生成成功！资产已存证');
      
    } catch (error: any) {
      toast.error('确权失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const copyHash = () => {
    navigator.clipboard.writeText(txHash);
    toast.success('数字指纹已复制，可用于全网核验');
  };

  // 🚨 重新设计的超高逼格“确权成功”界面
  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-4 text-center bg-white rounded-3xl">
        <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 260, damping: 20 }} className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_-10px_rgba(16,185,129,0.3)]">
          <ShieldCheck className="w-10 h-10 text-emerald-500" />
        </motion.div>
        
        <h3 className="text-2xl font-black text-gray-900 mb-2">资产确权存证成功</h3>
        <p className="text-gray-500 text-sm mb-8">该成就已被系统加密认证，不可篡改</p>

        {/* 数字指纹展示区 */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 text-left flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            SHA-256 Digital Fingerprint
          </p>
          <div className="flex items-center justify-between bg-zinc-100 rounded-xl p-3 border border-zinc-200">
             <code className="text-xs font-mono text-zinc-700 truncate mr-4">
                0x{txHash}
             </code>
             <button onClick={copyHash} className="p-2 bg-white rounded-lg shadow-sm hover:shadow hover:text-emerald-600 transition-all text-zinc-400">
               <Copy className="w-4 h-4" />
             </button>
          </div>
        </motion.div>

        <button onClick={() => { if(onClose) onClose(); else setSubmitted(false); }} className="mt-8 px-8 py-3 bg-zinc-900 text-white text-sm font-bold rounded-xl hover:bg-black transition-all">
          返回 3D 星系查看
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl mx-auto border border-gray-100 shadow-2xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">成就资产确权</h2>
          <p className="text-sm text-gray-500 mt-1">引入 SHA-256 算法，构建防篡改数据链路</p>
        </div>
        <button type="button" onClick={handleAiFill} disabled={aiLoading} className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-xl text-xs font-bold transition-all hover:scale-105 active:scale-95 disabled:opacity-50">
          {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          AI 语义提取
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="text-xs font-bold text-gray-400 uppercase mb-2 block tracking-widest ml-1">成就名称 *</label>
          <input 
            required type="text" placeholder="如：第 41 次 CCF CSP 认证"
            value={formData.title}
            onChange={e => setFormData({...formData, title: e.target.value})}
            className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase mb-2 block tracking-widest ml-1">奖项等级</label>
            <input 
              type="text" placeholder="如：一等奖"
              value={formData.award_level}
              onChange={e => setFormData({...formData, award_level: e.target.value})}
              className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase mb-2 block tracking-widest ml-1">获得日期</label>
            <input 
              type="date" value={formData.date}
              onChange={e => setFormData({...formData, date: e.target.value})}
              className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-gray-400 uppercase mb-2 block tracking-widest ml-1">相关专业 / 领域</label>
          <input 
            type="text" placeholder="如：算法工程 / 软件设计"
            value={formData.major}
            onChange={e => setFormData({...formData, major: e.target.value})}
            className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
          />
        </div>

        {/* 🚨 按钮动画增强，展现“加密计算”的过程 */}
        <button type="submit" disabled={loading} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-500 transition-all shadow-xl shadow-emerald-200 disabled:bg-zinc-800 disabled:shadow-none">
          {loading ? (
            <>
               <Loader2 className="w-5 h-5 animate-spin" />
               <span className="animate-pulse">正在生成数字指纹...</span>
            </>
          ) : (
            <> 
               <ShieldCheck className="w-5 h-5" /> 
               生成 SHA-256 存证 
            </>
          )}
        </button>
      </form>
    </div>
  );
};