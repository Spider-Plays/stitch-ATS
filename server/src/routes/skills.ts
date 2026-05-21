import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import {
  ensureDefaultSkillCatalog,
  invalidateSkillCatalogCache,
  listSkillCatalog,
} from '../lib/skillCatalog.js'
import { requireAuth, requireActiveUser, requireRoles } from '../middleware/auth.js'
import { INTERNAL_ROLES } from '../lib/roles.js'

const router = Router()

router.use(requireAuth, requireActiveUser, requireRoles(...INTERNAL_ROLES))

router.get('/', async (_req, res) => {
  const skills = await listSkillCatalog()
  res.json(skills)
})

router.post('/', requireRoles('ADMIN'), async (req, res) => {
  const body = z
    .object({
      name: z.string().min(2).max(80),
      category: z.string().max(40).optional(),
    })
    .parse(req.body)

  const name = body.name.trim().replace(/\s+/g, ' ')
  const existing = await prisma.skillCatalog.findFirst({
    where: { name: { equals: name, mode: 'insensitive' } },
  })
  if (existing) {
    return res.status(409).json({ error: 'This skill already exists', skill: existing })
  }

  const row = await prisma.skillCatalog.create({
    data: {
      name,
      category: body.category?.trim() || 'General',
    },
  })
  invalidateSkillCatalogCache()
  res.status(201).json(row)
})

router.delete('/:id', requireRoles('ADMIN'), async (req, res) => {
  const row = await prisma.skillCatalog.findUnique({ where: { id: req.params.id } })
  if (!row) return res.status(404).json({ error: 'Skill not found' })

  await prisma.skillCatalog.delete({ where: { id: row.id } })
  invalidateSkillCatalogCache()
  res.status(204).send()
})

router.post('/seed-defaults', requireRoles('ADMIN'), async (_req, res) => {
  await ensureDefaultSkillCatalog()
  const skills = await listSkillCatalog()
  res.json({ count: skills.length, skills })
})

export default router
