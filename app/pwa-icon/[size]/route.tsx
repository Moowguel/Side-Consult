import { ImageResponse } from 'next/og'

// Ícones PNG do app gerados no servidor (sem arquivos binários no repositório).
export async function GET(_req: Request, { params }: { params: Promise<{ size: string }> }) {
  const size = (await params).size === '512' ? 512 : 192
  const bar = size * 0.16
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #2563eb, #06b6d4)' }}>
        <div style={{ position: 'relative', width: size * 0.5, height: size * 0.5, display: 'flex' }}>
          <div style={{ position: 'absolute', left: (size * 0.5 - bar) / 2, top: 0, width: bar, height: size * 0.5, background: 'white', borderRadius: bar / 3 }} />
          <div style={{ position: 'absolute', top: (size * 0.5 - bar) / 2, left: 0, height: bar, width: size * 0.5, background: 'white', borderRadius: bar / 3 }} />
        </div>
      </div>
    ),
    { width: size, height: size }
  )
}
