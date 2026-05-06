export const SERVICES = [
  { id: 'corte',       label: 'Corte de Cabelo', minutes: 30, emoji: '✂️' },
  { id: 'barba',       label: 'Barba',            minutes: 20, emoji: '🪒' },
  { id: 'sobrancelha', label: 'Sobrancelha',      minutes: 15, emoji: '✨' },
  { id: 'hidratacao',  label: 'Hidratação',        minutes: 25, emoji: '💧' },
  { id: 'coloracao',   label: 'Coloração',         minutes: 60, emoji: '🎨' },
] as const

export type ServiceId = (typeof SERVICES)[number]['id']

export function calcMinutes(serviceIds: string[], durations?: Record<string, number>): number {
  return SERVICES.filter((s) => serviceIds.includes(s.id)).reduce(
    (sum, s) => sum + (durations?.[s.id] ?? s.minutes),
    0,
  )
}

export function formatMinutes(minutes: number): string {
  if (minutes === 0) return '—'
  if (minutes < 60) return `aprox. ${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `aprox. ${h}h ${m}min` : `aprox. ${h}h`
}
