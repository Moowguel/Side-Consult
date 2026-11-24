import { test } from 'node:test'
import assert from 'node:assert/strict'
import { hybridTriage, suggestSpecialty } from '../lib/ai/hybrid'
import { tokenize } from '../lib/ai/sideconsult-model'
import { ruleSeverity } from '../lib/triageAlgorithm'
import model from '../lib/ai/model.json'

test('a IA nunca rebaixa a gravidade dada pelas regras (piso de segurança)', () => {
  const symptoms = ['FEBRE_ALTA', 'DOR_TORACICA', 'FALTA_AR', 'DOR_CABECA', 'DOR_GARGANTA', 'DIARREIA']
  for (let mask = 1; mask < 64; mask++) {
    const s = symptoms.filter((_, i) => mask & (1 << i))
    for (const pain of [0, 5, 8, 10]) {
      const r = hybridTriage({ symptoms: s, painLevel: pain, age: 30, notes: 'estou bem, foi leve' })
      assert.ok(r.severity >= ruleSeverity(s as never, pain), `${s} dor ${pain}`)
    }
  }
})

test('sinal de alarme no relato livre eleva a prioridade que as regras subestimam', () => {
  const r = hybridTriage({ symptoms: ['DOR_CABECA'], painLevel: 4, age: 70, notes: 'de repente fala enrolada e boca torta' })
  assert.equal(r.ruleSeverity, 1)
  assert.ok(r.severity >= 4, `esperado >= 4, veio ${r.severity}`)
  assert.ok(r.raisedByAI)
  assert.ok(r.factors.length > 0)
})

test('caso leve continua leve', () => {
  const r = hybridTriage({ symptoms: ['DOR_GARGANTA'], painLevel: 2, age: 25, notes: 'garganta arranhando desde ontem' })
  assert.ok(r.severity <= 2)
})

test('tokenize remove acentos e stopwords', () => {
  assert.deepEqual(tokenize('Desmaiei no banheiro, com DOR!'), ['desmaiei', 'banheiro', 'dor'])
})

test('modelo exportado reduz casos graves perdidos em relação às regras', () => {
  const m = model.metrics as { regras: { graveMissed: number }; hibrido: { graveMissed: number } }
  assert.ok(m.hibrido.graveMissed < m.regras.graveMissed)
})

test('agente sugere especialidade pelo sintoma mais grave', () => {
  assert.equal(suggestSpecialty(['DOR_CABECA', 'DOR_TORACICA']), 'Cardiologia')
  assert.equal(suggestSpecialty(['DOR_GARGANTA']), 'Clínica Geral')
})
