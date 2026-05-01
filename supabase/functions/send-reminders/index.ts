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

export interface Competition {
  id: string;
  name: string;
  // 🚨 修复重点：这里必须包含 CareerNavigator 需要的字面量类型
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