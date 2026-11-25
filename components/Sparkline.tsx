// Mini-gráfico de linha em SVG puro (sem biblioteca de gráficos). Faixa de referência opcional.
export default function Sparkline({ values, color = "#db2777", height = 56, refMax, label }: {
  values: number[]; color?: string; height?: number; refMax?: number; label: string
}) {
  if (values.length < 2) return <p className="text-xs text-slate-400">Dados insuficientes para o gráfico.</p>
  const w = 300, pad = 4
  const lo = Math.min(...values, refMax ?? Infinity), hi = Math.max(...values, refMax ?? -Infinity)
  const y = (v: number) => height - pad - ((v - lo) / (hi - lo || 1)) * (height - pad * 2)
  const x = (i: number) => pad + (i / (values.length - 1)) * (w - pad * 2)
  const points = values.map((v, i) => `${x(i)},${y(v)}`).join(" ")
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full" style={{ height }} role="img" aria-label={label}>
      {refMax != null && <line x1={0} x2={w} y1={y(refMax)} y2={y(refMax)} stroke="#f97316" strokeDasharray="4 4" strokeWidth={1} />}
      <polyline points={points} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={x(values.length - 1)} cy={y(values[values.length - 1])} r={4} fill={color} />
    </svg>
  )
}
