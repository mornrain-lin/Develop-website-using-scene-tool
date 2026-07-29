import { useEffect, useMemo, useRef, useState } from 'react'
import { useChat } from '@/hooks/useChat'
import { useTheme } from '@/hooks/useTheme'
import { PERSONA_MAP } from '@/lib/personas'
import { Sidebar } from '@/components/chat/Sidebar'
import { ChatHeader } from '@/components/chat/ChatHeader'
import { MessageList } from '@/components/chat/MessageList'
import { Composer } from '@/components/chat/Composer'
import { EmptyState } from '@/components/chat/EmptyState'
import { Sheet, SheetContent } from '@/components/ui/sheet'

export default function Index() {
  const chat = useChat()
  const { theme, toggle } = useTheme()
  const [menuOpen, setMenuOpen] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const messages = useMemo(() => chat.active?.messages ?? [], [chat.active?.messages])
  const hasMessages = messages.length > 0

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: chat.isStreaming ? 'auto' : 'smooth',
    })
  }, [messages, chat.activeId, chat.isStreaming])

  const handlePickPersona = (id: string) => {
    const p = PERSONA_MAP[id]
    if (p) chat.startPersona(p)
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <aside className="hidden w-72 shrink-0 border-r md:block">
        <Sidebar
          conversations={chat.conversations}
          activeId={chat.activeId}
          onSelect={chat.selectConversation}
          onNew={chat.newChat}
          onDelete={chat.deleteConversation}
        />
      </aside>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <Sidebar
            conversations={chat.conversations}
            activeId={chat.activeId}
            onSelect={chat.selectConversation}
            onNew={chat.newChat}
            onDelete={chat.deleteConversation}
            onClose={() => setMenuOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <ChatHeader
          persona={chat.activePersona}
          theme={theme}
          onToggleTheme={toggle}
          onNewChat={chat.newChat}
          onOpenSidebar={() => setMenuOpen(true)}
        />
        <main className="flex-1 overflow-y-auto">
          {hasMessages ? (
            <>
              <MessageList
                messages={messages}
                persona={chat.activePersona}
                onRegenerate={chat.regenerate}
                isStreaming={chat.isStreaming}
              />
              <div ref={bottomRef} />
            </>
          ) : (
            <EmptyState onPickPersona={handlePickPersona} onExample={(t) => chat.send(t)} />
          )}
        </main>
        <Composer onSend={(t) => chat.send(t)} onStop={chat.stop} isStreaming={chat.isStreaming} />
      </div>
    </div>
  )
}
