import React, { useRef, useState, useEffect, useCallback } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import { Orbit, Maximize2, Minimize2, Play, Target, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react'; 
import * as THREE from 'three';

const clock = new THREE.Clock();

export const SkillUniverse3D: React.FC = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isTouring, setIsTouring] = useState(false);
  const [tourText, setTourText] = useState("");
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });
  
  const containerRef = useRef<HTMLDivElement>(null); 
  const graphRef = useRef<any>(null); 

  // 🚨 比赛专用：内置高质量“极客档案”样板数据，绝不白屏
  const getDemoData = () => {
    const nodes: any[] = [{ id: 'Me', name: '极客核心档案', group: 0, val: 35, color: '#ffffff' }];
    const links: any[] = [];

    // 1. 核心技术底座 (展示强大的底层能力)
    const skillNodes = [
      { id: 's_alg', name: '算法能力 (EXP: 850)', val: 18, color: '#3b82f6' },
      { id: 's_dev', name: '工程研发 (EXP: 720)', val: 16, color: '#3b82f6' },
      { id: 's_pm',  name: '产品架构 (EXP: 920)', val: 20, color: '#3b82f6' }
    ];
    nodes.push(...skillNodes);
    skillNodes.forEach(sk => links.push({ source: 'Me', target: sk.id, value: 3 }));

    // 2. 目标职业画像 (结合你的产品意向)
    const roleNode = { id: 'career', name: '🎯 目标: 高级产品经理 (技术向)', val: 24, color: '#10b981' };
    nodes.push(roleNode);
    links.push({ source: 's_pm', target: 'career', value: 4 });

    // 3. 确权成就资产 (结合你的真实背景定制的耀眼履历)
    const honors = [
      { id: 'h1', name: '🏆 第41次 CCF CSP 认证 (高分)', target: 's_alg' },
      { id: 'h2', name: '🏆 蓝桥杯全国软件大赛 国二', target: 's_alg' },
      { id: 'h3', name: '🏆 “极客枢纽” 竞赛资产系统', target: 's_pm' },
      { id: 'h4', name: '🏆 小米便签级代码重构开源', target: 's_dev' },
      { id: 'h5', name: '🏆 AI 驱动全链路确权 商业计划书', target: 's_pm' }
    ];

    honors.forEach((h, index) => {
      nodes.push({ id: h.id, name: h.name, val: 14, color: '#f59e0b' });
      links.push({ source: 'Me', target: h.id, value: 2 });
      links.push({ source: h.id, target: h.target, value: 2.5 }); // 加粗连线
    });

    return { nodes, links };
  };

  const [dynamicData] = useState(getDemoData());

  // 物理引擎：极具张力的排斥与连线
  useEffect(() => {
    if (graphRef.current) {
      const charge = graphRef.current.d3Force('charge');
      if (charge) charge.strength(-1800); // 强力散开
      const link = graphRef.current.d3Force('link');
      if (link) link.distance(200);     // 保持距离
      const collide = graphRef.current.d3Force('collide');
      if (collide) collide.radius(50);  // 绝对防重叠
    }
  }, [dynamicData]);

  const triggerTour = useCallback(async () => {
    if (!graphRef.current) return;
    setIsTouring(true);
    setTourText("Step 1: 扫描全局数字确权链路...");
    graphRef.current.cameraPosition({ x: 380, y: 380, z: 380 }, { x: 0, y: 0, z: 0 }, 2500);
    await new Promise(r => setTimeout(r, 3000));
    setTourText("Step 2: 资产指纹匹配成功，能力模型推导完毕。");
    setTimeout(() => { setIsTouring(false); setTourText(""); }, 2500);
  }, []);

  const updateDimensions = useCallback(() => {
    if (containerRef.current) {
      setDimensions({ width: containerRef.current.clientWidth, height: isFullscreen ? window.innerHeight : 400 });
    }
  }, [isFullscreen]);

  useEffect(() => {
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [updateDimensions]);

  useEffect(() => {
    if (graphRef.current) {
      let angle = 0;
      const interval = setInterval(() => {
        if (isTouring) return;
        angle += Math.PI / 1200; // 匀速自转，适合大屏展示
        graphRef.current.cameraPosition({ x: 320 * Math.sin(angle), z: 320 * Math.cos(angle) });
      }, 30);
      return () => clearInterval(interval);
    }
  }, [graphRef.current, isTouring]);

  return (
    <motion.div layout className={isFullscreen ? "fixed inset-0 z-[999] bg-zinc-950 flex flex-col" : "bg-zinc-950 rounded-[32px] overflow-hidden shadow-2xl relative border-4 border-zinc-900 group min-h-[400px]"}>
      <div className="absolute top-0 left-0 w-full p-6 z-10 flex justify-between items-start pointer-events-none">
        <div className="flex flex-col gap-2">
          <h3 className="text-xl font-black text-white flex items-center gap-2 drop-shadow-md">
            <Target className="w-6 h-6 text-emerald-400" />
            能力确权拓扑图 (Showcase 演示模式)
          </h3>
          <div className="flex items-center gap-3">
            <button onClick={triggerTour} disabled={isTouring} className="pointer-events-auto px-4 py-1.5 bg-blue-500/20 hover:bg-blue-500/40 border border-blue-500/50 text-blue-400 text-[10px] font-bold rounded-full transition-all flex items-center gap-2">
              <Play className="w-3 h-3" /> 开启资产巡检
            </button>
            <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono border border-emerald-400/30 px-2 py-1 rounded-full bg-emerald-400/10">
              <Sparkles className="w-3 h-3" /> DEMO READY
            </span>
          </div>
        </div>
        <button onClick={() => setIsFullscreen(!isFullscreen)} className="pointer-events-auto p-3 bg-white/10 hover:bg-white/20 text-white rounded-xl backdrop-blur-sm transition-all">
          {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
        </button>
      </div>

      <AnimatePresence>
        {isTouring && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="absolute top-24 left-6 z-20 px-4 py-2 bg-blue-600/20 border border-blue-400/30 backdrop-blur-md rounded-lg">
            <p className="text-xs font-mono text-blue-300 animate-pulse">{">"} {tourText}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-6 left-6 z-10 flex gap-4 pointer-events-none">
         <span className="flex items-center gap-2 text-xs font-bold text-white drop-shadow-md"><span className="w-3 h-3 rounded-full bg-[#f59e0b]"></span> 确权成就 (已上链)</span>
         <span className="flex items-center gap-2 text-xs font-bold text-white drop-shadow-md"><span className="w-3 h-3 rounded-full bg-[#3b82f6]"></span> 核心技术底座</span>
         <span className="flex items-center gap-2 text-xs font-bold text-white drop-shadow-md"><span className="w-3 h-3 rounded-full bg-[#10b981]"></span> 能力推导画像</span>
      </div>

      <div ref={containerRef} className={`w-full flex items-center justify-center ${isFullscreen ? 'flex-1' : 'h-[400px]'}`}>
        <ForceGraph3D
          ref={graphRef}
          width={dimensions.width}
          height={dimensions.height}
          graphData={dynamicData}
          backgroundColor="#09090b"
          nodeLabel="name"
          nodeColor="color"
          nodeRelSize={6}
          linkOpacity={0.7} // 粗实、明显的连线
          linkWidth={(link) => (link.value as number) * 1.5}
          linkColor={() => 'rgba(255,255,255,0.4)'}
          nodeThreeObject={(node: any) => {
            const geometry = new THREE.SphereGeometry(node.val);
            const material = new THREE.MeshLambertMaterial({ color: node.color, transparent: true, opacity: 0.9, emissive: node.color, emissiveIntensity: 0.5 });
            const sphere = new THREE.Mesh(geometry, material);
            sphere.onBeforeRender = () => {
              const t = clock.getElapsedTime();
              sphere.scale.setScalar(1 + Math.sin(t * 2.5) * 0.04);
              material.emissiveIntensity = 0.5 + Math.sin(t * 2.5) * 0.2;
            };
            return sphere;
          }}
        />
      </div>
    </motion.div>
  );
};