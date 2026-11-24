import type { MetadataRoute } from 'next'

// Web App Manifest: permite instalar o SideConsult no celular como um app (ícone na tela inicial, tela cheia).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SideConsult - Saúde Pública Inteligente',
    short_name: 'SideConsult',
    description: 'Triagem com IA, monitoramento IoT e carteira de vacinação na palma da mão.',
    start_url: '/portal',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#f8fafc',
    theme_color: '#2563eb',
    lang: 'pt-BR',
    categories: ['health', 'medical'],
    icons: [
      { src: '/pwa-icon/192', sizes: '192x192', type: 'image/png' },
      { src: '/pwa-icon/512', sizes: '512x512', type: 'image/png' },
      { src: '/pwa-icon/512', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Triagem com IA', url: '/triage', icons: [{ src: '/pwa-icon/192', sizes: '192x192' }] },
      { name: 'Diário de Saúde', url: '/portal/monitoring', icons: [{ src: '/pwa-icon/192', sizes: '192x192' }] },
    ],
  }
}
