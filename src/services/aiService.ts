/**
 * AIService — Intégration de vraies API IA pour l'assistant
 * 
 * Supports : OpenAI (GPT-3.5/4), Anthropic Claude, Google Gemini, Ollama (local)
 * L'utilisateur configure sa clé API dans /ai-config
 * Les appels se font côté client (pas de backend requis)
 */

export type AIModel = 'gpt-3.5-turbo' | 'gpt-4' | 'gpt-4-turbo' | 'claude-sonnet' | 'claude-haiku' | 'gemini-pro' | 'gemini-flash' | 'ollama-llama3' | 'ollama-mistral';

export interface AIConfig {
  provider: 'openai' | 'anthropic' | 'google' | 'ollama' | 'demo';
  model: AIModel;
  apiKey: string;
  baseUrl?: string;       // Pour Ollama ou proxy custom
  maxTokens: number;
  temperature: number;
  enabled: boolean;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

const DEFAULT_CONFIG: AIConfig = {
  provider: 'demo',
  model: 'gpt-3.5-turbo',
  apiKey: '',
  maxTokens: 2000,
  temperature: 0.7,
  enabled: false,
};

const STORAGE_KEY = 'xtrendai_ai_config';
const CHAT_HISTORY_KEY = 'xtrendai_chat_history';

// ─── Config management ──────────────────────────────────

export function getAIConfig(): AIConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT_CONFIG, ...JSON.parse(raw) } : { ...DEFAULT_CONFIG };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export function saveAIConfig(config: AIConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function isAIEnabled(): boolean {
  const cfg = getAIConfig();
  return cfg.enabled && cfg.apiKey.length > 10;
}

// ─── Chat history ───────────────────────────────────────

export function getChatHistory(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(CHAT_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addChatMessage(msg: ChatMessage) {
  const history = getChatHistory();
  history.push(msg);
  // Keep last 100 messages
  if (history.length > 100) history.shift();
  localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(history));
}

export function clearChatHistory() {
  localStorage.removeItem(CHAT_HISTORY_KEY);
}

// ─── System prompt for trading assistant ────────────────

function getSystemPrompt(): string {
  return `Tu es XTrendAI Pro Assistant, un expert en analyse technique et trading financier. 

CAPACITÉS :
- Analyse technique : supports, résistances, tendances, patterns chartistes
- Signaux de trading : évaluation des setups Entry/Stop Loss/Take Profit
- Gestion des risques : calcul des positions, ratios R/R, money management
- Analyse fondamentale : impact des news économiques sur les marchés
- Psychologie du trading : gestion des émotions, discipline

RÈGLES :
- Réponds toujours en français sauf si l'utilisateur demande autrement
- Sois concis mais précis — les traders n'ont pas le temps de lire des romans
- Inclus des chiffres quand c'est pertinent (niveaux de prix, ratios)
- Donne un avis clair : ACHAT, VENTE, ou ATTENTE avec justification
- Mentionne toujours les risques — jamais de promesse de gains
- Utilise le format markdown pour la lisibilité

FORMAT DE RÉPONSE POUR LES SIGNAUX :
**Direction** : ACHAT / VENTE / ATTENTE
**Confiance** : X/100
**Entry** : prix
**Stop Loss** : prix  
**Take Profit** : prix
**Ratio R/R** : X:1
**Analyse** : justification en 2-3 phrases`;
}

// ─── API Callers ────────────────────────────────────────

async function callOpenAI(config: AIConfig, messages: ChatMessage[]): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: 'system', content: getSystemPrompt() },
        ...messages.map(m => ({ role: m.role, content: m.content })),
      ],
      max_tokens: config.maxTokens,
      temperature: config.temperature,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `OpenAI error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || 'Pas de réponse';
}

async function callClaude(config: AIConfig, messages: ChatMessage[]): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: config.model === 'claude-sonnet' ? 'claude-3-sonnet-20240229' : 'claude-3-haiku-20240307',
      max_tokens: config.maxTokens,
      temperature: config.temperature,
      system: getSystemPrompt(),
      messages: messages.map(m => ({ role: m.role === 'system' ? 'user' : m.role, content: m.content })),
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Claude error: ${response.status}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text || 'Pas de réponse';
}

async function callGemini(config: AIConfig, messages: ChatMessage[]): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.model === 'gemini-flash' ? 'gemini-1.5-flash' : 'gemini-1.5-pro'}:generateContent?key=${config.apiKey}`;

  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      generationConfig: {
        maxOutputTokens: config.maxTokens,
        temperature: config.temperature,
      },
      systemInstruction: { parts: [{ text: getSystemPrompt() }] },
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Gemini error: ${response.status}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Pas de réponse';
}

async function callOllama(config: AIConfig, messages: ChatMessage[]): Promise<string> {
  const baseUrl = config.baseUrl || 'http://localhost:11434';
  const model = config.model === 'ollama-llama3' ? 'llama3' : 'mistral';

  const response = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: getSystemPrompt() },
        ...messages.map(m => ({ role: m.role, content: m.content })),
      ],
      stream: false,
      options: { temperature: config.temperature, num_predict: config.maxTokens },
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama error: ${response.status} — Vérifiez qu'Ollama tourne sur ${baseUrl}`);
  }

  const data = await response.json();
  return data.message?.content || 'Pas de réponse';
}

