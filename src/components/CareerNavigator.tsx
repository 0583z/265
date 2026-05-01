import { DynamicTopology3D } from './DynamicTopology3D';
import React, { useState, useEffect } from 'react';
import {
  Compass, Zap, Database, Layers, CheckCircle2,
  ChevronDown, Cpu, Network, Briefcase, Activity, AlertTriangle, Check, Mic
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

// 🚀 新增引入面试舱组件
import { VoiceInterviewCabin } from './modules/VoiceInterviewCabin';

// --- 💡 定义严格的类型接口，解决 isWarning 报错 ---
interface CareerBlock {
  title: string;
  desc: string;
  icon: React.ReactNode;
  color: string;
  isWarning?: boolean; // 问号表示可选，完美解决报错
}

interface CareerData {
  matchScore: number;
  blocks: CareerBlock[];
  pool: string[];
}

const CAREER_MATRICES = [
  {
    category: '产品与商业化体系',
    icon: <Briefcase className="w-4 h-4 text-blue-500" />,
    roles: ['技术型产品经理', 'AI 产品经理']
  },
  {
    category: '前沿算法与数据体系',
    icon: <Network className="w-4 h-4 text-purple-500" />,
    roles: ['大模型应用工程师', '算法研究员']
  },
  {
    category: '核心工程与架构体系',
    icon: <Layers className="w-4 h-4 text-emerald-500" />,
    roles: ['全栈开发工程师', '云原生架构师']
  }
];

// 用户的真实资产底座
const USER_ACTUAL_ASSETS = {
  algorithms: ['CCF CSP 认证', 'C++', 'Java', 'Python', 'BFS/DFS', '动态规划'],
  projects: ['Xiaomi Notes 源码深度拆解', 'Android SDK 应用开发', '微信小程序多人协同开发'],
  ai_ml: ['K-Means 聚类', 'Logistic Regression 分类器']
};

// --- 🧠 增强版数据引擎 ---
const evaluateCareerMatch = (role: string, assets: typeof USER_ACTUAL_ASSETS): CareerData => {
  const base: Record<string, CareerData> = {
    '技术型产品经理': {
      matchScore: 88,
      blocks: [
        { title: '复杂业务逆向工程', desc: `已确认数据：${assets.projects[0]}`, icon: <Layers />, color: 'bg-blue-500' },
        { title: '敏捷协同与边界把控', desc: `已确认数据：${assets.projects[2]}`, icon: <Activity />, color: 'bg-indigo-500' },
        { title: '逻辑抽象能力', desc: `已确认数据：${assets.algorithms[0]} & ${assets.algorithms[1]}`, icon: <Cpu />, color: 'bg-cyan-500' }
      ],
      pool: [
        '基于 Xiaomi Notes 拆解，输出一份商业化 PRD',
        '复盘微信小程序协作痛点，提炼为项目管理经验',
        '分析 C++ 内存管理逻辑对系统稳定性设计的影响',
        '撰写一份关于“从开发者视角看产品体验”的分享文档',
        '为 Xiaomi Notes 设计一个基于 AI 的自动化标签功能'
      ]
    },
    'AI 产品经理': {
      matchScore: 75,
      blocks: [
        { title: '模型能力产品化', desc: `已确认数据：${assets.ai_ml[0]} & ${assets.ai_ml[1]}`, icon: <Network />, color: 'bg-emerald-500' },
        { title: '技术栈纵深', desc: `已确认数据：${assets.algorithms[3]} 数据处理`, icon: <Database />, color: 'bg-teal-500' },
        { title: '⚠️ 提示词工程数据缺失', desc: '系统未检测到大模型 Prompt 实战记录', icon: <AlertTriangle />, color: 'bg-orange-500', isWarning: true }
      ],
      pool: [
        '【推荐行动】接入 DeepSeek API，完成一个智能问答 Demo',
        '将 K-Means 理解转化为《聚类分析指导用户增长》方案',
        '设计一个基于逻辑回归的简单用户流失预警原型'
      ]
    },
    '云原生架构师': {
      matchScore: 25,
      blocks: [
        { title: '编程语言基础', desc: `已确认数据：${assets.algorithms[2]} 等基础开发`, icon: <Cpu />, color: 'bg-gray-600' },
        { title: '🚨 容器化技术缺失', desc: '未检索到 Docker/K8s 相关项目', icon: <AlertTriangle />, color: 'bg-red-500', isWarning: true },
        { title: '🚨 高并发架构缺失', desc: '未检索到微服务拆分经验', icon: <AlertTriangle />, color: 'bg-red-500', isWarning: true }
      ],
      pool: [
        '【紧急补缺】完成一个基于 Docker 部署的微服务项目',
        '学习 Kubernetes 基础，并在本地集群运行'
      ]
    }
  };

  return base[role] || {
    matchScore: 60,
    blocks: [{ title: '基础工程能力', desc: '已确认通用开发数据', icon: <Layers />, color: 'bg-blue-500' }],
    pool: ['补充 GitHub 开源项目 Readme', '优化个人技术博客架构']
  };
};

export const CareerNavigator: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState('技术型产品经理');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [translationData, setTranslationData] = useState<CareerData>(() => evaluateCareerMatch('技术型产品经理', USER_ACTUAL_ASSETS));

  const [activeTasks, setActiveTasks] = useState<string[]>([]);
  const [taskPool, setTaskPool] = useState<string[]>([]);
  const [completingId, setCompletingId] = useState<number | null>(null);

  // 🚀 新增面试舱的开启状态
  const [isInterviewOpen, setIsInterviewOpen] = useState(false);

  useEffect(() => {
    const newData = evaluateCareerMatch(selectedRole, USER_ACTUAL_ASSETS);
    setTranslationData(newData);
    setActiveTasks(newData.pool.slice(0, 3));
    setTaskPool(newData.pool.slice(3));
    setIsDropdownOpen(false);
  }, [selectedRole]);

  const handleTaskComplete = (index: number) => {
    if (completingId !== null) return;
    setCompletingId(index);
    toast.success('任务达成！正在生成新挑战...');

    setTimeout(() => {
      const nextActive = [...activeTasks];
      const nextPool = [...taskPool];

      if (nextPool.length > 0) {
        nextActive[index] = nextPool.shift()!;
        setTaskPool(nextPool);
      } else {
        nextActive.splice(index, 1);
      }

      setActiveTasks(nextActive);
      setCompletingId(null);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FD] p-6 lg:p-10 space-y-8 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* 左侧控制台 */}
        <div className="lg:col-span-4 space-y-6">
          {/* 🚀 修改这里：把标题和新增的模拟面试小按钮放在同一行 */}
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-black text-gray-900 tracking-tighter flex items-center gap-3">
              <Compass className="w-8 h-8 text-blue-600" /> 职业引航舱
            </h2>
            <button
              onClick={() => setIsInterviewOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50/80 hover:bg-blue-100 text-blue-600 border border-blue-100/50 rounded-full text-[11px] font-black tracking-widest transition-all active:scale-95 shadow-sm"
            >
              <Mic className="w-3.5 h-3.5" />
              模拟面试
            </button>
          </div>

          <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-xl shadow-blue-900/5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Target Role</label>
            <div className="relative">
              <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="w-full flex items-center justify-between bg-gray-50 border border-gray-200 px-6 py-4 rounded-2xl">
                <span className="font-black text-gray-900">{selectedRole}</span>
                <ChevronDown className={`w-5 h-5 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute z-50 top-full mt-2 w-full bg-white border border-gray-100 rounded-2xl shadow-2xl max-h-80 overflow-y-auto">
                    {CAREER_MATRICES.map((matrix, idx) => (
                      <div key={idx} className="p-4 border-b border-gray-50 last:border-0">
                        <span className="text-[10px] font-black text-gray-400 uppercase block mb-2">{matrix.category}</span>
                        {matrix.roles.map(role => (
                          <button key={role} onClick={() => setSelectedRole(role)} className={`w-full text-left px-4 py-2 rounded-xl text-sm font-bold ${selectedRole === role ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'}`}>
                            {role}
                          </button>
                        ))}
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* 右侧蓝图 */}
        <div className="lg:col-span-8 bg-gray-900 rounded-[2.5rem] p-8 lg:p-10 border border-gray-800 shadow-2xl flex flex-col md:flex-row items-center gap-10">
          <div className="relative shrink-0">
            <svg className="w-40 h-40 transform -rotate-90">
              <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-800" />
              <motion.circle key={selectedRole} initial={{ strokeDasharray: "0 440" }} animate={{ strokeDasharray: `${(translationData.matchScore / 100) * 440} 440` }} cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" className={`${translationData.matchScore >= 80 ? 'text-emerald-500' : translationData.matchScore >= 60 ? 'text-blue-500' : 'text-red-500'}`} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-black text-white">{translationData.matchScore}%</span>
            </div>
          </div>
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AnimatePresence mode="popLayout">
              {translationData.blocks.map((block, idx) => (
                <motion.div key={`${selectedRole}-${idx}`} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className={`bg-gray-800/50 border ${block.isWarning ? 'border-red-900/50' : 'border-gray-700'} p-5 rounded-2xl`}>
                  <div className={`w-8 h-8 rounded-lg ${block.color} flex items-center justify-center mb-4 text-white`}>{block.icon}</div>
                  <h4 className={`text-sm font-black mb-1 ${block.isWarning ? 'text-red-400' : 'text-white'}`}>{block.title}</h4>
                  <p className="text-xs font-bold text-gray-400 leading-relaxed">{block.desc}</p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* 3D 拓扑组件 */}
      <div className="bg-[#0A0A0A] rounded-[2.5rem] border border-gray-800 h-[500px] relative overflow-hidden">
        <div className="absolute top-6 left-8 z-20">
          <h3 className="text-white font-black text-xl flex items-center gap-2"><Zap className="w-5 h-5 text-emerald-400" /> 动态映射拓扑</h3>
        </div>
        <div className="absolute inset-0 z-10">
          <DynamicTopology3D targetRole={selectedRole} />
        </div>
      </div>

      {/* 任务流水线战区 */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm">
        <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2"><CheckCircle2 className="w-6 h-6 text-emerald-500" /> 行动指南与数据补齐</h3>
        <div className="space-y-3 min-h-[150px]">
          <AnimatePresence mode="popLayout">
            {activeTasks.length > 0 ? activeTasks.map((task, idx) => (
              <motion.div key={task} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} onClick={() => handleTaskComplete(idx)} className={`flex items-start gap-4 p-4 rounded-2xl border transition-all cursor-pointer group ${task.includes('行动') || task.includes('补缺') ? 'bg-orange-50/50 border-orange-100' : 'bg-[#F8F9FD] border-transparent hover:border-blue-100'}`}>
                <div className={`w-6 h-6 shrink-0 rounded-full border-2 flex items-center justify-center mt-0.5 ${completingId === idx ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300 group-hover:border-blue-500 bg-white'}`}>
                  {completingId === idx && <Check className="w-4 h-4 text-white" />}
                </div>
                <span className={`text-sm font-bold ${completingId === idx ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{task}</span>
              </motion.div>
            )) : (
              <div className="py-10 text-center"><h4 className="text-lg font-black text-gray-900">Mission Accomplished!</h4></div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 🚀 挂载模拟面试舱，并且隐藏时不占位 */}
      <VoiceInterviewCabin
        isOpen={isInterviewOpen}
        onClose={() => setIsInterviewOpen(false)}
      />
    </div>
  );
};