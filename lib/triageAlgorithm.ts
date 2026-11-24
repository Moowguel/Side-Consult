export type Symptom = 'FEBRE_ALTA' | 'DOR_TORACICA' | 'FALTA_AR' | 'DOR_CABECA' | 'DOR_GARGANTA' | 'DIARREIA';

interface TriageResult {
  score: number;
  priorityLabel: string;
  recommendedAction: string;
}

const SYMPTOM_WEIGHTS: Record<Symptom, number> = {
  DOR_TORACICA: 50,
  FALTA_AR: 40,
  FEBRE_ALTA: 20,
  DIARREIA: 10,
  DOR_CABECA: 5,
  DOR_GARGANTA: 5,
};

export const SEVERITY_INFO: Record<number, { label: string; action: string }> = {
  5: { label: 'EMERGÊNCIA (Vermelho)', action: 'Direcionar para atendimento imediato/ambulância.' },
  4: { label: 'MUITO URGENTE (Laranja)', action: 'Atendimento em até 10 minutos.' },
  3: { label: 'URGENTE (Amarelo)', action: 'Agendar consulta para hoje (Encaixe).' },
  2: { label: 'POUCO URGENTE (Verde)', action: 'Consulta nas próximas 24-48h ou teleconsulta.' },
  1: { label: 'NÃO URGENTE (Azul)', action: 'Liberar agendamento eletivo para próximos dias.' },
};

export function calculateTriagePriority(symptoms: Symptom[]): TriageResult {
  const totalWeight = symptoms.reduce((acc, symptom) => acc + (SYMPTOM_WEIGHTS[symptom] || 0), 0);
  const score = totalWeight >= 50 ? 5 : totalWeight >= 30 ? 4 : totalWeight >= 20 ? 3 : 1;
  return { score, priorityLabel: SEVERITY_INFO[score].label, recommendedAction: SEVERITY_INFO[score].action };
}

// Protocolo de regras completo (sintomas + escala de dor). É o "piso de segurança" da triagem híbrida.
export function ruleSeverity(symptoms: Symptom[], painLevel: number): number {
  let score = calculateTriagePriority(symptoms).score;
  if (painLevel >= 8 && score < 4) score = 4;
  if (painLevel === 10) score = 5;
  return score;
}
