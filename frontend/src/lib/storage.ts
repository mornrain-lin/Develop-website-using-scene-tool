import type { Conversation } from '@/types/chat'

const CONV_KEY = 'lingxi.conversations.v1'
const ACTIVE_KEY = 'lingxi.activeId.v1'
const THEME_KEY = 'lingxi.theme'

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export function loadConversations(): Conversation[] {
  if (typeof localStorage === 'undefined') return []
  const data = safeParse<Conversation[]>(localStorage.getItem(CONV_KEY))
  return Array.isArray(data) ? data : []
}

export function saveConversations(list: Conversation[]): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(CONV_KEY, JSON.stringify(list))
  } catch {
    // storage full or unavailable — ignore
  }
}

export function loadActiveId(): string | null {
  if (typeof localStorage === 'undefined') return null
  return localStorage.getItem(ACTIVE_KEY)
}

export function saveActiveId(id: string | null): void {
  if (typeof localStorage === 'undefined') return
  if (id) localStorage.setItem(ACTIVE_KEY, id)
  else localStorage.removeItem(ACTIVE_KEY)
}

export function loadTheme(): 'light' | 'dark' {
  if (typeof localStorage === 'undefined') return 'light'
  return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light'
}

export function saveTheme(theme: 'light' | 'dark'): void {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(THEME_KEY, theme)
}
