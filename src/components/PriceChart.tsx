import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Bar
} from 'recharts';
import type { PriceData } from '@/types/trading';

interface PriceChartProps {
  data: PriceData[];
  title: string;
  height?: number;
}

export const PriceChart: React.FC<PriceChartProps> = ({ data, title, height = 400 }) => {
  const [showVolume, setShowVolume] = useState(true);
  const [showEMA, setShowEMA] = useState(true);

  const minPrice = Math.min(...data.map(d => d.low)) * 0.9995;
  const maxPrice = Math.max(...data.map(d => d.high)) * 1.0005;

  // Calculate EMA
  const calculateEMA = (prices: number[], period: number): (number | null)[] => {
    const ema: (number | null)[] = [];
    const multiplier = 2 / (period + 1);
    
    for (let i = 0; i < prices.length; i++) {
      if (i < period - 1) {
        ema.push(null);
      } else if (i === period - 1) {
        const sum = prices.slice(0, period).reduce((a, b) => a + b, 0);
        ema.push(sum / period);
      } else {
        const prevEma = ema[i - 1] || prices[i - 1];
        ema.push((prices[i] - prevEma) * multiplier + prevEma);
      }
    }
    return ema;
  };

  const closes = data.map(d => d.close);
  const ema20 = calculateEMA(closes, 20);
  const ema50 = calculateEMA(closes, 50);

  const chartData = data.map((d, i) => ({
    ...d,
    ema20: ema20[i],
    ema50: ema50[i],
    time: new Date(d.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
  }));

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowEMA(!showEMA)}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${showEMA ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-slate-800 text-slate-500 border border-slate-700'}`}
          >
            EMA
          </button>
          <button
            onClick={() => setShowVolume(!showVolume)}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${showVolume ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-slate-800 text-slate-500 border border-slate-700'}`}
          >
            Volume
          </button>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis 
            dataKey="time" 
            stroke="#475569" 
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            tickLine={false}
          />
          <YAxis 
            domain={[minPrice, maxPrice]} 
            stroke="#475569"
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            tickLine={false}
            width={80}
            tickFormatter={(val: number) => val.toFixed(2)}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0f172a',
              border: '1px solid #1e293b',
              borderRadius: '12px',
              color: '#fff',
            }}
            labelStyle={{ color: '#94a3b8' }}
          />
          {showVolume && (
            <Bar dataKey="volume" fill="#f59e0b" opacity={0.3} yAxisId="volume" />
          )}
          <YAxis yAxisId="volume" orientation="right" hide />
          <Area 
            type="monotone" 
            dataKey="close" 
            stroke="#3b82f6" 
            fill="#3b82f6" 
            fillOpacity={0.1}
            strokeWidth={2}
            name="Prix"
          />
          {showEMA && (
            <>
              <Line type="monotone" dataKey="ema20" stroke="#10b981" strokeWidth={1.5} dot={false} name="EMA 20" />
              <Line type="monotone" dataKey="ema50" stroke="#f59e0b" strokeWidth={1.5} dot={false} name="EMA 50" />
            </>
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </motion.div>
  );
};
