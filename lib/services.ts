export interface ServiceDef {
  id: string
  label: string
  emoji: string
  minutes: number
  ord: number
}

// Used only for seeding the database on first run
export const SERVICES: ServiceDef[] = [
  { id: 'corte',       label: 'Corte de Cabelo', minutes: 30, emoji: '✂️', ord: 0 },
  { id: 'barba',       label: 'Barba',            minutes: 20, emoji: '🪒', ord: 1 },
  { id: 'sobrancelha', label: 'Sobrancelha',      minutes: 15, emoji: '✨', ord: 2 },
  { id: 'hidratacao',  label: 'Hidratação',        minutes: 25, emoji: '💧', ord: 3 },
  { id: 'coloracao',   label: 'Coloração',         minutes: 60, emoji: '🎨', ord: 4 },
]

export function calcMinutes(serviceIds: string[], durations: Record<string, number> = {}): number {
  return serviceIds.reduce((sum, id) => sum + (durations[id] ?? 0), 0)
}

export function formatMinutes(minutes: number): string {
  if (minutes === 0) return '—'
  if (minutes < 60) return `aprox. ${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `aprox. ${h}h ${m}min` : `aprox. ${h}h`
}

export function slugify(str: string): string {
  return (
    str
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || `svc-${Date.now()}`
  )
}
