/**
 * SPIRIT AD AI — Database Migration Runner
 * Applies the full schema to Supabase using the Management API
 * Run: node scripts/run-migration.mjs
 */

import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

const SUPABASE_URL = 'https://eyibvmjuymuxmptwvrkt.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5aWJ2bWp1eW11eG1wdHd2cmt0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTExMzA2MCwiZXhwIjoyMTA0Njg5MDYwfQ.KdLoXjDZIfHE6UFhdfFm_4ZniOPAIOxC7IvFHAG1le8'
const PROJECT_REF = 'eyibvmjuymuxmptwvrkt'

const SQL = readFileSync(
  join(__dirname, '..', 'supabase', 'migrations', '001_initial_schema.sql'),
  'utf8'
)

// Split SQL into individual statements
function splitStatements(sql) {
  // Split on semicolons not inside $$ blocks
  const statements = []
  let current = ''
  let inDollarQuote = false
  let dollarTag = ''

  const lines = sql.split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    // Skip pure comment lines
    if (trimmed.startsWith('--') && !inDollarQuote) {
      continue
    }

    // Detect $$ block start/end
    const dollarMatches = line.match(/\$\$|\$[a-z]+\$/gi) || []
    for (const match of dollarMatches) {
      if (!inDollarQuote) {
        inDollarQuote = true
        dollarTag = match
      } else if (match === dollarTag) {
        inDollarQuote = false
        dollarTag = ''
      }
    }

    current += line + '\n'

    if (!inDollarQuote && current.trim().endsWith(';')) {
      const stmt = current.trim()
      if (stmt.length > 1 && stmt !== ';') {
        statements.push(stmt)
      }
      current = ''
    }
  }

  if (current.trim()) statements.push(current.trim())
  return statements
}

async function runSQL(query) {
  // Try Supabase Management API first
  const mgmtRes = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    }
  )

  if (mgmtRes.ok) {
    return { ok: true, source: 'management-api' }
  }

  // Try postgres-meta endpoint (Supabase internal)
  const metaRes = await fetch(`${SUPABASE_URL}/pg/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  })

  if (metaRes.ok) {
    return { ok: true, source: 'postgres-meta' }
  }

  const errText = await mgmtRes.text().catch(() => 'unknown error')
  return { ok: false, status: mgmtRes.status, error: errText }
}

async function getAnonKey() {
  // Try to get the anon key via management API
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/api-keys`,
    {
      headers: { 'Authorization': `Bearer ${SERVICE_ROLE_KEY}` },
    }
  )

  if (res.ok) {
    const keys = await res.json()
    const anon = keys.find(k => k.name === 'anon')
    return anon?.api_key || null
  }
  return null
}

async function main() {
  console.log('🌿 SPIRIT AD AI — Database Migration Runner\n')
  console.log(`📡 Project: ${PROJECT_REF}`)
  console.log(`🔗 URL: ${SUPABASE_URL}\n`)

  // Try to get anon key
  console.log('🔑 Fetching anon key...')
  const anonKey = await getAnonKey()
  if (anonKey) {
    console.log(`✅ Anon key found: ${anonKey.slice(0, 20)}...`)
    console.log(`\n📝 Add this to your .env.local:`)
    console.log(`NEXT_PUBLIC_SUPABASE_ANON_KEY=${anonKey}\n`)
  } else {
    console.log('⚠️  Could not auto-fetch anon key. Get it from:')
    console.log('   Supabase Dashboard → Settings → API → anon public key\n')
  }

  // Test connection first
  console.log('🔌 Testing connection...')
  const testResult = await runSQL('SELECT current_database(), current_user, version()')
  
  if (!testResult.ok) {
    console.log(`❌ Cannot execute SQL directly via API (status: ${testResult.status})`)
    console.log(`   Error: ${testResult.error}`)
    console.log('\n📋 MANUAL MIGRATION REQUIRED:')
    console.log('   1. Go to: https://supabase.com/dashboard/project/eyibvmjuymuxmptwvrkt/sql/new')
    console.log('   2. Open: supabase/migrations/001_initial_schema.sql')
    console.log('   3. Paste the entire contents and click Run')
    console.log('   4. Then run: node scripts/run-seed.mjs\n')
    return
  }

  console.log(`✅ Connected! (via ${testResult.source})\n`)

  // Apply migration
  console.log('🏗️  Applying database schema...\n')
  const statements = splitStatements(SQL)
  console.log(`   Found ${statements.length} statements to execute\n`)

  let success = 0
  let failed = 0

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i]
    const preview = stmt.replace(/\s+/g, ' ').slice(0, 60)
    process.stdout.write(`   [${i + 1}/${statements.length}] ${preview}... `)
    
    const result = await runSQL(stmt)
    if (result.ok) {
      console.log('✅')
      success++
    } else {
      console.log(`❌ ${result.error?.slice(0, 80) || 'failed'}`)
      failed++
    }
  }

  console.log(`\n📊 Migration complete: ${success} succeeded, ${failed} failed`)
  
  if (failed === 0) {
    console.log('✅ Schema applied successfully!\n')
    console.log('🌱 Next step: Run the seed script:')
    console.log('   SEED_USER_ID=your-user-uuid npx tsx scripts/seed.ts')
  }
}

main().catch(console.error)
