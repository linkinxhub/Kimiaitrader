/**
 * PDF Export Service
 * Génère des rapports PDF professionnels pour les signaux de trading
 */

import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import type { AISignal } from './aiSignalEngine';

// Extend jsPDF type for autotable
interface AutoTableConfig {
  startY?: number;
  head?: string[][];
  body?: (string | number)[][];
  theme?: string;
  styles?: Record<string, unknown>;
  headStyles?: Record<string, unknown>;
  bodyStyles?: Record<string, unknown>;
  alternateRowStyles?: Record<string, unknown>;
}

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: AutoTableConfig) => void;
    lastAutoTable?: { finalY: number };
  }
}

// ─── Signal PDF ─────────────────────────────────────────

export function exportSignalToPDF(signal: AISignal): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 50, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('XTrendAI Pro', 20, 25);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('Rapport de Signal IA', 20, 35);

  const now = new Date().toLocaleString('fr-FR');
  doc.setFontSize(9);
  doc.text(`Généré le ${now}`, 20, 43);

  // Signal badge
  const signalColor = signal.signal === 'ACHAT' ? [16, 185, 129] : signal.signal === 'VENTE' ? [239, 68, 68] : [245, 158, 11];
  doc.setFillColor(signalColor[0], signalColor[1], signalColor[2]);
  doc.roundedRect(pageWidth - 80, 15, 60, 22, 4, 4, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(signal.signal, pageWidth - 70, 30);

  // Asset & Confidence
  let y = 65;
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(`${signal.asset}`, 20, y);

  y += 10;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Confiance IA: ${signal.confidence}%  |  Score: ${signal.aiScore}/100  |  Timeframe: ${signal.timeframe}`, 20, y);

  // Key Levels Table
  y += 15;
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Niveaux de Trading', 20, y);

  doc.autoTable({
    startY: y + 5,
    head: [['Indicateur', 'Valeur', 'Détails']],
    body: [
      ['Point d\'Entrée', signal.entryPoint.toFixed(4), 'Prix actuel au moment du signal'],
      ['Stop Loss', signal.stopLoss.toFixed(4), `Risque: ${Math.abs(signal.entryPoint - signal.stopLoss).toFixed(4)}`],
      ['Take Profit 1', signal.takeProfit1.toFixed(4), 'Objectif conservateur'],
      ['Take Profit 2', signal.takeProfit2.toFixed(4), 'Objectif modéré'],
      ['Take Profit 3', signal.takeProfit3.toFixed(4), 'Objectif agressif'],
      ['Risk/Reward', signal.riskRewardRatio, 'Ratio risque/rendement'],
      ['Niveau de Risque', signal.riskLevel, signal.riskLevel === 'Faible' ? 'Signal fiable' : signal.riskLevel === 'Modéré' ? 'Prudence recommandée' : 'Risque élevé'],
    ],
    theme: 'striped',
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontSize: 10 },
    bodyStyles: { fontSize: 10, textColor: [51, 65, 85] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    styles: { font: 'helvetica' },
  });

  // AI Explanations
  const tableEndY = doc.lastAutoTable?.finalY || y + 80;
  y = tableEndY + 15;

  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Analyse IA Détaillée', 20, y);

  doc.autoTable({
    startY: y + 5,
    head: [['Indicateur', 'Valeur', 'Interprétation']],
    body: signal.explanations.map(e => [e.indicator, e.value, e.interpretation]),
    theme: 'striped',
    headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255], fontSize: 10 },
    bodyStyles: { fontSize: 9, textColor: [51, 65, 85] },
    alternateRowStyles: { fillColor: [239, 246, 255] },
    styles: { font: 'helvetica' },
    columnStyles: { 2: { cellWidth: 'auto' } },
  });

  // Market Context
  const explanationsEndY = doc.lastAutoTable?.finalY || y + 60;
  y = explanationsEndY + 15;

  if (y > 240) {
    doc.addPage();
    y = 30;
  }

  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Contexte Marché', 20, y);

  y += 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);

  const contextLines = [
    `Sentiment: ${signal.marketSentiment}`,
    `Volatilité: ${(signal.volatility / 100).toFixed(2)}%`,
    `Source: ${signal.source}`,
    `ID Signal: ${signal.id}`,
    `Horodatage: ${signal.timestamp.toLocaleString('fr-FR')}`,
  ];

  contextLines.forEach(line => {
    doc.text(line, 25, y);
    y += 7;
  });

  // Multi-timeframe analysis
  if (signal.timeFrameAnalysis && signal.timeFrameAnalysis.length > 0) {
    y += 5;
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('Analyse Multi-Timeframe', 20, y);

    doc.autoTable({
      startY: y + 5,
      head: [['Timeframe', 'Tendance', 'Force', 'Probabilité', 'Recommandation']],
      body: signal.timeFrameAnalysis.map(t => [
        t.timeframe,
        t.trend,
        `${t.trendStrength}%`,
        `${t.probability}%`,
        t.recommendation,
      ]),
      theme: 'striped',
      headStyles: { fillColor: [124, 58, 237], textColor: [255, 255, 255], fontSize: 9 },
      bodyStyles: { fontSize: 9, textColor: [51, 65, 85] },
      alternateRowStyles: { fillColor: [245, 243, 255] },
    });
  }

  // Footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFillColor(15, 23, 42);
    doc.rect(0, doc.internal.pageSize.getHeight() - 20, pageWidth, 20, 'F');
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('© 2026 XTrendAI Pro — Signaux générés par IA — Ne constitue pas un conseil en investissement', 20, doc.internal.pageSize.getHeight() - 8);
    doc.text(`Page ${i}/${totalPages}`, pageWidth - 30, doc.internal.pageSize.getHeight() - 8);
  }

  doc.save(`signal-${signal.asset.replace('/', '-')}-${Date.now()}.pdf`);
}

// ─── Multi-Signal PDF ───────────────────────────────────

export function exportSignalsListToPDF(signals: AISignal[]): void {
  const doc = new jsPDF('landscape');
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 40, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('XTrendAI Pro — Rapport des Signaux', 20, 25);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text(`${signals.length} signaux — ${new Date().toLocaleString('fr-FR')}`, 20, 35);

  // Summary stats
  const achats = signals.filter(s => s.signal === 'ACHAT').length;
  const ventes = signals.filter(s => s.signal === 'VENTE').length;
  const attentes = signals.filter(s => s.signal === 'ATTENTE').length;
  const avgConfidence = signals.length > 0 ? signals.reduce((s, sig) => s + sig.confidence, 0) / signals.length : 0;

  const summaryBody = [
    ['Signaux ACHAT', achats.toString(), 'Signaux VENTE', ventes.toString()],
    ['Signaux ATTENTE', attentes.toString(), 'Confiance moyenne', `${avgConfidence.toFixed(1)}%`],
  ];

  doc.autoTable({
    startY: 50,
    body: summaryBody,
    theme: 'plain',
    bodyStyles: { fontSize: 11, textColor: [51, 65, 85], fontStyle: 'bold' },
    columnStyles: {
      0: { fillColor: [16, 185, 129], textColor: [255, 255, 255], cellPadding: 5 },
      1: { fillColor: [236, 253, 245], textColor: [16, 185, 129], cellPadding: 5 },
      2: { fillColor: [239, 68, 68], textColor: [255, 255, 255], cellPadding: 5 },
      3: { fillColor: [254, 242, 242], textColor: [239, 68, 68], cellPadding: 5 },
    },
  });

  // Signals table
  doc.autoTable({
    startY: (doc.lastAutoTable?.finalY || 50) + 10,
    head: [['Actif', 'Signal', 'Confiance', 'Entrée', 'SL', 'TP1', 'TP2', 'TP3', 'R/R', 'Risque', 'Timeframe']],
    body: signals.map(s => [
      s.asset,
      s.signal,
      `${s.confidence}%`,
      s.entryPoint.toFixed(2),
      s.stopLoss.toFixed(2),
      s.takeProfit1.toFixed(2),
      s.takeProfit2.toFixed(2),
      s.takeProfit3.toFixed(2),
      s.riskRewardRatio,
      s.riskLevel,
      s.timeframe,
    ]),
    theme: 'striped',
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontSize: 9 },
    bodyStyles: { fontSize: 8, textColor: [51, 65, 85] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      1: {
        fontStyle: 'bold',
        textColor: (data: any) => {
          const val = data.cell?.raw || data.raw;
          return val === 'ACHAT' ? [16, 185, 129] : val === 'VENTE' ? [239, 68, 68] : [245, 158, 11];
        },
      },
    },
  });

  // Footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFillColor(15, 23, 42);
    doc.rect(0, doc.internal.pageSize.getHeight() - 15, pageWidth, 15, 'F');
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(8);
    doc.text('© 2026 XTrendAI Pro — Signaux générés par IA', 20, doc.internal.pageSize.getHeight() - 5);
    doc.text(`Page ${i}/${totalPages}`, pageWidth - 30, doc.internal.pageSize.getHeight() - 5);
  }

  doc.save(`signals-report-${Date.now()}.pdf`);
}

// ─── Trade Journal PDF ──────────────────────────────────

export function exportTradeJournalToPDF(trades: any[], stats: any): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 45, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('Journal de Trading', 20, 25);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text(`XTrendAI Pro — ${new Date().toLocaleDateString('fr-FR')}`, 20, 35);

  // Stats cards
  doc.autoTable({
    startY: 55,
    body: [
      ['Trades Total', stats.totalTrades.toString(), 'Trades Ouverts', stats.openTrades.toString()],
      ['Win Rate', `${stats.winRate.toFixed(1)}%`, 'P&L Total', `${stats.totalPnl >= 0 ? '+' : ''}${stats.totalPnl.toFixed(2)} EUR`],
      ['Profit Factor', stats.profitFactor.toFixed(2), 'Meilleur Trade', `+${stats.bestTrade.toFixed(2)} EUR`],
    ],
    theme: 'plain',
    bodyStyles: { fontSize: 11, fontStyle: 'bold' },
    columnStyles: {
      0: { fillColor: [37, 99, 235], textColor: [255, 255, 255] },
      1: { fillColor: [239, 246, 255], textColor: [37, 99, 235] },
      2: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
      3: { fillColor: [248, 250, 252], textColor: [15, 23, 42] },
    },
  });

  // Trades table
  const closedTrades = trades.filter((t: any) => t.status === 'CLOSED');

  if (closedTrades.length > 0) {
    doc.autoTable({
      startY: (doc.lastAutoTable?.finalY || 55) + 15,
      head: [['Actif', 'Type', 'Entrée', 'Sortie', 'P&L', 'P&L %', 'Date Ouverture', 'Date Fermeture']],
      body: closedTrades.map((t: any) => [
        t.asset,
        t.type,
        t.entryPrice.toFixed(4),
        t.exitPrice?.toFixed(4) || '-',
        `${(t.pnl || 0) >= 0 ? '+' : ''}${(t.pnl || 0).toFixed(2)}`,
        `${(t.pnlPercent || 0) >= 0 ? '+' : ''}${(t.pnlPercent || 0).toFixed(2)}%`,
        new Date(t.openedAt).toLocaleDateString('fr-FR'),
        t.closedAt ? new Date(t.closedAt).toLocaleDateString('fr-FR') : '-',
      ]),
      theme: 'striped',
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      columnStyles: {
        4: {
          textColor: (data: any) => {
            const val = String(data.cell?.raw || data.raw || '');
            return val.startsWith('+') ? [16, 185, 129] : val.startsWith('-') ? [239, 68, 68] : [100, 116, 139];
          },
          fontStyle: 'bold',
        },
        5: {
          textColor: (data: any) => {
            const val = String(data.cell?.raw || data.raw || '');
            return val.startsWith('+') ? [16, 185, 129] : val.startsWith('-') ? [239, 68, 68] : [100, 116, 139];
          },
        },
      },
    });
  }

  // Footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFillColor(15, 23, 42);
    doc.rect(0, doc.internal.pageSize.getHeight() - 15, pageWidth, 15, 'F');
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(8);
    doc.text('© 2026 XTrendAI Pro — Journal de Trading', 20, doc.internal.pageSize.getHeight() - 5);
    doc.text(`Page ${i}/${totalPages}`, pageWidth - 30, doc.internal.pageSize.getHeight() - 5);
  }

  doc.save(`journal-trading-${Date.now()}.pdf`);
}
