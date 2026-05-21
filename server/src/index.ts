import { app } from './app.js'
import { env } from './config/env.js'

const server = app.listen(env.port, () => {
  console.log(`API running at http://localhost:${env.port}`)
})

server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${env.port} is already in use. Stop the other process or change PORT in server/.env`)
    process.exit(1)
  }
  throw err
})
