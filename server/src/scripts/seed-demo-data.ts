import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma.js'
import { DEV_USERS, DEV_PASSWORD } from '../config/devUsers.js'
import {
  DEMO_CANDIDATES,
  DEMO_PORTAL_USERS,
  DEMO_REQUIREMENTS,
  DEMO_RESUME_URLS,
  DEMO_VENDOR_CODE,
} from '../config/demoData.js'
import { serializeSkills } from '../lib/skills.js'
import { saveResumeFile } from '../lib/resumeStorage.js'
import {
  buildCandidateResumePayload,
  extractResumeText,
} from '../lib/resumeParse.js'
import { computeMatchScore } from '../lib/profileMatching.js'
import { findCandidateByEmail } from '../lib/candidateDuplicate.js'

const FRESH = process.argv.includes('--fresh')

async function clearHiringData() {
  console.log('Clearing existing hiring data...')
  await prisma.$transaction([
    prisma.activityLog.deleteMany(),
    prisma.feedback.deleteMany(),
    prisma.offer.deleteMany(),
    prisma.interview.deleteMany(),
    prisma.candidate.deleteMany(),
    prisma.vendorRequirement.deleteMany(),
    prisma.requirement.deleteMany(),
  ])
}

async function upsertUser(u: {
  email: string
  password: string
  name: string
  role: string
  department?: string
  vendorId?: string
}) {
  const passwordHash = await bcrypt.hash(u.password, 10)
  return prisma.user.upsert({
    where: { email: u.email.toLowerCase() },
    update: {
      name: u.name,
      role: u.role,
      department: u.department,
      passwordHash,
      status: 'ACTIVE',
      ...(u.vendorId !== undefined && { vendorId: u.vendorId }),
    },
    create: {
      email: u.email.toLowerCase(),
      passwordHash,
      name: u.name,
      role: u.role,
      department: u.department,
      status: 'ACTIVE',
      permissions: '[]',
      themePreference: 'system',
      authProvider: 'local',
      ...(u.vendorId !== undefined && { vendorId: u.vendorId }),
    },
  })
}

const resumeCache: Buffer[] = []

async function fetchResumeBuffers() {
  if (resumeCache.length > 0) return resumeCache
  console.log('Downloading sample resume PDFs...')
  for (const url of DEMO_RESUME_URLS) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(20_000) })
      if (!res.ok) continue
      const buf = Buffer.from(await res.arrayBuffer())
      if (buf.length > 500) resumeCache.push(buf)
    } catch {
      // try next URL
    }
  }
  if (resumeCache.length === 0) {
    console.warn('Could not download PDFs — candidates will have resume text only.')
  } else {
    console.log(`Cached ${resumeCache.length} resume PDF(s).`)
  }
  return resumeCache
}

async function attachResume(
  candidateId: string,
  snippet: string,
  index: number,
  skills?: { primary?: string[]; secondary?: string[] }
) {
  const textPayload = buildCandidateResumePayload(snippet)
  const primarySkills =
    skills?.primary?.length
      ? serializeSkills(skills.primary)
      : textPayload.primarySkills
  const secondarySkills =
    skills?.secondary?.length
      ? serializeSkills(skills.secondary)
      : textPayload.secondarySkills

  const pdfs = await fetchResumeBuffers()
  if (pdfs.length > 0) {
    const buffer = pdfs[index % pdfs.length]
    try {
      const parsed = await extractResumeText(buffer, 'application/pdf', 'resume.pdf')
      const merged = [snippet, parsed].filter(Boolean).join('\n\n')
      const mergedPayload = buildCandidateResumePayload(merged)
      await saveResumeFile(candidateId, 'application/pdf', buffer, 'resume.pdf')
      await prisma.candidate.update({
        where: { id: candidateId },
        data: {
          resumeFileName: 'resume.pdf',
          resumeMimeType: 'application/pdf',
          resumeUrl: null,
          resumeText: mergedPayload.resumeText,
          primarySkills: skills?.primary?.length ? primarySkills : mergedPayload.primarySkills,
          secondarySkills: skills?.secondary?.length
            ? secondarySkills
            : mergedPayload.secondarySkills,
        },
      })
      return
    } catch {
      // fall through to text-only
    }
  }

  await prisma.candidate.update({
    where: { id: candidateId },
    data: {
      resumeFileName: null,
      resumeMimeType: null,
      resumeUrl: null,
      resumeText: textPayload.resumeText,
      primarySkills,
      secondarySkills,
    },
  })
}

