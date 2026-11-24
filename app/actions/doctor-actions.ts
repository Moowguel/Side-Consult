'use server'

import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'


interface DoctorRegisterData {
  name: string
  email: string
  crm: string
  specialty: string
  password: string
}

export async function registerDoctor(data: DoctorRegisterData) {
  try {

    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    })

    if (existingUser) {
      return { success: false, message: "E-mail já cadastrado." }
      
    }


    const hashedPassword = await bcrypt.hash(data.password, 10)

    await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        crm: data.crm,
        specialty: data.specialty,
        role: "MEDICO" 
      }
    })

    return { success: true, message: "Médico cadastrado com sucesso!" }

  } catch (error) {
    console.error("Erro cadastro médico:", error)
    return { success: false, message: "Erro interno." }
  }
}