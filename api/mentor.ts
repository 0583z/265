import type { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

let DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || process.env.VITE_DEEPSEEK_API_KEY;
if (!DEEPSEEK_API_KEY) {
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const envFile = fs.readFileSync(envPath, 'utf8');
      const match = envFile.match(/(?:VITE_)?DEEPSEEK_API_KEY\s*=\s*(sk-[^\r\n"']+)/);
      if (match && match[1]) DEEPSEEK_API_KEY = match[1].trim();
    }
  } catch (e) {}
}

const BASE_URL = 'https://api.deepseek.com/chat/completions';

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    if (!DEEPSEEK_API_KEY) return res.status(500).json({ error: 'API Key 未配置' });

    const { mode, content, intent } = req.body;

    // 🚨 打卡专用模式：强制 DeepSeek 返回 JSON，提取心情、精力和总结
    if (mode === 'punch') {
      const systemPrompt = `你是一个结构化数据提取助手。请根据用户的日记内容，严格提取为 JSON 格式。
      必须包含：
      - "summary": 50字以内的核心总结
      - "mood_score": 1-10的整数，表示心情评估
      - "energy_score": 1-10的整数，表示精力评估
      - "wins": 今天的收获(一句话)
      只输出合法的 JSON 字符串，不要出现任何 markdown 标记 (如 \`\`\`json) 或其他废话。`;

      const aiResponse = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${DEEPSEEK_API_KEY}` },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: content }],
          stream: false // 打卡必须等完整结果
        })
      });

      if (!aiResponse.ok) throw new Error('API Request Failed');
      const data = await aiResponse.json();
      return res.status(200).json({ result: data.choices[0].message.content });
    }

    // --- 分析模式 (保留流式处理) ---
    const systemPrompt = `你是 GEEK HUB 极客助教。当前意图：${intent || '建议'}。语气硬核。使用 Markdown。`;
    const aiResponse = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${DEEPSEEK_API_KEY}` },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: content || '你好' }],
        stream: true,
        temperature: 0.7
      })
    });

    if (!aiResponse.ok) throw new Error('API Error');

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');

    const reader = aiResponse.body?.getReader();
    const decoder = new TextDecoder();
    if (!reader) throw new Error('流读取失败');

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(decoder.decode(value, { stream: true }));
    }
    res.end();
  } catch (error: any) {
    if (!res.headersSent) res.status(500).json({ error: error.message });
    else res.end();
  }
}