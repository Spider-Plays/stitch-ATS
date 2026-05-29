import { prisma } from './prisma.js'
import { DEFAULT_DEPARTMENT_CATALOG } from '../config/defaultDepartments.js'

export type DepartmentCatalogEntry = {
  id: string
  name: string
}

let cachedNames: string[] | null = null
let cacheAt = 0
const CACHE_MS = 60_000

export async function ensureDefaultDepartmentCatalog(): Promise<void> {
  const count = await prisma.departmentCatalog.count()
  if (count > 0) return

  await prisma.departmentCatalog.createMany({
    data: DEFAULT_DEPARTMENT_CATALOG.map((name) => ({ name })),
    skipDuplicates: true,
  })
  cachedNames = null
}

export async function listDepartmentCatalog(): Promise<DepartmentCatalogEntry[]> {
  await ensureDefaultDepartmentCatalog()
  return prisma.departmentCatalog.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  })
}

export async function getCatalogDepartmentNames(): Promise<string[]> {
  const now = Date.now()
  if (cachedNames && now - cacheAt < CACHE_MS) return cachedNames

  await ensureDefaultDepartmentCatalog()
  const rows = await prisma.departmentCatalog.findMany({ select: { name: true } })
  cachedNames = rows.map((r) => r.name)
  cacheAt = now
  return cachedNames
}

export function invalidateDepartmentCatalogCache(): void {
  cachedNames = null
}
