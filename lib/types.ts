export interface QueueEntry {
  id: string
  name: string
  ticket: number
  status: 'waiting' | 'called' | 'served'
  services: string[]
  createdAt: string
  calledAt?: string | null
}
