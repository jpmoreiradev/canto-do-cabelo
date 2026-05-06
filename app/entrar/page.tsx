'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { SERVICES, calcMinutes, formatMinutes } from '@/lib/services'

function EntrarForm() {
  const params = useSearchParams()
  const router = useRouter()
  const token = params.get('t') ?? ''

  const [name, setName] = useState('')
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [queueWaitMinutes, setQueueWaitMinutes] = useState(0)
  const [durations, setDurations] = useState<Record<string, number>>({})

  useEffect(() => {
    if (!token) setError('Escaneie o QR code na TV para entrar na fila.')
  }, [token])

  useEffect(() => {
    async function fetchQueue() {
      const res = await fetch('/api/queue')
      if (!res.ok) return
      const data = await res.json()
      const d: Record<string, number> = data.serviceDurations ?? {}
      setDurations(d)
      const total = data.entries
        .filter((e: { status: string; services: string[] }) => e.status === 'waiting' || e.status === 'called')
        .reduce((sum: number, e: { services: string[] }) => sum + calcMinutes(e.services, d), 0)
      setQueueWaitMinutes(total)
    }
    fetchQueue()
  }, [])

  function toggleService(id: string) {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !token) return
    setLoading(true)
    setError('')

    const res = await fetch('/api/queue/self-register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, name: name.trim(), services: selectedServices }),
    })

    if (res.ok) {
      const entry = await res.json()
      router.push(`/acompanhar?id=${entry.id}`)
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Erro ao entrar na fila. Tente escanear o QR code novamente.')
      setLoading(false)
    }
  }

  const estimatedMinutes = calcMinutes(selectedServices, durations)
  const disabled = !token || loading

  return (
    <main className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Header */}
        <div className="text-center space-y-1">
          <img src="/image.png" alt="Canto do Cabelo" className="h-20 w-auto rounded-xl mx-auto" />
          <h1 className="text-2xl font-black text-zinc-100 mt-2">Canto do Cabelo</h1>
          <p className="text-zinc-500 text-sm">Entre na fila de espera</p>
        </div>

        {error && !loading ? (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-5 text-center">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        ) : null}

        {token && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div className="space-y-1">
              <label className="text-xs text-zinc-500 uppercase tracking-wide">Seu nome</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Como você se chama?"
                maxLength={40}
                autoFocus
                disabled={disabled}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 placeholder-zinc-600 focus:border-amber-500 focus:outline-none transition-colors disabled:opacity-50"
              />
            </div>

            {/* Services */}
            <div className="space-y-2">
              <label className="text-xs text-zinc-500 uppercase tracking-wide">Serviços</label>
              <div className="grid grid-cols-1 gap-2">
                {SERVICES.map((s) => {
                  const active = selectedServices.includes(s.id)
                  return (
                    <button
                      key={s.id}
                      type="button"
                      disabled={disabled}
                      onClick={() => toggleService(s.id)}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl border text-sm transition-all ${
                        active
                          ? 'bg-amber-500/15 border-amber-500 text-amber-400'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <span>
                        {s.emoji} {s.label}
                      </span>
                      <span className={`text-xs ${active ? 'text-amber-400' : 'text-zinc-600'}`}>
                        {s.minutes} min
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Time estimates */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-zinc-500 text-xs">Espera na fila</span>
                <span className="font-bold text-amber-400">
                  {queueWaitMinutes === 0 ? 'em breve' : formatMinutes(queueWaitMinutes)}
                </span>
              </div>
              {estimatedMinutes > 0 && (
                <div className="flex justify-between items-center border-t border-zinc-800 pt-1.5">
                  <span className="text-zinc-500 text-xs">Seu serviço</span>
                  <span className="text-zinc-400 text-sm">{formatMinutes(estimatedMinutes)}</span>
                </div>
              )}
            </div>

            {error && (
              <p className="text-red-400 text-sm text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={!name.trim() || selectedServices.length === 0 || disabled}
              className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-950 font-black py-4 rounded-2xl text-lg transition-colors"
            >
              {loading ? 'Entrando na fila...' : 'Entrar na fila'}
            </button>
          </form>
        )}
      </div>
    </main>
  )
}

export default function EntrarPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-zinc-950 flex items-center justify-center">
          <p className="text-zinc-600 animate-pulse">Carregando...</p>
        </main>
      }
    >
      <EntrarForm />
    </Suspense>
  )
}
