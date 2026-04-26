import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export interface AIMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface AIToolSchema {
  name: string
  description: string
  input_schema: Record<string, unknown>
}

export interface AICompleteResult {
  text: string | null
  toolResult: Record<string, unknown> | null
}

// Fetches the user's stored AI settings (provider + api_key) from DB.
// Called server-side from API routes.
async function getUserAISettings(userId: string): Promise<{
  provider: 'anthropic' | 'openai'
  apiKey: string | null
  model: string | null
}> {
  try {
    const supabase = await createServerSupabaseClient()
    const { data } = await supabase
      .from('user_ai_settings')
      .select('provider, api_key, model')
      .eq('user_id', userId)
      .maybeSingle()

    return {
      provider: (data?.provider as 'anthropic' | 'openai') ?? 'anthropic',
      apiKey: data?.api_key ?? null,
      model: data?.model ?? null,
    }
  } catch {
    return { provider: 'anthropic', apiKey: null, model: null }
  }
}

// Resolve the actual API key to use: user's own key → server env key → error
function resolveAnthropicKey(userKey: string | null): string {
  const key = userKey || process.env.ANTHROPIC_API_KEY
  if (!key) throw new Error('Kein Anthropic API-Key konfiguriert. Bitte in Einstellungen → KI-Provider hinterlegen.')
  return key
}

function resolveOpenAIKey(userKey: string | null): string {
  const key = userKey || process.env.OPENAI_API_KEY
  if (!key) throw new Error('Kein OpenAI API-Key konfiguriert. Bitte in Einstellungen → KI-Provider hinterlegen.')
  return key
}

// Default models per provider
const DEFAULT_MODELS = {
  anthropic: 'claude-sonnet-4-6',
  openai: 'gpt-4o',
}

// ─── Anthropic call ──────────────────────────────────────────────────────────

async function callAnthropic(params: {
  apiKey: string
  model: string
  system: string
  messages: AIMessage[]
  tool?: AIToolSchema
  maxTokens?: number
}): Promise<AICompleteResult> {
  const client = new Anthropic({ apiKey: params.apiKey })

  if (params.tool) {
    const response = await client.messages.create({
      model: params.model,
      max_tokens: params.maxTokens ?? 2048,
      system: params.system,
      messages: params.messages,
      tools: [params.tool as Anthropic.Tool],
      tool_choice: { type: 'tool', name: params.tool.name },
    })

    const toolBlock = response.content.find(b => b.type === 'tool_use') as Anthropic.ToolUseBlock | undefined
    return {
      text: null,
      toolResult: (toolBlock?.input as Record<string, unknown>) ?? null,
    }
  }

  const response = await client.messages.create({
    model: params.model,
    max_tokens: params.maxTokens ?? 2048,
    system: params.system,
    messages: params.messages,
  })

  const textBlock = response.content.find(b => b.type === 'text') as Anthropic.TextBlock | undefined
  return { text: textBlock?.text ?? null, toolResult: null }
}

// ─── OpenAI call ─────────────────────────────────────────────────────────────

async function callOpenAI(params: {
  apiKey: string
  model: string
  system: string
  messages: AIMessage[]
  tool?: AIToolSchema
  maxTokens?: number
}): Promise<AICompleteResult> {
  const client = new OpenAI({ apiKey: params.apiKey })

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: params.system },
    ...params.messages.map(m => ({ role: m.role, content: m.content } as OpenAI.Chat.ChatCompletionMessageParam)),
  ]

  if (params.tool) {
    // Use function calling for structured output
    const response = await client.chat.completions.create({
      model: params.model,
      max_tokens: params.maxTokens ?? 2048,
      messages,
      functions: [{
        name: params.tool.name,
        description: params.tool.description,
        parameters: params.tool.input_schema,
      }],
      function_call: { name: params.tool.name },
    })

    const fnCall = response.choices[0]?.message?.function_call
    if (!fnCall?.arguments) return { text: null, toolResult: null }
    try {
      return { text: null, toolResult: JSON.parse(fnCall.arguments) as Record<string, unknown> }
    } catch {
      return { text: null, toolResult: null }
    }
  }

  const response = await client.chat.completions.create({
    model: params.model,
    max_tokens: params.maxTokens ?? 2048,
    messages,
  })

  return { text: response.choices[0]?.message?.content ?? null, toolResult: null }
}

// ─── Public interface ────────────────────────────────────────────────────────

export async function callAI(params: {
  userId: string
  system: string
  messages: AIMessage[]
  tool?: AIToolSchema
  maxTokens?: number
}): Promise<AICompleteResult> {
  const settings = await getUserAISettings(params.userId)
  const provider = settings.provider
  const model = settings.model || DEFAULT_MODELS[provider]

  if (provider === 'openai') {
    const apiKey = resolveOpenAIKey(settings.apiKey)
    return callOpenAI({ apiKey, model, ...params })
  }

  // Default: Anthropic
  const apiKey = resolveAnthropicKey(settings.apiKey)
  return callAnthropic({ apiKey, model, ...params })
}

// Backwards-compatible helper — for routes that haven't migrated yet.
// Uses env key only, no user settings lookup.
export function getAnthropicClientDirect(): Anthropic {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) throw new Error('ANTHROPIC_API_KEY is not set')
  return new Anthropic({ apiKey: key })
}
