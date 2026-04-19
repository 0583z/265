import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Sparkles, Loader2, CheckCircle, Globe, Mail, Info, Tag, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

interface SubmitContestProps {
  onClose?: () => void;
}

/**
 * SubmitContest 组件：用户投喂功能
 * 
 * [AI 优化体验说明]:
 * 1. 减少录入负担：利用 DeepSeek-V3 强大的文本语义提取能力，用户仅需提供一个官网链接或一段简要描述，
 *    AI 即可自动推断出截稿日期、分类、简介等关键信息。
 * 2. 数据准确性控制：AI 提取后用户仍可手动修改确认。管理员通过后台审核（pending_competitions）
 *    来实现对前端展示数据的最终把关，形成“用户贡献+AI辅助+人工初审”的闭环。
 */
export const SubmitContest: React.FC<SubmitContestProps> = ({ onClose }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    category: '',
    deadline: '',
    link: '',
    description: '',
    submitter_contact: user?.email || ''
  });

  const handleAiFill = async () => {
    if (!formData.link && !formData.title) {
      toast.error('请至少提供比赛名称或官网链接，以便 AI 进行识别');
      return;
    }

    setAiLoading(true);
    try {
      // 调用现有 api/chat 接口的 extract 模式
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText: formData.link || formData.title,
          mode: 'extract'
        })
      });

      const data = (await response.json()) as { title?: string; error?: string; deadline?: string; category?: string; description?: string; link?: string };
      if (!response.ok) throw new Error(data.error || `AI 服务响应异常 (${response.status})`);
      
      setFormData(prev => ({
        ...prev,
        title: data.title || prev.title,
        deadline: data.deadline || prev.deadline,
        category: data.category || prev.category,
        description: data.description || prev.description,
        link: data.link || prev.link
      }));

      toast.success('AI 已智能补全表单，请核对信息');
    } catch (error) {
      console.error('AI Error:', error);
      toast.error('AI 补全失败，请尝试手动填写');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) {
      toast.error('竞赛名称是必填项');
      return;
    }

    setLoading(true);
    try {
      const deadline = formData.deadline
        ? new Date(`${formData.deadline}T23:59:59`).toISOString()
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      const payload = {
        name: formData.title,
        level: '校级',
        category: formData.category || '综合',
        deadline,
        registrationUrl: formData.link || 'https://example.com',
        description: formData.description || '用户投稿赛事',
        major: ['不限'],
        techStack: ['待补充'],
        historicalAwardRatio: 0.1,
        ai_suggestion: null,
      };

      const { error } = await supabase.from('competitions').insert([payload]);
      if (error) throw error;

      setSubmitted(true);
      toast.success('提交成功！已收录');
      
      setTimeout(() => {
        if (onClose) onClose();
        else setSubmitted(false);
      }, 3000);
    } catch (error: any) {
      toast.error('提交失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4"
        >
          <CheckCircle className="w-8 h-8 text-green-600" />
        </motion.div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">提交成功！</h3>
        <p className="text-gray-500 max-w-xs mx-auto">
          您的贡献对社区至关重要。管理员审核通过后，该竞赛将展示在首页。
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl mx-auto border border-gray-100 shadow-2xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">提交新竞赛</h2>
          <p className="text-sm text-gray-500 mt-1">发现新赛事？在这里“投喂”给伙伴们吧</p>
        </div>
        <button
          onClick={handleAiFill}
          disabled={aiLoading}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl text-xs font-bold shadow-lg hover:shadow-indigo-200/50 transition-all disabled:opacity-50 active:scale-95"
        >
          {aiLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Sparkles className="w-3.5 h-3.5" />
          )}
          AI 智能补全
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* 官网链接 - 引导 AI 的关键字段 */}
          <div className="md:col-span-2">
            <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">
              <Globe className="w-3 h-3" />
              官网链接 (建议首填)
            </label>
            <input
              type="url"
              placeholder="https://..."
              value={formData.link} 
              onChange={e => setFormData({ ...formData, link: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">
              <Info className="w-3 h-3" />
              竞赛名称 *
            </label>
            <input
              required
              type="text"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">
              <Tag className="w-3 h-3" />
              分类
            </label>
            <input
              type="text"
              placeholder="如：软件设计 / 数学建模"
              value={formData.category}
              onChange={e => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm"
            />
          </div>

          <div className="md:col-span-1">
            <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">
              <Calendar className="w-3 h-3" />
              截稿日期
            </label>
            <input
              type="date"
              value={formData.deadline}
              onChange={e => setFormData({ ...formData, deadline: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm"
            />
          </div>

          <div className="md:col-span-1">
            <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">
              <Mail className="w-3 h-3" />
              您的联系方式
            </label>
            <input
              type="text"
              placeholder="QQ/微信/邮箱"
              value={formData.submitter_contact}
              onChange={e => setFormData({ ...formData, submitter_contact: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm"
            />
          </div>

          <div className="md:col-span-2">
            <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">
              简介 (AI 将为您生成)
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm resize-none"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black transition-all shadow-xl shadow-gray-200 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Send className="w-4 h-4" />
              提交审核
            </>
          )}
        </button>
      </form>
    </div>
  );
};
