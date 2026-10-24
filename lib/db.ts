import { MongoClient, type Db } from 'mongodb'
import type { Click, Link, LoginAttempt } from './types'

// One client per server instance, reused across requests (and across hot reloads in dev).
const g = globalThis as unknown as { _mongo?: Promise<MongoClient>; _indexes?: Promise<unknown> }

function client() {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI is not set. Add your MongoDB Atlas connection string to .env')
  g._mongo ??= new MongoClient(uri, { maxPoolSize: 10, serverSelectionTimeoutMS: 5000, appName: 'redirector' }).connect()
  return g._mongo
}

export async function db(): Promise<Db> {
  const d = (await client()).db(process.env.MONGODB_DB || 'redirector')
  g._indexes ??= Promise.all([
    d.collection('links').createIndex({ slug: 1 }, { unique: true }),
    d.collection('clicks').createIndex({ ts: -1 }),
    d.collection('clicks').createIndex({ slug: 1, ts: -1 }),
    d.collection('login_attempts').createIndex({ at: 1 }, { expireAfterSeconds: 15 * 60 }),
  ]).catch((e) => {
    g._indexes = undefined
    console.error('[redirector] index creation failed', e)
  })
  return d
}

export async function cols() {
  const d = await db()
  return {
    links: d.collection<Link>('links'),
    clicks: d.collection<Click>('clicks'),
    attempts: d.collection<LoginAttempt>('login_attempts'),
  }
}
