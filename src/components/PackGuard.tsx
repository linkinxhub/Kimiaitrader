import type { PackId } from '@/types/packs';
import { usePackAccess } from '@/hooks/usePackAccess';
import { PACK_LABELS, PACK_BG_COLORS } from '@/types/packs';
import { formatCurrency } from '@/lib/format';
import { motion } from 'framer-motion';
import { Lock, ArrowUp } from 'lucide-react';
import { useNavigate } from 'react-router';

interface PackGuardProps {
  requiredPack: PackId;
  children: React.ReactNode;
}

export const PackGuard: React.FC<PackGuardProps> = ({ requiredPack, children }) => {
  const { canAccess } = usePackAccess();
  const navigate = useNavigate();

  if (canAccess(requiredPack)) {
    return <>{children}</>;
  }

  const packPrices: Record<PackId, number> = {
    free: 0,
    pro: 79,
    expert: 199,
    institutional: 499,
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`flex flex-col items-center justify-center min-h-[400px] rounded-2xl border-2 border-dashed p-10 text-center ${PACK_BG_COLORS[requiredPack]}`}
    >
      <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mb-4">
        <Lock className="w-8 h-8 text-slate-400" />
      </div>
      <h3 className="text-xl font-bold text-white mb-2">Fonctionnalité Premium</h3>
      <p className="text-sm text-slate-400 mb-2">
        Cette fonctionnalité nécessite le pack <span className="font-bold text-amber-400">{PACK_LABELS[requiredPack]}</span>.
      </p>
      <p className="text-lg font-bold text-amber-400 mb-6">
        {formatCurrency(packPrices[requiredPack])}/mois
      </p>
      <button
        onClick={() => navigate('/subscription')}
        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl font-semibold text-white hover:shadow-lg hover:shadow-amber-500/30 hover:scale-105 transition-all"
      >
        <ArrowUp className="w-4 h-4" /> Passer au pack {PACK_LABELS[requiredPack]}
      </button>
    </motion.div>
  );
};
