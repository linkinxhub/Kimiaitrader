/**
 * Footer Config Service — Configuration globale et avancée du footer
 * Persistance localStorage, editable via Admin panel
 */

export interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
}

export interface FooterColumn {
  title: string;
  links: FooterLink[];
  visible: boolean;
}

export interface FooterSocial {
  platform: 'twitter' | 'facebook' | 'linkedin' | 'instagram' | 'youtube' | 'discord' | 'telegram';
  url: string;
  visible: boolean;
}

export interface FooterBadge {
  label: string;
  icon: string;
  color: string;
  visible: boolean;
}

export interface FooterPayment {
  name: string;
  icon: string;
  visible: boolean;
}

export interface FooterLegal {
  companyName: string;
  siret: string;
  address: string;
  email: string;
  phone: string;
  copyright: string;
  gdprEnabled: boolean;
  cookieEnabled: boolean;
  termsUrl: string;
  privacyUrl: string;
}

export interface FooterNewsletter {
  enabled: boolean;
  title: string;
  description: string;
  placeholder: string;
  buttonText: string;
}

export interface FooterDesign {
  variant: 'compact' | 'expanded' | 'minimal';
  showSocial: boolean;
  showPayment: boolean;
  showNewsletter: boolean;
  showBadges: boolean;
  showLiveStatus: boolean;
  columnsLayout: '3' | '4' | '5';
  backToTop: boolean;
  stickyBottom: boolean;
  glassEffect: boolean;
  borderTop: boolean;
  customColor?: string;
}

export interface FooterConfig {
  version: string;
  lastModified: string;
  design: FooterDesign;
  legal: FooterLegal;
  columns: FooterColumn[];
  socials: FooterSocial[];
  badges: FooterBadge[];
  payments: FooterPayment[];
  newsletter: FooterNewsletter;
  customHtml?: string;
  analyticsCode?: string;
}

const STORAGE_KEY = 'xtrendai_footer_config';
const BACKUP_KEY = 'xtrendai_footer_config_backup';

export const DEFAULT_CONFIG: FooterConfig = {
  version: '1.0',
  lastModified: new Date().toISOString(),

  design: {
    variant: 'expanded',
    showSocial: true,
    showPayment: true,
    showNewsletter: true,
    showBadges: true,
    showLiveStatus: true,
    columnsLayout: '4',
    backToTop: true,
    stickyBottom: false,
    glassEffect: true,
    borderTop: true,
  },

  legal: {
    companyName: 'XTrendAI Pro',
    siret: 'FR12345678901',
    address: 'Paris, France',
    email: 'contact@xtrendai.pro',
    phone: '+33 1 23 45 67 89',
    copyright: `© ${new Date().getFullYear()} XTrendAI Pro. Tous droits réservés.`,
    gdprEnabled: true,
    cookieEnabled: true,
    termsUrl: '/terms',
    privacyUrl: '/privacy',
  },

  columns: [
    {
      title: 'Produit',
      visible: true,
      links: [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Signaux IA', href: '/signals' },
        { label: 'Radar Opportunités', href: '/radar-opportunities' },
        { label: 'Analyse Technique', href: '/technical' },
        { label: 'Smart Money', href: '/smart-money' },
        { label: 'Assistant IA', href: '/ai-assistant' },
      ],
    },
    {
      title: 'Outils',
      visible: true,
      links: [
        { label: 'Scanner Marché', href: '/scanner' },
        { label: 'Labo Stratégies', href: '/strategy-lab' },
        { label: 'Simulateur', href: '/simulator' },
        { label: 'Journal Trading', href: '/history' },
        { label: 'Export MT4/5', href: '/mt-export' },
        { label: 'Calendrier Éco', href: '/calendar' },
      ],
    },
    {
      title: 'Ressources',
      visible: true,
      links: [
        { label: 'Nouveautés', href: '/nouveautes' },
        { label: 'Documentation', href: '/docs' },
        { label: 'API Trading', href: '/api-center' },
        { label: 'Blog', href: '/blog', external: true },
        { label: 'Webinaires', href: '/webinars' },
        { label: 'Communauté', href: '/community', external: true },
      ],
    },
    {
      title: 'Entreprise',
      visible: true,
      links: [
        { label: 'À propos', href: '/about' },
        { label: 'Carrières', href: '/careers' },
        { label: 'Presse', href: '/press' },
        { label: 'Partenaires', href: '/partners' },
        { label: 'Nous contacter', href: '/contact' },
        { label: 'Statut système', href: '/status' },
      ],
    },
  ],

  socials: [
    { platform: 'twitter', url: 'https://twitter.com/xtrendai', visible: true },
    { platform: 'linkedin', url: 'https://linkedin.com/company/xtrendai', visible: true },
    { platform: 'youtube', url: 'https://youtube.com/@xtrendai', visible: true },
    { platform: 'discord', url: 'https://discord.gg/xtrendai', visible: true },
    { platform: 'telegram', url: 'https://t.me/xtrendai', visible: true },
  ],

  badges: [
    { label: 'SSL Sécurisé', icon: 'Shield', color: 'text-emerald-400', visible: true },
    { label: 'Données Encryptées', icon: 'Lock', color: 'text-blue-400', visible: true },
    { label: 'RGPD Conforme', icon: 'CheckCircle', color: 'text-purple-400', visible: true },
    { label: 'Uptime 99.9%', icon: 'Server', color: 'text-amber-400', visible: true },
  ],

  payments: [
    { name: 'Visa', icon: 'CreditCard', visible: true },
    { name: 'Mastercard', icon: 'CreditCard', visible: true },
    { name: 'PayPal', icon: 'Wallet', visible: true },
    { name: 'Crypto', icon: 'Bitcoin', visible: true },
    { name: 'SEPA', icon: 'Landmark', visible: true },
  ],

  newsletter: {
    enabled: true,
    title: 'Restez informé',
    description: 'Recevez nos analyses et signaux IA directement dans votre boîte mail.',
    placeholder: 'votre@email.com',
    buttonText: 'S\'abonner',
  },
};