async function main() {
  if (FRESH) await clearHiringData()

  console.log('Seeding demo users...')
  const vendor = await prisma.vendor.upsert({
    where: { code: DEMO_VENDOR_CODE },
    update: {
      name: 'Demo Staffing Co',
      status: 'ACTIVE',
      email: 'demo-vendor@staffing.local.test',
      contactName: 'Sarah Vendor',
    },
    create: {
      name: 'Demo Staffing Co',
      code: DEMO_VENDOR_CODE,
      email: 'demo-vendor@staffing.local.test',
      status: 'ACTIVE',
      contactName: 'Sarah Vendor',
      phone: '+91 98765 43210',
    },
  })

  const userByEmail = new Map<string, string>()

  for (const u of DEV_USERS) {
    const row = await upsertUser({
      ...u,
      vendorId: u.role === 'VENDOR' ? vendor.id : undefined,
    })
    userByEmail.set(row.email, row.id)
  }

  for (const u of DEMO_PORTAL_USERS) {
    const row = await upsertUser({
      email: u.email,
      password: u.password,
      name: u.name,
      role: 'CANDIDATE',
    })
    userByEmail.set(row.email, row.id)
  }

  const recruiterId =
    userByEmail.get('dev-recruiter@local.test') ??
    userByEmail.get('dev-admin@local.test')!

  console.log('Seeding requirements...')
  const reqByCode = new Map<string, { id: string; title: string }>()

  for (const r of DEMO_REQUIREMENTS) {
    const timestamp = new Date()
    const row = await prisma.requirement.upsert({
      where: { jobCode: r.jobCode },
      update: {
        title: r.title,
        department: r.department,
        hiringManager: r.hiringManager,
        client: r.client,
        location: r.location,
        priority: r.priority,
        openings: r.openings,
        filled: r.filled,
        status: r.status,
        description: r.description,
        jobDescription: r.jobDescription,
        primarySkills: serializeSkills([...r.primarySkills]),
        secondarySkills: serializeSkills([...r.secondarySkills]),
        visibleToCandidates: r.visibleToCandidates,
        visibleToVendors: r.visibleToVendors,
        approval:
          r.status === 'LIVE'
            ? JSON.stringify({ decision: 'APPROVED' })
            : JSON.stringify({ decision: 'PENDING' }),
      },
      create: {
        jobCode: r.jobCode,
        title: r.title,
        department: r.department,
        hiringManager: r.hiringManager,
        client: r.client,
        location: r.location,
        priority: r.priority,
        openings: r.openings,
        filled: r.filled,
        status: r.status,
        description: r.description,
        jobDescription: r.jobDescription,
        primarySkills: serializeSkills([...r.primarySkills]),
        secondarySkills: serializeSkills([...r.secondarySkills]),
        visibleToCandidates: r.visibleToCandidates,
        visibleToVendors: r.visibleToVendors,
        createdBy: recruiterId,
        createdByRole: 'RECRUITER',
        recruiters: JSON.stringify([recruiterId]),
        approval:
          r.status === 'LIVE'
            ? JSON.stringify({ decision: 'APPROVED' })
            : JSON.stringify({ decision: 'PENDING' }),
        approvalHistory: JSON.stringify([
          {
            action: r.status === 'LIVE' ? 'APPROVED' : 'REQUESTED',
            by: recruiterId,
            at: timestamp.toISOString(),
            role: 'RECRUITER',
          },
        ]),
        versions: '[]',
        currentVersion: 1,
      },
    })
    reqByCode.set(r.jobCode, { id: row.id, title: row.title })

    if (r.visibleToVendors) {
      await prisma.vendorRequirement.upsert({
        where: {
          vendorId_requirementId: {
            vendorId: vendor.id,
            requirementId: row.id,
          },
        },
        update: {},
        create: {
          vendorId: vendor.id,
          requirementId: row.id,
          assignedBy: recruiterId,
        },
      })
    }
  }

  const vendorUserId = userByEmail.get('dev-vendor@local.test')

  async function upsertCandidate(
    data: {
      email: string
      name: string
      role: string
      status: string
      source: string
      jobCode?: string | null
      phone?: string
      location?: string
      totalExperience?: string
      currentCompany?: string
      primarySkills?: string[]
      secondarySkills?: string[]
      resumeSnippet: string
      vendorId?: string
      submittedByUserId?: string
      createdBy?: string
    },
    index: number
  ) {
    const requirement = data.jobCode ? reqByCode.get(data.jobCode) : undefined
    const skillsPayload = buildCandidateResumePayload(data.resumeSnippet)

    const payload = {
      name: data.name,
      role: data.role,
      status: data.status,
      source: data.source,
      requirementId: requirement?.id ?? null,
      jobTitle: requirement?.title ?? data.role,
      phone: data.phone ?? null,
      location: data.location ?? null,
      totalExperience: data.totalExperience ?? null,
      currentCompany: data.currentCompany ?? null,
      primarySkills: data.primarySkills
        ? serializeSkills(data.primarySkills)
        : skillsPayload.primarySkills,
      secondarySkills: data.secondarySkills
        ? serializeSkills(data.secondarySkills)
        : skillsPayload.secondarySkills,
      resumeText: skillsPayload.resumeText,
      vendorId: data.vendorId ?? null,
      submittedByUserId: data.submittedByUserId ?? null,
      createdBy: data.createdBy ?? null,
    }

    const existing = await findCandidateByEmail(data.email)
    const row = existing
      ? await prisma.candidate.update({
          where: { id: existing.id },
          data: payload,
        })
      : await prisma.candidate.create({
          data: {
            email: data.email.toLowerCase(),
            matchScore: 0,
            ...payload,
          },
        })

    const fullReq = requirement
      ? await prisma.requirement.findUnique({ where: { id: requirement.id } })
      : null

    if (fullReq) {
      const { score } = computeMatchScore(row, fullReq, data.resumeSnippet)
      await prisma.candidate.update({
        where: { id: row.id },
        data: { matchScore: score },
      })
    }

    await attachResume(row.id, data.resumeSnippet, index, {
      primary: data.primarySkills,
      secondary: data.secondarySkills,
    })
    return row
  }

  console.log('Seeding candidates...')
  let idx = 0
  for (const c of DEMO_CANDIDATES) {
    await upsertCandidate(
      {
        ...c,
        vendorId: c.vendorSubmitted ? vendor.id : undefined,
        submittedByUserId: c.vendorSubmitted ? vendorUserId : undefined,
        createdBy: c.vendorSubmitted ? vendorUserId : recruiterId,
      },
      idx++
    )
  }

  console.log('Seeding portal self-applications...')
  for (const p of DEMO_PORTAL_USERS) {
    if (!p.applyToJobCode) continue
    const requirement = reqByCode.get(p.applyToJobCode)
    if (!requirement) continue

    const snippet = `${p.name} — applied via candidate portal. Motivated applicant for ${requirement.title}.`
    await upsertCandidate(
      {
        email: p.email,
        name: p.name,
        role: requirement.title,
        status: 'APPLIED',
        source: 'Candidate Portal',
        jobCode: p.applyToJobCode,
        phone: '+91 90000 00000',
        location: 'India',
        resumeSnippet: snippet,
      },
      idx++
    )
  }

  // Ensure dev-candidate portal account is linked (self-applied)
  const devCandUser = userByEmail.get('dev-candidate@local.test')
  if (devCandUser) {
    const req = reqByCode.get('DEMO-SWE-01')
    if (req) {
      await upsertCandidate(
        {
          email: 'dev-candidate@local.test',
          name: 'Dev Candidate',
          role: req.title,
          status: 'APPLIED',
          source: 'Candidate Portal',
          jobCode: 'DEMO-SWE-01',
          resumeSnippet:
            'Dev Candidate — self-applied via portal for Senior Software Engineer. TypeScript, React, Node.js.',
        },
        idx++
      )
    }
  }

  // Interviews for candidates in INTERVIEW status
  const interviewCandidates = await prisma.candidate.findMany({
    where: { status: 'INTERVIEW', requirementId: { not: null } },
  })
  const interviewerId = userByEmail.get('dev-interviewer@local.test')!
  for (const c of interviewCandidates) {
    const existing = await prisma.interview.findFirst({
      where: { candidateId: c.id },
    })
    if (existing) continue
    await prisma.interview.create({
      data: {
        candidateId: c.id,
        requirementId: c.requirementId!,
        scheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        interviewerIds: JSON.stringify([interviewerId]),
        type: 'Technical',
        status: 'SCHEDULED',
        duration: 60,
        meetingLink: 'https://meet.example.com/demo-interview',
      },
    })
  }

  // Offer for OFFER status candidate
  const offerCandidate = await prisma.candidate.findFirst({
    where: { status: 'OFFER', email: 'demo.cand04@local.test' },
  })
  if (offerCandidate?.requirementId) {
    const existingOffer = await prisma.offer.findFirst({
      where: { candidateId: offerCandidate.id },
    })
    if (!existingOffer) {
      await prisma.offer.create({
        data: {
          candidateId: offerCandidate.id,
          requirementId: offerCandidate.requirementId,
          baseSalary: 2800000,
          bonus: 200000,
          status: 'PENDING',
          createdBy: recruiterId,
          history: JSON.stringify([
            {
              action: 'CREATED',
              at: new Date().toISOString(),
              by: recruiterId,
            },
          ]),
        },
      })
    }
  }

  const counts = await Promise.all([
    prisma.user.count(),
    prisma.requirement.count(),
    prisma.candidate.count(),
    prisma.candidate.count({ where: { source: 'Candidate Portal' } }),
    prisma.candidate.count({ where: { vendorId: { not: null } } }),
  ])

  console.log('\nDemo data ready:')
  console.log(`  Users: ${counts[0]} (password: ${DEV_PASSWORD})`)
  console.log(`  Requirements: ${counts[1]}`)
  console.log(`  Candidates: ${counts[2]} (${counts[3]} self-applied, ${counts[4]} vendor)`)
  console.log('  Portal browse-only: demo.portal-browse@local.test, demo.portal-browse2@local.test')
  console.log('  Re-run with --fresh to replace hiring data.\n')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
