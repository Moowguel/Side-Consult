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

export function calculateTriagePriority(symptoms: Symptom[]): TriageResult {
  let totalWeight = symptoms.reduce((acc, symptom) => {
    return acc + (SYMPTOM_WEIGHTS[symptom] || 0);
  }, 0);

  if (totalWeight >= 50) {
    return {
      score: 5,
      priorityLabel: 'EMERGÊNCIA (Vermelho)',
      recommendedAction: 'Direcionar para atendimento imediato/ambulância.'
    };
  } 
  
  if (totalWeight >= 30) {
    return {
      score: 4,
      priorityLabel: 'MUITO URGENTE (Laranja)',
      recommendedAction: 'Atendimento em até 10 minutos.'
    };
  }

  if (totalWeight >= 20) {
    return {
      score: 3,
      priorityLabel: 'URGENTE (Amarelo)',
      recommendedAction: 'Agendar consulta para hoje (Encaixe).'
    };
  }

  return {
    score: 1, 
    priorityLabel: 'NÃO URGENTE (Azul/Verde)',
    recommendedAction: 'Liberar agendamento eletivo para próximos dias.'
  };
}