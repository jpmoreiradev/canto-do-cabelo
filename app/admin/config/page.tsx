'use client'

import { useEffect, useState } from 'react'
import { SERVICES } from '@/lib/services'

export default function ConfigPage() {
  const [durations, setDurations] = useState<Record<string, number>>({})
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/config/services')
      .then((r) => r.json())
      .then((data) => {
        setDurations(data.serviceDurations)
        setLoading(false)
      })
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await fetch('/api/config/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(durations),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <main className="min-h-screen bg-zinc-950 p-6">
      <div className="max-w-lg mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-zinc-100">Configurações</h1>
            <p className="text-zinc-500 text-sm">Duração dos serviços</p>
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
          <form onSubmit={handleSave} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
            <p className="text-xs text-zinc-500 uppercase tracking-widest font-semibold">
              Tempo em minutos
            </p>

            {SERVICES.map((s) => (
              <div key={s.id} className="flex items-center gap-4">
                <span className="text-zinc-300 flex-1 font-medium">
                  {s.emoji} {s.label}
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={300}
                    value={durations[s.id] ?? s.minutes}
                    onChange={(e) =>
                      setDurations((prev) => ({ ...prev, [s.id]: Number(e.target.value) }))
                    }
                    className="w-20 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-zinc-100 text-center focus:border-amber-500 focus:outline-none transition-colors"
                  />
                  <span className="text-zinc-500 text-sm">min</span>
                </div>
              </div>
            ))}

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-950 font-black py-3 rounded-xl transition-colors mt-2"
            >
              {saving ? 'Salvando...' : saved ? 'Salvo!' : 'Salvar'}
            </button>
          </form>
        )}
      </div>
    </main>
  )
}
