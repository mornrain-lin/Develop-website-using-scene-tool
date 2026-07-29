import { z } from 'zod'

export const ChatRoleSchema = z.enum(['system', 'user', 'assistant'])

export const ChatMessageSchema = z.object({
  role: ChatRoleSchema,
  content: z.string(),
})

export const ChatRequestSchema = z.object({
  messages: z.array(ChatMessageSchema).min(1),
  model: z.string().optional(),
  temperature: z.number().optional(),
})

export type ChatMessage = z.infer<typeof ChatMessageSchema>
export type ChatRequest = z.infer<typeof ChatRequestSchema>
