import OpenAI from 'openai'
import type {
  AIProvider,
  CampaignInput,
  CampaignOutput,
  ChatInput,
  ChatOutput,
  ImageGenerationInput,
  ImageGenerationOutput,
} from './provider'

export class OpenAIProvider implements AIProvider {
  readonly name = 'openai'
  private client: OpenAI
  private model: string
  private imageModel: string

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured')
    }
    this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    this.model = process.env.OPENAI_MODEL ?? 'gpt-4o'
    this.imageModel = process.env.OPENAI_IMAGE_MODEL ?? 'dall-e-3'
  }

  async generateCampaign(input: CampaignInput): Promise<CampaignOutput> {
    const previousTitles = input.previousCampaigns
      .slice(-10)
      .map(c => `- ${c.title} (${c.content_type})`)
      .join('\n')

    const productsText = input.products
      .filter(p => p.availability_status !== 'out_of_stock')
      .map(p => `- ${p.name}: ${p.currency === 'NGN' ? '₦' : p.currency}${p.price ?? 'Price TBD'} per ${p.unit} [${p.availability_status}]`)
      .join('\n')

    const systemPrompt = `You are an expert social media marketing AI for ${input.businessName}.
    
Business: ${input.businessDescription ?? 'A local business'}
Brand Voice: ${input.brandVoice ?? 'Friendly, professional, trustworthy'}
Target Audience: ${input.targetAudience ?? 'Local customers'}

CRITICAL RULES:
1. NEVER invent prices, discounts, stock levels, or promotions not listed below
2. NEVER fabricate customer reviews or testimonials
3. ONLY use information provided — if data is missing, say so in the output
4. Focus on real available products at their actual prices
5. Make content engaging, authentic, and appropriate for Nigerian audiences

Available products:
${productsText}

Recent campaigns (avoid repetition):
${previousTitles || 'None yet'}

Respond ONLY with valid JSON matching the schema exactly.`

    const userPrompt = `Generate a ${input.contentType ?? 'product_promotion'} marketing campaign for ${input.platform ?? 'all'} platform(s).
${input.specificProduct ? `Focus on: ${input.specificProduct}` : 'Choose the best product to promote.'}

Return JSON with this exact structure:
{
  "title": "Campaign title",
  "headline": "Attention-grabbing headline",
  "caption": "Full post caption (2-3 paragraphs, engaging, includes CTA)",
  "callToAction": "CTA text e.g. Order Now, DM us, Visit our website",
  "hashtags": ["hashtag1", "hashtag2", ...],
  "imagePrompt": "Detailed DALL-E image generation prompt for an advert creative",
  "contentType": "${input.contentType ?? 'product_promotion'}",
  "selectedProductId": "product id or null",
  "marketingAngle": "Brief description of the marketing angle used"
}`

    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.8,
      max_tokens: 1500,
    })

    const raw = completion.choices[0]?.message?.content ?? '{}'
    const parsed = JSON.parse(raw) as CampaignOutput

    // Validate selected product ID is real
    if (parsed.selectedProductId) {
      const validIds = input.products.map(p => p.id)
      if (!validIds.includes(parsed.selectedProductId)) {
        parsed.selectedProductId = null
      }
    }

    return parsed
  }

  async chat(input: ChatInput): Promise<ChatOutput> {
    const ctx = input.businessContext

    const productsText = ctx.products
      .map(p =>
        `- ${p.name}: ${p.currencySymbol}${p.price ?? 'Price not set'} per ${p.unit} | Status: ${p.availability_status}${p.description ? ` | ${p.description}` : ''}`
      )
      .join('\n')

    const faqText = ctx.faqs
      .filter(f => f)
      .map(f => `Q: ${f.question}\nA: ${f.answer}`)
      .join('\n\n')

    const docsText = ctx.knowledgeDocs
      .filter(d => d.content)
      .map(d => `[${d.title}]\n${d.content}`)
      .join('\n\n')

    const openingHoursText = Object.entries(ctx.openingHours)
      .map(([day, hours]) => `${day}: ${hours}`)
      .join(', ')

    const systemPrompt = `You are a helpful customer support AI assistant for ${ctx.businessName}.

BUSINESS INFORMATION (use ONLY this — never invent):
Name: ${ctx.businessName}
${ctx.businessDescription ? `About: ${ctx.businessDescription}` : ''}
Phone: ${ctx.phone ?? 'Not provided'}${ctx.phone2 ? ` / ${ctx.phone2}` : ''}
Website: ${ctx.website ?? 'Not provided'}
Location: ${[ctx.address, ctx.city, ctx.state].filter(Boolean).join(', ') || 'Not provided'}
Opening Hours: ${openingHoursText || 'Not specified'}

PRODUCTS (current prices and availability — NEVER invent or change these):
${productsText || 'No products listed'}

FREQUENTLY ASKED QUESTIONS:
${faqText || 'No FAQs available'}

ADDITIONAL KNOWLEDGE:
${docsText || 'None'}

CRITICAL RULES:
1. NEVER invent prices, quantities, or availability
2. If you don't know something, say so and offer to connect the customer with the team
3. Be warm, professional, and helpful
4. Respond in the same language the customer uses
5. If the customer wants to place an order, collect: product, quantity, delivery address
6. If you're unsure or it's a complaint, set requiresHuman to true
7. Detect purchase intent and score leads

Respond ONLY with valid JSON matching the schema exactly.`

    const userPrompt = `Customer message: "${input.userMessage}"

Analyze and respond. Return JSON:
{
  "message": "Your response to the customer",
  "confidence": 85,
  "requiresHuman": false,
  "intent": "product_query",
  "detectedProducts": [],
  "detectedQuantity": null,
  "isLead": false,
  "leadScore": 0,
  "leadType": "standard"
}

Intent options: product_query, price_query, availability_query, order_intent, delivery_query, location_query, hours_query, complaint, refund_request, human_request, general
Lead types: standard, high_value, bulk, recurring`

    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...input.messages.slice(-10).map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user', content: userPrompt },
    ]

    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages,
      response_format: { type: 'json_object' },
      temperature: 0.4,
      max_tokens: 800,
    })

    const raw = completion.choices[0]?.message?.content ?? '{}'
    const parsed = JSON.parse(raw) as ChatOutput

    // Enforce human escalation triggers
    const escalationTriggers = [
      'refund', 'complaint', 'angry', 'upset', 'terrible', 'scam',
      'speak to someone', 'speak to a person', 'human', 'manager',
      'payment problem', 'legal', 'sue'
    ]
    const lowercaseMsg = input.userMessage.toLowerCase()
    if (escalationTriggers.some(t => lowercaseMsg.includes(t))) {
      parsed.requiresHuman = true
      parsed.confidence = Math.min(parsed.confidence, 40)
    }

    // Enforce confidence threshold from env
    const threshold = parseInt(process.env.AI_CONFIDENCE_THRESHOLD ?? '60', 10)
    if (parsed.confidence < threshold) {
      parsed.requiresHuman = true
    }

    return parsed
  }

  async generateImage(input: ImageGenerationInput): Promise<ImageGenerationOutput> {
    const response = await this.client.images.generate({
      model: this.imageModel,
      prompt: input.prompt,
      n: 1,
      size: input.size ?? '1024x1024',
      quality: input.quality ?? 'standard',
    })

    const imageData = response.data[0]
    if (!imageData?.url) {
      throw new Error('No image URL returned from OpenAI')
    }

    return {
      url: imageData.url,
      revisedPrompt: imageData.revised_prompt ?? undefined,
    }
  }
}
