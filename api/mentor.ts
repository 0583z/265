import type { Request, Response } from 'express';
import { deepseekChatCompletion, getDeepseekApiKey } from './_deepseekHttp.ts';

const COACH_SYSTEM = `你是严厉但专业的信息学竞赛教练（CCF CSP / NOIP 风格）。
要求：只用简体中文；短句、可执行；不灌水；不道歉过度；指出问题时一针见血。
当需要结构化输出时，严格遵守用户要求的 JSON 字段，不要输出多余 Markdown。`;

function safeJsonParse<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    const m = raw.match(/\{[\s\S]*\}/);
    if (!m) return null;
    try {
      return JSON.parse(m[0]) as T;
    } catch {
      return null;
    }
  }
}

export default async function mentorHandler(req: Request, res: Response): Promise<void> {
  const key = getDeepseekApiKey();
  if (!key) {
    res.status(500).json({ error: '服务端未配置 DEEPSEEK_API_KEY' });
    return;
  }

  const body = req.body || {};
  const mode = String(body.mode || '');

  try {
    if (mode === 'proactive') {
      const title = String(body.title || '').slice(0, 500);
      const category = String(body.category || '').slice(0, 80);
      const durationMinutes = Number(body.durationMinutes) || 0;
      const memoryBlock = String(body.memoryBlock || '（无）').slice(0, 4000);

      const user = `用户刚完成一次专注。
标题：${title}
分类：${category}
时长：${durationMinutes} 分钟

知识库 / 历史记忆命中摘要：
${memoryBlock}

请判断用户当前是否在「架构 / 分层 / 模块边界 / 依赖注入 / 设计原则」等方向深入。若是，在 followUp 里用一句话主动询问是否需要某条具体知识点（例如依赖倒置原则）的深度解析；若否，followUp 可为另一条高质量追问。
严格输出 JSON：{"title":"string","body":"string","followUp":"string"}`;

      const raw = await deepseekChatCompletion({
        apiKey: key,
        messages: [
          { role: 'system', content: COACH_SYSTEM },
          { role: 'user', content: user },
        ],
        responseFormatJson: true,
      });
      const parsed = safeJsonParse<{ title?: string; body?: string; followUp?: string }>(raw);
      if (!parsed?.title || !parsed?.body) {
        res.status(500).json({ error: '导师响应解析失败' });
        return;
      }
      res.json({ title: parsed.title, body: parsed.body, followUp: parsed.followUp || '' });
      return;
    }

    if (mode === 'morning') {
      const contextMarkdown = String(body.contextMarkdown || '').slice(0, 12000);
      const user = `以下是用户最近的能力雷达、专注与打卡（Markdown）。假设用户正在备战「第 41 届 CCF CSP」。
请找出最可能的薄弱项（尤其动态规划、图论、贪心、实现细节），给出今日一条可执行训练建议。

用户画像：
${contextMarkdown}

严格输出 JSON：{"title":"string","body":"string","challenge":"string"}`;

      const raw = await deepseekChatCompletion({
        apiKey: key,
        messages: [
          { role: 'system', content: COACH_SYSTEM },
          { role: 'user', content: user },
        ],
        responseFormatJson: true,
      });
      const parsed = safeJsonParse<{ title?: string; body?: string; challenge?: string }>(raw);
      if (!parsed?.title || !parsed?.body) {
        res.status(500).json({ error: '早报解析失败' });
        return;
      }
      res.json({
        title: parsed.title,
        body: parsed.body,
        challenge: parsed.challenge || '',
      });
      return;
    }

    if (mode === 'monthly') {
      const contextMarkdown = String(body.contextMarkdown || '').slice(0, 16000);
      const monthLabel = String(body.monthLabel || '当月');

      const user = `你是竞赛教练兼技术写作顾问。请根据以下「原始备赛数据」（含 focus_sessions 与 daily_logs 摘录），写一份「${monthLabel}备赛月报」。
要求：
- 输出为完整 Markdown，可直接放进简历或大赛说明书；
- 把口语化打卡（如「修好了 K-Means 的 Bug」）改写成专业项目叙述（问题背景—方法—结果），但不得捏造不存在的具体指标；
- 分小节：概览 / 技术深度 / 节奏与心态 / 下月建议；
- 不要代码围栏包裹全文；不要 JSON。

原始数据：
${contextMarkdown}`;

      const raw = await deepseekChatCompletion({
        apiKey: key,
        messages: [
          { role: 'system', content: COACH_SYSTEM },
          { role: 'user', content: user },
        ],
        responseFormatJson: false,
      });
      res.json({ markdown: raw.trim() });
      return;
    }

    res.status(400).json({ error: '未知 mode，支持 proactive | morning | monthly' });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : '导师接口异常';
    res.status(500).json({ error: msg });
  }
}
