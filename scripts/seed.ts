/**
 * Seed Script — Pinnacles Resource Centre Farm
 * Run: npx tsx scripts/seed.ts
 *
 * Prerequisites:
 *  1. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 *  2. Create an admin user via Supabase Dashboard (Auth > Users > Add User)
 *  3. Pass that user's ID as SEED_USER_ID environment variable
 *     Example: SEED_USER_ID=your-user-uuid npx tsx scripts/seed.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const SEED_USER_ID = process.env.SEED_USER_ID

async function main() {
  if (!SEED_USER_ID) {
    console.error('❌  Please set SEED_USER_ID environment variable to your admin user UUID')
    console.error('   Example: SEED_USER_ID=your-uuid npx tsx scripts/seed.ts')
    process.exit(1)
  }

  console.log('🌱 Seeding Pinnacles Resource Centre Farm...\n')

  // 1. Create business
  const { data: business, error: bizErr } = await supabase
    .from('businesses')
    .upsert({
      owner_id: SEED_USER_ID,
      name: 'Pinnacles Resource Centre Farm',
      description: 'Fresh farm produce direct from Offa, Kwara State, Nigeria. We grow and supply high-quality vegetables, fruits and farm products.',
      website: 'https://farm.pinnaclescentre.ng',
      phone: '09037505632',
      phone2: '07078210834',
      email: 'info@pinnaclescentre.ng',
      address: 'Pinnacles Resource Centre',
      city: 'Offa',
      state: 'Kwara State',
      country: 'Nigeria',
      currency: 'NGN',
      currency_symbol: '₦',
      brand_voice: 'Warm, community-focused, trustworthy, and proud of fresh local produce',
      target_audience: 'Households, restaurants, food vendors, and supermarkets in Offa and surrounding areas in Kwara State',
      opening_hours: {
        Monday:    '7:00 AM – 6:00 PM',
        Tuesday:   '7:00 AM – 6:00 PM',
        Wednesday: '7:00 AM – 6:00 PM',
        Thursday:  '7:00 AM – 6:00 PM',
        Friday:    '7:00 AM – 6:00 PM',
        Saturday:  '7:00 AM – 4:00 PM',
        Sunday:    'Closed',
      },
    }, { onConflict: 'owner_id' })
    .select('id')
    .single()

  if (bizErr) { console.error('❌ Business error:', bizErr.message); process.exit(1) }
  const businessId = business!.id
  console.log('✅ Business created:', businessId)

  // 2. Products
  const productDefs = [
    { name: 'Maize',           category: 'Grains',      unit: 'bag',    price: 15000, description: 'Fresh dried maize / corn, available in 50kg bags' },
    { name: 'Carrots',         category: 'Vegetables',  unit: 'kg',     price: 800,   description: 'Fresh farm carrots, sweet and crunchy' },
    { name: 'Eggs',            category: 'Poultry',     unit: 'crate',  price: 4500,  description: 'Fresh farm eggs, one crate = 30 eggs' },
    { name: 'Green Peas',      category: 'Vegetables',  unit: 'kg',     price: 1200,  description: 'Fresh green peas, harvested daily' },
    { name: 'Tomatoes',        category: 'Vegetables',  unit: 'basket', price: 8000,  description: 'Fresh ripe tomatoes, perfect for cooking and sauce' },
    { name: 'Bell Pepper',     category: 'Vegetables',  unit: 'kg',     price: 1500,  description: 'Fresh colourful bell peppers — red, yellow and green' },
    { name: 'Garden Cucumber', category: 'Vegetables',  unit: 'kg',     price: 700,   description: 'Fresh farm cucumbers, great for salads and juices' },
  ]

  for (const prod of productDefs) {
    const { data: product, error: prodErr } = await supabase
      .from('products')
      .upsert({
        business_id: businessId,
        name: prod.name,
        description: prod.description,
        category: prod.category,
        price: prod.price,
        currency: 'NGN',
        unit: prod.unit,
        is_active: true,
      }, { onConflict: 'business_id,name' })
      .select('id')
      .single()

    if (prodErr) { console.warn(`  ⚠️  Product ${prod.name}:`, prodErr.message); continue }

    await supabase.from('product_inventory').upsert({
      product_id: product!.id,
      quantity: 100,
      availability_status: 'available',
    }, { onConflict: 'product_id' })

    console.log(`  ✅ Product: ${prod.name} — ₦${prod.price.toLocaleString()} / ${prod.unit}`)
  }

  // 3. FAQs
  const faqs = [
    {
      question: 'What products do you sell?',
      answer: 'We sell fresh farm produce including Maize, Carrots, Eggs, Green Peas, Tomatoes, Bell Peppers, and Garden Cucumbers. All produce is farm-fresh from Offa, Kwara State.',
      category: 'products',
    },
    {
      question: 'How much is a crate of eggs?',
      answer: 'A crate of eggs (30 eggs) is currently ₦4,500. Prices may vary — please contact us for bulk orders.',
      category: 'pricing',
    },
    {
      question: 'Do you deliver?',
      answer: 'Yes! We deliver within Offa and surrounding areas in Kwara State. Please call us on 09037505632 or 07078210834 to arrange delivery.',
      category: 'delivery',
    },
    {
      question: 'Where are you located?',
      answer: 'We are located at Pinnacles Resource Centre, Offa, Kwara State, Nigeria. Visit our website at farm.pinnaclescentre.ng for more details.',
      category: 'location',
    },
    {
      question: 'What are your opening hours?',
      answer: 'We are open Monday to Friday: 7:00 AM – 6:00 PM, Saturday: 7:00 AM – 4:00 PM, and closed on Sundays.',
      category: 'hours',
    },
    {
      question: 'How can I place an order?',
      answer: 'You can place an order by:\n1. Calling us on 09037505632 or 07078210834\n2. Sending us a WhatsApp message\n3. Visiting our farm directly in Offa, Kwara State\n4. Via our website: farm.pinnaclescentre.ng',
      category: 'orders',
    },
    {
      question: 'Do you sell in bulk?',
      answer: 'Yes, we welcome bulk orders! Please contact us on 09037505632 or 07078210834 to discuss bulk pricing and availability.',
      category: 'bulk',
    },
    {
      question: 'Are your products fresh?',
      answer: 'Absolutely! All our produce is grown on our farm and harvested fresh. We pride ourselves on quality and freshness.',
      category: 'products',
    },
    {
      question: 'What is your website?',
      answer: 'Our website is farm.pinnaclescentre.ng — visit us for updates and information.',
      category: 'contact',
    },
    {
      question: 'How can I contact you?',
      answer: 'Phone: 09037505632 or 07078210834\nWebsite: farm.pinnaclescentre.ng\nLocation: Pinnacles Resource Centre, Offa, Kwara State, Nigeria',
      category: 'contact',
    },
  ]

  for (const faq of faqs) {
    const { error } = await supabase.from('faqs').upsert({
      business_id: businessId,
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      is_active: true,
    }, { onConflict: 'business_id,question' })
    if (error) console.warn(`  ⚠️  FAQ: ${faq.question.slice(0, 40)}:`, error.message)
    else console.log(`  ✅ FAQ: ${faq.question.slice(0, 50)}`)
  }

  // 4. AI Permissions (default safe settings)
  await supabase.from('ai_permissions').upsert({
    business_id: businessId,
    autopilot_enabled: false,
    approval_mode: 'approval',
    confidence_threshold: 60,
    permissions: {
      marketing: {
        generate_adverts: true,
        generate_images: true,
        schedule_posts: true,
        publish_automatically: false,
      },
      facebook: { publish_posts: true, delete_posts: false },
      instagram: { publish_posts: true, delete_posts: false },
      whatsapp: {
        read_messages: true,
        answer_faqs: true,
        detect_leads: true,
        send_bulk: false,
      },
      orders: { create_drafts: true, confirm_orders: false },
      business: { modify_products: false, modify_prices: false },
    },
  }, { onConflict: 'business_id' })
  console.log('\n✅ AI permissions set (default safe mode)')

  // 5. Sample knowledge document
  await supabase.from('knowledge_documents').upsert({
    business_id: businessId,
    title: 'About Pinnacles Resource Centre Farm',
    content: `Pinnacles Resource Centre Farm is a modern agricultural enterprise located in Offa, Kwara State, Nigeria.

We specialise in growing and supplying fresh, high-quality farm produce to households, restaurants, food vendors, and supermarkets across Kwara State.

Our products include:
- Maize (dried grain, 50kg bags)
- Carrots (fresh, per kg)
- Eggs (crates of 30)
- Green Peas (fresh, per kg)
- Tomatoes (fresh, per basket)
- Bell Peppers (fresh, per kg)
- Garden Cucumbers (fresh, per kg)

Contact us:
Phone: 09037505632 / 07078210834
Website: farm.pinnaclescentre.ng
Address: Pinnacles Resource Centre, Offa, Kwara State, Nigeria

We offer delivery within Offa and surrounding areas. Bulk orders welcome — call for bulk pricing.`,
    document_type: 'text',
  }, { onConflict: 'business_id,title' })
  console.log('✅ Knowledge document created')

  console.log('\n🎉 Seed complete! Log in and visit /dashboard to get started.\n')
}

main().catch(e => { console.error(e); process.exit(1) })
