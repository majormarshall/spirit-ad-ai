/**
 * AI Provider Factory — returns the configured provider.
 * Swap the provider here to switch between OpenAI, Gemini, etc.
 */
import type { AIProvider } from './provider'

let _provider: AIProvider | null = null

export function getAIProvider(): AIProvider {
  if (_provider) return _provider

  // Default to OpenAI. To add a new provider, import it and change the line below.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { OpenAIProvider } = require('./openai-provider')
  _provider = new OpenAIProvider() as AIProvider
  return _provider
}

// Allow overriding in tests
export function setAIProvider(provider: AIProvider) {
  _provider = provider
}
