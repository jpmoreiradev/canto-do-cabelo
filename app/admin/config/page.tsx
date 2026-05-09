'use client'

import { useEffect, useState } from 'react'
import type { ServiceDef } from '@/lib/services'

export default function ConfigPage() {
  const [services, setServices] = useState<ServiceDef[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [edits, setEdits] = useState<Record<string, Partial<ServiceDef>>>({})
  const [newSvc, setNewSvc] = useState({ emoji: '', label: '', minutes: '' })
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState('')

  useEffect(() => {
    fetch('/api/config/services')
      .then((r) => r.json())
      .then((data) => {
        setServices(data.services)
        setLoading(false)
      })
  }, [])

  function field(id: string, key: keyof ServiceDef) {
    return edits[id]?.[key] ?? services.find((s) => s.id === id)?.[key] ?? ''
  }

  function setField(id: string, key: keyof ServiceDef, value: string | number) {
    setEdits((prev) => ({ ...prev, [id]: { ...prev[id], [key]: value } }))
  }

  async function saveService(id: string) {
    setSavingId(id)
    const patch = edits[id]
    if (!patch) { setSavingId(null); return }

    const res = await fetch('/api/config/services', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...patch }),
    })
    if (res.ok) {
      const { service } = await res.json()
      setServices((prev) => prev.map((s) => (s.id === id ? service : s)))
      setEdits((prev) => { const next = { ...prev }; delete next[id]; return next })
    }
    setSavingId(null)
  }

  async function deleteService(id: string) {
    await fetch(`/api/config/services?id=${id}`, { method: 'DELETE' })
    setServices((prev) => prev.filter((s) => s.id !== id))
    setConfirmDeleteId(null)
  }

  async function addService(e: React.FormEvent) {
    e.preventDefault()
    setAddError('')
    if (!newSvc.emoji.trim() || !newSvc.label.trim() || !newSvc.minutes) {
      setAddError('Preencha todos os campos')
      return
    }
    setAdding(true)
    const res = await fetch('/api/config/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        emoji: newSvc.emoji.trim(),
        label: newSvc.label.trim(),
        minutes: Number(newSvc.minutes),
      }),
    })
    if (res.ok) {
      const { service } = await res.json()
      setServices((prev) => [...prev, service])
      setNewSvc({ emoji: '', label: '', minutes: '' })
    } else {
      const data = await res.json()
      setAddError(data.error ?? 'Erro ao adicionar')
    }
    setAdding(false)
  }

  return (
    <main className="min-h-screen bg-zinc-950 p-6">
      <div className="max-w-lg mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-zinc-100">Configurações</h1>
            <p className="text-zinc-500 text-sm">Gerenciar serviços</p>
          </div>
          <a
            href="/admin"
            className="text-sm text-zinc-400 border border-zinc-700 px-3 py-1.5 rounded-lg hover:border-zinc-500 transition-colors"
          >
            Voltar
          </a>
        </div>

        {loading ? (
          <p className="text-zinc-600 animate-pulse text-center py-10">Carregando...</p>
        ) : (
          <>
            {/* Service list */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
              <div className="px-5 py-3 border-b border-zinc-800">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
                  Serviços ativos
                </p>
              </div>

              {services.length === 0 && (
                <p className="text-zinc-600 text-center py-8">Nenhum serviço cadastrado</p>
              )}

              {services.map((s) => (
                <div key={s.id} className="px-5 py-4 border-b border-zinc-800/60 last:border-0 space-y-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={String(field(s.id, 'emoji'))}
                      onChange={(e) => setField(s.id, 'emoji', e.target.value)}
                      className="w-14 bg-zinc-800 border border-zinc-700 rounded-xl px-2 py-2 text-zinc-100 text-center focus:border-amber-500 focus:outline-none transition-colors text-lg"
                      maxLength={4}
                    />
                    <input
                      type="text"
                      value={String(field(s.id, 'label'))}
                      onChange={(e) => setField(s.id, 'label', e.target.value)}
                      className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-zinc-100 focus:border-amber-500 focus:outline-none transition-colors"
                    />
                    <div className="flex items-center gap-1 shrink-0">
                      <input
                        type="number"
                        min={1}
                        max={300}
                        value={String(field(s.id, 'minutes'))}
                        onChange={(e) => setField(s.id, 'minutes', Number(e.target.value))}
                        className="w-16 bg-zinc-800 border border-zinc-700 rounded-xl px-2 py-2 text-zinc-100 text-center focus:border-amber-500 focus:outline-none transition-colors"
                      />
                      <span className="text-zinc-500 text-xs">min</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-600 font-mono">{s.id}</span>
                    <div className="flex gap-2">
                      {confirmDeleteId === s.id ? (
                        <>
                          <button
                            onClick={() => deleteService(s.id)}
                            className="text-xs text-red-500 border border-red-500/50 px-3 py-1 rounded-lg transition-colors hover:border-red-400"
                          >
                            confirmar exclusão
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                          >
                            cancelar
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => saveService(s.id)}
                            disabled={savingId === s.id || !edits[s.id]}
                            className="text-xs font-bold bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-950 px-3 py-1 rounded-lg transition-colors"
                          >
                            {savingId === s.id ? 'Salvando...' : 'Salvar'}
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(s.id)}
                            className="text-xs text-red-500 hover:text-red-400 border border-red-500/30 hover:border-red-400 px-3 py-1 rounded-lg transition-colors"
                          >
                            Excluir
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Add new service */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
                Adicionar serviço
              </p>

              <form onSubmit={addService} className="space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="✂️"
                    value={newSvc.emoji}
                    onChange={(e) => setNewSvc((p) => ({ ...p, emoji: e.target.value }))}
                    maxLength={4}
                    className="w-14 bg-zinc-800 border border-zinc-700 rounded-xl px-2 py-2.5 text-zinc-100 text-center focus:border-amber-500 focus:outline-none transition-colors text-lg"
                  />
                  <input
                    type="text"
                    placeholder="Nome do serviço"
                    value={newSvc.label}
                    onChange={(e) => setNewSvc((p) => ({ ...p, label: e.target.value }))}
                    className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-zinc-100 placeholder-zinc-500 focus:border-amber-500 focus:outline-none transition-colors"
                  />
                  <div className="flex items-center gap-1 shrink-0">
                    <input
                      type="number"
                      placeholder="30"
                      min={1}
                      max={300}
                      value={newSvc.minutes}
                      onChange={(e) => setNewSvc((p) => ({ ...p, minutes: e.target.value }))}
                      className="w-16 bg-zinc-800 border border-zinc-700 rounded-xl px-2 py-2.5 text-zinc-100 text-center focus:border-amber-500 focus:outline-none transition-colors"
                    />
                    <span className="text-zinc-500 text-xs">min</span>
                  </div>
                </div>

                {addError && <p className="text-red-400 text-xs">{addError}</p>}

                <button
                  type="submit"
                  disabled={adding}
                  className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-950 font-black py-2.5 rounded-xl transition-colors"
                >
                  {adding ? 'Adicionando...' : '+ Adicionar serviço'}
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </main>
  )
}
