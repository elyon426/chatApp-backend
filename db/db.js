// db/db.js
import 'dotenv/config'
import { neon } from '@neondatabase/serverless'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined in the environment variables')
}

export const db = neon(process.env.DATABASE_URL)