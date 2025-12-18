'use server'

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

interface RegisterFormData {
  name: string
  email: string
  cpf: string
  password: string
}

export async function registerPatient(data: RegisterFormData) {
  try {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: data.email },
          { cpf: data.cpf }
        ]
      }
    })

    if (existingUser) {
      return { success: false, message: "Usuário já cadastrado com este e-mail ou CPF." }
    }
    const hashedPassword = await bcrypt.hash(data.password, 10)


    const newUser = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        cpf: data.cpf,
        password: hashedPassword,
        role: "CIDADAO" 
      }
    })

    return { success: true, message: "Cadastro realizado com sucesso!" }

  } catch (error) {
    console.error("Erro no cadastro:", error)
    return { success: false, message: "Erro interno no servidor. Tente novamente." }
  }
}