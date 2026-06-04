import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import {
  ensureDefaultClientCatalog,
  invalidateClientCatalogCache,
  listClientCatalog,
} from '../lib/clientCatalog.js'
import { requireAuth, requireActiveUser, requireRoles } from '../middleware/auth.js'
import { INTERNAL_ROLES } from '../lib/roles.js'

const router = Router()

router.use(requireAuth, requireActiveUser, requireRoles(...INTERNAL_ROLES))

router.get('/', async (_req, res) => {
  const clients = await listClientCatalog()
  res.json(clients)
})

router.post('/', requireRoles('ADMIN'), async (req, res) => {
  const body = z.object({ name: z.string().min(1).max(120) }).parse(req.body)

  const name = body.name.trim().replace(/\s+/g, ' ')
  const existing = await prisma.clientCatalog.findFirst({
    where: { name: { equals: name, mode: 'insensitive' } },
  })
  if (existing) {
    return res.status(409).json({ error: 'This client already exists', client: existing })
  }

  const row = await prisma.clientCatalog.create({ data: { name } })
  invalidateClientCatalogCache()
  res.status(201).json(row)
})

router.delete('/:id', requireRoles('ADMIN'), async (req, res) => {
  const row = await prisma.clientCatalog.findUnique({ where: { id: req.params.id } })
  if (!row) return res.status(404).json({ error: 'Client not found' })

  await prisma.clientCatalog.delete({ where: { id: row.id } })
  invalidateClientCatalogCache()
  res.status(204).send()
})

router.post('/seed-defaults', requireRoles('ADMIN'), async (_req, res) => {
  await ensureDefaultClientCatalog()
  const clients = await listClientCatalog()
  res.json({ count: clients.length, clients })
})

export default router
