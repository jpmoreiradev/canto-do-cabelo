'use client'

import { useEffect, useState } from 'react'
import type { QueueEntry } from '@/lib/types'
import { calcMinutes, formatMinutes } from '@/lib/services'

interface QueueStateDB {
  entries: QueueEntry[]
  currentTicket: number
  lastCalledId: string | null
}

export default function TVPage() {
  const [state, setState] = useState<QueueStateDB | null>(null)
  const [time, setTime] = useState('')

  useEffect(() => {
    const tick = () =>
      setTime(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }))
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    async function fetchState() {
      const res = await fetch('/api/queue')
      if (res.ok) setState(await res.json())
    }
    fetchState()
    const id = setInterval(fetchState, 5000)
    return () => clearInterval(id)
  }, [])

  if (!state) {
    return (
      <main className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <p className="text-zinc-600 text-2xl animate-pulse">Conectando...</p>
      </main>
    )
  }

  const called = state.entries.find((e) => e.id === state.lastCalledId)
  const waiting = state.entries.filter((e) => e.status === 'waiting')

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col p-8 gap-6 select-none">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-5">
        <div className="flex items-center gap-3">
          <span className="text-4xl">✂️</span>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-zinc-100">Canto do Cabelo</h1>
            <p className="text-zinc-500 text-sm">Ordem de atendimento</p>
          </div>
        </div>
        <div className="text-zinc-400 text-3xl font-mono font-bold">{time}</div>
      </div>

      <div className="flex gap-6 flex-1 min-h-0">
        {/* Currently being attended */}
        <div className="flex-1 flex flex-col gap-4">
          <h2 className="text-zinc-500 uppercase tracking-widest text-sm font-semibold">
            Em atendimento
          </h2>

          {called ? (
            <div className="flex-1 rounded-3xl bg-zinc-900 border border-zinc-800 flex flex-col items-center justify-center gap-4 p-8">
              <p className="text-zinc-500 uppercase tracking-widest text-xl font-semibold">
                Sendo atendido agora
              </p>
              <p className="text-8xl font-black text-amber-400 leading-none">{called.ticket}</p>
              <p className="text-4xl font-bold text-zinc-100">{called.name}</p>
            </div>
          ) : (
            <div className="flex-1 rounded-3xl border-2 border-dashed border-zinc-800 flex items-center justify-center">
              <p className="text-zinc-700 text-2xl">Nenhum atendimento em curso</p>
            </div>
          )}
        </div>

        {/* Queue sidebar */}
        <div className="w-80 flex flex-col gap-4">
          <h2 className="text-zinc-500 uppercase tracking-widest text-sm font-semibold">
            Na fila ({waiting.length})
          </h2>

          <div className="flex flex-col gap-2 overflow-y-auto flex-1">
            {waiting.length === 0 && (
              <p className="text-zinc-700 text-center py-8">Fila vazia</p>
            )}
            {waiting.map((e, i) => {
              const waitBefore = waiting
                .slice(0, i)
                .reduce((s, w) => s + calcMinutes(w.services), 0)

              return (
                <div
                  key={e.id}
                  className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3"
                >
                  <span className="text-2xl font-black text-amber-400 w-12 shrink-0">{i + 1}º</span>
                  <span className="text-zinc-200 font-medium flex-1 truncate">{e.name}</span>
                  {i === 0 ? (
                    <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full shrink-0">
                      em breve
                    </span>
                  ) : waitBefore > 0 ? (
                    <span className="text-xs text-zinc-500 shrink-0 text-right">
                      espera {formatMinutes(waitBefore)}
                    </span>
                  ) : null}
                </div>
              )
            })}
          </div>

        </div>
      </div>
    </main>
  )
}
