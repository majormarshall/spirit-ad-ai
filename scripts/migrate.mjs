/**
 * Applies the migration via direct Supabase PostgreSQL connection.
 * Tries multiple connection strategies.
 */
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import pg from 'pg'

const { Client } = pg
const __dirname = dirname(fileURLToPath(import.meta.url))

const SQL = readFileSync(
  join(__dirname, '..', 'supabase', 'migrations', '001_initial_schema.sql'),
  'utf8'
)

const PROJECT_REF = 'eyibvmjuymuxmptwvrkt'
const DB_PASS = process.argv[2]

if (!DB_PASS) {
  console.error('Usage: node scripts/migrate.mjs <DB_PASSWORD>')
  console.error('')
  console.error('Get DB password from:')
  console.error('  Supabase Dashboard → Settings → Database → Database password')
  console.error('  (Reset it there if you forgot it)')
  process.exit(1)
}

// Try connection strategies in order
const strategies = [
  {
    name: 'Direct (IPv4)',
    config: {
      host: `db.${PROJECT_REF}.supabase.co`,
      port: 5432,
      database: 'postgres',
      user: 'postgres',
      password: DB_PASS,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
    }
  },
  {
    name: 'Pooler Session Mode',
    config: {
      connectionString: `postgresql://postgres.${PROJECT_REF}:${encodeURIComponent(DB_PASS)}@aws-0-eu-west-2.pooler.supabase.com:5432/postgres?sslmode=require`,
      connectionTimeoutMillis: 10000,
    }
  },
  {
    name: 'Pooler US East',
    config: {
      connectionString: `postgresql://postgres.${PROJECT_REF}:${encodeURIComponent(DB_PASS)}@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require`,
      connectionTimeoutMillis: 10000,
    }
  },
]

async function tryConnect(config) {
  const client = new Client(config)
  await client.connect()
  return client
}

async function main() {
  console.log('🌿 SPIRIT AD AI — Database Migration\n')
  
  let client = null
  for (const strategy of strategies) {
    try {
      process.stdout.write(`🔌 Trying ${strategy.name}... `)
      client = await tryConnect(strategy.config)
      console.log('✅ Connected!')
      break
    } catch (err) {
      console.log(`❌ ${err.message.slice(0, 60)}`)
      client = null
    }
  }

  if (!client) {
    console.error('\n❌ All connection strategies failed.')
    console.error('\n📋 Please apply the migration manually:')
    console.error('   1. Go to: https://supabase.com/dashboard/project/eyibvmjuymuxmptwvrkt/sql/new')
    console.error('   2. Paste the contents of: supabase/migrations/001_initial_schema.sql')
    console.error('   3. Click Run')
    console.error('   4. Then run: node scripts/auto-setup.mjs')
    process.exit(1)
  }

  try {
    console.log('\n🏗️  Applying schema migration...')
    await client.query(SQL)
    console.log('✅ Schema applied!\n')

    const { rows } = await client.query(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `)
    console.log(`📊 Tables created (${rows.length}):`)
    rows.forEach(r => console.log(`   ✅ ${r.tablename}`))

    console.log('\n✅ Migration complete!')
    console.log('\n🌱 Now run the seed:')
    console.log('   node scripts/auto-setup.mjs admin@pinnaclescentre.ng PinnaclesAdmin2024!')

  } catch (err) {
    if (err.message.includes('already exists')) {
      console.log('✅ Schema already applied (tables exist)')
    } else {
      console.error('❌ Migration error:', err.message)
    }
  } finally {
    await client.end()
  }
}

main().catch(console.error)
