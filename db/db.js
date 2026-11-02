import {neon} from '@neondatabase/serverless'
import 'dotenv/config'
if(!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not defined in the environment variables')                    
export default  db = neon(process.env.DATABASE_URL)