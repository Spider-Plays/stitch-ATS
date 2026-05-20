import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { prisma } from '../lib/prisma.js'

export interface AuthPayload {
  userId: string
  email: string
  role: string
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthPayload
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  try {
    const token = header.slice(7)
    req.auth = jwt.verify(token, env.jwtSecret) as AuthPayload
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

export function requireRoles(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth) return res.status(401).json({ error: 'Unauthorized' })
    if (!roles.includes(req.auth.role)) {
      return res.status(403).json({ error: 'Forbidden' })
    }
    next()
  }
}

export async function requireActiveUser(req: Request, res: Response, next: NextFunction) {
  if (!req.auth) return res.status(401).json({ error: 'Unauthorized' })
  const user = await prisma.user.findUnique({ where: { id: req.auth.userId } })
  if (!user || user.status === 'DISABLED') {
    return res.status(403).json({ error: 'Account disabled' })
  }
  next()
}
