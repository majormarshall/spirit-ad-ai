/**
 * SPIRIT AD AI — Auto Setup Script
 * Uses only the service_role key to:
 * 1. Create an admin user in Supabase Auth
 * 2. Seed all Pinnacles Resource Centre Farm data
 *
 * Run AFTER applying the database migration:
 *   node scripts/auto-setup.mjs <ADMIN_EMAIL> <ADMIN_PASSWORD>
 *
 * Example:
 *   node scripts/auto-setup.mjs admin@pinnaclescentre.ng MyPassword123!
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://eyibvmjuymuxmptwvrkt.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5aWJ2bWp1eW11eG1wdHd2cmt0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTExMzA2MCwiZXhwIjoyMTA0Njg5MDYwfQ.KdLoXjDZIfHE6UFhdfFm_4ZniOPAIOxC7IvFHAG1le8'

const ADMIN_EMAIL = process.argv[2] || 'admin@pinnaclescentre.ng'
const ADMIN_PASSWORD = process.argv[3] || 'PinnaclesAdmin2024!'

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function main() {
  console.log('🌿 SPIRIT AD AI — Auto Setup\n')
  console.log(`📧 Admin email: ${ADMIN_EMAIL}`)
  console.log(`📡 Project: eyibvmjuymuxmptwvrkt\n`)

  // 1. Create admin user
  console.log('👤 Creating admin user...')
  let userId

  const { data: existingUsers } = await supabase.auth.admin.listUsers()
  const existing = existingUsers?.users?.find(u => u.email === ADMIN_EMAIL)

  if (existing) {
    userId = existing.id
    console.log(`✅ User already exists: ${userId}`)
  } else {
    const { data: newUser, error: userErr } = await supabase.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
    })
    if (userErr) {
      console.error('❌ Failed to create user:', userErr.message)
      if (userErr.message.includes('Database error')) {
        console.error('\n⚠️  The database schema has not been applied yet!')
        console.error('   Please apply the migration first:')
        console.error('   node scripts/apply-migration.mjs <DB_PASSWORD>')
        console.error('   OR apply supabase/migrations/001_initial_schema.sql in the Supabase SQL Editor\n')
      }
      process.exit(1)
    }
    userId = newUser.user.id
    console.log(`✅ Created user: ${userId}`)
  }

  // 2. Create business
  console.log('\n🏢 Creating Pinnacles Resource Centre Farm...')
  const { data: business, error: bizErr } = await supabase
    .from('businesses')
    .upsert({
      owner_id: userId,
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
        Monday: '7:00 AM – 6:00 PM', Tuesday: '7:00 AM – 6:00 PM',
        Wednesday: '7:00 AM – 6:00 PM', Thursday: '7:00 AM – 6:00 PM',
        Friday: '7:00 AM – 6:00 PM', Saturday: '7:00 AM – 4:00 PM', Sunday: 'Closed',
      },
    }, { onConflict: 'owner_id' })
    .select('id').single()

  if (bizErr) {
    console.error('❌ Business error:', bizErr.message)
    process.exit(1)
  }
  const businessId = business.id
  console.log(`✅ Business ID: ${businessId}`)

  // 3. Products
  const products = [
    { name: 'Maize', category: 'Grains', unit: 'bag', price: 15000, description: 'Fresh dried maize / corn, available in 50kg bags' },
    { name: 'Carrots', category: 'Vegetables', unit: 'kg', price: 800, description: 'Fresh farm carrots, sweet and crunchy' },
    { name: 'Eggs', category: 'Poultry', unit: 'crate', price: 4500, description: 'Fresh farm eggs — one crate = 30 eggs' },
    { name: 'Green Peas', category: 'Vegetables', unit: 'kg', price: 1200, description: 'Fresh green peas, harvested daily' },
    { name: 'Tomatoes', category: 'Vegetables', unit: 'basket', price: 8000, description: 'Fresh ripe tomatoes, perfect for cooking and sauce' },
    { name: 'Bell Pepper', category: 'Vegetables', unit: 'kg', price: 1500, description: 'Fresh colourful bell peppers — red, yellow and green' },
    { name: 'Garden Cucumber', category: 'Vegetables', unit: 'kg', price: 700, description: 'Fresh farm cucumbers, great for salads and juices' },
  ]

  console.log('\n🛒 Adding products...')
  for (const prod of products) {
    const { data: p, error } = await supabase.from('products').upsert(
      { business_id: businessId, currency: 'NGN', is_active: true, ...prod },
      { onConflict: 'business_id,name' }
    ).select('id').single()

    if (error) { console.warn(`  ⚠️  ${prod.name}: ${error.message}`); continue }
    await supabase.from('product_inventory').upsert(
      { product_id: p.id, quantity: 100, availability_status: 'available' },
      { onConflict: 'product_id' }
    )
    console.log(`  ✅ ${prod.name} — ₦${prod.price.toLocaleString()}/${prod.unit}`)
  }

  // 4. FAQs
  const faqs = [
    { question: 'What products do you sell?', answer: 'We sell fresh farm produce including Maize, Carrots, Eggs, Green Peas, Tomatoes, Bell Peppers, and Garden Cucumbers. All produce is farm-fresh from Offa, Kwara State.', category: 'products' },
    { question: 'How much is a crate of eggs?', answer: 'A crate of eggs (30 eggs) is currently ₦4,500. Contact us for bulk pricing.', category: 'pricing' },
    { question: 'Do you deliver?', answer: 'Yes! We deliver within Offa and surrounding areas. Call us on 09037505632 or 07078210834.', category: 'delivery' },
    { question: 'Where are you located?', answer: 'Pinnacles Resource Centre, Offa, Kwara State, Nigeria. Website: farm.pinnaclescentre.ng', category: 'location' },
    { question: 'What are your opening hours?', answer: 'Monday–Friday: 7:00 AM – 6:00 PM, Saturday: 7:00 AM – 4:00 PM, Sunday: Closed.', category: 'hours' },
    { question: 'How can I place an order?', answer: 'Call 09037505632 or 07078210834, send a WhatsApp message, or visit our farm in Offa.', category: 'orders' },
    { question: 'Do you sell in bulk?', answer: 'Yes! Call 09037505632 or 07078210834 for bulk pricing and availability.', category: 'bulk' },
    { question: 'Are your products fresh?', answer: 'Absolutely! All produce is grown on our farm and harvested fresh daily.', category: 'products' },
    { question: 'What is your website?', answer: 'Our website is farm.pinnaclescentre.ng', category: 'contact' },
    { question: 'How can I contact you?', answer: 'Phone: 09037505632 or 07078210834\nWebsite: farm.pinnaclescentre.ng\nLocation: Pinnacles Resource Centre, Offa, Kwara State', category: 'contact' },
  ]

  console.log('\n💬 Adding FAQs...')
  for (const faq of faqs) {
    const { error } = await supabase.from('faqs').upsert(
      { business_id: businessId, is_active: true, ...faq },
      { onConflict: 'business_id,question' }
    )
    if (error) console.warn(`  ⚠️  FAQ: ${error.message}`)
    else console.log(`  ✅ ${faq.question.slice(0, 50)}`)
  }

  // 5. Knowledge document
  console.log('\n📄 Adding knowledge document...')
  await supabase.from('knowledge_documents').upsert({
    business_id: businessId,
    title: 'About Pinnacles Resource Centre Farm',
    document_type: 'text',
    content: `Pinnacles Resource Centre Farm is located in Offa, Kwara State, Nigeria.\n\nProducts: Maize (₦15,000/bag), Carrots (₦800/kg), Eggs (₦4,500/crate), Green Peas (₦1,200/kg), Tomatoes (₦8,000/basket), Bell Peppers (₦1,500/kg), Garden Cucumbers (₦700/kg)\n\nContact: 09037505632 / 07078210834\nWebsite: farm.pinnaclescentre.ng\nAddress: Pinnacles Resource Centre, Offa, Kwara State, Nigeria\n\nOpening hours: Mon–Fri 7AM–6PM, Sat 7AM–4PM, Sun Closed`,
  }, { onConflict: 'business_id,title' })
  console.log('  ✅ Knowledge document added')

  // 6. AI permissions
  console.log('\n🔐 Setting AI permissions...')
  await supabase.from('ai_permissions').upsert({
    business_id: businessId,
    autopilot_enabled: false,
    approval_mode: 'approval',
    confidence_threshold: 60,
    permissions: {
      marketing: { generate_adverts: true, generate_images: true, schedule_posts: true, publish_automatically: false },
      facebook: { publish_posts: true, delete_posts: false },
      instagram: { publish_posts: true, delete_posts: false },
      whatsapp: { read_messages: true, answer_faqs: true, detect_leads: true, send_bulk: false },
      orders: { create_drafts: true, confirm_orders: false },
      business: { modify_products: false, modify_prices: false },
    },
  }, { onConflict: 'business_id' })
  console.log('  ✅ AI permissions configured (safe defaults)')

  console.log('\n' + '='.repeat(60))
  console.log('🎉 SETUP COMPLETE!')
  console.log('='.repeat(60))
  console.log(`\n📧 Admin login:`)
  console.log(`   Email:    ${ADMIN_EMAIL}`)
  console.log(`   Password: ${ADMIN_PASSWORD}`)
  console.log(`\n🔑 Still needed:`)
  console.log(`   • NEXT_PUBLIC_SUPABASE_ANON_KEY`)
  console.log(`     Get from: Supabase Dashboard → Settings → API → anon public`)
  console.log(`   • Add to .env.local then run: npm run dev`)
  console.log(`\n🌿 Dashboard: http://localhost:3000/dashboard`)
}

main().catch(console.error)
