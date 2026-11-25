import { type NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySession, SESSION_COOKIE } from '@/lib/session'

// Exporta as triagens (com os mesmos filtros do painel) em CSV para Power BI / Excel. Somente GESTOR.
// Sem nome/CPF: o arquivo sai anonimizado (LGPD).
export async function GET(request: NextRequest) {
  const session = verifySession(request.cookies.get(SESSION_COOKIE)?.value)
  if (session?.role !== 'GESTOR') return new Response('acesso negado', { status: 403 })

  const sp = request.nextUrl.searchParams
  const days = Math.min(365, Number(sp.get('dias')) || 90)
  const since = new Date(); since.setHours(0, 0, 0, 0); since.setDate(since.getDate() - days + 1)
  const triages = await prisma.triage.findMany({
    where: {
      createdAt: { gte: since },
      severity: { gte: Number(sp.get('gravidade')) || 1 },
      ...(sp.get('regiao') && { region: sp.get('regiao')! }),
      ...(sp.get('fonte') && { source: sp.get('fonte')! }),
    },
    orderBy: { createdAt: 'asc' },
  })

  const header = 'id;data;hora;regiao;origem;sintomas;idade;dor;gravidade_final;gravidade_regras;gravidade_ia;confianca_ia;gravidade_medico;especialidade'
  const lines = triages.map(t => [
    t.id, t.createdAt.toLocaleDateString('sv-SE'), t.createdAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), t.region ?? '', t.source,
    (JSON.parse(t.symptoms) as string[]).join('|'), t.age ?? '', t.painLevel ?? '', t.severity, t.ruleSeverity ?? '',
    t.aiSeverity ?? '', t.aiConfidence != null ? String(t.aiConfidence).replace('.', ',') : '', t.doctorSeverity ?? '', t.specialty ?? '',
  ].join(';'))

  return new Response('﻿' + [header, ...lines].join('\n'), {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="sideconsult_triagens_${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
