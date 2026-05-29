import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import {
  ensureDefaultDepartmentCatalog,
  invalidateDepartmentCatalogCache,
  listDepartmentCatalog,
} from '../lib/departmentCatalog.js'
import { requireAuth, requireActiveUser, requireRoles } from '../middleware/auth.js'
import { INTERNAL_ROLES } from '../lib/roles.js'

const router = Router()

router.use(requireAuth, requireActiveUser, requireRoles(...INTERNAL_ROLES))

router.get('/', async (_req, res) => {
  const departments = await listDepartmentCatalog()
  res.json(departments)
})

router.post('/', requireRoles('ADMIN'), async (req, res) => {
  const body = z.object({ name: z.string().min(1).max(120) }).parse(req.body)

  const name = body.name.trim().replace(/\s+/g, ' ')
  const existing = await prisma.departmentCatalog.findFirst({
    where: { name: { equals: name, mode: 'insensitive' } },
  })
  if (existing) {
    return res.status(409).json({ error: 'This department already exists', department: existing })
  }

  const row = await prisma.departmentCatalog.create({ data: { name } })
  invalidateDepartmentCatalogCache()
  res.status(201).json(row)
})

router.delete('/:id', requireRoles('ADMIN'), async (req, res) => {
  const row = await prisma.departmentCatalog.findUnique({ where: { id: req.params.id } })
  if (!row) return res.status(404).json({ error: 'Department not found' })

  await prisma.departmentCatalog.delete({ where: { id: row.id } })
  invalidateDepartmentCatalogCache()
  res.status(204).send()
})

router.post('/seed-defaults', requireRoles('ADMIN'), async (_req, res) => {
  await ensureDefaultDepartmentCatalog()
  const departments = await listDepartmentCatalog()
  res.json({ count: departments.length, departments })
})

export default router
