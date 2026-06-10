/**
 * OpenAI / Claude / DeepSeek / Gemini Service
 * Service d'intégration LLM pour l'Assistant IA Trading
 * L'utilisateur configure sa clé API dans ses paramètres
 *
 * Compatible avec :
 * - OpenAI GPT-4o / GPT-4o-mini
 * - Anthropic Claude 3.5 Sonnet / Haiku
 * - DeepSeek Chat
 * - Google Gemini
 */

export type LLMProvider = 'openai' | 'anthropic' | 'deepseek' | 'gemini';

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMConfig {
  provider: LLMProvider;
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

const SYSTEM_PROMPT = `Tu es XTrendAI Pro, un assistant de trading expert propulsé par IA.
Tu analyses les marchés financiers (Forex, Crypto, Métaux) avec expertise.
Règles :
- Réponds de manière concise et professionnelle en français
- Fournis des analyses basées sur les données fournies
- Donne toujours un disclaimer : "Ce n'est pas un conseil financier"
- Inclus des niveaux clés (support, résistance, Entry, SL, TP) quand possible
- Utilise des émojis pour rendre les réponses lisibles
- Formatte avec des sections claires (## Titre)`;

// ─── Storage ────────────────────────────────────────────

const CONFIG_KEY = 'xtrendai_llm_config';

export function getLLMConfig(): LLMConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (!raw) return getDefaultConfig();
    return { ...getDefaultConfig(), ...JSON.parse(raw) };
  } catch {
    return getDefaultConfig();
  }
}

function getDefaultConfig(): LLMConfig {
  return {
    provider: 'openai',
    apiKey: '',
    model: 'gpt-4o-mini',
    temperature: 0.7,
    maxTokens: 1500,
  };
}

export function saveLLMConfig(config: Partial<LLMConfig>) {
  const current = getLLMConfig();
  const updated = { ...current, ...config };
  localStorage.setItem(CONFIG_KEY, JSON.stringify(updated));
  return updated;
}

export function hasLLMConfigured(): boolean {
  return !!getLLMConfig().apiKey;
}

// ─── API Calls ──────────────────────────────────────────

async function callOpenAI(config: LLMConfig, messages: LLMMessage[]): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      temperature: config.temperature,
      max_tokens: config.maxTokens,
      stream: false,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `OpenAI Error: ${res.status}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || 'Pas de réponse';
}

async function callAnthropic(config: LLMConfig, messages: LLMMessage[]): Promise<string> {
  const systemMsg = messages.find(m => m.role === 'system')?.content || SYSTEM_PROMPT;
  const userMessages = messages.filter(m => m.role !== 'system');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: config.model || 'claude-3-5-sonnet-20241022',
      max_tokens: config.maxTokens,
      temperature: config.temperature,
      system: systemMsg,
      messages: userMessages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Claude Error: ${res.status}`);
  }

  const data = await res.json();
  return data.content?.[0]?.text || 'Pas de réponse';
}

async function callDeepSeek(config: LLMConfig, messages: LLMMessage[]): Promise<string> {
  const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model || 'deepseek-chat',
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      temperature: config.temperature,
      max_tokens: config.maxTokens,
      stream: false,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `DeepSeek Error: ${res.status}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || 'Pas de réponse';
}

async function callGemini(config: LLMConfig, messages: LLMMessage[]): Promise<string> {
  const userMessages = messages.filter(m => m.role !== 'system');
  const lastMessage = userMessages[userMessages.length - 1];

  const model = config.model || 'gemini-1.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.apiKey}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: lastMessage?.content || 'Hello' }] }],
      generationConfig: {
        temperature: config.temperature,
        maxOutputTokens: config.maxTokens,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Gemini Error: ${res.status}`);
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Pas de réponse';
}

// ─── Unified Chat ───────────────────────────────────────

export async function chatWithLLM(userMessage: string, context?: string): Promise<string> {
  const config = getLLMConfig();
  if (!config.apiKey) {
    throw new Error('Clé API non configurée. Allez dans Paramètres > Intelligence Artificielle pour configurer votre clé.');
  }

  const messages: LLMMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
  ];

  if (context) {
    messages.push({ role: 'system', content: `Contexte marché actuel : ${context}` });
  }

  messages.push({ role: 'user', content: userMessage });

  switch (config.provider) {
    case 'openai': return callOpenAI(config, messages);
    case 'anthropic': return callAnthropic(config, messages);
    case 'deepseek': return callDeepSeek(config, messages);
    case 'gemini': return callGemini(config, messages);
    default: throw new Error('Provider non supporté');
  }
}

export async function* chatWithLLMStream(userMessage: string, context?: string): AsyncGenerator<string, void, unknown> {
  const config = getLLMConfig();
  if (!config.apiKey) {
    yield '⚠️ **Clé API non configurée**\n\nAllez dans **Paramètres > Intelligence Artificielle** pour configurer votre clé API OpenAI, Claude, DeepSeek ou Gemini.';
    return;
  }

  // Streaming via OpenAI (le plus fiable)
  try {
    const messages = [
      { role: 'system' as const, content: SYSTEM_PROMPT + (context ? `\nContexte : ${context}` : '') },
      { role: 'user' as const, content: userMessage },
    ];

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model || 'gpt-4o-mini',
        messages,
        temperature: config.temperature,
        max_tokens: config.maxTokens,
        stream: true,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Erreur ${res.status}`);
    }

    const reader = res.body?.getReader();
    if (!reader) throw new Error('No reader');

    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter(l => l.trim().startsWith('data: '));

      for (const line of lines) {
        const json = line.replace('data: ', '').trim();
        if (json === '[DONE]') return;
        try {
          const parsed = JSON.parse(json);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) yield content;
        } catch {
          // skip
        }
      }
    }
  } catch (err) {
    yield `\n\n❌ **Erreur** : ${err instanceof Error ? err.message : 'Erreur inconnue'}`;
  }
}
