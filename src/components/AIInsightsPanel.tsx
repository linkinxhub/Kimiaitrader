import React from 'react';
import { motion } from 'framer-motion';
import { Brain, TrendingUp, Newspaper, Users } from 'lucide-react';
import type { AIInsight } from '@/types/trading';

interface AIInsightsPanelProps {
  insights: AIInsight[];
}

export const AIInsightsPanel: React.FC<AIInsightsPanelProps> = ({ insights }) => {
  const getIcon = (type: string) => {
    if (type === 'technical') return <TrendingUp className="w-4 h-4 text-blue-400" />;
    if (type === 'fundamental') return <Newspaper className="w-4 h-4 text-amber-400" />;
    return <Users className="w-4 h-4 text-purple-400" />;
  };

  const getTypeColor = (type: string) => {
    if (type === 'technical') return 'border-blue-500/30 bg-blue-500/5';
    if (type === 'fundamental') return 'border-amber-500/30 bg-amber-500/5';
    return 'border-purple-500/30 bg-purple-500/5';
  };

  const getTypeLabel = (type: string) => {
    if (type === 'technical') return 'Technique';
    if (type === 'fundamental') return 'Fondamental';
    return 'Sentiment';
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-5 h-5 text-purple-400" />
        <h3 className="text-lg font-semibold text-white">Insights IA</h3>
      </div>

      <div className="space-y-3">
        {insights.map((insight, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`p-4 rounded-xl border ${getTypeColor(insight.type)}`}
          >
            <div className="flex items-center gap-2 mb-2">
              {getIcon(insight.type)}
              <span className="text-xs font-medium text-slate-500 uppercase">{getTypeLabel(insight.type)}</span>
              <div className="ml-auto flex items-center gap-1">
                <div className="h-1.5 w-16 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                    style={{ width: `${insight.confidence}%` }}
                  />
                </div>
                <span className="text-xs text-slate-500">{insight.confidence}%</span>
              </div>
            </div>
            <h4 className="text-sm font-semibold text-white mb-1">{insight.title}</h4>
            <p className="text-xs text-slate-400">{insight.description}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
