/**
 * FooterConfigPanel — Panneau de configuration avancée du footer
 * Accessible depuis l'admin panel
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings, Eye, EyeOff, Save, RotateCcw, Download, Upload,
  Shield, CheckCircle, Lock, Server, CreditCard, Wallet, Landmark,
  Bitcoin, Globe, Layout, Type, Bell, GlassWater, ArrowUp, Smartphone,
  ChevronDown, ChevronUp, Plus, Trash2, AlertTriangle, Check,
  FileCode, Paintbrush, Palette
} from 'lucide-react';
import {
  getFooterConfig, saveFooterConfig, resetFooterConfig,
  exportFooterConfig, importFooterConfig, restoreBackup,
  type FooterConfig, type FooterColumn, type FooterLink, type FooterDesign,
} from '@/services/footerConfigService';

const SOCIAL_ICONS: Record<string, string> = {
  twitter: '𝕏', facebook: 'f', linkedin: 'in', instagram: '📷',
  youtube: '▶', discord: '💬', telegram: '✈',
};

function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center justify-between cursor-pointer py-1">
      <span className="text-xs text-slate-400">{label}</span>
      <button
        onClick={() => onChange(!value)}
        className={`w-8 h-4 rounded-full transition-all ${value ? 'bg-blue-500' : 'bg-slate-700'}`}
      >
        <motion.div animate={{ x: value ? 14 : 2 }} className="w-3 h-3 rounded-full bg-white shadow" />
      </button>
    </label>
  );
}

export default function FooterConfigPanel() {
  const [config, setConfig] = useState<FooterConfig>(getFooterConfig);
  const [activeTab, setActiveTab] = useState<'design' | 'columns' | 'legal' | 'social' | 'advanced'>('design');
  const [saved, setSaved] = useState(false);
  const [newLinkCol, setNewLinkCol] = useState<number | null>(null);
  const [newLink, setNewLink] = useState({ label: '', href: '', external: false });

  const update = (partial: Partial<FooterConfig>) => {
    const next = { ...config, ...partial };
    setConfig(next);
    saveFooterConfig(next);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const updateDesign = (partial: Partial<FooterDesign>) => {
    update({ design: { ...config.design, ...partial } });
  };

  const addLink = (colIdx: number) => {
    if (!newLink.label || !newLink.href) return;
    const cols = [...config.columns];
    cols[colIdx].links = [...cols[colIdx].links, { ...newLink }];
    update({ columns: cols });
    setNewLink({ label: '', href: '', external: false });
    setNewLinkCol(null);
  };

  const removeLink = (colIdx: number, linkIdx: number) => {
    const cols = [...config.columns];
    cols[colIdx].links = cols[colIdx].links.filter((_, i) => i !== linkIdx);
    update({ columns: cols });
  };

  const tabs = [
    { id: 'design' as const, label: 'Design', icon: Palette },
    { id: 'columns' as const, label: 'Colonnes', icon: Layout },
    { id: 'legal' as const, label: 'Légal', icon: Shield },
    { id: 'social' as const, label: 'Social', icon: Globe },
    { id: 'advanced' as const, label: 'Avancé', icon: FileCode },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
            <Settings className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Configuration du Footer</h2>
            <p className="text-xs text-slate-400">Personnalisation globale et avancée</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {saved && (
            <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
              className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold flex items-center gap-1">
              <Check className="w-3 h-3" /> Sauvegardé
            </motion.span>
          )}
          <button onClick={() => { resetFooterConfig(); setConfig(getFooterConfig()); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 text-xs hover:text-white transition-colors">
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === t.id ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
            }`}>
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {/* ─── TAB: DESIGN ──────────────────────────────── */}
      {activeTab === 'design' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Variant */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><Layout className="w-4 h-4 text-purple-400" /> Variante</h3>
            <div className="flex gap-2">
              {(['compact', 'expanded', 'minimal'] as const).map(v => (
                <button key={v} onClick={() => updateDesign({ variant: v })}
                  className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    config.design.variant === v ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-slate-800 text-slate-500 hover:bg-slate-700'
                  }`}>
                  {v === 'compact' ? 'Compact' : v === 'expanded' ? 'Étendu' : 'Minimal'}
                </button>
              ))}
            </div>
          </div>

          {/* Layout columns */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><Layout className="w-4 h-4 text-blue-400" /> Colonnes</h3>
            <div className="flex gap-2">
              {(['3', '4', '5'] as const).map(n => (
                <button key={n} onClick={() => updateDesign({ columnsLayout: n })}
                  className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    config.design.columnsLayout === n ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-slate-800 text-slate-500 hover:bg-slate-700'
                  }`}>
                  {n} colonnes
                </button>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-2">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><Eye className="w-4 h-4 text-emerald-400" /> Visibilité</h3>
            <Toggle value={config.design.showSocial} onChange={v => updateDesign({ showSocial: v })} label="Réseaux sociaux" />
            <Toggle value={config.design.showPayment} onChange={v => updateDesign({ showPayment: v })} label="Moyens de paiement" />
            <Toggle value={config.design.showNewsletter} onChange={v => updateDesign({ showNewsletter: v })} label="Newsletter" />
            <Toggle value={config.design.showBadges} onChange={v => updateDesign({ showBadges: v })} label="Badges de confiance" />
            <Toggle value={config.design.showLiveStatus} onChange={v => updateDesign({ showLiveStatus: v })} label="Statut temps réel" />
            <Toggle value={config.design.backToTop} onChange={v => updateDesign({ backToTop: v })} label="Bouton retour haut" />
            <Toggle value={config.design.glassEffect} onChange={v => updateDesign({ glassEffect: v })} label="Effet verre (glassmorphism)" />
            <Toggle value={config.design.borderTop} onChange={v => updateDesign({ borderTop: v })} label="Bordure supérieure" />
          </div>

          {/* Preview card */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><Paintbrush className="w-4 h-4 text-amber-400" /> Aperçu</h3>
            <div className={`rounded-xl p-4 ${config.design.glassEffect ? 'bg-slate-800/50 backdrop-blur-sm border border-slate-700/50' : 'bg-slate-800'} ${config.design.borderTop ? 'border-t-2 border-t-purple-500/30' : ''}`}>
              <div className="grid grid-cols-3 gap-3 mb-3">
                {config.columns.filter(c => c.visible).slice(0, Number(config.design.columnsLayout)).map((c, i) => (
                  <div key={i}>
                    <p className="text-[10px] font-bold text-slate-400 mb-1">{c.title}</p>
                    {c.links.slice(0, 3).map((l, j) => (
                      <p key={j} className="text-[9px] text-slate-600">{l.label}</p>
                    ))}
                  </div>
                ))}
              </div>
              {config.design.showSocial && (
                <div className="flex gap-1.5 mb-2">
                  {config.socials.filter(s => s.visible).map(s => (
                    <span key={s.platform} className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-[8px] text-slate-400">{SOCIAL_ICONS[s.platform]}</span>
                  ))}
                </div>
              )}
              {config.design.showNewsletter && (
                <div className="flex gap-1.5">
                  <div className="flex-1 h-4 rounded bg-slate-700/50" />
                  <div className="w-10 h-4 rounded bg-purple-500/30" />
                </div>
              )}
              <p className="text-[8px] text-slate-600 mt-2">{config.legal.copyright}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* ─── TAB: COLUMNS ─────────────────────────────── */}
      {activeTab === 'columns' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {config.columns.map((col, colIdx) => (
            <div key={colIdx} className={`bg-slate-900/60 border rounded-2xl p-5 ${col.visible ? 'border-slate-800' : 'border-slate-800/30 opacity-50'}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <button onClick={() => {
                    const cols = [...config.columns];
                    cols[colIdx].visible = !cols[colIdx].visible;
                    update({ columns: cols });
                  }} className="p-1.5 rounded-lg hover:bg-slate-800 transition-colors">
                    {col.visible ? <Eye className="w-4 h-4 text-emerald-400" /> : <EyeOff className="w-4 h-4 text-slate-600" />}
                  </button>
                  <input
                    value={col.title}
                    onChange={e => {
                      const cols = [...config.columns];
                      cols[colIdx].title = e.target.value;
                      update({ columns: cols });
                    }}
                    className="bg-transparent text-sm font-bold text-white focus:outline-none border-b border-transparent focus:border-purple-500/50 pb-0.5"
                  />
                </div>
                <span className="text-xs text-slate-600">{col.links.length} liens</span>
              </div>

              <div className="space-y-1.5 pl-8">
                {col.links.map((link, linkIdx) => (
                  <div key={linkIdx} className="flex items-center gap-2 group">
                    <input value={link.label}
                      onChange={e => {
                        const cols = [...config.columns];
                        cols[colIdx].links[linkIdx].label = e.target.value;
                        update({ columns: cols });
                      }}
                      className="flex-1 min-w-0 bg-slate-800/50 border border-slate-700/50 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-purple-500/50"
                    />
                    <input value={link.href}
                      onChange={e => {
                        const cols = [...config.columns];
                        cols[colIdx].links[linkIdx].href = e.target.value;
                        update({ columns: cols });
                      }}
                      className="w-32 bg-slate-800/50 border border-slate-700/50 rounded-lg px-2 py-1 text-xs text-slate-400 focus:outline-none focus:border-purple-500/50 font-mono"
                    />
                    <button onClick={() => removeLink(colIdx, linkIdx)}
                      className="p-1 rounded-lg hover:bg-red-500/10 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}

                {/* Add link */}
                {newLinkCol === colIdx ? (
                  <div className="flex items-center gap-2 mt-2">
                    <input value={newLink.label} onChange={e => setNewLink({ ...newLink, label: e.target.value })}
                      placeholder="Label" className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500" />
                    <input value={newLink.href} onChange={e => setNewLink({ ...newLink, href: e.target.value })}
                      placeholder="/path" className="w-28 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 font-mono" />
                    <button onClick={() => addLink(colIdx)} className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20">
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setNewLinkCol(null)} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-500">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setNewLinkCol(colIdx)}
                    className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-purple-400 transition-colors mt-1">
                    <Plus className="w-3 h-3" /> Ajouter un lien
                  </button>
                )}
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* ─── TAB: LEGAL ───────────────────────────────── */}
      {activeTab === 'legal' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { key: 'companyName', label: 'Nom de l\'entreprise', type: 'text' },
            { key: 'siret', label: 'SIRET', type: 'text' },
            { key: 'address', label: 'Adresse', type: 'text' },
            { key: 'email', label: 'Email', type: 'email' },
            { key: 'phone', label: 'Téléphone', type: 'tel' },
            { key: 'copyright', label: 'Copyright', type: 'text' },
            { key: 'termsUrl', label: 'URL CGU', type: 'text' },
            { key: 'privacyUrl', label: 'URL Confidentialité', type: 'text' },
          ].map(field => (
            <div key={field.key} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
              <label className="text-xs text-slate-500 mb-1 block">{field.label}</label>
              <input
                type={field.type}
                value={(config.legal as any)[field.key]}
                onChange={e => {
                  const legal = { ...config.legal, [field.key]: e.target.value };
                  update({ legal });
                }}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          ))}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-2 md:col-span-2">
            <Toggle value={config.legal.gdprEnabled} onChange={v => update({ legal: { ...config.legal, gdprEnabled: v } })} label="RGPD / GDPR activé" />
            <Toggle value={config.legal.cookieEnabled} onChange={v => update({ legal: { ...config.legal, cookieEnabled: v } })} label="Bannière cookies activée" />
          </div>
        </motion.div>
      )}

      {/* ─── TAB: SOCIAL ──────────────────────────────── */}
      {activeTab === 'social' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          {/* Social links */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-white mb-3">Réseaux sociaux</h3>
            <div className="space-y-2">
              {config.socials.map((s, i) => (
                <div key={s.platform} className={`flex items-center gap-3 ${s.visible ? '' : 'opacity-40'}`}>
                  <button onClick={() => {
                    const socials = [...config.socials];
                    socials[i].visible = !socials[i].visible;
                    update({ socials });
                  }} className="p-1.5 rounded-lg hover:bg-slate-800">
                    {s.visible ? <Eye className="w-4 h-4 text-emerald-400" /> : <EyeOff className="w-4 h-4 text-slate-600" />}
                  </button>
                  <span className="text-lg w-6 text-center">{SOCIAL_ICONS[s.platform]}</span>
                  <span className="text-xs text-slate-400 w-20 capitalize">{s.platform}</span>
                  <input value={s.url}
                    onChange={e => {
                      const socials = [...config.socials];
                      socials[i].url = e.target.value;
                      update({ socials });
                    }}
                    className="flex-1 bg-slate-800/50 border border-slate-700/50 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-purple-500/50 font-mono"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Newsletter */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><Bell className="w-4 h-4 text-amber-400" /> Newsletter</h3>
            <div className="space-y-3">
              <Toggle value={config.newsletter.enabled} onChange={v => update({ newsletter: { ...config.newsletter, enabled: v } })} label="Activer la newsletter" />
              {config.newsletter.enabled && (
                <>
                  {[
                    { key: 'title', label: 'Titre' },
                    { key: 'description', label: 'Description' },
                    { key: 'placeholder', label: 'Placeholder email' },
                    { key: 'buttonText', label: 'Texte bouton' },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="text-xs text-slate-500 mb-1 block">{f.label}</label>
                      <input value={(config.newsletter as any)[f.key]}
                        onChange={e => update({ newsletter: { ...config.newsletter, [f.key]: e.target.value } })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-purple-500" />
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* ─── TAB: ADVANCED ────────────────────────────── */}
      {activeTab === 'advanced' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><Download className="w-4 h-4 text-emerald-400" /> Export / Import</h3>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => {
                const blob = new Blob([exportFooterConfig()], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = `footer-config-${new Date().toISOString().slice(0, 10)}.json`; a.click();
                URL.revokeObjectURL(url);
              }} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm hover:bg-blue-500/20 transition-colors">
                <Download className="w-4 h-4" /> Exporter JSON
              </button>
              <label className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-slate-400 text-sm hover:bg-slate-700 hover:text-white transition-colors cursor-pointer">
                <Upload className="w-4 h-4" /> Importer JSON
                <input type="file" accept=".json" className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = ev => {
                      if (importFooterConfig(ev.target?.result as string)) {
                        setConfig(getFooterConfig());
                      }
                    };
                    reader.readAsText(file);
                  }} />
              </label>
              <button onClick={() => { if (restoreBackup()) setConfig(getFooterConfig()); }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-slate-400 text-sm hover:bg-slate-700 hover:text-white transition-colors">
                <RotateCcw className="w-4 h-4" /> Restaurer backup
              </button>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><Server className="w-4 h-4 text-blue-400" /> Informations</h3>
            <div className="space-y-1 text-xs text-slate-500">
              <p>Version: <span className="text-slate-300">{config.version}</span></p>
              <p>Dernière modification: <span className="text-slate-300">{new Date(config.lastModified).toLocaleString('fr-FR')}</span></p>
              <p>Colonnes actives: <span className="text-slate-300">{config.columns.filter(c => c.visible).length}/{config.columns.length}</span></p>
              <p>Liens totaux: <span className="text-slate-300">{config.columns.reduce((sum, c) => sum + c.links.length, 0)}</span></p>
              <p>Réseaux sociaux actifs: <span className="text-slate-300">{config.socials.filter(s => s.visible).length}/{config.socials.length}</span></p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
