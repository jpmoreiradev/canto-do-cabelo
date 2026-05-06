'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

interface Entry {
  id: string
  name: string
  ticket: number
  status: 'waiting' | 'called' | 'served'
  createdAt: string
  calledAt?: string
  position: number
}

function AcompanharContent() {
  const params = useSearchParams()
  const id = params.get('id')
  const [entry, setEntry] = useState<Entry | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) { setError('Link inválido'); return }

    async function fetch_() {
      const res = await fetch(`/api/queue/entry?id=${id}`)
      if (res.status === 404) { setError('Senha não encontrada'); return }
      if (res.ok) setEntry(await res.json())
    }

    fetch_()
    const interval = setInterval(fetch_, 30000)
    return () => clearInterval(interval)
  }, [id])

  if (error) {
    return (
      <main className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center max-w-sm w-full">
          <p className="text-red-400 mb-4">{error}</p>
          <a href="/tv" className="text-amber-400 underline text-sm">Ver fila</a>
        </div>
      </main>
    )
  }

  if (!entry) {
    return (
      <main className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-600 animate-pulse">Carregando...</div>
      </main>
    )
  }

  const isCalled = entry.status === 'called'
  const isServed = entry.status === 'served'
  const isWaiting = entry.status === 'waiting'

  return (
    <main className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-sm p-8 text-center">
        <div className="mb-6">
          <span className="text-4xl">✂️</span>
          <h1 className="text-lg font-black text-zinc-300 mt-2">Canto do Cabelo</h1>
        </div>

        {/* Ticket card */}
        <div
          className={`rounded-2xl p-6 mb-5 border-2 ${
            isCalled
              ? 'bg-amber-500/10 border-amber-500 animate-pulse-slow'
              : isServed
                ? 'bg-zinc-800 border-zinc-700'
                : 'bg-zinc-800 border-zinc-700'
          }`}
        >
          <p className="text-zinc-500 text-xs uppercase tracking-widest mb-1">Sua posição na fila</p>
          <p
            className={`text-7xl font-black leading-none mb-2 ${isCalled ? 'text-amber-400' : 'text-zinc-100'}`}
          >
            {isWaiting ? `${entry.position}º` : isCalled ? '1º' : '—'}
          </p>
          <p className="text-zinc-300 font-semibold">{entry.name}</p>
        </div>

        {/* Status */}
        <div
          className={`rounded-xl p-4 ${
            isCalled
              ? 'bg-amber-500 text-zinc-950'
              : isServed
                ? 'bg-zinc-800 text-zinc-500'
                : 'bg-zinc-800 text-zinc-200'
          }`}
        >
          {isCalled && <p className="text-2xl font-black">🎉 É a sua vez!</p>}
          {isServed && <p className="font-semibold">Atendimento concluído</p>}
          {isWaiting && <p className="text-zinc-400 text-sm">aguardando na fila</p>}
        </div>

        {!isServed && (
          <p className="text-xs text-zinc-600 mt-4">Atualiza automaticamente a cada 30 segundos</p>
        )}

        {isServed && (
          <a
            href="/tv"
            className="mt-5 inline-block text-amber-400 text-sm underline"
          >
            Ver fila geral
          </a>
        )}
      </div>
    </main>
  )
}

export default function AcompanharPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-zinc-950 flex items-center justify-center">
          <div className="text-zinc-600 animate-pulse">Carregando...</div>
        </main>
      }
    >
      <AcompanharContent />
    </Suspense>
  )
}
