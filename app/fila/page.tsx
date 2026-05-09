'use client'

import { useEffect, useState } from 'react'
import type { QueueEntry } from '@/lib/types'
import { calcMinutes, formatMinutes } from '@/lib/services'

interface QueueStateDB {
  entries: QueueEntry[]
  lastCalledId: string | null
  serviceDurations: Record<string, number>
}

export default function FilaPage() {
  const [state, setState] = useState<QueueStateDB | null>(null)

  useEffect(() => {
    async function fetch_() {
      const res = await fetch('/api/queue')
      if (res.ok) setState(await res.json())
    }
    fetch_()
    const id = setInterval(fetch_, 10000)
    return () => clearInterval(id)
  }, [])

  if (!state) {
    return (
      <main className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <p className="text-zinc-600 animate-pulse">Carregando fila...</p>
      </main>
    )
  }

  const called = state.entries.find((e) => e.id === state.lastCalledId)
  const waiting = state.entries.filter((e) => e.status === 'waiting')

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="text-center">
          <img src="/image.png" alt="Canto do Cabelo" className="h-16 w-auto rounded-xl mx-auto" />
          <h1 className="text-2xl font-black text-zinc-100 mt-2">Canto do Cabelo</h1>
          <p className="text-zinc-500 text-sm mt-1">Fila de espera</p>
        </div>

        {/* Em atendimento */}
        {called && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 text-center">
            <p className="text-zinc-500 text-xs uppercase tracking-widest mb-1">
              Em atendimento
            </p>
            <p className="text-xl font-bold text-zinc-100 mt-2">{called.name}</p>
          </div>
        )}

        {/* Fila */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-zinc-800 flex items-center justify-between">
            <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
              Aguardando
            </h2>
            <span className="text-xs text-zinc-600">{waiting.length} na fila</span>
          </div>

          {waiting.length === 0 ? (
            <p className="text-zinc-600 text-center py-10">Fila vazia</p>
          ) : (
            <div>
              {waiting.map((e, i) => {
                const d = state.serviceDurations
                const calledMinutes = calcMinutes(called?.services ?? [], d)
                const waitBefore = calledMinutes + waiting
                  .slice(0, i)
                  .reduce((s, w) => s + calcMinutes(w.services, d), 0)

                return (
                  <div
                    key={e.id}
                    className="flex items-center gap-4 px-5 py-4 border-b border-zinc-800/60 last:border-0"
                  >
                    <div className="flex flex-col items-center w-10 shrink-0">
                      <span className="text-2xl font-black text-amber-400 leading-none">
                        {i + 1}º
                      </span>
                    </div>

                    <span className="text-zinc-100 font-medium flex-1 truncate">{e.name}</span>

                    {waitBefore === 0 ? (
                      <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full shrink-0">
                        em breve
                      </span>
                    ) : (
                      <span className="text-zinc-500 text-sm shrink-0">
                        espera {formatMinutes(waitBefore)}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <p className="text-center text-xs text-zinc-700">
          Atualiza automaticamente a cada 10 segundos
        </p>
      </div>
    </main>
  )
}
