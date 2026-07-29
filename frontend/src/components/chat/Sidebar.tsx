import { Plus, MessageSquare, Trash2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Conversation } from '@/types/chat'

interface Props {
  conversations: Conversation[]
  activeId: string | null
  onSelect: (id: string) => void
  onNew: () => void
  onDelete: (id: string) => void
  onClose?: () => void
}

export function Sidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
  onClose,
}: Props) {
  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center gap-2 px-4 py-4">
        <div className="flex size-8 items-center justify-center rounded-full bg-brand-gradient text-sm shadow-sm">
          <Sparkles className="size-4 text-white" />
        </div>
        <span className="text-lg font-bold">灵犀</span>
      </div>
      <div className="px-3">
        <Button onClick={() => {
          onNew()
          onClose?.()
        }} className="w-full gap-2">
          <Plus className="size-4" /> 新建对话
        </Button>
      </div>
      <div className="mt-3 flex-1 overflow-y-auto px-2 pb-3">
        {conversations.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">
            还没有对话，开始第一句吧 ✨
          </p>
        ) : (
          <ul className="flex flex-col gap-1">
            {conversations.map((c) => (
              <li key={c.id}>
                <div
                  className={cn(
                    'group flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
                    c.id === activeId ? 'bg-muted font-medium' : 'hover:bg-muted/60'
                  )}
                  onClick={() => {
                    onSelect(c.id)
                    onClose?.()
                  }}
                >
                  <MessageSquare className="size-4 shrink-0 text-muted-foreground" />
                  <span className="flex-1 truncate">{c.title || '新对话'}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete(c.id)
                    }}
                    className="text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                    aria-label="删除对话"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="border-t px-4 py-3 text-xs text-muted-foreground">
        本地保存 · 无需登录
      </div>
    </div>
  )
}
