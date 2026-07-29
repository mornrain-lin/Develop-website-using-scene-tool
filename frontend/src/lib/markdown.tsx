import { useState, type ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

function CodeBlock({ language, code }: { language?: string; code: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard unavailable */
    }
  }
  return (
    <div className="my-3 overflow-hidden rounded-lg border bg-muted/40">
      <div className="flex items-center justify-between border-b bg-muted/60 px-3 py-1.5 text-xs text-muted-foreground">
        <span className="font-mono">{language || 'code'}</span>
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {copied ? '已复制' : '复制'}
        </button>
      </div>
      <pre className="overflow-x-auto px-3 pb-3 pt-2 text-[0.82rem] leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  )
}

export function Markdown({ content, className }: { content: string; className?: string }) {
  return (
    <div className={cn('text-[0.95rem] leading-relaxed break-words', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          pre({ children }) {
            return <>{children}</>
          },
          code({ className: cls, children, ...props }) {
            const match = /language-(\w+)/.exec(cls || '')
            const text = String(children)
            const isBlock = !!match || text.includes('\n')
            if (!isBlock) {
              return (
                <code
                  className="rounded bg-muted px-1.5 py-0.5 text-[0.85em] text-primary"
                  {...props}
                >
                  {children}
                </code>
              )
            }
            return <CodeBlock language={match?.[1]} code={text.replace(/\n$/, '')} />
          },
          a({ children, ...props }) {
            return (
              <a
                target="_blank"
                rel="noreferrer"
                className="text-primary underline underline-offset-2"
                {...props}
              >
                {children}
              </a>
            )
          },
          ul({ children }) {
            return <ul className="my-2 list-disc space-y-1 pl-5">{children as ReactNode}</ul>
          },
          ol({ children }) {
            return <ol className="my-2 list-decimal space-y-1 pl-5">{children as ReactNode}</ol>
          },
          p({ children }) {
            return <p className="my-2">{children}</p>
          },
          h1({ children }) {
            return <h1 className="mb-2 mt-3 text-lg font-semibold">{children}</h1>
          },
          h2({ children }) {
            return <h2 className="mb-2 mt-3 text-base font-semibold">{children}</h2>
          },
          h3({ children }) {
            return <h3 className="mb-1 mt-2 text-sm font-semibold">{children}</h3>
          },
          blockquote({ children }) {
            return (
              <blockquote className="my-2 border-l-2 border-primary/40 pl-3 text-muted-foreground">
                {children}
              </blockquote>
            )
          },
          table({ children }) {
            return (
              <div className="my-2 overflow-x-auto">
                <table className="w-full border-collapse text-sm">{children}</table>
              </div>
            )
          },
          th({ children }) {
            return <th className="border bg-muted/50 px-2 py-1 text-left font-semibold">{children}</th>
          },
          td({ children }) {
            return <td className="border px-2 py-1">{children}</td>
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
