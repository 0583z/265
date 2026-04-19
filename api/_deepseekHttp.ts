/**
 * DeepSeek Chat Completions（OpenAI 兼容 HTTP），不依赖 openai npm 包。
 */
const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions';

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

export async function deepseekChatCompletion(params: {
  apiKey: string;
  messages: ChatMessage[];
  responseFormatJson?: boolean;
  model?: string;
}): Promise<string> {
  const { apiKey, messages, responseFormatJson, model = 'deepseek-chat' } = params;
  const res = await fetch(DEEPSEEK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      ...(responseFormatJson ? { response_format: { type: 'json_object' } } : {}),
    }),
  });

  const raw = await res.text();
  if (!res.ok) {
    throw new Error(`DeepSeek HTTP ${res.status}: ${raw.slice(0, 200)}`);
  }
  let json: { choices?: { message?: { content?: string } }[] };
  try {
    json = JSON.parse(raw) as typeof json;
  } catch {
    throw new Error('DeepSeek 返回非 JSON');
  }
  const text = json.choices?.[0]?.message?.content;
  if (text == null || text === '') throw new Error('DeepSeek 返回空内容');
  return text;
}

export function getDeepseekApiKey(): string | undefined {
  const k = process.env.DEEPSEEK_API_KEY;
  return k && k.trim() ? k.trim() : undefined;
}
