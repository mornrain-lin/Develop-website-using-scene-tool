import { FadeIn } from '@/components/MotionPrimitives'
import { MessageBubble } from './MessageBubble'
import type { ChatMessage, Persona } from '@/types/chat'

interface Props {
  messages: ChatMessage[]
  persona?: Persona
  onRegenerate: () => void
  isStreaming: boolean
}

export function MessageList({ messages, persona, onRegenerate, isStreaming }: Props) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6">
      {messages.map((m, i) => (
        <FadeIn key={m.id}>
          <MessageBubble
            message={m}
            persona={persona}
            canRegenerate={
              !isStreaming && i === messages.length - 1 && m.role === 'assistant'
            }
            onRegenerate={onRegenerate}
          />
        </FadeIn>
      ))}
    </div>
  )
}
