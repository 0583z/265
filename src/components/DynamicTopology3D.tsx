import React, { useMemo, useRef, useEffect, useState } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import * as THREE from 'three';

// 💡 定义节点和连线的严格类型接口，堵住 TS 的嘴
interface GraphNode {
    id: string;
    name: string;
    color: string;
    val: number;
    group: string; // 强制要求 group 属性
}

interface GraphLink {
    source: string;
    target: string;
    color: string;
    particles?: number;
}

interface DynamicTopology3DProps {
    targetRole: string;
}

export const DynamicTopology3D: React.FC<DynamicTopology3DProps> = ({ targetRole }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 800, height: 500 });

    useEffect(() => {
        if (containerRef.current) {
            setDimensions({
                width: containerRef.current.offsetWidth,
                height: containerRef.current.offsetHeight
            });
        }

        const handleResize = () => {
            if (containerRef.current) {
                setDimensions({ width: containerRef.current.offsetWidth, height: containerRef.current.offsetHeight });
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const graphData = useMemo(() => {
        // 💡 明确指定数组类型为 GraphNode[] 和 GraphLink[]
        const nodes: GraphNode[] = [
            { id: 'Me', name: '极客档案内核', color: '#ffffff', val: 12, group: 'core' },
        ];
        const links: GraphLink[] = [];

        // 2. 核心技术底座 (蓝色节点)
        const techBases: GraphNode[] = [
            { id: 'cpp', name: 'C++ / 数据结构与算法', color: '#3b82f6', val: 6, group: 'tech' },
            { id: 'python', name: 'Python / 机器学习', color: '#3b82f6', val: 6, group: 'tech' },
            { id: 'frontend', name: '移动端框架开发', color: '#3b82f6', val: 6, group: 'tech' }
        ];
        nodes.push(...techBases);
        techBases.forEach(tech => links.push({ source: 'Me', target: tech.id, color: '#333333' }));

        // 3. 确权成就 (橙色节点)
        const achievements: GraphNode[] = [
            { id: 'csp', name: 'CCF CSP 认证 (BFS/DFS寻优)', color: '#f97316', val: 5, group: 'achievement' },
            { id: 'kmeans', name: 'K-Means 聚类模型实战', color: '#f97316', val: 5, group: 'achievement' },
            { id: 'xiaomi', name: 'Xiaomi Notes 源码拆解', color: '#f97316', val: 5, group: 'achievement' },
            { id: 'wechat', name: '微信小程序协同开发', color: '#f97316', val: 5, group: 'achievement' }
        ];
        nodes.push(...achievements);

        links.push({ source: 'cpp', target: 'csp', color: '#444444' });
        links.push({ source: 'python', target: 'kmeans', color: '#444444' });
        links.push({ source: 'frontend', target: 'xiaomi', color: '#444444' });
        links.push({ source: 'frontend', target: 'wechat', color: '#444444' });

        // 4. 动态推演画像 (绿色/红色节点)
        if (targetRole === '技术型产品经理') {
            const pmNodes: GraphNode[] = [
                { id: 'pm_logic', name: '复杂业务抽象力', color: '#10b981', val: 8, group: 'role' },
                { id: 'pm_team', name: '敏捷研发协同', color: '#10b981', val: 8, group: 'role' }
            ];
            nodes.push(...pmNodes);
            links.push({ source: 'xiaomi', target: 'pm_logic', color: '#10b981', particles: 4 });
            links.push({ source: 'csp', target: 'pm_logic', color: '#10b981', particles: 2 });
            links.push({ source: 'wechat', target: 'pm_team', color: '#10b981', particles: 4 });
        }
        else if (targetRole === 'AI 产品经理') {
            const aiNodes: GraphNode[] = [
                { id: 'ai_model', name: '算法能力产品化', color: '#10b981', val: 8, group: 'role' },
                { id: 'ai_data', name: '数据驱动决策', color: '#10b981', val: 8, group: 'role' }
            ];
            nodes.push(...aiNodes);
            links.push({ source: 'kmeans', target: 'ai_model', color: '#10b981', particles: 5 });
            links.push({ source: 'python', target: 'ai_data', color: '#10b981', particles: 3 });
        }
        else if (targetRole === '云原生架构师') {
            const cloudNodes: GraphNode[] = [
                { id: 'cloud_docker', name: '🚨 容器化经验缺失', color: '#ef4444', val: 8, group: 'role' },
                { id: 'cloud_micro', name: '🚨 高并发架构缺失', color: '#ef4444', val: 8, group: 'role' }
            ];
            nodes.push(...cloudNodes);
            links.push({ source: 'Me', target: 'cloud_docker', color: '#ef4444', particles: 2 });
            links.push({ source: 'Me', target: 'cloud_micro', color: '#ef4444', particles: 2 });
        }
        else {
            const defaultNodes: GraphNode[] = [
                { id: 'def_1', name: '工程化落地能力', color: '#10b981', val: 8, group: 'role' }
            ];
            nodes.push(...defaultNodes);
            links.push({ source: 'wechat', target: 'def_1', color: '#10b981', particles: 3 });
            links.push({ source: 'xiaomi', target: 'def_1', color: '#10b981', particles: 3 });
        }

        return { nodes, links };
    }, [targetRole]);

    return (
        <div ref={containerRef} className="w-full h-full absolute inset-0 cursor-move">
            <ForceGraph3D
                width={dimensions.width}
                height={dimensions.height}
                graphData={graphData}
                backgroundColor="#0A0A0A"
                nodeLabel="name"
                nodeColor="color"
                nodeRelSize={6}
                linkColor="color"
                linkWidth={1.5}
                linkDirectionalParticles={(link: any) => link.particles || 0}
                linkDirectionalParticleWidth={3}
                linkDirectionalParticleSpeed={0.01}
                nodeThreeObject={(node: any) => {
                    const sprite = new THREE.Mesh(
                        new THREE.SphereGeometry(node.val),
                        new THREE.MeshLambertMaterial({
                            color: node.color,
                            transparent: true,
                            opacity: 0.9,
                            emissive: node.color,
                            emissiveIntensity: 0.2
                        })
                    );
                    return sprite;
                }}
            />

            <div className="absolute bottom-4 w-full text-center pointer-events-none">
                <p className="text-[10px] text-gray-600 font-mono">
                    Left-click: rotate, Mouse-wheel/middle-click: zoom, Right-click: pan
                </p>
            </div>

            <div className="absolute bottom-4 left-6 pointer-events-none flex gap-4">
                <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500" /> 核心技术底座</span>
                <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-orange-500" /> 确权成就 (已上链)</span>
                <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> 能力推导画像</span>
            </div>
        </div>
    );
};