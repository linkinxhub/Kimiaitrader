import React from 'react';
import { motion } from 'framer-motion';

interface ConfidenceGaugeProps {
  value: number;
  size?: number;
  label?: string;
  sublabel?: string;
}

export const ConfidenceGauge: React.FC<ConfidenceGaugeProps> = ({ 
  value, 
  size = 140, 
  label = 'Confiance IA',
  sublabel
}) => {
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (value / 100) * circumference;
  
  const getColor = (v: number) => {
    if (v >= 80) return '#10b981';
    if (v >= 60) return '#f59e0b';
    if (v >= 40) return '#f97316';
    return '#ef4444';
  };

  const color = getColor(value);

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#1e293b"
            strokeWidth={strokeWidth}
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - progress }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span 
            className="text-2xl font-bold text-white"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            {value}%
          </motion.span>
        </div>
      </div>
      <p className="mt-2 text-sm font-medium text-slate-300">{label}</p>
      {sublabel && <p className="text-xs text-slate-500">{sublabel}</p>}
    </div>
  );
};
