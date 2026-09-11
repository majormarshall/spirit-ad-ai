/**
 * SPIRIT AD AI — Direct Postgres Migration
 * Connects via Supabase direct PostgreSQL connection
 * Run: node scripts/apply-migration.mjs <DB_PASSWORD>
 *
 * Get DB password from: Supabase Dashboard → Settings → Database → Database password
 * OR reset it there and paste it here.
 */

import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { createClient } from '@supabase/supabase-js'

const __dirname = dirname(fileURLToPath(import.meta.url))

const DB_PASSWORD = process.argv[2]
const SUPABASE_URL = 'https://eyibvmjuymuxmptwvrkt.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5aWJ2bWp1eW11eG1wdHd2cmt0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTExMzA2MCwiZXhwIjoyMTA0Njg5MDYwfQ.KdLoXjDZIfHE6UFhdfFm_4ZniOPAIOxC7IvFHAG1le8'

if (!DB_PASSWORD) {
  console.log('❌ Usage: node scripts/apply-migration.mjs <YOUR_DB_PASSWORD>')
  console.log('')
  console.log('   Get it from: Supabase Dashboard → Settings → Database → Database password')
  console.log('   (or reset it there)')
  process.exit(1)
}

// Dynamic import of pg (CommonJS module)
const { default: pg } = await import('pg')
const { Client } = pg

// Connection via Supabase direct (not pooler) — supports DDL
const client = new Client({
  host: 'db.eyibvmjuymuxmptwvrkt.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
})

const SQL = readFileSync(
  join(__dirname, '..', 'supabase', 'migrations', '001_initial_schema.sql'),
  'utf8'
)

async function main() {
  console.log('🌿 SPIRIT AD AI — Direct PostgreSQL Migration\n')

  try {
    console.log('🔌 Connecting to database...')
    await client.connect()
    console.log('✅ Connected!\n')

    console.log('🏗️  Applying full schema migration...')
    await client.query(SQL)
    console.log('✅ Schema applied successfully!\n')

    // Now test by counting tables
    const { rows } = await client.query(`
      SELECT count(*) as table_count 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `)
    console.log(`📊 Tables created: ${rows[0].table_count}`)

    // Get anon key via supabase-js (just to test connection)
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
    const { data: users, error } = await supabase.auth.admin.listUsers()
    if (!error) {
      console.log(`👤 Existing auth users: ${users.users.length}`)
    }

    console.log('\n✅ Database ready!\n')
    console.log('📋 Next steps:')
    console.log('   1. Get your anon key from: Supabase Dashboard → Settings → API')
    console.log('   2. Add it to .env.local as NEXT_PUBLIC_SUPABASE_ANON_KEY=...')
    console.log('   3. Create a user in Supabase Auth → Users → Add User')
    console.log('   4. Run seed: SEED_USER_ID=<uuid> npx tsx scripts/seed.ts')
    console.log('   5. Run: npm run dev')

  } catch (err) {
    console.error('❌ Error:', err.message)
    if (err.message.includes('password authentication')) {
      console.error('\n💡 Wrong password. Reset it at: Supabase Dashboard → Settings → Database → Reset database password')
    }
  } finally {
    await client.end()
  }
}

main()
