import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const REQUIRED = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'KAVENEGAR_SENDER',
]

function loadEnvFile(path) {
  const values = {}
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
    if (match) values[match[1]] = match[2]
  }
  return values
}

function getNetlifyEnv(key) {
  try {
    return execSync(`npx --yes netlify-cli env:get ${key} --context production --force`, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
  } catch {
    return ''
  }
}

function setNetlifyEnv(key, value, { secret = false } = {}) {
  const args = [
    'npx', '--yes', 'netlify-cli', 'env:set', key, value,
    '--context', 'production',
    '--scope', 'builds', 'functions', 'runtime',
    '--force',
  ]
  if (secret) args.push('--secret')
  execSync(args.join(' '), { stdio: 'inherit' })
}

const local = loadEnvFile('.env.local')
const viteUrl = getNetlifyEnv('VITE_SUPABASE_URL') || local.VITE_SUPABASE_URL || ''
const supabaseUrl = local.SUPABASE_URL || viteUrl

const toSet = {
  SUPABASE_URL: supabaseUrl,
  SUPABASE_SERVICE_ROLE_KEY: local.SUPABASE_SERVICE_ROLE_KEY,
  KAVENEGAR_SENDER: local.KAVENEGAR_SENDER || process.env.KAVENEGAR_SENDER || '',
}

for (const key of REQUIRED) {
  const existing = getNetlifyEnv(key)
  const next = toSet[key]
  if (existing) {
    console.log(`${key}: already set on production`)
    continue
  }
  if (!next) {
    console.error(`${key}: missing locally; set it in .env.local or pass it in the shell before running this script`)
    process.exitCode = 1
    continue
  }
  console.log(`Setting ${key} on Netlify production...`)
  setNetlifyEnv(key, next, { secret: key.includes('KEY') || key.includes('SECRET') })
}
