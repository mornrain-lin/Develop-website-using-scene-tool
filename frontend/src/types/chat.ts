import type { LucideIcon } from 'lucide-react'

export type Role = 'system' | 'user' | 'assistant'

export interface ChatMessage {
  id: string
  role: Role
  content: string
  createdAt: number
  streaming?: boolean
  error?: boolean
}

export interface Persona {
  id: string
  name: string
  emoji: string
  description: string
  systemPrompt: string
  greeting: string
  icon: LucideIcon
  accent: string
}

export interface Conversation {
  id: string
  title: string
  personaId: string | null
  messages: ChatMessage[]
  createdAt: number
  updatedAt: number
}

export interface ApiMessage {
  role: Role
  content: string
}
