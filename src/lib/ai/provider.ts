/**
 * Abstract AI Provider Interface
 * Implement this to add a new AI provider (e.g. Google Gemini, Anthropic Claude)
 */

export interface CampaignInput {
  businessName: string
  businessDescription: string | null
  brandVoice: string | null
  targetAudience: string | null
  products: Array<{
    id: string
    name: string
    description: string | null
    price: number | null
    unit: string
    currency: string
    availability_status: string
  }>
  previousCampaigns: Array<{
    title: string
    content_type: string | null
    caption: string | null
    created_at: string
  }>
  contentType?: string
  platform?: string
  specificProduct?: string
}

export interface CampaignOutput {
  title: string
  headline: string
  caption: string
  callToAction: string
  hashtags: string[]
  imagePrompt: string
  contentType: string
  selectedProductId: string | null
  marketingAngle: string
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface ChatInput {
  messages: ChatMessage[]
  businessContext: BusinessContext
  userMessage: string
}

export interface BusinessContext {
  businessName: string
  businessDescription: string | null
  phone: string | null
  phone2: string | null
  website: string | null
  address: string | null
  city: string | null
  state: string | null
  openingHours: Record<string, string>
  products: Array<{
    name: string
    price: number | null
    unit: string
    currency?: string
    currencySymbol: string
    availability_status: string
    description: string | null
  }>
  faqs: Array<{
    question: string
    answer: string
    category: string
  }>
  knowledgeDocs: Array<{
    title: string
    content: string | null
  }>
}

export interface ChatOutput {
  message: string
  confidence: number            // 0-100
  requiresHuman: boolean
  intent: string                // 'product_query' | 'order_intent' | 'complaint' | 'general' | etc.
  detectedProducts?: string[]
  detectedQuantity?: number
  isLead?: boolean
  leadScore?: number
  leadType?: 'standard' | 'high_value' | 'bulk' | 'recurring'
}

export interface ImageGenerationInput {
  prompt: string
  size?: '1024x1024' | '1792x1024' | '1024x1792'
  quality?: 'standard' | 'hd'
}

export interface ImageGenerationOutput {
  url: string
  revisedPrompt?: string
}

/**
 * Base interface every AI provider must implement
 */
export interface AIProvider {
  readonly name: string

  generateCampaign(input: CampaignInput): Promise<CampaignOutput>
  chat(input: ChatInput): Promise<ChatOutput>
  generateImage(input: ImageGenerationInput): Promise<ImageGenerationOutput>
}
