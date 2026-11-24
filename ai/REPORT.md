# Relatório de treino: modelo SideConsult de triagem

Gerado automaticamente por `ai/train.ts` em 2026-11-24T22:18:13.987Z.

- Algoritmo: regressão logística multinomial (softmax), gradiente descendente, L2, pesos por classe
- Entradas: 6 sintomas, escala de dor, idade (+ faixas idoso/criança) e **TF-IDF do relato livre** (100 termos)
- Dados: 3200 casos de treino / 800 de teste (sintéticos)

## Regras × Modelo × Híbrido (conjunto de teste)

| Abordagem | Acurácia | Erro de até 1 nível | Sub-triagem (classificou abaixo do real) | **Casos graves (4-5) que passaram como não graves** |
|---|---|---|---|---|
| Regras (Manchester simplificado) | 40.3% | 87.1% | 36.9% | **20.1%** |
| Modelo SideConsult | 86.0% | 98.0% | 10.2% | **8.8%** |
| **Híbrido (usado no app): max(regras, modelo)** | 70.4% | 98.5% | 5.1% | **6.0%** |

**Ganho da IA:** as regras olham só para os sintomas marcados e a dor. O modelo também lê o relato livre
(ex.: "desmaiei", "fala enrolada") e a idade. No híbrido, as regras são o piso de segurança e a IA só pode
**aumentar** a gravidade, por isso a sub-triagem cai sem que a IA consiga "rebaixar" um caso grave.

## Matriz de confusão do híbrido

| real \ previsto | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|
| **1** | 48 | 3 | 0 | 0 | 0 |
| **2** | 2 | 124 | 5 | 0 | 0 |
| **3** | 0 | 8 | 95 | 24 | 4 |
| **4** | 2 | 1 | 21 | 99 | 160 |
| **5** | 2 | 2 | 1 | 2 | 197 |

## Termos do relato que mais puxam para EMERGÊNCIA (nível 5)

`convulsao`, `gravida`, `labios`, `roxos`, `pior`, `vida`, `sangramento`, `perdi`

## Limitações

Treinado com dados **sintéticos** gerados a partir de critérios clínicos de sinais de alarme. Não é validado
clinicamente. O pipeline está pronto para re-treino com dados reais anonimizados: cada correção do médico no
atendimento vira um rótulo (`npm run ai:feedback` → `npm run ai:train`).
