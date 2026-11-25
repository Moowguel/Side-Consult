import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createSessionToken, verifySession } from '../lib/session'

test('sessão assinada é aceita', () => {
  const s = verifySession(createSessionToken('user-1', 'CIDADAO'))
  assert.equal(s?.userId, 'user-1')
  assert.equal(s?.role, 'CIDADAO')
})

test('sessão adulterada é rejeitada (não dá para virar outro usuário ou virar GESTOR)', () => {
  const [payload, sig] = createSessionToken('user-1', 'CIDADAO').split('.')
  const forged = Buffer.from(JSON.stringify({ userId: 'user-2', role: 'GESTOR', exp: Date.now() + 1e6 })).toString('base64url')
  assert.equal(verifySession(`${forged}.${sig}`), null)
  assert.equal(verifySession(`${payload}.xxx`), null)
  assert.equal(verifySession('id-puro-antigo'), null)
  assert.equal(verifySession(undefined), null)
})
