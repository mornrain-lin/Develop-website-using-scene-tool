import { Sparkles } from 'lucide-react'
import { FadeIn, Stagger, HoverLift } from '@/components/MotionPrimitives'
import { PERSONAS } from '@/lib/personas'

const EXAMPLES = [
  '帮我写一条朋友圈文案，关于周末爬山',
  '把这段话翻译成英文：今天天气真好',
  '用 Python 写一个快速排序',
  '给我一份三天两晚的成都旅行攻略',
]

interface Props {
  onPickPersona: (id: string) => void
  onExample: (text: string) => void
}

export function EmptyState({ onPickPersona, onExample }: Props) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center px-4 py-10">
      <FadeIn>
        <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-brand-gradient shadow-lg">
          <Sparkles className="size-8 text-white" />
        </div>
      </FadeIn>
      <FadeIn>
        <h1 className="text-center text-3xl font-bold tracking-tight">你好，我是灵犀</h1>
      </FadeIn>
      <FadeIn delay={0.05}>
        <p className="mt-2 text-center text-muted-foreground">
          选择一位专家，或直接开始对话
        </p>
      </FadeIn>

      <Stagger className="mt-8 grid w-full grid-cols-2 gap-3 sm:grid-cols-3">
        {PERSONAS.map((p) => {
          const Icon = p.icon
          return (
            <HoverLift key={p.id}>
              <button
                type="button"
                onClick={() => onPickPersona(p.id)}
                className="flex w-full flex-col items-start gap-2 rounded-xl border bg-card p-4 text-left transition-colors hover:border-primary/40"
              >
                <span
                  className="flex size-9 items-center justify-center rounded-lg"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${p.accent} 15%, transparent)`,
                    color: p.accent,
                  }}
                >
                  <Icon className="size-5" />
                </span>
                <span className="font-semibold">{p.name}</span>
                <span className="text-xs text-muted-foreground">{p.description}</span>
              </button>
            </HoverLift>
          )
        })}
      </Stagger>

      <FadeIn className="mt-8 w-full">
        <p className="mb-2 text-xs font-medium text-muted-foreground">试试这些：</p>
        <div className="flex flex-col gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => onExample(ex)}
              className="rounded-lg border bg-card px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              {ex}
            </button>
          ))}
        </div>
      </FadeIn>
    </div>
  )
}
