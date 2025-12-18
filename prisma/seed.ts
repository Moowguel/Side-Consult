import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Combinações de sintomas para variar a gravidade nos gráficos
const SYMPTOM_COMBINATIONS = [
  ['FEBRE_ALTA', 'DOR_CABECA', 'DOR_GARGANTA'],
  ['DOR_TORACICA', 'FALTA_AR'], 
  ['DIARREIA', 'DOR_CABECA'],
  ['DOR_CABECA'],
  ['FALTA_AR', 'FEBRE_ALTA'],
  ['DOR_GARGANTA'],
]

async function main() {
  console.log('🌱 Iniciando o plantio de dados (Seed)...')

  // Senha padrão: 123456
  const passwordHash = await bcrypt.hash('123456', 10)

  // -------------------------------------------------------
  // 1. CRIAR MÉDICO GESTOR
  // -------------------------------------------------------
  const gestor = await prisma.user.upsert({
    where: { email: 'gestor@saude.gov' },
    update: {},
    create: {
      email: 'gestor@saude.gov',
      name: 'Dr. Gestor Silva',
      role: 'MEDICO', 
      crm: '99999/BR',
      specialty: 'Gestão Hospitalar',
      password: passwordHash
    }
  })
  console.log('👨‍⚕️ Gestor criado/atualizado.')

  // -------------------------------------------------------
  // 2. CRIAR UNIDADES DE SAÚDE
  // -------------------------------------------------------
  console.log('🏥 Verificando unidades de saúde...')
  const units = [
    { 
        name: 'Hospital Municipal Central', 
        address: 'Av. Paulista, 1578 - Bela Vista, São Paulo', 
        type: 'HOSPITAL', 
        phone: '(11) 3222-0000' 
    },
    { 
        name: 'UBS Vila Mariana', 
        address: 'Rua Dr. Diogo de Faria, 100 - Vila Mariana, São Paulo', 
        type: 'UBS', 
        phone: '(11) 5555-1234' 
    },
    { 
        name: 'UPA 24h Zona Sul', 
        address: 'Av. Santo Amaro, 5000 - Brooklin, São Paulo', 
        type: 'UPA', 
        phone: '(11) 5555-9999' 
    },
    { 
        name: 'Farmácia Popular do Centro', 
        address: 'Praça da Sé, 10 - Centro, São Paulo', 
        type: 'FARMACIA', 
        phone: '(11) 3100-5000' 
    },
    { 
        name: 'Hospital Infantil Sabará', 
        address: 'Av. Angélica, 1987 - Higienópolis, São Paulo', 
        type: 'HOSPITAL', 
        phone: '(11) 3155-2000' 
    },
  ]

  for (const unit of units) {
    const existing = await prisma.healthUnit.findFirst({ where: { name: unit.name } })
    if (!existing) {
        await prisma.healthUnit.create({
            data: { ...unit, creatorId: gestor.id }
        })
    }
  }

  // -------------------------------------------------------
  // 3. CRIAR PACIENTES, TRIAGENS E VACINAS
  // -------------------------------------------------------
  console.log('🤒 Gerando pacientes, triagens e vacinas...')
  
  // Loop para criar 30 pacientes fictícios
  for (let i = 0; i < 30; i++) {
    // A. Cria o Paciente
    const patient = await prisma.user.create({
      data: {
        email: `paciente_v2_${i}@teste.com`, // Email único
        name: `Paciente Teste ${i}`,
        cpf: `123456789${i < 10 ? '0'+i : i}`,
        role: 'CIDADAO',
        password: passwordHash
      }
    })

    // B. Cria a Triagem (Sintomas Aleatórios)
    const randomSymptoms = SYMPTOM_COMBINATIONS[Math.floor(Math.random() * SYMPTOM_COMBINATIONS.length)]
    
    let severity = 1
    let notes = "Sintomas leves."
    
    if (randomSymptoms.includes('DOR_TORACICA')) {
        severity = 5
        notes = "Dor torácica intensa, irradiação para MSE. Sudorese."
    } else if (randomSymptoms.includes('FALTA_AR')) {
        severity = 4
        notes = "Dispneia moderada a grave. Saturação 92%."
    } else if (randomSymptoms.includes('FEBRE_ALTA')) {
        severity = 3
        notes = "Pico febril de 39.5°C não cede com antitérmico."
    }

    // Data aleatória nas últimas 48h
    const date = new Date()
    date.setHours(date.getHours() - Math.floor(Math.random() * 48))

    await prisma.triage.create({
      data: {
        patientId: patient.id,
        symptoms: JSON.stringify(randomSymptoms),
        severity: severity,
        createdAt: date,
        notes: notes
      }
    })

    // C. Cria Vacinas (1 Passada, 1 Futura)
    // Vacina 1: Covid (Já tomou)
    await prisma.vaccine.create({
        data: {
            userId: patient.id,
            name: "Covid-19 (Pfizer)",
            dose: "Reforço Bivalente",
            batch: "PF" + i + "2024",
            date: new Date("2024-05-10"),
            status: "APLICADA",
            location: "UBS Vila Mariana"
        }
    })

    await prisma.vaccine.create({
        data: {
            userId: patient.id,
            name: "Influenza (Gripe)",
            dose: "Dose Anual 2025",
            date: new Date("2025-04-20"), 
            status: "PENDENTE",
            location: "Campanha Nacional"
        }
    })
  }

  console.log('✅ Banco de dados atualizado com sucesso!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })