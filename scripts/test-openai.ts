import OpenAI from 'openai'
import path from 'path'
import dotenv from 'dotenv'
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

async function test() {
  try {
    console.log('Testing with key:', process.env.OPENAI_API_KEY?.slice(0, 10))
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: 'test',
    })
    console.log('SUCCESS: API is working.')
  } catch (err: any) {
    console.error('❌ API ERROR:', err.message)
    if (err.status) console.error('Status:', err.status)
  }
}

test()
