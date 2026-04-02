import Fastify from 'fastify'
import cors from '@fastify/cors'
import { parseRoutes } from './routes/parse.js'
import { transcribeRoutes } from './routes/transcribe.js'
import { generateArticleRoutes } from './routes/generate-article.js'
import { extractInfoRoutes } from './routes/extract-info.js'
import { downloadRoutes } from './routes/download.js'

const app = Fastify({
  logger: true,
})

await app.register(cors, {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
})

// Health check
app.get('/api/health', async () => {
  return {
    status: 'ok',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  }
})

// Register routes
await app.register(parseRoutes)
await app.register(transcribeRoutes)
await app.register(generateArticleRoutes)
await app.register(extractInfoRoutes)
await app.register(downloadRoutes)

export default app
