import type { VercelRequest, VercelResponse } from '@vercel/node';
import { deepseekChatCompletion, getDeepseekApiKey } from './_deepseekHttp.ts';

type ChatMode = 'extract' | 'strategy' | 'focus_review' | 'structured_log' | 'intent_detect';

/**
 * 极客导师：全量 DeepSeek，JSON 输出；上下文注入实现降级 RAG。
 */

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const {
    rawText,
    mode = 'extract',
    contextMarkdown,
    personaWeights,
    durationMinutes,
  } = req.body as {
    rawText?: string;
    mode?: ChatMode;
    contextMarkdown?: string;
    personaWeights?: Record<string, number>;
    durationMinutes?: number;
  };

  if (!rawText || typeof rawText !== 'string') {
    return res.status(400).json({ error: '请提供输入文本内容。' });
  }

  const safeMode: ChatMode = [
    'extract',
    'strategy',
    'focus_review',
    'structured_log',
    'intent_detect',
  ].includes(mode)
    ? mode
    : 'extract';

  try {
    const apiKey = getDeepseekApiKey();
    if (!apiKey) {
      return res.status(500).json({ error: '缺少 DEEPSEEK_API_KEY：请在 .env 中配置' });
    }

    const personaLine =
      personaWeights && Object.keys(personaWeights).length
        ? `\n【系统推荐权重（已按画像微调，请在建议中隐性体现）】\n${JSON.stringify(personaWeights)}`
        : '';

    const contextBlock =
      contextMarkdown && contextMarkdown.trim().length
        ? `\n\n【用户能力画像与学习节奏 — 必须参考】\n${contextMarkdown.trim()}`
        : '';

    const systemPrompts: Record<ChatMode, string> = {
      intent_detect: `你是意图分类器。根据用户输入判断更适合哪种处理：
- extract：粘贴了网址、赛事公告、报名简章、PDF 文字、赛制说明等需要「结构化提取」的内容。
- strategy：用户在问推荐、计划、怎么做、如何提升、组队、备赛路线等「咨询建议」。
只输出 JSON：{ "analyzerMode": "extract" | "strategy", "confidence": 0-1, "reason": "一句中文理由" }`,

      extract: `你是一个专业的大学竞赛数据提取助手。从输入的文本中提取最精准的竞赛核心数据。输出严格 JSON。
      结构：{ "title": "比赛名称", "deadline": "YYYY-MM-DD", "category": "学科技术/创新创业/艺术传媒/综合类", "link": "链接", "description": "20-50字简介" }
      若无法识别，尽量合理推断字段，不要返回空 title。${contextBlock}${personaLine}`,

      strategy: `你是一个资深的计算机专业竞赛教练。结合用户画像，为用户生成「可执行的备赛建议」。
      字数：80-140 字；必须点名与用户强项/弱项相关的动作（例如算法 vs 前端）。
      输出 JSON：{ "strategy": "建议正文" }${contextBlock}${personaLine}`,

      focus_review: `你是「极客回归」首席技术教练。用户刚完成一段番茄专注，请根据「专注主题」与「时长」给出 2-4 句硬核技术点评：可包含学习路径、常见坑、工具链或刻意练习建议。
      输出 JSON：{ "review": "点评正文" }
      用户专注时长（分钟）：${typeof durationMinutes === 'number' ? durationMinutes : '未知'}${contextBlock}`,

      structured_log: `将用户的口语化打卡/心得整理为备赛日志字段。输出严格 JSON：
      { "summary": "一句话总结", "wins": "今日小胜利", "blockers": "阻碍/卡点", "mood_score": 1-5 整数, "energy_score": 1-5 整数 }
      若信息缺失，用合理默认值补齐数字字段。${contextBlock}`,
    };

    const content = await deepseekChatCompletion({
      apiKey,
      messages: [
        { role: 'system', content: systemPrompts[safeMode] },
        { role: 'user', content: rawText },
      ],
      responseFormatJson: true,
    });

    const result = JSON.parse(content || '{}');

    if (safeMode === 'intent_detect' && result.analyzerMode) {
      return res.status(200).json({
        analyzerMode: result.analyzerMode === 'strategy' ? 'strategy' : 'extract',
        intentConfidence: typeof result.confidence === 'number' ? result.confidence : 0.7,
        intentReason: typeof result.reason === 'string' ? result.reason : '',
        _mode: safeMode,
      });
    }

    return res.status(200).json({ ...result, _mode: safeMode });
  } catch (error: unknown) {
    console.error('DeepSeek Server Error:', error);
    return res.status(500).json({ error: 'AI 解析引擎暂不可用，请稍后再试。' });
  }
}
