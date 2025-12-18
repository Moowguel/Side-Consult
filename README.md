# SideConsult 🏥
### Tecnologia a Serviço do Bem-Estar Coletivo

> "A saúde pública é um ecossistema vivo. Nossa missão é integrar pessoas, instituições e dados para tornar o cuidado mais proativo, humano e eficiente."

---

## 🎯 O Problema (As Dores da Saúde Pública)

Vivemos em um cenário de superlotação, falta de dados integrados e atendimento reativo. O **SideConsult** foi desenvolvido para solucionar gargalos críticos do sistema tradicional:

1.  **A "Cegueira" da Fila de Espera:**
    * *Dor:* Em prontos-socorros tradicionais, a ordem de chegada muitas vezes ignora a gravidade clínica real.
    * *Impacto:* Pacientes graves esperam demais, enquanto casos leves lotam o sistema.

2.  **Fragmentação do Histórico Médico:**
    * *Dor:* O histórico do paciente (vacinas, alergias, consultas anteriores) está espalhado em papéis ou sistemas desconectados.
    * *Impacto:* Diagnósticos imprecisos e perda de informações vitais (ex: carteira de vacinação de papel perdida).

3.  **Medicina Reativa vs. Proativa:**
    * *Dor:* O sistema só atua quando o paciente já está doente. Não há monitoramento preventivo para crônicos.
    * *Impacto:* Agravamento de quadros que poderiam ser controlados remotamente (hipertensão, diabetes).

4.  **Gestão sem Inteligência de Dados:**
    * *Dor:* Gestores tomam decisões no escuro, sem saber quais doenças estão surgindo em tempo real.
    * *Impacto:* Falta de insumos e incapacidade de prever surtos epidemiológicos.

---

## 💡 A Solução Proposta

O **SideConsult** é uma plataforma *Fullstack* que conecta **Cidadão**, **Médico** e **Gestor** em um fluxo único e inteligente.

### Para o Cidadão (Acesso e Prevenção)
* **Triagem Inteligente (IA):** Algoritmo baseado no Protocolo de Manchester que classifica o risco (Emergência, Urgente, Leve) antes mesmo do paciente sair de casa.
* **Carteira de Vacinação Digital:** Histórico na nuvem com alertas de campanhas nacionais ativas.
* **Diário de Saúde:** Monitoramento remoto de sinais vitais (Pressão/Glicose) com detecção automática de anomalias.
* **Telemedicina Integrada:** Acesso a especialistas via vídeo para regiões remotas.
* **Geolocalização:** Mapa de unidades de saúde próximas (UBS, UPAs, Hospitais).

### Para o Médico (Eficiência e Foco)
* **Fila Priorizada:** Visualização automática dos pacientes mais graves no topo da lista.
* **Prontuário Unificado:** Acesso imediato ao relato da triagem e histórico do paciente.
* **Gestão de Agenda:** Aceite ou recusa de solicitações de consulta e vacinas.
* **Prescrição Digital:** Geração de receitas e atestados médicos prontos para impressão.

### Para o Gestor (Inteligência Estratégica)
* **Dashboard Epidemiológico:** Gráficos em tempo real mostrando os sintomas mais comuns (ex: detecção de surtos de Dengue ou Gripe).
* **Análise de Capacidade:** Monitoramento da gravidade dos casos atendidos e ocupação.

---

## 🛠️ Stack Tecnológica

Este projeto utiliza o que há de mais moderno no ecossistema React para garantir performance, segurança e tipagem forte.

* **Frontend & Backend:** [Next.js 15](https://nextjs.org/) (App Router & Server Actions)
* **Linguagem:** [TypeScript](https://www.typescriptlang.org/)
* **Estilização:** [Tailwind CSS](https://tailwindcss.com/)
* **Banco de Dados:** [SQLite](https://www.sqlite.org/) (Ambiente Dev)
* **ORM:** [Prisma](https://www.prisma.io/)
* **Ícones:** [Lucide React](https://lucide.dev/)
* **Segurança:** Bcrypt (Hash de senhas)

---

## 🚀 Como Rodar o Projeto

Siga os passos abaixo para ter o ecossistema rodando na sua máquina:

### 1. Instalação
Clone o repositório e instale as dependências:
```bash
npm install
```

### 2. Configuração do Banco de Dados
Crie o arquivo do banco SQLite e gere as tabelas:
```bash
npx prisma migrate dev --name init
```

### 3. Popular com Dados (Seed)
Para ver os gráficos e históricos funcionando, execute o script que cria médicos, pacientes, triagens e vacinas fictícias:
```bash
npm install -D tsx  # Caso não tenha instalado
npx tsx prisma/seed.ts
```

### 4. Executar
Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

---

## 🔐 Credenciais de Acesso (Geradas pelo Seed)

Para testar os diferentes perfis, utilize:

Perfil Médico (Gestor):

    Email: gestor@saude.gov

    Senha: 123456

Perfil Paciente (Exemplo):

    Email: paciente_v2_0@teste.com

    Senha: 123456

---