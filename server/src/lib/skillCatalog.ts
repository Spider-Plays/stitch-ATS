import { prisma } from './prisma.js'
import { DEFAULT_SKILL_CATALOG } from '../config/defaultSkills.js'

export type SkillCatalogEntry = {
  id: string
  name: string
  category: string
}

let cachedNames: string[] | null = null
let cacheAt = 0
const CACHE_MS = 60_000

export async function ensureDefaultSkillCatalog(): Promise<void> {
  const count = await prisma.skillCatalog.count()
  if (count > 0) return

  await prisma.skillCatalog.createMany({
    data: DEFAULT_SKILL_CATALOG.map((s) => ({
      name: s.name,
      category: s.category,
    })),
    skipDuplicates: true,
  })
  cachedNames = null
}

export async function listSkillCatalog(): Promise<SkillCatalogEntry[]> {
  await ensureDefaultSkillCatalog()
  return prisma.skillCatalog.findMany({
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
    select: { id: true, name: true, category: true },
  })
}

export async function getCatalogSkillNames(): Promise<string[]> {
  const now = Date.now()
  if (cachedNames && now - cacheAt < CACHE_MS) return cachedNames

  await ensureDefaultSkillCatalog()
  const rows = await prisma.skillCatalog.findMany({ select: { name: true } })
  cachedNames = rows.map((r) => r.name)
  cacheAt = now
  return cachedNames
}

export function invalidateSkillCatalogCache(): void {
  cachedNames = null
}
