import { motion } from 'framer-motion';
import { useNavigate } from 'react-router';
import { Home, ArrowLeft, AlertTriangle } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B0E14] p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full text-center space-y-6"
      >
        {/* Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="w-20 h-20 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto"
        >
          <AlertTriangle className="w-10 h-10 text-amber-400" />
        </motion.div>

        {/* Code */}
        <div>
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-7xl font-bold text-white font-mono"
          >
            404
          </motion.h1>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-2 h-0.5 w-16 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full"
          />
        </div>

        {/* Message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="space-y-2"
        >
          <h2 className="text-xl font-bold text-white">Page introuvable</h2>
          <p className="text-sm text-slate-400">
            La page que vous cherchez n&apos;existe pas ou a été déplacée.
            Vérifiez l&apos;URL ou retournez au Dashboard.
          </p>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-3 pt-4"
        >
          <button
            onClick={() => navigate('/dashboard')}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold text-sm hover:from-blue-600 hover:to-purple-700 transition-all"
          >
            <Home className="w-4 h-4" /> Dashboard
          </button>
          <button
            onClick={() => navigate(-1)}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-800 text-slate-300 font-medium text-sm hover:bg-slate-700 hover:text-white transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Retour
          </button>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-xs text-slate-600 pt-4"
        >
          XTrendAI Pro — Si le problème persiste, contactez le support.
        </motion.p>
      </motion.div>
    </div>
  );
}