// ─── CRUD ───────────────────────────────────────────────

export function getFooterConfig(): FooterConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_CONFIG, ...parsed, design: { ...DEFAULT_CONFIG.design, ...parsed.design }, legal: { ...DEFAULT_CONFIG.legal, ...parsed.legal }, newsletter: { ...DEFAULT_CONFIG.newsletter, ...parsed.newsletter } };
    }
  } catch { /* ignore */ }
  return { ...DEFAULT_CONFIG };
}

export function saveFooterConfig(config: FooterConfig) {
  // Backup before save
  const current = localStorage.getItem(STORAGE_KEY);
  if (current) localStorage.setItem(BACKUP_KEY, current);

  config.lastModified = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));

  // Dispatch event for real-time update
  window.dispatchEvent(new CustomEvent('footer-config-changed', { detail: config }));
}

export function resetFooterConfig() {
  localStorage.setItem(BACKUP_KEY, localStorage.getItem(STORAGE_KEY) || '');
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CONFIG));
  window.dispatchEvent(new CustomEvent('footer-config-changed', { detail: DEFAULT_CONFIG }));
}

export function exportFooterConfig(): string {
  return JSON.stringify(getFooterConfig(), null, 2);
}

export function importFooterConfig(json: string): boolean {
  try {
    const parsed = JSON.parse(json);
    if (parsed.columns && parsed.legal && parsed.design) {
      saveFooterConfig({ ...DEFAULT_CONFIG, ...parsed });
      return true;
    }
  } catch { /* ignore */ }
  return false;
}

export function restoreBackup(): boolean {
  const backup = localStorage.getItem(BACKUP_KEY);
  if (backup) {
    localStorage.setItem(STORAGE_KEY, backup);
    window.dispatchEvent(new CustomEvent('footer-config-changed', { detail: getFooterConfig() }));
    return true;
  }
  return false;
}

// ─── Subscribe to changes ───────────────────────────────

export function subscribeToFooterChanges(callback: (config: FooterConfig) => void) {
  const handler = (e: any) => callback(e.detail);
  window.addEventListener('footer-config-changed', handler);
  return () => window.removeEventListener('footer-config-changed', handler);
}

// ─── Quick toggles ──────────────────────────────────────

export function toggleFooterColumn(columnIndex: number) {
  const cfg = getFooterConfig();
  if (cfg.columns[columnIndex]) {
    cfg.columns[columnIndex].visible = !cfg.columns[columnIndex].visible;
    saveFooterConfig(cfg);
  }
}

export function toggleFooterSocial(platform: string) {
  const cfg = getFooterConfig();
  const s = cfg.socials.find(x => x.platform === platform);
  if (s) { s.visible = !s.visible; saveFooterConfig(cfg); }
}

export function updateFooterDesign(partial: Partial<FooterDesign>) {
  const cfg = getFooterConfig();
  cfg.design = { ...cfg.design, ...partial };
  saveFooterConfig(cfg);
}
