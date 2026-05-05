import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Canto do Cabelo - Fila de Espera',
  description: 'Sistema de ordem de chegada',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="h-full" suppressHydrationWarning>
      <body className="min-h-full antialiased">{children}</body>
    </html>
  )
}
