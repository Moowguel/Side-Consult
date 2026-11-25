import modelJson from './model.json'
import { predict, type ModelFile, type TriageInput } from './sideconsult-model'
import { ruleSeverity, SEVERITY_INFO, type Symptom } from '../triageAlgorithm'

const model = modelJson as ModelFile
export const MODEL_VERSION = model.version

export interface HybridResult {
  severity: number
  ruleSeverity: number
  aiSeverity: number
  aiConfidence: number
  factors: { label: string; impact: number }[]
  raisedByAI: boolean
  label: string
  action: string
}

// Triagem híbrida: as regras são o piso de segurança; a IA só pode AUMENTAR a gravidade.
export function hybridTriage(input: TriageInput): HybridResult {
  const rule = ruleSeverity(input.symptoms as Symptom[], input.painLevel)
  const ai = predict(input, model)
  const severity = Math.max(rule, ai.severity)
  return {
    severity,
    ruleSeverity: rule,
    aiSeverity: ai.severity,
    aiConfidence: ai.confidence,
    factors: ai.factors,
    raisedByAI: ai.severity > rule,
    label: SEVERITY_INFO[severity].label,
    action: SEVERITY_INFO[severity].action,
  }
}

const SPECIALTY_BY_SYMPTOM: [string, string][] = [
  ['DOR_TORACICA', 'Cardiologia'],
  ['FALTA_AR', 'Pneumologia'],
  ['FEBRE_ALTA', 'Infectologia'],
  ['DIARREIA', 'Clínica Geral'],
  ['DOR_CABECA', 'Clínica Geral'],
  ['DOR_GARGANTA', 'Clínica Geral'],
]

export function suggestSpecialty(symptoms: string[]): string {
  return SPECIALTY_BY_SYMPTOM.find(([s]) => symptoms.includes(s))?.[1] ?? 'Clínica Geral'
}
