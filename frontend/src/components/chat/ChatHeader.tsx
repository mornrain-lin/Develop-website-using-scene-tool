import { Moon, Sun, Plus, Menu, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Persona } from '@/types/chat'

interface Props {
  persona?: Persona
  theme: 'light' | 'dark'
  onToggleTheme: () => void
  onNewChat: () => void
  onOpenSidebar: () => void
}

export function ChatHeader({ persona, theme, onToggleTheme, onNewChat, onOpenSidebar }: Props) {
  return (
    <header className="flex items-center gap-2 border-b bg-background/80 px-3 py-2 backdrop-blur">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={onOpenSidebar}
        aria-label="打开菜单"
      >
        <Menu className="size-5" />
      </Button>
      <div className="flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-full bg-brand-gradient shadow-sm">
          <Sparkles className="size-4 text-white" />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold">{persona ? persona.name : 'Mornrain'}</div>
          <div className="text-xs text-muted-foreground">
            {persona ? persona.description : '你的全能 AI 助手'}
          </div>
        </div>
      </div>
      <div className="ml-auto flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleTheme}
          aria-label="切换主题"
        >
          {theme === 'dark' ? <Sun className="size-5" /> : <Moon className="size-5" />}
        </Button>
        <Button variant="ghost" size="sm" onClick={onNewChat} className="gap-1.5">
          <Plus className="size-4" /> 新对话
        </Button>
      </div>
    </header>
  )
}
