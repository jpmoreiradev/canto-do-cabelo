'use client'

import { useEffect, useState, useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import type { QueueEntry } from '@/lib/types'
import { SERVICES, calcMinutes, formatMinutes } from '@/lib/services'

interface QueueStateDB {
  entries: QueueEntry[]
  currentTicket: number
  lastCalledId: string | null
  serviceDurations: Record<string, number>
}

interface LastAdded extends QueueEntry {
  trackingUrl: string
}

export default function AdminPage() {
  const [state, setState] = useState<QueueStateDB | null>(null)
  const [callLoading, setCallLoading] = useState(false)
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [addLoading, setAddLoading] = useState(false)
  const [addError, setAddError] = useState('')
  const [lastAdded, setLastAdded] = useState<LastAdded | null>(null)
  const [entryLink, setEntryLink] = useState('')
  const [entryLinkCopied, setEntryLinkCopied] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function fetchState() {
    const res = await fetch('/api/queue')
    if (res.ok) setState(await res.json())
  }

  useEffect(() => {
    fetchState()
    const id = setInterval(fetchState, 5000)
    return () => clearInterval(id)
  }, [])

  function toggleService(id: string) {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    )
  }

  async function addPatient(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setAddLoading(true)
    setAddError('')

    const res = await fetch('/api/queue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim(), services: selectedServices }),
    })

    if (res.ok) {
      const entry = await res.json()
      const base = typeof window !== 'undefined' ? window.location.origin : ''
      setLastAdded({ ...entry, trackingUrl: `${base}/acompanhar?id=${entry.id}` })
      setNewName('')
      setSelectedServices([])
      fetchState()
      inputRef.current?.focus()
    } else {
      setAddError('Erro ao adicionar')
    }
    setAddLoading(false)
  }

  async function callNext() {
    setCallLoading(true)
    await fetch('/api/queue/next', { method: 'POST' })
    setCallLoading(false)
    fetchState()
  }

  async function markServed(id: string) {
    await fetch('/api/queue/served', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    fetchState()
  }

  async function removeFromQueue(id: string) {
    await fetch('/api/queue/remove', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setConfirmRemoveId(null)
    fetchState()
  }

  async function generateEntryLink() {
    const res = await fetch('/api/queue/tv-token')
    if (res.ok) {
      const { token } = await res.json()
      const link = `${window.location.origin}/entrar?t=${token}`
      setEntryLink(link)
      setEntryLinkCopied(false)
    }
  }

  async function copyEntryLink() {
    await navigator.clipboard.writeText(entryLink)
    setEntryLinkCopied(true)
    setTimeout(() => setEntryLinkCopied(false), 3000)
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/admin/login'
  }

  const durations = state?.serviceDurations
  const estimatedMinutes = calcMinutes(selectedServices, durations)

  if (!state) {
    return (
      <main className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <p className="text-zinc-500 animate-pulse">Conectando...</p>
      </main>
    )
  }

  const called = state.entries.find((e) => e.id === state.lastCalledId)
  const waiting = state.entries.filter((e) => e.status === 'waiting')
  const served = state.entries.filter((e) => e.status === 'served')
  const lastAddedPosition = lastAdded ? waiting.findIndex((e) => e.id === lastAdded.id) + 1 : null

  return (
    <main className="min-h-screen bg-zinc-950 p-6">
      <div className="max-w-2xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-zinc-100">Painel do Atendente</h1>
            <p className="text-zinc-500 text-sm">Canto do Cabelo</p>
          </div>
          <div className="flex gap-2">
            <a
              href="/fila"
              target="_blank"
              className="text-sm text-zinc-400 border border-zinc-700 px-3 py-1.5 rounded-lg hover:border-zinc-500 transition-colors"
            >
              Fila
            </a>
            <a
              href="/tv"
              target="_blank"
              className="text-sm text-amber-400 border border-zinc-700 px-3 py-1.5 rounded-lg hover:border-amber-500 transition-colors"
            >
              TV
            </a>
            <a
              href="/admin/config"
              className="text-sm text-zinc-400 border border-zinc-700 px-3 py-1.5 rounded-lg hover:border-zinc-500 transition-colors"
            >
              Config
            </a>
            <button
              onClick={logout}
              className="text-sm text-zinc-500 border border-zinc-800 px-3 py-1.5 rounded-lg hover:border-zinc-600 transition-colors"
            >
              Sair
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Aguardando" value={waiting.length} color="amber" />
          <Stat label="Atendidos" value={served.length} color="green" />
          <Stat label="Total hoje" value={state.currentTicket} color="zinc" />
        </div>

        {/* Entry link generator */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-4">
            Link de entrada (WhatsApp)
          </h2>
          {entryLink ? (
            <div className="space-y-3">
              <code className="text-xs text-zinc-400 bg-zinc-800 rounded-lg px-3 py-2 block truncate">
                {entryLink}
              </code>
              <div className="flex gap-2">
                <button
                  onClick={copyEntryLink}
                  className="flex-1 text-sm font-bold bg-amber-500 hover:bg-amber-400 text-zinc-950 px-4 py-2.5 rounded-xl transition-colors"
                >
                  {entryLinkCopied ? 'Copiado!' : 'Copiar link'}
                </button>
                <button
                  onClick={generateEntryLink}
                  className="text-sm text-zinc-400 border border-zinc-700 px-4 py-2.5 rounded-xl hover:border-zinc-500 transition-colors"
                >
                  Renovar
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={generateEntryLink}
              className="w-full text-sm font-bold text-zinc-300 border border-zinc-700 hover:border-amber-500 hover:text-amber-400 px-4 py-3 rounded-xl transition-colors"
            >
              Gerar link
            </button>
          )}
        </div>

        {/* Add patient form */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-4">
            Adicionar Cliente
          </h2>

          <form onSubmit={addPatient} className="space-y-4">
            {/* Name */}
            <input
              ref={inputRef}
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nome do cliente"
              maxLength={40}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-zinc-100 placeholder-zinc-500 focus:border-amber-500 focus:outline-none transition-colors"
            />

            {/* Services */}
            <div>
              <p className="text-zinc-400 text-xs mb-2 uppercase tracking-wide">Serviços</p>
              <div className="grid grid-cols-2 gap-2">
                {SERVICES.map((s) => {
                  const active = selectedServices.includes(s.id)
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleService(s.id)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl border text-sm transition-all ${
                        active
                          ? 'bg-amber-500/15 border-amber-500 text-amber-400'
                          : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600'
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

            {/* Time estimate + button */}
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-center">
                <span className="text-zinc-500 text-xs">Tempo estimado </span>
                <span className={`font-bold ${estimatedMinutes > 0 ? 'text-amber-400' : 'text-zinc-600'}`}>
                  {formatMinutes(estimatedMinutes)}
                </span>
              </div>
              <button
                type="submit"
                disabled={!newName.trim() || selectedServices.length === 0 || addLoading}
                className="bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-950 font-bold px-5 py-2.5 rounded-xl transition-colors whitespace-nowrap"
              >
                {addLoading ? '...' : '+ Adicionar'}
              </button>
            </div>

            {addError && <p className="text-red-400 text-sm">{addError}</p>}
          </form>

          {/* Last added — tracking link */}
          {lastAdded && (
            <div className="mt-4 bg-zinc-800 border border-zinc-700 rounded-xl p-4">
              {lastAddedPosition ? (
                <div className="text-center mb-4">
                  <p className="text-amber-400 font-black" style={{ fontSize: 32 }}>{lastAdded.name} adicionado na {lastAddedPosition}ª posição</p>
                </div>
              ) : null}
              <div className="flex gap-4 items-center">
                <div className="bg-white p-2 rounded-lg shrink-0">
                  <QRCodeSVG value={lastAdded.trackingUrl} size={96} />
                </div>
                <div className="flex flex-col gap-2 flex-1 min-w-0">
                  <code className="text-xs text-zinc-400 bg-zinc-900 rounded-lg px-3 py-2 truncate block">
                    {lastAdded.trackingUrl}
                  </code>
                  <button
                    onClick={() => navigator.clipboard.writeText(lastAdded.trackingUrl)}
                    className="text-xs text-zinc-300 bg-zinc-700 hover:bg-zinc-600 px-3 py-2 rounded-lg transition-colors"
                  >
                    Copiar link
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Currently called */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-4">
            Em atendimento
          </h2>
          {called ? (
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <div>
                  <p className="font-bold text-zinc-100 text-lg">{called.name}</p>
                  {called.services.length > 0 && (
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {called.services
                        .map((id) => SERVICES.find((s) => s.id === id)?.label)
                        .filter(Boolean)
                        .join(' · ')}{' '}
                      · {formatMinutes(calcMinutes(called.services))}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => markServed(called.id)}
                  className="bg-green-600 hover:bg-green-500 text-white font-bold px-5 py-2.5 rounded-xl transition-colors"
                >
                  Finalizar
                </button>
              </div>
            </div>
          ) : (
            <p className="text-zinc-600 text-center py-3">Nenhum cliente em atendimento</p>
          )}
        </div>

        {/* Call next */}
        <button
          onClick={callNext}
          disabled={callLoading || waiting.length === 0}
          className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-950 font-black py-5 rounded-2xl text-xl transition-colors"
        >
          {callLoading
            ? 'Chamando...'
            : waiting.length > 0
              ? 'Chamar Próximo'
              : 'Fila Vazia'}
        </button>

        {/* Queue list */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-4">
            Fila de espera ({waiting.length})
          </h2>
          {waiting.length === 0 ? (
            <p className="text-zinc-600 text-center py-4">Nenhum cliente aguardando</p>
          ) : (
            <div className="space-y-1">
              {waiting.map((e, i) => {
                const waitBefore = waiting.slice(0, i).reduce((s, w) => s + calcMinutes(w.services, durations), 0)
                return (
                  <div key={e.id} className="flex items-center gap-3 py-2.5 border-b border-zinc-800 last:border-0">
                    <span className="text-xl font-black text-amber-400 w-10 shrink-0">{i + 1}º</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-zinc-200 font-medium truncate">{e.name}</p>
                      {e.services.length > 0 && (
                        <p className="text-xs text-zinc-600 truncate">
                          {e.services.map((id) => SERVICES.find((s) => s.id === id)?.emoji).join(' ')}
                          {' '}{e.services.map((id) => SERVICES.find((s) => s.id === id)?.label).filter(Boolean).join(' · ')}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      {i === 0 ? (
                        <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full">
                          em breve
                        </span>
                      ) : waitBefore > 0 ? (
                        <p className="text-xs text-amber-400 font-medium">espera {formatMinutes(waitBefore)}</p>
                      ) : null}
                    </div>
                    {confirmRemoveId === e.id ? (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => removeFromQueue(e.id)}
                          className="text-xs text-red-500 hover:text-red-400 border border-red-500/50 px-2 py-0.5 rounded-full transition-colors"
                        >
                          confirmar
                        </button>
                        <button
                          onClick={() => setConfirmRemoveId(null)}
                          className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                        >
                          cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmRemoveId(e.id)}
                        className="shrink-0 text-xs text-red-500 hover:text-red-400 border border-red-500/30 hover:border-red-400 px-2 py-0.5 rounded-full transition-colors"
                      >
                        remover
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    amber: 'text-amber-400',
    green: 'text-green-400',
    zinc: 'text-zinc-300',
  }
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
      <p className={`text-3xl font-black ${colors[color]}`}>{value}</p>
      <p className="text-xs text-zinc-500 mt-1">{label}</p>
    </div>
  )
}
