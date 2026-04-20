import type { Request, Response } from 'express';

const BASE_URL = 'https://api.deepseek.com/v1/chat/completions';

export default async function chatHandler(req: Request, res: Response) {
  try {
    // 🚨 核心修复 1：将环境变量读取移入函数内部！确保每次点击时去实时读取最新配置
    const DEEPSEEK_API_KEY = process.env.VITE_DEEPSEEK_API_KEY || process.env.DEEPSEEK_API_KEY;

    if (!DEEPSEEK_API_KEY) {
      return res.status(500).json({ error: '未配置 DEEPSEEK_API_KEY' });
    }

    const { messages, stream = true, mode, rawText } = req.body;

    // 🚨 核心修复 2：拦截处理“结构化打卡”模式，让 AI 返回前端需要的 JSON 格式
    if (mode === 'structured_log') {
      const prompt = `你是一个备赛系统助教。请分析用户的备赛打卡日记，提取出结构化数据。
必须严格输出合法的 JSON 格式（不要包含 markdown 代码块）。
JSON 格式要求：
{
  "summary": "一句话总结用户的进度或心情(20字以内)",
  "wins": "今天做的好/学到的(如果没有留空)",
  "blockers": "遇到的困难/卡点(如果没有留空)",
  "mood_score": 5, // 心情打分，1-5的整数
  "energy_score": 5 // 精力打分，1-5的整数
}

用户的日记：\n${rawText}`;

      const response = await fetch(BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: prompt }],
          stream: false,
          response_format: { type: 'json_object' } // 尝试让模型强制输出 JSON
        })
      });

      if (!response.ok) throw new Error(`DeepSeek Error: ${response.statusText}`);
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '{}';
      
      try {
        // 清理 AI 可能带上的 markdown 格式，确保 JSON 能被解析
        const cleanContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanContent);
        return res.status(200).json(parsed);
      } catch (e) {
        console.error("AI 返回的 JSON 无法解析:", content);
        return res.status(500).json({ error: 'AI 未按规定返回数据' });
      }
    }

    // --- 下面是原来的“普通极客聊天”逻辑 ---
    const systemMessage = {
      role: 'system',
      content: '你是 GEEK HUB 竞赛工作台的内置 AI 助教。回答要简短、极客、直接提供代码片段或架构思路，不讲废话。'
    };

    const payloadMessages = [systemMessage, ...(messages || [])];

    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: payloadMessages,
        stream: stream // 开启流式响应
      })
    });

    if (!response.ok) {
      throw new Error(`DeepSeek Error: ${response.statusText}`);
    }

    // 处理流式输出 (Stream)
    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      if (response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          res.write(chunk);
        }
      }
      return res.end();
    } else {
      // 非流式处理
      const data = await response.json();
      return res.status(200).json(data);
    }

  } catch (error: any) {
    console.error('[Chat API Error]:', error);
    if (!res.headersSent) {
      return res.status(500).json({ error: error.message || '对话接口异常' });
    }
    res.end();
  }
}