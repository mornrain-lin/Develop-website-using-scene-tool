import { useCallback, useEffect, useRef, useState } from 'react'
import { streamChat } from '@/lib/chat-api'
import { getPersona } from '@/lib/personas'
import { loadActiveId, loadConversations, saveActiveId, saveConversations } from '@/lib/storage'
import type { ApiMessage, ChatMessage, Conversation, Persona } from '@/types/chat'

function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export function useChat() {
  const [conversations, setConversations] = useState<Conversation[]>(() => loadConversations())
  const [activeId, setActiveId] = useState<string | null>(() => {
    const id = loadActiveId()
    const list = loadConversations()
    return id && list.some((c) => c.id === id) ? id : (list[0]?.id ?? null)
  })
  const [isStreaming, setIsStreaming] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (persistTimer.current) clearTimeout(persistTimer.current)
    persistTimer.current = setTimeout(() => saveConversations(conversations), 300)
    return () => {
      if (persistTimer.current) clearTimeout(persistTimer.current)
    }
  }, [conversations])

  useEffect(() => {
    saveActiveId(activeId)
  }, [activeId])

  const active = conversations.find((c) => c.id === activeId) ?? null
  const activePersona = getPersona(active?.personaId)

  const updateConversation = useCallback((id: string, updater: (c: Conversation) => Conversation) => {
    setConversations((prev) => prev.map((c) => (c.id === id ? updater(c) : c)))
  }, [])

  const runStream = useCallback(
    async (convId: string, assistantMsgId: string, apiMessages: ApiMessage[]) => {
      const controller = new AbortController()
      abortRef.current = controller
      setIsStreaming(true)
      let acc = ''
      try {
        for await (const chunk of streamChat(apiMessages, { signal: controller.signal })) {
          if (chunk.type === 'delta') {
            acc += chunk.content ?? ''
            setConversations((prev) =>
              prev.map((c) =>
                c.id === convId
                  ? {
                      ...c,
                      messages: c.messages.map((m) =>
                        m.id === assistantMsgId ? { ...m, content: acc } : m
                      ),
                      updatedAt: Date.now(),
                    }
                  : c
              )
            )
          } else if (chunk.type === 'error') {
            setConversations((prev) =>
              prev.map((c) =>
                c.id === convId
                  ? {
                      ...c,
                      messages: c.messages.map((m) =>
                        m.id === assistantMsgId
                          ? { ...m, content: acc || `⚠️ ${chunk.message ?? '出错了'}`, error: true, streaming: false }
                          : m
                      ),
                    }
                  : c
              )
            )
            break
          } else if (chunk.type === 'done') {
            setConversations((prev) =>
              prev.map((c) =>
                c.id === convId
                  ? {
                      ...c,
                      messages: c.messages.map((m) =>
                        m.id === assistantMsgId ? { ...m, streaming: false } : m
                      ),
                    }
                  : c
              )
            )
          }
        }
      } finally {
        setIsStreaming(false)
        abortRef.current = null
      }
    },
    []
  )

  const startPersona = useCallback((persona: Persona): string => {
    const id = uid()
    const now = Date.now()
    const greeting: ChatMessage = {
      id: uid(),
      role: 'assistant',
      content: persona.greeting,
      createdAt: now,
    }
    const conv: Conversation = {
      id,
      title: persona.name,
      personaId: persona.id,
      messages: [greeting],
      createdAt: now,
      updatedAt: now,
    }
    setConversations((prev) => [conv, ...prev])
    setActiveId(id)
    return id
  }, [])

  const newChat = useCallback((): string => {
    const id = uid()
    const now = Date.now()
    const conv: Conversation = {
      id,
      title: '新对话',
      personaId: null,
      messages: [],
      createdAt: now,
      updatedAt: now,
    }
    setConversations((prev) => [conv, ...prev])
    setActiveId(id)
    return id
  }, [])

  const selectConversation = useCallback((id: string) => setActiveId(id), [])

  const deleteConversation = useCallback(
    (id: string) => {
      setConversations((prev) => {
        const next = prev.filter((c) => c.id !== id)
        if (activeId === id) setActiveId(next[0]?.id ?? null)
        return next
      })
    },
    [activeId]
  )

  const renameConversation = useCallback(
    (id: string, title: string) => {
      updateConversation(id, (c) => ({ ...c, title: title || c.title, updatedAt: Date.now() }))
    },
    [updateConversation]
  )

  const stop = useCallback(() => {
    abortRef.current?.abort()
    if (activeId) {
      updateConversation(activeId, (c) => ({
        ...c,
        messages: c.messages.map((m) => ({ ...m, streaming: false })),
      }))
    }
    setIsStreaming(false)
  }, [activeId, updateConversation])

  const send = useCallback(
    async (text: string, persona?: Persona) => {
      const content = text.trim()
      if (!content || isStreaming) return

      let convId: string
      let currentMessages: ChatMessage[]
      let personaId: string | null
      let title: string
      let createdAt: number

      if (!active) {
        convId = uid()
        personaId = persona?.id ?? null
        currentMessages = []
        title = persona ? persona.name : content.slice(0, 20)
        createdAt = Date.now()
      } else if (persona && active.personaId !== persona.id) {
        convId = uid()
        personaId = persona.id
        currentMessages = []
        title = persona.name
        createdAt = Date.now()
      } else {
        convId = active.id
        personaId = active.personaId
        currentMessages = active.messages
        createdAt = active.createdAt
        title = active.messages.some((m) => m.role === 'user')
          ? active.title
          : content.slice(0, 20)
      }

      const userMsg: ChatMessage = { id: uid(), role: 'user', content, createdAt: Date.now() }
      const assistantMsg: ChatMessage = {
        id: uid(),
        role: 'assistant',
        content: '',
        createdAt: Date.now() + 1,
        streaming: true,
      }
      const finalMessages = [...currentMessages, userMsg, assistantMsg]

      setConversations((prev) => {
        const exists = prev.some((c) => c.id === convId)
        const next: Conversation = {
          id: convId,
          title,
          personaId,
          messages: finalMessages,
          createdAt: exists ? createdAt : Date.now(),
          updatedAt: Date.now(),
        }
        return exists ? prev.map((c) => (c.id === convId ? next : c)) : [next, ...prev]
      })
      setActiveId(convId)

      const personaObj = getPersona(personaId)
      const apiMessages: ApiMessage[] = []
      if (personaObj) apiMessages.push({ role: 'system', content: personaObj.systemPrompt })
      for (const m of currentMessages) apiMessages.push({ role: m.role, content: m.content })
      apiMessages.push({ role: 'user', content })

      await runStream(convId, assistantMsg.id, apiMessages)
    },
    [active, isStreaming, runStream]
  )

  const regenerate = useCallback(async () => {
    if (!active || isStreaming) return
    const msgs = [...active.messages]
    while (msgs.length && msgs[msgs.length - 1].role === 'assistant') msgs.pop()
    const lastUser = [...msgs].reverse().find((m) => m.role === 'user')
    if (!lastUser) return

    const assistantMsg: ChatMessage = {
      id: uid(),
      role: 'assistant',
      content: '',
      createdAt: Date.now(),
      streaming: true,
    }
    const newMsgs = [...msgs, assistantMsg]
    setConversations((prev) =>
      prev.map((c) => (c.id === active.id ? { ...c, messages: newMsgs, updatedAt: Date.now() } : c))
    )

    const personaObj = getPersona(active.personaId)
    const apiMessages: ApiMessage[] = []
    if (personaObj) apiMessages.push({ role: 'system', content: personaObj.systemPrompt })
    for (const m of msgs) apiMessages.push({ role: m.role, content: m.content })

    await runStream(active.id, assistantMsg.id, apiMessages)
  }, [active, isStreaming, runStream])

  return {
    conversations,
    active,
    activeId,
    activePersona,
    isStreaming,
    send,
    regenerate,
    stop,
    newChat,
    startPersona,
    selectConversation,
    deleteConversation,
    renameConversation,
  }
}
