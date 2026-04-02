import dotenv from 'dotenv'
dotenv.config()

import app from './app.js'

const port = parseInt(process.env.PORT || '3001', 10)
const host = process.env.HOST || '0.0.0.0'

async function start() {
  try {
    await app.listen({ port, host })
    console.log(`Server running at http://${host}:${port}`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