// ─── Main send message ──────────────────────────────────

export async function sendMessage(userMessage: string): Promise<string> {
  const config = getAIConfig();

  // Add user message to history
  addChatMessage({ role: 'user', content: userMessage, timestamp: Date.now() });

  // If demo mode or no API key, return demo response
  if (config.provider === 'demo' || !config.apiKey || config.apiKey.length < 10) {
    return generateDemoResponse(userMessage);
  }

  // Get recent history for context (last 10 messages)
  const history = getChatHistory().slice(-10);

  try {
    let response: string;
    switch (config.provider) {
      case 'openai':
        response = await callOpenAI(config, history);
        break;
      case 'anthropic':
        response = await callClaude(config, history);
        break;
      case 'google':
        response = await callGemini(config, history);
        break;
      case 'ollama':
        response = await callOllama(config, history);
        break;
      default:
        response = generateDemoResponse(userMessage);
    }

    // Save assistant response
    addChatMessage({ role: 'assistant', content: response, timestamp: Date.now() });
    return response;
  } catch (error: any) {
    const errMsg = `**Erreur API** : ${error.message}\n\nVérifiez votre clé API dans Paramètres > Configuration IA. En mode démo, je peux quand même répondre aux questions générales.`;
    addChatMessage({ role: 'assistant', content: errMsg, timestamp: Date.now() });
    return errMsg;
  }
}

// ─── Demo responses (when no API key) ──────────────────

function generateDemoResponse(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes('xau') || lower.includes('or') || lower.includes('gold')) {
    return `**Direction** : ACHAT (attente du retest)\n**Confiance** : 82/100\n**Entry** : 2648.50 (retest de la breakout zone)\n**Stop Loss** : 2640.00\n**Take Profit** : 2665.00 / 2680.00\n**Ratio R/R** : 2.1:1\n\n**Analyse** : XAU/USD a cassé la résistance des 2648$ avec volume. Attendez un retest de cette zone pour entrer. Le RSI daily à 62 laisse de la marge haussière. Attention au NFP vendredi qui pourrait créer du volatility.`;
  }

  if (lower.includes('btc') || lower.includes('bitcoin')) {
    return `**Direction** : ACHAT (momentum)\n**Confiance** : 75/100\n**Entry** : 67200\n**Stop Loss** : 65800\n**Take Profit** : 69500 / 72000\n**Ratio R/R** : 1.8:1\n\n**Analyse** : BTC confirme son rebond sur le support 66K$. MACD 4h croisement haussier en cours. Volume en hausse de 15% sur 24h. Risque : réjection sur la résistance 68.5K$ qui a tenu 3 fois.`;
  }

  if (lower.includes('eur') || lower.includes('euro')) {
    return `**Direction** : VENTE (divergence)\n**Confiance** : 68/100\n**Entry** : 1.0850\n**Stop Loss** : 1.0885\n**Take Profit** : 1.0800 / 1.0760\n**Ratio R/R** : 1.4:1\n\n**Analyse** : Divergence baissière RSI H4 + double top en formation. L'EUR/USD est sous pression avec le différentiel de taux Fed/ECB. Attention aux données IPC US jeudi.`;
  }

  if (lower.includes('risk') || lower.includes('risque') || lower.includes('money management')) {
    return `**Money Management — Règles d'or :**

1. **Jamais plus de 2% du capital par trade**
2. **Ratio R/R minimum 1:1.5** (idéalement 1:2+)
3. **3 trades max simultanés** pour un compte < 10K$
4. **Stop Loss toujours placé avant l'entry** — pas après !
5. **Journal de trading** : notez chaque trade, revoyez hebdo

**Exemple de sizing** :\nCapital 10 000$ × 2% = 200$ max de risque\nSi SL = 50 pips → position = 200$ / 50 pips = 4$/pip = 0.4 lots standard`;
  }

  if (lower.includes('bonjour') || lower.includes('salut') || lower.includes('hello')) {
    return `Salut ! Je suis votre assistant trading XTrendAI Pro.\n\nJe peux vous aider avec :\n• **Analyse technique** — supports, résistances, patterns\n• **Évaluation de signaux** — Entry, SL, TP, ratio R/R\n• **Money management** — sizing, gestion du risque\n• **Psychologie trading** — discipline, gestion des émotions\n\nPosez-moi une question sur un actif (XAU, BTC, EUR/USD...) ou demandez une analyse !`;
  }

  return `**Analyse de votre question :**\n\nPour vous donner une réponse précise, j'ai besoin de quelques détails :\n\n1. **Quel actif** ? (XAU/USD, BTC/USD, EUR/USD, NAS100...)
2. **Quel timeframe** ? (M15, H1, H4, D1)
3. **Votre profil** ? (day trader, swing, position)
\nEn attendant, voici les niveaux clés du jour :\n\n| Actif | Support | Résistance | Tendance |\n|-------|---------|------------|----------|\n| XAU/USD | 2640 | 2665 | Haussière |\n| BTC/USD | 65800 | 68500 | Haussière |\n| EUR/USD | 1.0820 | 1.0880 | Baissière |\n| NAS100 | 19200 | 19700 | Haussière |\n\nConfigurez une clé API (OpenAI, Claude, Gemini) dans Paramètres > Configuration IA pour des analyses personnalisées en temps réel.`;
}
