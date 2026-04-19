import type { Request, Response } from 'express';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

function supabaseUrl(): string | undefined {
  return process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
}

function supabaseAnonKey(): string | undefined {
  return process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
}

function bearer(req: Request): string | null {
  const h = req.headers.authorization;
  if (!h) return null;
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}

function userClient(accessToken: string): SupabaseClient {
  const url = supabaseUrl();
  const anon = supabaseAnonKey();
  if (!url || !anon) throw new Error('缺少 SUPABASE_URL / SUPABASE_ANON_KEY（或 VITE_*）');
  return createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function tokenizeQuery(q: string): string[] {
  const s = q.trim().toLowerCase();
  const parts = s.split(/[\s,，。；;、]+/).filter((w) => w.length > 1);
  const uniq = [...new Set(parts)];
  if (uniq.length === 0 && s.length >= 2) return [s];
  return uniq.slice(0, 24);
}

function keywordScore(query: string, topic: string, content: string): number {
  const blob = `${topic}\n${content}`.toLowerCase();
  const words = tokenizeQuery(query);
  if (!words.length) return 0;
  let hits = 0;
  for (const w of words) {
    if (blob.includes(w)) hits++;
  }
  let score = hits / words.length;
  if (blob.includes(query.trim().toLowerCase())) score = Math.min(1, score + 0.35);
  return score;
}

/**
 * POST /api/ai/memory — 关键词记忆库（无向量）
 */
export async function insertAiMemoryHandler(req: Request, res: Response) {
  try {
    const token = bearer(req);
    if (!token) return res.status(401).json({ error: '需要 Supabase access_token（Authorization: Bearer）' });

    const topic = typeof req.body?.topic === 'string' ? req.body.topic.trim() : '';
    const content = typeof req.body?.content === 'string' ? req.body.content.trim() : '';
    if (!topic || !content) return res.status(400).json({ error: 'topic 与 content 必填' });

    const sb = userClient(token);
    const { data: userData, error: uerr } = await sb.auth.getUser();
    if (uerr || !userData.user) return res.status(401).json({ error: '无效或已过期的登录令牌' });

    const { data, error } = await sb
      .from('geek_memory_entries')
      .insert({
        user_id: userData.user.id,
        topic: topic.slice(0, 200),
        content: content.slice(0, 8000),
      })
      .select('id')
      .single();

    if (error) {
      console.error('[geek_memory insert]', error);
      return res.status(500).json({ error: error.message });
    }
    return res.status(201).json({ id: data?.id });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : '写入失败';
    console.error('[geek_memory]', e);
    return res.status(500).json({ error: msg });
  }
}

export type AiMemoryMatchRow = {
  id: string;
  topic: string;
  content: string;
  similarity: number;
  created_at: string;
};

/**
 * POST /api/ai/memory/search — 关键词匹配 + 按相关度排序
 */
export async function searchAiMemoryHandler(req: Request, res: Response) {
  try {
    const token = bearer(req);
    if (!token) return res.status(401).json({ error: '需要 Supabase access_token（Authorization: Bearer）' });

    const query = typeof req.body?.query === 'string' ? req.body.query.trim() : '';
    if (!query) return res.status(400).json({ error: 'query 必填' });

    const match_threshold =
      typeof req.body?.match_threshold === 'number' && Number.isFinite(req.body.match_threshold)
        ? req.body.match_threshold
        : 0.12;
    const match_count =
      typeof req.body?.match_count === 'number' && req.body.match_count > 0
        ? Math.min(20, Math.floor(req.body.match_count))
        : 8;

    const sb = userClient(token);
    const { data: userData, error: uerr } = await sb.auth.getUser();
    if (uerr || !userData.user) return res.status(401).json({ error: '无效或已过期的登录令牌' });

    const { data: rows, error } = await sb
      .from('geek_memory_entries')
      .select('id, topic, content, created_at')
      .eq('user_id', userData.user.id)
      .order('created_at', { ascending: false })
      .limit(120);

    if (error) {
      console.error('[geek_memory search]', error);
      return res.status(500).json({ error: error.message });
    }

    const scored = (rows || [])
      .map((r: { id: string; topic: string; content: string; created_at: string }) => ({
        id: r.id,
        topic: r.topic,
        content: r.content,
        created_at: r.created_at,
        similarity: keywordScore(query, r.topic, r.content),
      }))
      .filter((r) => r.similarity >= match_threshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, match_count)
      .map(({ similarity, ...rest }) => ({ ...rest, similarity }));

    return res.json({ matches: scored as AiMemoryMatchRow[] });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : '检索失败';
    console.error('[geek_memory search]', e);
    return res.status(500).json({ error: msg });
  }
}
