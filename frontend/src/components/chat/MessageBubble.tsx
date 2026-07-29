import { Copy, Check, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Markdown } from '@/lib/markdown'
import type { ChatMessage, Persona } from '@/types/chat'

interface Props {
  message: ChatMessage
  persona?: Persona
  canRegenerate?: boolean
  onRegenerate?: () => void
}

export function MessageBubble({ message, persona, canRegenerate, onRegenerate }: Props) {
  const isUser = message.role === 'user'

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      toast.success('已复制')
    } catch {
      toast.error('复制失败')
    }
  }

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl bg-primary px-4 py-2.5 text-primary-foreground shadow-sm">
          {message.content}
        </div>
      </div>
    )
  }

  const avatar = persona?.emoji ?? '✨'
  const name = persona?.name ?? '灵犀'

  return (
    <div className="flex gap-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-base shadow-sm">
        <span>{avatar}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          <span className="text-sm font-semibold">{name}</span>
          {message.streaming && (
            <span className="text-xs text-muted-foreground">正在输入…</span>
          )}
        </div>
        <div
          className={cn(
            'rounded-2xl rounded-tl-sm bg-muted px-4 py-2.5',
            message.error && 'border border-destructive/40'
          )}
        >
          {message.content ? (
            <Markdown content={message.content} />
          ) : message.streaming ? (
            <span className="inline-block size-2 animate-pulse rounded-full bg-muted-foreground/50" />
          ) : null}
          {message.streaming && message.content && (
            <span className="ml-0.5 inline-block h-4 w-1.5 translate-y-0.5 animate-pulse bg-primary align-middle" />
          )}
        </div>
        {!message.streaming && message.content && (
          <div className="mt-1 flex items-center gap-1">
            <button
              type="button"
              onClick={copy}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Copy className="size-3.5" /> 复制
            </button>
            {canRegenerate && onRegenerate && (
              <button
                type="button"
                onClick={onRegenerate}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <RefreshCw className="size-3.5" /> 重新生成
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
