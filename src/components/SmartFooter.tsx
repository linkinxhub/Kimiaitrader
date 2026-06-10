/**
 * SmartFooter — Footer intelligent basé sur la configuration
 * S'adapte dynamiquement aux paramètres du footerConfigService
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowUp, Twitter, Linkedin, Youtube, Instagram, Facebook,
  MessageCircle, Send, CreditCard, Wallet, Landmark, Bitcoin,
  Shield, Lock, CheckCircle, Server, Globe, Mail, MapPin, Phone,
  Zap, Wifi, WifiOff, ChevronRight, Sparkles
} from 'lucide-react';
import {
  getFooterConfig, subscribeToFooterChanges,
  type FooterConfig, type FooterDesign,
} from '@/services/footerConfigService';

const SOCIAL_MAP: Record<string, { icon: React.ElementType; color: string }> = {
  twitter:    { icon: Twitter,    color: 'hover:text-white hover:bg-black' },
  facebook:   { icon: Facebook,   color: 'hover:text-blue-500 hover:bg-blue-500/10' },
  linkedin:   { icon: Linkedin,   color: 'hover:text-blue-600 hover:bg-blue-600/10' },
  instagram:  { icon: Instagram,  color: 'hover:text-pink-500 hover:bg-pink-500/10' },
  youtube:    { icon: Youtube,    color: 'hover:text-red-500 hover:bg-red-500/10' },
  discord:    { icon: MessageCircle, color: 'hover:text-indigo-400 hover:bg-indigo-500/10' },
  telegram:   { icon: Send,       color: 'hover:text-sky-400 hover:bg-sky-500/10' },
};

const BADGE_MAP: Record<string, { icon: React.ElementType }> = {
  Shield: CheckCircle, Lock: Lock, CheckCircle: CheckCircle, Server: Server,
};

function BackToTop() {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  return (
    <motion.button
      onClick={scrollToTop}
      whileHover={{ scale: 1.1, y: -2 }}
      whileTap={{ scale: 0.95 }}
      className="fixed bottom-6 left-6 z-40 w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white hover:border-purple-500/50 hover:bg-slate-700 transition-all shadow-lg"
      title="Retour en haut"
    >
      <ArrowUp className="w-4 h-4" />
    </motion.button>
  );
}

function LiveStatus() {
  const day = new Date().getDay();
  const hour = new Date().getUTCHours();
  const isOpen = !(day === 6 || (day === 0 && hour < 22) || (day === 5 && hour >= 22));

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/60 border border-slate-700/50">
      <span className={`w-1.5 h-1.5 rounded-full ${isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
      <span className="text-[10px] text-slate-400">
        {isOpen ? 'Marché Ouvert' : 'Marché Fermé'}
      </span>
      <Wifi className="w-3 h-3 text-slate-600" />
    </div>
  );
}

export default function SmartFooter() {
  const [config, setConfig] = useState<FooterConfig>(getFooterConfig);

  useEffect(() => {
    const unsub = subscribeToFooterChanges(setConfig);
    return unsub;
  }, []);

  const { design, legal, columns, socials, badges, payments, newsletter } = config;
  const visibleColumns = columns.filter(c => c.visible);
  const visibleSocials = socials.filter(s => s.visible);
  const visibleBadges = badges.filter(b => b.visible);

  if (design.variant === 'minimal') {
    return (
      <>
        {design.backToTop && <BackToTop />}
        <footer className={`border-t ${design.borderTop ? 'border-purple-500/20' : 'border-slate-800'} ${design.glassEffect ? 'bg-slate-950/80 backdrop-blur-sm' : 'bg-slate-950'}`}>
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <p className="text-[10px] text-slate-600">{legal.copyright}</p>
            <div className="flex items-center gap-3">
              {design.showLiveStatus && <LiveStatus />}
              <a href={legal.termsUrl} className="text-[10px] text-slate-600 hover:text-slate-400 transition-colors">CGU</a>
              <a href={legal.privacyUrl} className="text-[10px] text-slate-600 hover:text-slate-400 transition-colors">Confidentialité</a>
            </div>
          </div>
        </footer>
      </>
    );
  }

  return (
    <>
      {design.backToTop && <BackToTop />}
      <footer className={`relative ${design.glassEffect ? 'bg-slate-950/90 backdrop-blur-md' : 'bg-slate-950'} ${design.borderTop ? 'border-t border-purple-500/15' : ''}`}>
        {/* Gradient top line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />

        <div className="max-w-7xl mx-auto px-6 pt-12 pb-8">
          {/* Newsletter section */}
          {design.showNewsletter && newsletter.enabled && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-12 p-6 md:p-8 rounded-2xl bg-gradient-to-br from-purple-500/5 to-blue-500/5 border border-purple-500/10"
            >
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white mb-1">{newsletter.title}</h3>
                  <p className="text-sm text-slate-400">{newsletter.description}</p>
                </div>
                <div className="flex w-full md:w-auto gap-2">
                  <input
                    type="email"
                    placeholder={newsletter.placeholder}
                    className="flex-1 md:w-64 px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
                  />
                  <button className="px-5 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-bold hover:from-blue-600 hover:to-purple-700 transition-all whitespace-nowrap">
                    {newsletter.buttonText}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Main grid */}
          <div className={`grid gap-8 mb-10 ${
            design.columnsLayout === '3' ? 'grid-cols-2 md:grid-cols-3' :
            design.columnsLayout === '5' ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5' :
            'grid-cols-2 md:grid-cols-4'
          }`}>
            {/* Brand column */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-bold text-white">{legal.companyName}</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Plateforme de trading propulsée par l'IA. Signaux temps réel, analyse technique et gestion du risque.
              </p>
              {design.showLiveStatus && <LiveStatus />}
              <div className="space-y-1 text-xs text-slate-600">
                <p className="flex items-center gap-1.5"><MapPin className="w-3 h-3" /> {legal.address}</p>
                <p className="flex items-center gap-1.5"><Mail className="w-3 h-3" /> {legal.email}</p>
                <p className="flex items-center gap-1.5"><Phone className="w-3 h-3" /> {legal.phone}</p>
              </div>
            </div>

            {/* Dynamic columns */}
            {visibleColumns.map((col, i) => (
              <motion.div
                key={col.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="space-y-3"
              >
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map(link => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        target={link.external ? '_blank' : undefined}
                        rel={link.external ? 'noopener noreferrer' : undefined}
                        className="text-sm text-slate-500 hover:text-white transition-colors flex items-center gap-1 group"
                      >
                        <ChevronRight className="w-3 h-3 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all text-purple-400" />
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

          {/* Badges */}
          {design.showBadges && visibleBadges.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-3 py-6 border-t border-slate-800/60">
              {visibleBadges.map(badge => {
                const Icon = (BADGE_MAP[badge.icon] || Shield);
                return (
                  <div key={badge.label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800/40 border border-slate-700/30">
                    <Icon className={`w-3 h-3 ${badge.color}`} />
                    <span className="text-[10px] text-slate-400">{badge.label}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Social + Payments */}
          {(design.showSocial || design.showPayment) && (
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-6 border-t border-slate-800/60">
              {design.showSocial && visibleSocials.length > 0 && (
                <div className="flex items-center gap-2">
                  {visibleSocials.map(s => {
                    const cfg = SOCIAL_MAP[s.platform];
                    if (!cfg) return null;
                    const Icon = cfg.icon;
                    return (
                      <a key={s.platform} href={s.url} target="_blank" rel="noopener noreferrer"
                        className={`w-8 h-8 rounded-lg bg-slate-800/60 border border-slate-700/30 flex items-center justify-center text-slate-500 transition-all ${cfg.color}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </a>
                    );
                  })}
                </div>
              )}

              {design.showPayment && (
                <div className="flex items-center gap-2">
                  {payments.filter(p => p.visible).map(p => (
                    <div key={p.name} className="px-2 py-1 rounded-md bg-slate-800/40 border border-slate-700/30">
                      <span className="text-[10px] text-slate-500">{p.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Bottom bar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 pt-6 border-t border-slate-800/60">
            <p className="text-[11px] text-slate-600">{legal.copyright}</p>
            <div className="flex items-center gap-4">
              {legal.gdprEnabled && (
                <span className="flex items-center gap-1 text-[10px] text-slate-600">
                  <Shield className="w-3 h-3" /> RGPD
                </span>
              )}
              <a href={legal.termsUrl} className="text-[11px] text-slate-600 hover:text-slate-400 transition-colors">CGU</a>
              <a href={legal.privacyUrl} className="text-[11px] text-slate-600 hover:text-slate-400 transition-colors">Confidentialité</a>
              <span className="flex items-center gap-1 text-[10px] text-slate-600">
                <Sparkles className="w-3 h-3 text-purple-400" /> Propulsé par l'IA
              </span>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
