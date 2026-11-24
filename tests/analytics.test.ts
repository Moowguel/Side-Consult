import { test } from 'node:test'
import assert from 'node:assert/strict'
import { linearTrend, personalAnomaly, detectOutbreak, dailySeries, criticalVitals, maskCpf } from '../lib/analytics'
import { cleanRow } from '../data/ingest'

test('regressão linear calcula a inclinação por dia', () => {
  const t0 = new Date('2026-01-01').getTime()
  const pts = [0, 1, 2, 3].map(d => ({ t: new Date(t0 + d * 86_400_000), v: 120 + 2 * d }))
  assert.equal(linearTrend(pts)?.slopePerDay, 2)
})

test('anomalia usa a linha de base do próprio paciente', () => {
  const hist = [120, 122, 118, 121, 119, 120]
  assert.ok(personalAnomaly(150, hist))
  assert.equal(personalAnomaly(122, hist), null)
  assert.equal(personalAnomaly(150, [120, 121]), null) // histórico insuficiente
})

test('detecção de surto: hoje > 2x a média dos 7 dias anteriores', () => {
  assert.ok(detectOutbreak([2, 3, 2, 2, 3, 2, 2, 15]))
  assert.equal(detectOutbreak([0, 1, 0, 1, 1, 0, 1, 5]), null) // poucos casos: ruído, não surto
  assert.equal(detectOutbreak([2, 3, 2, 2, 3, 2, 2, 4]), null)
})

test('série diária agrupa por dia e calcula média móvel', () => {
  const now = new Date('2026-11-24T15:00:00')
  const s = dailySeries([new Date('2026-11-24T10:00:00'), new Date('2026-11-24T11:00:00'), new Date('2026-11-23T10:00:00')], 3, now)
  assert.deepEqual(s.map(d => d.count), [0, 1, 2])
  assert.equal(s[2].movingAvg, 0.5)
})

test('limites críticos de sinais vitais', () => {
  assert.equal(criticalVitals({ spo2: 84 })[0].severity, 5)
  assert.equal(criticalVitals({ systolic: 120, spo2: 98, heartRate: 70 }).length, 0)
})

test('CPF mascarado na tela', () => assert.equal(maskCpf('12345678901'), '***.456.789-**'))

test('ingestão normaliza região/sintomas e rejeita registro inválido', () => {
  const ok = cleanRow('05/11/2026;Z. Leste;UBS Itaquera;febre alta | Dor de Cabeça;34;6;3')
  assert.equal(ok.row?.region, 'Zona Leste')
  assert.deepEqual(ok.row?.symptoms, ['FEBRE_ALTA', 'DOR_CABECA'])
  assert.equal(cleanRow('31/02/2026;Centro;UBS;febre alta;30;5;3').error, 'data inexistente')
  assert.equal(cleanRow('10/10/2026;Marte;UBS;febre alta;30;5;3').error, 'região desconhecida')
})
