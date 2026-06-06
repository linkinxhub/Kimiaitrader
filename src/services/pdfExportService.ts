import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { AISignal, PortfolioStats, Trade } from "@/types";

function createBasePdf(title: string) {
  const pdf = new jsPDF();
  pdf.setFillColor(15, 23, 42);
  pdf.rect(0, 0, 210, 297, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(20);
  pdf.text("XTrendAI Pro", 14, 18);
  pdf.setFontSize(11);
  pdf.setTextColor(148, 163, 184);
  pdf.text(title, 14, 26);
  return pdf;
}

export function exportSignalToPDF(signal: AISignal) {
  const pdf = createBasePdf(`Rapport signal ${signal.asset}`);
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(14);
  pdf.text(`${signal.direction} • confiance ${signal.confidence}%`, 14, 42);
  autoTable(pdf, {
    startY: 52,
    head: [["Champ", "Valeur"]],
    body: [
      ["Actif", signal.asset],
      ["Source", signal.source],
      ["Entrée", String(signal.entryPoint)],
      ["Stop Loss", String(signal.stopLoss)],
      ["Take Profit 1", String(signal.takeProfits[0])],
      ["Take Profit 2", String(signal.takeProfits[1])],
      ["Take Profit 3", String(signal.takeProfits[2])],
      ["Risk / Reward", String(signal.riskRewardRatio)],
    ],
    theme: "grid",
    styles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], lineColor: [30, 41, 59] },
    headStyles: { fillColor: [37, 99, 235] },
  });
  pdf.save(`xtrendai-signal-${signal.asset.replace("/", "-")}.pdf`);
}

export function exportSignalsListToPDF(signals: AISignal[]) {
  const pdf = createBasePdf("Récapitulatif des signaux");
  autoTable(pdf, {
    startY: 40,
    head: [["Actif", "Direction", "Confiance", "Entrée", "Source"]],
    body: signals.map((signal) => [signal.asset, signal.direction, `${signal.confidence}%`, String(signal.entryPoint), signal.source]),
    theme: "grid",
    styles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], lineColor: [30, 41, 59] },
    headStyles: { fillColor: [37, 99, 235] },
  });
  pdf.save("xtrendai-signals.pdf");
}

export function exportTradeJournalToPDF(trades: Trade[], stats: PortfolioStats) {
  const pdf = createBasePdf("Journal de trading");
  autoTable(pdf, {
    startY: 40,
    head: [["Actif", "Type", "Entrée", "Sortie", "PnL"]],
    body: trades.map((trade) => [trade.asset, trade.type, String(trade.entryPrice), String(trade.exitPrice ?? "-"), String(trade.pnl ?? "-")]),
    theme: "grid",
    styles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], lineColor: [30, 41, 59] },
    headStyles: { fillColor: [37, 99, 235] },
  });
  pdf.text(`Win rate: ${stats.winRate.toFixed(1)}%`, 14, 250);
  pdf.text(`Profit factor: ${stats.profitFactor.toFixed(2)}`, 14, 258);
  pdf.text(`PnL total: ${stats.totalPnl.toFixed(2)} EUR`, 14, 266);
  pdf.save("xtrendai-journal.pdf");
}
