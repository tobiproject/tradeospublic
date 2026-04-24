import Anthropic from '@anthropic-ai/sdk'

export function getAnthropicClient(): Anthropic {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) {
    throw new Error(`ANTHROPIC_API_KEY is not set (env keys available: ${Object.keys(process.env).filter(k => k.startsWith('ANTHROPIC') || k.startsWith('NEXT')).join(', ')})`)
  }
  return new Anthropic({ apiKey: key })
}
