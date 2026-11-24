// Simulador de wearable (oxímetro + monitor de pressão + glicosímetro) que envia leituras para a API IoT.
// Uso:
//   npm run iot:sim                          -> paciente demo, leitura a cada 3s
//   npm run iot:sim -- --crise 5             -> após 5 leituras normais, simula uma crise (pressão sobe, SpO2 cai)
//   npm run iot:sim -- --token X --url http://localhost:3000 --interval 2000 --count 20
const args = Object.fromEntries(
  process.argv.slice(2).join(' ').split('--').filter(Boolean).map(a => { const [k, v] = a.trim().split(/\s+/); return [k, v ?? 'true'] })
)
const URL_BASE = args.url ?? process.env.IOT_URL ?? 'http://localhost:3000'
const TOKEN = args.token ?? process.env.IOT_DEVICE_TOKEN ?? 'demo-wearable-token'
const INTERVAL = Number(args.interval ?? 3000)
const COUNT = Number(args.count ?? Infinity)
const CRISE = args.crise ? Number(args.crise) : null

const state = { systolic: 124, diastolic: 80, heartRate: 74, spo2: 97, glucose: 102 }
const drift = (v: number, step: number, min: number, max: number, target: number) =>
  Math.min(max, Math.max(min, v + (Math.random() - 0.5) * step + (target - v) * 0.15))

async function tick(i: number) {
  const inCrisis = CRISE !== null && i >= CRISE
  state.systolic = drift(state.systolic, 6, 90, 200, inCrisis ? 188 : 124)
  state.diastolic = drift(state.diastolic, 4, 55, 120, inCrisis ? 112 : 80)
  state.heartRate = drift(state.heartRate, 6, 45, 160, inCrisis ? 128 : 74)
  state.spo2 = drift(state.spo2, 1, 80, 100, inCrisis ? 86 : 97)
  state.glucose = drift(state.glucose, 8, 60, 320, inCrisis ? 150 : 102)
  const reading = Object.fromEntries(Object.entries(state).map(([k, v]) => [k, Math.round(v)]))

  try {
    const res = await fetch(`${URL_BASE}/api/iot`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-device-token': TOKEN },
      body: JSON.stringify(reading),
    })
    const data = await res.json()
    const alert = data.alerts?.length ? `  🚨 ${data.alerts.map((a: { msg: string }) => a.msg).join(' | ')}` : ''
    console.log(`#${i + 1} ${res.status} PA ${reading.systolic}/${reading.diastolic}  FC ${reading.heartRate}  SpO2 ${reading.spo2}%  Glic ${reading.glucose}${alert}${data.error ? '  ❌ ' + data.error : ''}`)
  } catch (e) {
    console.error(`#${i + 1} falha ao enviar (o servidor está rodando em ${URL_BASE}?)`, (e as Error).message)
  }
}

console.log(`📡 Simulador IoT → ${URL_BASE}/api/iot (a cada ${INTERVAL}ms${CRISE !== null ? `, crise após ${CRISE} leituras` : ''})`)
let i = 0
tick(i++)
const timer = setInterval(async () => {
  if (i >= COUNT) return clearInterval(timer)
  await tick(i++)
}, INTERVAL)

export {}
