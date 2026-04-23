import React, { useRef, useState, useEffect, useCallback } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import { Orbit, Maximize2, Minimize2 } from 'lucide-react';
import { motion } from 'framer-motion';

// @ts-ignore 忽略 TS 对 three 类型的严格检查
import * as THREE from 'three';

// 🚨 构造硬核的极客知识图谱数据
const graphData = {
  nodes: [
    { id: 'Me', name: '极客档案', group: 0, val: 30, color: '#ffffff' },
    
    { id: 'CSP', name: 'CCF CSP 认证', group: 1, val: 15, color: '#f59e0b' },
    { id: 'Lanqiao', name: '蓝桥杯', group: 1, val: 12, color: '#f59e0b' },
    { id: 'Challenge', name: '挑战杯', group: 1, val: 10, color: '#f59e0b' },
    { id: 'MathMod', name: '数学建模', group: 1, val: 10, color: '#f59e0b' },
    
    { id: 'C++', name: 'C / C++', group: 2, val: 8, color: '#3b82f6' },
    { id: 'Java', name: 'Java', group: 2, val: 8, color: '#3b82f6' },
    { id: 'Python', name: 'Python', group: 2, val: 8, color: '#3b82f6' },
    { id: 'React', name: 'React生态', group: 2, val: 8, color: '#3b82f6' },
    { id: 'Node', name: 'Node.js', group: 2, val: 8, color: '#3b82f6' },
    { id: 'ML', name: '机器学习', group: 2, val: 8, color: '#3b82f6' },
    
    { id: 'Frontend', name: '前端研发工程师', group: 3, val: 20, color: '#10b981' },
    { id: 'Backend', name: '后端研发工程师', group: 3, val: 20, color: '#10b981' },
    { id: 'PM', name: '产品经理 (技术向)', group: 3, val: 20, color: '#10b981' },
    { id: 'Algorithm', name: '算法工程师', group: 3, val: 20, color: '#10b981' }
  ],
  links: [
    { source: 'Me', target: 'CSP', value: 2 },
    { source: 'Me', target: 'Lanqiao', value: 1 },
    { source: 'Me', target: 'Challenge', value: 1 },
    
    { source: 'CSP', target: 'C++', value: 3 },
    { source: 'Lanqiao', target: 'Java', value: 3 },
    { source: 'Lanqiao', target: 'C++', value: 2 },
    { source: 'MathMod', target: 'Python', value: 3 },
    { source: 'MathMod', target: 'ML', value: 2 },
    { source: 'Challenge', target: 'React', value: 2 },
    { source: 'Challenge', target: 'Node', value: 2 },
    
    { source: 'React', target: 'Frontend', value: 5 },
    { source: 'Node', target: 'Frontend', value: 2 },
    { source: 'Node', target: 'Backend', value: 3 },
    { source: 'Java', target: 'Backend', value: 5 },
    { source: 'C++', target: 'Backend', value: 4 },
    { source: 'C++', target: 'Algorithm', value: 3 },
    { source: 'Python', target: 'Algorithm', value: 5 },
    { source: 'ML', target: 'Algorithm', value: 4 },
    { source: 'Challenge', target: 'PM', value: 4 }
  ]
};

export const SkillUniverse3D: React.FC = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });
  
  const containerRef = useRef<HTMLDivElement>(null); // 修复 1
  const graphRef = useRef<any>(null); // 🚨 修复 2：这里加上了 null，解决 TS2554 报错

  const updateDimensions = useCallback(() => {
    if (containerRef.current) {
      setDimensions({
        width: containerRef.current.clientWidth,
        height: isFullscreen ? window.innerHeight : 400
      });
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
        angle += Math.PI / 600;
        graphRef.current.cameraPosition({
          x: 200 * Math.sin(angle),
          z: 200 * Math.cos(angle)
        });
      }, 30);
      return () => clearInterval(interval);
    }
  }, [graphRef.current]);

  return (
    <motion.div 
      layout
      className={
        isFullscreen 
          ? "fixed inset-0 z-[999] bg-zinc-950 flex flex-col" 
          : "bg-zinc-950 rounded-[32px] overflow-hidden shadow-2xl relative border-4 border-zinc-900 group"
      }
    >
      <div className="absolute top-0 left-0 w-full p-6 z-10 flex justify-between items-start pointer-events-none">
        <div>
          <h3 className="text-xl font-black text-white flex items-center gap-2 drop-shadow-md">
            <Orbit className="w-6 h-6 text-blue-400" />
            技能引力拓扑图 (3D Force Graph)
          </h3>
          <p className="text-xs font-bold text-zinc-400 mt-1 max-w-sm drop-shadow-md">
            基于力导向算法，实时渲染 赛事-技能-岗位 的高维关联网络。支持鼠标拖拽与滚轮缩放。
          </p>
        </div>
        
        <button 
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="pointer-events-auto p-3 bg-white/10 hover:bg-white/20 text-white rounded-xl backdrop-blur-sm transition-all"
        >
          {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
        </button>
      </div>

      <div className="absolute bottom-6 left-6 z-10 flex gap-4 pointer-events-none">
         <span className="flex items-center gap-2 text-xs font-bold text-white drop-shadow-md"><span className="w-3 h-3 rounded-full bg-[#f59e0b]"></span> 竞赛经历</span>
         <span className="flex items-center gap-2 text-xs font-bold text-white drop-shadow-md"><span className="w-3 h-3 rounded-full bg-[#3b82f6]"></span> 技术栈</span>
         <span className="flex items-center gap-2 text-xs font-bold text-white drop-shadow-md"><span className="w-3 h-3 rounded-full bg-[#10b981]"></span> 求职方向</span>
      </div>

      <div ref={containerRef} className={`w-full ${isFullscreen ? 'flex-1' : 'h-[400px]'}`}>
        {typeof window !== 'undefined' && (
          <ForceGraph3D
            ref={graphRef}
            width={dimensions.width}
            height={dimensions.height}
            graphData={graphData}
            backgroundColor="#09090b"
            nodeLabel="name"
            nodeColor="color"
            nodeRelSize={6}
            linkOpacity={0.4}
            linkWidth={link => (link.value as number)}
            linkColor={() => 'rgba(255,255,255,0.2)'}
            linkDirectionalParticles={2}
            linkDirectionalParticleWidth={1.5}
            nodeThreeObject={(node: any) => {
              const sprite = new THREE.Mesh(
                new THREE.SphereGeometry(node.val * 0.8),
                new THREE.MeshLambertMaterial({ 
                  color: node.color,
                  transparent: true,
                  opacity: 0.9,
                  emissive: node.color,
                  emissiveIntensity: 0.5
                })
              );
              return sprite;
            }}
          />
        )}
      </div>
    </motion.div>
  );
};