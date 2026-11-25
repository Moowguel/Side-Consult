'use server'

import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

interface RegisterFormData {
  name: string
  email: string
  cpf: string
  password: string
  birthYear?: number | null
  region?: string | null
  consent?: boolean
}

const REGIONS = ['Centro', 'Zona Norte', 'Zona Sul', 'Zona Leste', 'Zona Oeste']

export async function registerPatient(data: RegisterFormData) {
  const cpf = String(data.cpf ?? '').replace(/\D/g, '')
  const email = String(data.email ?? '').trim().toLowerCase()
  const year = new Date().getFullYear()

  if (!data.consent) return { success: false, message: "É necessário aceitar o termo de uso de dados (LGPD)." }
  if (cpf.length !== 11) return { success: false, message: "CPF deve ter 11 dígitos." }
  if (!/^\S+@\S+\.\S+$/.test(email)) return { success: false, message: "E-mail inválido." }
  if (String(data.password ?? '').length < 6) return { success: false, message: "A senha deve ter pelo menos 6 caracteres." }
  const birthYear = data.birthYear && data.birthYear > year - 120 && data.birthYear <= year ? data.birthYear : null

  try {
    const existingUser = await prisma.user.findFirst({ where: { OR: [{ email }, { cpf }] } })
    if (existingUser) return { success: false, message: "Usuário já cadastrado com este e-mail ou CPF." }

    await prisma.user.create({
      data: {
        name: String(data.name).trim().slice(0, 120),
        email,
        cpf,
        password: await bcrypt.hash(data.password, 10),
        role: "CIDADAO",
        birthYear,
        region: data.region && REGIONS.includes(data.region) ? data.region : null,
        consentAt: new Date(),
      },
    })

    return { success: true, message: "Cadastro realizado com sucesso!" }
  } catch (error) {
    console.error("Erro no cadastro:", error)
    return { success: false, message: "Erro interno no servidor. Tente novamente." }
  }
}
