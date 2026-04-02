import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { getPayload } from 'payload'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '.env') })
const { default: config } = await import(path.resolve(__dirname, 'src/payload.config.ts'))
const payload = await getPayload({ config })

const force = process.argv.includes('--force')

for (const collection of ['posts', 'projects', 'docs', 'notes']) {
  const result = await payload.find({ collection, limit: 100, pagination: false })
  for (const doc of result.docs) {
    const data = force ? { ...doc, _status: 'published' } : doc
    await payload.update({ collection, id: doc.id, data, draft: false, autosave: false })
    console.log(`published ${collection}:${doc.slug} status=${doc._status}`)
  }
}
