import { app } from './app.js'
import { env } from './config/env.js'
import { prisma } from './lib/prisma.js'

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection (API still running):', reason)
})

const server = app.listen(env.port, () => {
  console.log(`API running at http://localhost:${env.port}`)
  prisma
    .$queryRaw`SELECT 1`
    .then(() => console.log('Database connected'))
    .catch(() =>
      console.warn(
        'Database not reachable — API will return 503 until Neon is awake. Open console.neon.tech to resume your project.'
      )
    )
})

server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${env.port} is already in use. Stop the other process or change PORT in server/.env`)
    process.exit(1)
  }
  throw err
})
