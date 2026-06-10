/**
 * AIAssistant — Assistant trading propulsé par IA réelle
 * 
 * Utilise les API configurées (OpenAI, Claude, Gemini, Ollama)
 * Fallback en mode démo si pas de clé API configurée.
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Send, User, Loader2, Settings, Trash2, Sparkles, Key, Zap,
} from 'lucide-react';
import { AIAssistantGuide } from '@/components/FeatureGuide';
import { useNavigate } from 'react-router';
import {
  sendMessage,
  getChatHistory,
  clearChatHistory,
  isAIEnabled,
  type ChatMessage,
} from '@/services/aiService';

const SUGGESTIONS = [
  'Analyse XAU/USD pour aujourd\'hui',
  'BTC/USD : ACHAT ou VENTE ?',
  'Money management pour 5000$',
  'Niveaux clés EUR/USD cette semaine',
  'Comment gérer mes émotions en trading ?',
];

export default function AIAssistant() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>(getChatHistory);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiActive, setAiActive] = useState(isAIEnabled);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Check AI status periodically
  useEffect(() => {
    const interval = setInterval(() => setAiActive(isAIEnabled()), 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSend = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || loading) return;

    setInput('');
    setLoading(true);

    // Add user message to UI immediately
    const userMsg: ChatMessage = { role: 'user', content: msg, timestamp: Date.now() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);

    try {
      const response = await sendMessage(msg);
      setMessages([...updatedMessages, { role: 'assistant', content: response, timestamp: Date.now() }]);
    } catch (error: any) {
      setMessages([...updatedMessages, {
        role: 'assistant',
        content: `**Erreur** : ${error.message || 'Service temporairement indisponible'}\n\n[Vérifiez votre configuration IA](/ai-config)`,
        timestamp: Date.now(),
      }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleClear = () => {
    clearChatHistory();
    setMessages([]);
  };

  const formatContent = (content: string) => {
    // Simple markdown formatting
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="text-slate-300">$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-slate-800 px-1.5 py-0.5 rounded text-xs font-mono text-blue-400">$1</code>')
      .replace(/\n/g, '<br />');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              Assistant IA
              {aiActive && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-400 font-normal">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live
                </span>
              )}
              {!aiActive && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-400 font-normal">
                  <Zap className="w-2.5 h-2.5" /> Démo
                </span>
              )}
            </h1>
            <p className="text-xs text-slate-400">
              {aiActive ? 'Connecté à l\'API IA — Réponses en temps réel' : 'Mode démo — Configurez une clé API pour des réponses personnalisées'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/ai-config')}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 hover:text-white hover:border-slate-700 transition-colors">
            <Key className="w-3.5 h-3.5" /> Config IA
          </button>
          <button onClick={handleClear}
            className="p-2 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-red-400 hover:border-red-500/20 transition-colors"
            title="Effacer la conversation">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Feature Guide */}
      <div className="px-6 pt-4">
        <AIAssistantGuide />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* Welcome */}
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Assistant Trading IA</h2>
              <p className="text-sm text-slate-400 max-w-md mx-auto">
                {aiActive
                  ? 'Connecté à l\'IA — Posez-moi vos questions sur les marchés, les signaux, ou la gestion du risque.'
                  : 'Mode démo actif. Configurez une clé API (OpenAI, Claude, Gemini) pour des analyses personnalisées en temps réel.'}
              </p>
              {!aiActive && (
                <button onClick={() => navigate('/ai-config')}
                  className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-400 rounded-xl text-sm font-medium hover:bg-blue-500/30 transition-colors border border-blue-500/30 mx-auto">
                  <Key className="w-4 h-4" /> Configurer l'IA
                </button>
              )}
            </div>

            {/* Suggestions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-2xl mx-auto">
              {SUGGESTIONS.map((s, i) => (
                <button key={i} onClick={() => handleSend(s)}
                  className="flex items-center gap-2 px-4 py-3 bg-slate-900/60 border border-slate-800 rounded-xl text-sm text-slate-300 hover:bg-slate-800/60 hover:border-slate-700 transition-colors text-left">
                  <Sparkles className="w-4 h-4 text-violet-400 flex-shrink-0" />
                  {s}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {messages.map((msg, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-3">
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-blue-500/20' : 'bg-gradient-to-br from-violet-500 to-purple-600'}`}>
              {msg.role === 'user' ? <User className="w-4 h-4 text-blue-400" /> : <Brain className="w-4 h-4 text-white" />}
            </div>

            {/* Content */}
            <div className={`flex-1 rounded-2xl px-4 py-3 ${msg.role === 'user' ? 'bg-blue-500/10 border border-blue-500/10' : 'bg-slate-900/60 border border-slate-800'}`}>
              <div
                className="text-sm text-slate-300 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: formatContent(msg.content) }}
              />
              <p className="text-[10px] text-slate-600 mt-2">
                {new Date(msg.timestamp).toLocaleTimeString('fr-FR')}
              </p>
            </div>
          </motion.div>
        ))}

        {/* Loading indicator */}
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />
                <span className="text-sm text-slate-400">L'IA analyse...</span>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 backdrop-blur-sm">
        <form
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="flex items-center gap-3"
        >
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Posez votre question sur les marchés..."
              disabled={loading}
              className="w-full px-4 py-3 bg-slate-900/60 border border-slate-800 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50 disabled:opacity-50"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl text-sm font-medium hover:from-violet-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <p className="text-[10px] text-slate-600 mt-2 text-center">
          {aiActive ? 'Connecté à l\'API IA — Les réponses sont générées en temps réel' : 'Mode démo — Les réponses sont pré-enregistrées'}
        </p>
      </div>
    </div>
  );
}
