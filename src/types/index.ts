// src/types/index.ts

export interface DailyLogRow {
    id?: string;
    user_id: string;
    log_date: string;
    summary: string;
    mood_score: number;
    energy_score: number;
    wins?: string;
    blockers?: string;
}

export interface FocusSessionRow {
    id?: string;
    user_id: string;
    session_date: string;
    duration_minutes: number;
    session_title?: string;
}

/**
 * 🚨 核心修复：
 * 这里的 level 必须包含 "国家级" | "省级" | "校级" 这三个字面量，
 * 否则 CareerNavigator 会报错无法分配。
 */
export interface Competition {
    id: string;
    name: string;
    // 必须精确匹配老组件要求的字面量联合类型
    level: "国家级" | "省级" | "校级" | string;
    deadline: string;
    type: 'public' | 'private';
    category?: string;
    major?: string;
    techStack?: string[];
    registrationUrl?: string;
    image_url?: string;
    tags?: string[];
    description?: string;
    historicalAwardRatio?: string;
}