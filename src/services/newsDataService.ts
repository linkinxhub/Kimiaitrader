/**
 * News Data Service — Service centralise de news
 * Connecte les news aux donnees marché live, decisions IA,
 * et alertes. N'utilise que des donnees sourcées et verifiees.
 */

import { cacheGet, cacheSet, newsCacheKey } from './cacheManager';
import { getApiSettings, fallbackFetch, getDataFreshness } from './apiProviderManager';
import { DEMO_NEWS } from './newsDemoData';
import type { NewsItem, NewsDaySummary, NewsFilterState, DataSource } from './newsEngine';
import { filterNews, generateDaySummary, NEWS_CATEGORIES_UI, IMPACT_COLORS } from './newsEngine';
export { NEWS_CATEGORIES_UI, IMPACT_COLORS, filterNews, generateDaySummary };

// ─── Fetch news from configured providers ───────────────

export async function fetchNewsFromProviders(): Promise<{
  news: NewsItem[];
  meta: { dataSource: DataSource; provider: string; count: number; hasRealData: boolean };
}> {
  const settings = getApiSettings();
  const cacheKey = 'all_news';
  const cached = cacheGet<NewsItem[]>(cacheKey, settings.cacheDuration);
  if (cached) {
    return {
      news: cached.data,
      meta: { dataSource: 'cached', provider: cached.provider, count: cached.data.length, hasRealData: false },
    };
  }

  // Try Finnhub news
  const finnhubResult = await fallbackFetch<any[]>('news', async (provider) => {
    const key = provider.apiKey || '';
    const res = await fetch(`${provider.baseUrl}/news?category=general&token=${key}`, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;
    return res.json();
  });

  let news: NewsItem[] = [];
  let hasRealData = false;

  if (finnhubResult.data && Array.isArray(finnhubResult.data)) {
    hasRealData = true;
    news = finnhubResult.data.slice(0, 20).map((item: any, i: number) => ({
      id: `live-${item.datetime || Date.now()}-${i}`,
      timestamp: (item.datetime || Date.now() / 1000) * 1000,
      timeLabel: new Date((item.datetime || Date.now() / 1000) * 1000).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      country: 'Global',
      currency: 'USD',
      category: mapFinnhubCategory(item.category),
      title: item.headline || 'News sans titre',
      source: item.source || 'Finnhub',
      impact: estimateImpact(item),
      status: 'past',
      previousValue: '',
      forecastValue: '',
      actualValue: null,
      surprise: null,
      affectedAssets: inferAssetsFromNews(item.headline || ''),
      probableDirection: null,
      aiDecision: null,
      riskLevel: null,
      signalNote: null,
      impactScore: 0,
      links: {
        technicalAnalysis: '/technical',
        fundamentalAnalysis: null,
        institutionalAnalysis: null,
        decisionCenter: '/decision-center',
        affectedAsset: null,
        createAlert: '/alerts',
        externalSource: item.url || null,
      },
      whyImportant: item.summary || '',
      marketReaction: '',
      beforeSignal: null,
      afterSignal: null,
      invalidationLevel: null,
      createdAt: Date.now(),
    }));
  }

  // If no real data and demo allowed
  if (news.length === 0 && settings.allowMockData) {
    news = DEMO_NEWS.map(n => ({ ...n, dataSource: 'cached' as DataSource }));
  }

  // Cache
  cacheSet(cacheKey, { data: news, timestamp: Date.now(), provider: finnhubResult.provider || 'demo', dataSource: hasRealData ? 'live' : 'cached', ttlSeconds: settings.cacheDuration });

  return {
    news,
    meta: {
      dataSource: hasRealData ? 'live' : (news.length > 0 ? 'cached' : 'unavailable'),
      provider: finnhubResult.provider || 'demo',
      count: news.length,
      hasRealData,
    },
  };
}

function mapFinnhubCategory(cat?: string): NewsItem['category'] {
  const map: Record<string, NewsItem['category']> = {
    general: 'macro', forex: 'forex', crypto: 'crypto', merger: 'stocks',
  };
  return map[cat || ''] || 'macro';
}

function estimateImpact(item: any): NewsItem['impact'] {
  const headline = (item.headline || '').toLowerCase();
  const criticalTerms = ['fed', 'fomc', 'cpi', 'nfp', 'recession', 'crash', 'war', 'rate cut', 'rate hike'];
  const highTerms = ['breaking', 'urgent', 'earnings', 'guidance', 'sued', 'merger', 'acquisition'];
  if (criticalTerms.some(t => headline.includes(t))) return 'critical';
  if (highTerms.some(t => headline.includes(t))) return 'high';
  if (item.related?.split(',').length > 3) return 'medium';
  return 'low';
}

function inferAssetsFromNews(headline: string): string[] {
  const h = headline.toLowerCase();
  const assets: string[] = [];
  if (h.includes('gold') || h.includes('xau')) assets.push('XAU/USD');
  if (h.includes('bitcoin') || h.includes('btc')) assets.push('BTC/USD');
  if (h.includes('ethereum') || h.includes('eth')) assets.push('ETH/USD');
  if (h.includes('oil') || h.includes('wti')) assets.push('WTI');
  if (h.includes('euro') || h.includes('eur/usd')) assets.push('EUR/USD');
  if (h.includes('nasdaq')) assets.push('NAS100');
  if (h.includes('s&p') || h.includes('spx')) assets.push('SPX500');
  if (h.includes('dollar') || h.includes('dxy')) assets.push('DXY');
  if (assets.length === 0) assets.push('SPX500');
  return assets;
}

// ─── Get all news (with caching) ────────────────────────

export async function getAllNews(filters?: NewsFilterState): Promise<{
  news: NewsItem[];
  summary: NewsDaySummary;
  meta: { dataSource: DataSource; hasRealData: boolean; count: number };
}> {
  const result = await fetchNewsFromProviders();
  const filtered = filters ? filterNews(result.news, filters) : result.news;
  const summary = generateDaySummary(result.news);

  return {
    news: filtered,
    summary,
    meta: {
      dataSource: result.meta.dataSource,
      hasRealData: result.meta.hasRealData,
      count: result.meta.count,
    },
  };
}

// ─── Status badge helpers ───────────────────────────────

export function getDataStatusBadge(dataSource: DataSource): { label: string; color: string; bg: string } {
  switch (dataSource) {
    case 'live': return { label: 'LIVE', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' };
    case 'cached': return { label: 'CACHE', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' };
    case 'delayed': return { label: 'RETARD', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' };
    case 'fallback': return { label: 'FALLBACK', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' };
    case 'unavailable': return { label: 'INDISPONIBLE', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' };
  }
}
