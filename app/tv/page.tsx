'use client'

import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import type { QueueEntry } from '@/lib/types'
import { calcMinutes, formatMinutes } from '@/lib/services'

interface QueueStateDB {
  entries: QueueEntry[]
  currentTicket: number
  lastCalledId: string | null
  serviceDurations: Record<string, number>
}

export default function TVPage() {
  const [state, setState] = useState<QueueStateDB | null>(null)
  const [time, setTime] = useState('')
  const [qrUrl, setQrUrl] = useState('')

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
    const id = setInterval(fetchState, 10000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    async function refreshToken() {
      const res = await fetch('/api/queue/tv-token')
      if (res.ok) {
        const { token } = await res.json()
        const base = window.location.origin
        setQrUrl(`${base}/entrar?t=${token}`)
      }
    }
    refreshToken()
    // Renova a cada 4 min para o token de 5 min nunca expirar enquanto exibido
    const id = setInterval(refreshToken, 4 * 60 * 1000)
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
    <main className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col p-4 md:p-8 gap-4 md:gap-6 select-none">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4 md:pb-5">
        <div className="flex items-center gap-2 md:gap-3">
          <img src="/image.png" alt="Canto do Cabelo" className="h-10 md:h-14 w-auto rounded-lg" />
          <div>
            <h1 className="text-xl md:text-3xl font-black tracking-tight text-zinc-100">Canto do Cabelo</h1>
            <p className="text-zinc-500 text-xs md:text-sm">Ordem de atendimento</p>
          </div>
        </div>
        <div className="text-zinc-400 text-2xl md:text-3xl font-mono font-bold">{time}</div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 md:gap-6 flex-1 min-h-0">
        {/* Em atendimento */}
        <div className="flex flex-col gap-3 md:flex-1">
          <h2 className="text-zinc-500 uppercase tracking-widest text-xs font-semibold">
            Em atendimento
          </h2>

          {called ? (
            <div className="rounded-3xl bg-zinc-900 border border-zinc-800 flex flex-col items-center justify-center gap-2 md:gap-4 py-8 px-6 md:p-8 md:flex-1">
              <p className="text-zinc-500 uppercase tracking-widest text-sm md:text-xl font-semibold">
                Sendo atendido agora
              </p>
              <p className="text-6xl md:text-8xl font-black text-amber-400 leading-none">{called.ticket}</p>
              <p className="text-3xl md:text-4xl font-bold text-zinc-100 text-center">{called.name}</p>
            </div>
          ) : (
            <div className="rounded-3xl border-2 border-dashed border-zinc-800 flex items-center justify-center py-10 md:flex-1">
              <p className="text-zinc-700 text-lg md:text-2xl text-center px-4">Nenhum atendimento em curso</p>
            </div>
          )}
        </div>

        {/* Coluna direita: fila + QR */}
        <div className="md:w-80 flex flex-col gap-4">
          <h2 className="text-zinc-500 uppercase tracking-widest text-xs font-semibold">
            Na fila ({waiting.length})
          </h2>

          <div className="flex flex-col gap-2 md:overflow-y-auto md:flex-1">
            {waiting.length === 0 && (
              <p className="text-zinc-700 text-center py-6">Fila vazia</p>
            )}
            {waiting.map((e, i) => {
              const d = state.serviceDurations
              const calledMinutes = calcMinutes(called?.services ?? [], d)
              const waitBefore = calledMinutes + waiting
                .slice(0, i)
                .reduce((s, w) => s + calcMinutes(w.services, d), 0)

              return (
                <div
                  key={e.id}
                  className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3"
                >
                  <span className="text-xl md:text-2xl font-black text-amber-400 w-10 shrink-0">{i + 1}º</span>
                  <span className="text-zinc-200 font-medium flex-1 truncate">{e.name}</span>
                  {waitBefore === 0 ? (
                    <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full shrink-0">
                      em breve
                    </span>
                  ) : (
                    <span className="text-xs text-zinc-500 shrink-0">
                      {formatMinutes(waitBefore)}
                    </span>
                  )}
                </div>
              )
            })}
          </div>

          {/* QR code */}
          {qrUrl && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col items-center gap-3 shrink-0">
              <p className="text-zinc-500 uppercase tracking-widest text-xs font-semibold">
                Entre na fila pelo celular
              </p>
              <div className="bg-white p-3 rounded-xl">
                <QRCodeSVG value={qrUrl} size={140} />
              </div>
              <p className="text-zinc-600 text-xs text-center">Escaneie a câmera do celular</p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
