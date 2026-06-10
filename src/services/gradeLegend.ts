/**
 * Grade Legend — Système de notes A+/A/B/C/D
 * Explications, règles de calcul, et tooltips
 */

export interface GradeLegendEntry {
  grade: 'A+' | 'A' | 'B' | 'C' | 'D';
  label: string;
  shortDescription: string;
  fullDescription: string;
  decisionRecommended: string;
  minScore: number;
  maxScore: number;
  color: string;
}

export const GRADE_LEGEND: GradeLegendEntry[] = [
  {
    grade: 'A+',
    label: 'Opportunite tres forte',
    shortDescription: 'Signal fortement confirme par les indicateurs techniques, le score IA et l\'alignement multi-timeframes.',
    fullDescription: 'Le signal possede une forte confirmation technique, IA et/ou institutionnelle. Le ratio risque/rendement est interessant, plusieurs timeframes sont alignes et le niveau de risque reste maitrise.',
    decisionRecommended: 'Entree possible uniquement si les conditions d\'entree sont respectees.',
    minScore: 85,
    maxScore: 100,
    color: 'emerald',
  },
  {
    grade: 'A',
    label: 'Opportunite valide',
    shortDescription: 'Signal globalement bon, avec une confirmation correcte et un risque acceptable.',
    fullDescription: 'Le signal est globalement bon, avec une confirmation correcte. Le risque est acceptable, mais certaines confirmations peuvent encore etre necessaires.',
    decisionRecommended: 'Signal exploitable avec prudence et bonne gestion du risque.',
    minScore: 70,
    maxScore: 84,
    color: 'emerald',
  },
  {
    grade: 'B',
    label: 'Opportunite moyenne',
    shortDescription: 'Signal interessant mais pas totalement confirme. Attendre une confirmation supplementaire.',
    fullDescription: 'Le signal est interessant mais pas totalement confirme. Il peut manquer une confirmation multi-timeframe, institutionnelle ou technique.',
    decisionRecommended: 'Attendre une confirmation supplementaire avant d\'entrer.',
    minScore: 55,
    maxScore: 69,
    color: 'blue',
  },
  {
    grade: 'C',
    label: 'Opportunite risquee',
    shortDescription: 'Signal presentant plusieurs faiblesses : risque eleve, ratio faible, timeframes contradictoires.',
    fullDescription: 'Le signal presente plusieurs faiblesses : risque eleve, ratio faible, timeframes contradictoires, proximite d\'une zone dangereuse ou news importante.',
    decisionRecommended: 'Eviter l\'entree immediate ou attendre une meilleure configuration.',
    minScore: 40,
    maxScore: 54,
    color: 'amber',
  },
  {
    grade: 'D',
    label: 'Signal a eviter',
    shortDescription: 'Signal faible, contradictoire ou dangereux. Le risque est trop eleve par rapport au potentiel de gain.',
    fullDescription: 'Le signal est faible, contradictoire ou dangereux. Le risque est trop eleve par rapport au potentiel de gain.',
    decisionRecommended: 'Ne pas trader ce signal.',
    minScore: 0,
    maxScore: 39,
    color: 'red',
  },
];

export function getGradeExplanation(grade: string): GradeLegendEntry | undefined {
  return GRADE_LEGEND.find(g => g.grade === grade);
}

export function getGradeTooltip(grade: string): string {
  const entry = getGradeExplanation(grade);
  if (!entry) return '';
  return `${entry.grade} — ${entry.label}: ${entry.shortDescription} Decision: ${entry.decisionRecommended}`;
}

export const GRADE_CALCULATION_RULES = `
A+ : Score global > 85%, risque maitrise, R/R > 1:2, plusieurs confirmations alignees
A  : Score global 75-85%, signal valide, risque acceptable
B  : Score global 60-75%, signal moyen, confirmation supplementaire necessaire
C  : Score global 40-60%, signal risque, conditions instables
D  : Score global < 40%, signal faible, contradictoire ou dangereux
`;

export const DISCLAIMER = "Les notes A+, A, B, C et D sont des aides a la decision basees sur l'analyse technique, IA, institutionnelle et le niveau de risque. Elles ne garantissent pas un resultat positif. L'utilisateur doit toujours appliquer une gestion du risque adaptee.";
