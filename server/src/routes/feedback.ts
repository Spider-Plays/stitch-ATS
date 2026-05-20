import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { mapFeedback } from '../utils/mappers.js'
import { requireAuth, requireActiveUser } from '../middleware/auth.js'

const router = Router()
router.use(requireAuth, requireActiveUser)

router.get('/by-interview/:interviewId', async (req, res) => {
  const rows = await prisma.feedback.findMany({
    where: { interviewId: req.params.interviewId },
    orderBy: { createdAt: 'desc' },
  })
  res.json(rows.map(mapFeedback))
})

router.get('/by-candidate/:candidateId', async (req, res) => {
  const rows = await prisma.feedback.findMany({
    where: { candidateId: req.params.candidateId },
    orderBy: { createdAt: 'desc' },
  })
  res.json(rows.map(mapFeedback))
})

router.post('/', async (req, res) => {
  const body = req.body
  const row = await prisma.feedback.create({
    data: {
      interviewId: body.interviewId,
      interviewerId: body.interviewerId,
      candidateId: body.candidateId,
      rating: body.rating,
      technicalRating: body.technicalRating,
      communicationRating: body.communicationRating,
      comments: body.comments,
      recommendation: body.recommendation,
    },
  })
  res.status(201).json(mapFeedback(row))
})

export default router
