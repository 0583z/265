/**
 * GEEK HUB - 极客成长通用确权算法模型
 * 参考：GQM 软件度量体系、OpenRank、CHAOSS 开源社区标准
 */

// 辅助函数：Sigmoid 平滑 (将其中心点平移，防止 0 输入时直接拿到高分)
const sigmoid = (x: number, shift: number = 0) => 1 / (1 + Math.exp(-(x - shift)));

// 辅助函数：计算香农信息熵 (用于创新力)
const calculateEntropy = (proportions: number[]) => {
    if (proportions.length === 0) return 0;
    const entropy = proportions.reduce((acc, p) => {
        return p > 0 ? acc - (p * Math.log2(p)) : acc;
    }, 0);
    const maxEntropy = Math.log2(proportions.length) || 1;
    return entropy / maxEntropy; // 归一化到 0-1
};

export interface GeekUserData {
    cspScore: number; // CCF CSP 成绩 (0-500)
    algoTagsCount: number; // 带有算法标签的提交/项目数
    totalLinesChanged: number; // 代码修改总行数 (additions + deletions)
    filesChanged: number; // 修改文件总数
    pullRequests: number; // PR 数量
    issues: number; // Issue 数量
    reviews: number; // Code Review 数量
    actionsLast30Days: number; // 近30天活跃次数
    languageProportions: number[]; // 各语言/技术栈占比 (如 [0.5, 0.3, 0.2])
    matchedSkillsCount: number; // 匹配到比赛要求的技能数量
    totalContestSkills: number; // 比赛总技能需求数量
}

export const calculateGeekPower = (data: GeekUserData) => {
    const BASE_SCORE = 40;
    const MULTIPLIER = 60; // 最高可加 60 分，满分 100

    // 1. 算法能力 (CSP 成绩优先，GitHub 算法标签次之)
    const cspRatio = data.cspScore / 500;
    const algoTagRatio = sigmoid(data.algoTagsCount, 2) - sigmoid(0, 2); // 减去基础偏移
    const P_alg = BASE_SCORE + MULTIPLIER * Math.max(cspRatio, algoTagRatio);

    // 2. 工程交付 (代码修改量与文件数熵，基于自然底数衰减)
    // 除以 1000 作为调节常数，可根据省赛普遍水平微调
    const engineeringFactor = (data.totalLinesChanged * data.filesChanged) / 1000;
    const P_eng = BASE_SCORE + MULTIPLIER * (1 - Math.exp(-engineeringFactor));

    // 3. 协作沟通 (PR 最重要，Issue 次之，Review 辅助)
    const collabRaw = 0.5 * data.pullRequests + 0.3 * data.issues + 0.2 * data.reviews;
    // shift=1 意味着如果只有 1 个 issue，分数不会暴涨，需要持续协作
    const P_col = BASE_SCORE + MULTIPLIER * (sigmoid(collabRaw, 1) - sigmoid(0, 1));

    // 4. 活跃度 (近30天活跃行为，50次以上趋于满分)
    const P_act = BASE_SCORE + MULTIPLIER * (data.actionsLast30Days / Math.max(data.actionsLast30Days, 50));

    // 5. 创新力 (技术栈多样性熵增)
    const P_inn = BASE_SCORE + MULTIPLIER * calculateEntropy(data.languageProportions);

    // 6. 赛事匹配度 (Jaccard 相似度演化)
    let matchScore = 0.15; // 基础意向 15%
    if (data.totalContestSkills > 0) {
        const jaccardRatio = data.matchedSkillsCount / data.totalContestSkills;
        matchScore = 0.15 + 0.85 * jaccardRatio;
    }

    return {
        Match: (matchScore * 100).toFixed(1) + '%',
        Algorithm: Math.round(P_alg),
        Engineering: Math.round(P_eng),
        Collaboration: Math.round(P_col),
        Activity: Math.round(P_act),
        Innovation: Math.round(P_inn)
    };
};