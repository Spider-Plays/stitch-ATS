import { app } from './app.js'
import { env } from './config/env.js'
import { assertPrismaClientModels, prisma } from './lib/prisma.js'
import { ensureCandidateMilestoneColumns } from './lib/ensureCandidateMilestoneColumns.js'
import { ensureReferralColumns } from './lib/ensureReferralColumns.js'

try {
  assertPrismaClientModels()
} catch (e) {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
}

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection (API still running):', reason)
})

const server = app.listen(env.port, () => {
  console.log(`API running at http://localhost:${env.port}`)
  prisma
    .$queryRaw`SELECT 1`
    .then(async () => {
      console.log('Database connected')
      try {
        await ensureCandidateMilestoneColumns()
        await ensureReferralColumns()
      } catch (e) {
        console.warn(
          'Could not verify optional DB columns:',
          e instanceof Error ? e.message : e
        )
      }
    })
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
