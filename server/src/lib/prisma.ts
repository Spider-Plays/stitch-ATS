import { Prisma, PrismaClient } from '@prisma/client'

export const prisma = new PrismaClient()

type PrismaWithCatalog = PrismaClient & {
  interviewPlan?: { findUnique: unknown }
  clientCatalog?: { count: unknown }
  interviewPanelLevel?: { findUnique: unknown }
}

/** Ensures generated client matches schema (new models require db:generate + API restart). */
export function assertPrismaClientModels() {
  const client = prisma as PrismaWithCatalog
  if (!client.interviewPlan?.findUnique) {
    throw new Error(
      'Prisma client is out of date (missing interviewPlan). Stop the API, run `npm run db:generate --prefix server`, then restart.'
    )
  }
  if (!client.clientCatalog?.count) {
    throw new Error(
      'Prisma client is out of date (missing clientCatalog). Stop the API, run `npm run db:generate --prefix server`, then restart `npm run dev`.'
    )
  }
  if (!client.interviewPanelLevel?.findUnique) {
    throw new Error(
      'Prisma client is out of date (missing interviewPanelLevel). Stop the API, run `npm run db:generate --prefix server`, then restart `npm run dev`.'
    )
  }
  const requirementFields = Prisma.dmmf.datamodel.models.find((m) => m.name === 'Requirement')?.fields
  if (!requirementFields?.some((f) => f.name === 'hiringStage')) {
    throw new Error(
      'Prisma client is out of date (missing Requirement.hiringStage). Stop the API, run `npm run db:generate --prefix server`, then restart `npm run dev`.'
    )
  }
}
