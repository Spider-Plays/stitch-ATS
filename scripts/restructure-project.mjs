/**
 * Restructure pages into per-page folders, colocate utils, unify permission imports.
 * Run: node scripts/restructure-project.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const SRC = path.join(ROOT, 'src')

const PAGE_MOVES = [
  ['pages/Dashboard.tsx', 'pages/dashboard/Dashboard.tsx'],
  ['pages/NotFound.tsx', 'pages/not-found/NotFound.tsx'],
  ['pages/auth/Login.tsx', 'pages/auth/login/Login.tsx'],
  ['pages/auth/Signup.tsx', 'pages/auth/signup/Signup.tsx'],
  ['pages/admin/AdminClients.tsx', 'pages/admin/clients/AdminClients.tsx'],
  ['pages/admin/AdminDepartments.tsx', 'pages/admin/departments/AdminDepartments.tsx'],
  ['pages/admin/AdminInterviewPanels.tsx', 'pages/admin/interview-panels/AdminInterviewPanels.tsx'],
  ['pages/admin/AdminOverview.tsx', 'pages/admin/overview/AdminOverview.tsx'],
  ['pages/admin/AdminSkills.tsx', 'pages/admin/skills/AdminSkills.tsx'],
  ['pages/admin/RoleAccessEditor.tsx', 'pages/admin/role-access/RoleAccessEditor.tsx'],
  ['pages/admin/UserDetail.tsx', 'pages/admin/user-detail/UserDetail.tsx'],
  ['pages/admin/UserManagement.tsx', 'pages/admin/users/UserManagement.tsx'],
  ['pages/candidate-portal/CandidateDashboard.tsx', 'pages/candidate-portal/dashboard/CandidateDashboard.tsx'],
  ['pages/candidate-portal/CandidateLogin.tsx', 'pages/candidate-portal/login/CandidateLogin.tsx'],
  ['pages/candidate-portal/CandidateSignup.tsx', 'pages/candidate-portal/signup/CandidateSignup.tsx'],
  ['pages/candidate-portal/PortalApplicationUpdates.tsx', 'pages/candidate-portal/application-updates/PortalApplicationUpdates.tsx'],
  ['pages/candidate-portal/PortalAppliedJobs.tsx', 'pages/candidate-portal/applied-jobs/PortalAppliedJobs.tsx'],
  ['pages/candidate-portal/PortalIndexRedirect.tsx', 'pages/candidate-portal/index-redirect/PortalIndexRedirect.tsx'],
  ['pages/candidate-portal/PortalJobDetail.tsx', 'pages/candidate-portal/job-detail/PortalJobDetail.tsx'],
  ['pages/candidate-portal/PortalJobs.tsx', 'pages/candidate-portal/jobs/PortalJobs.tsx'],
  ['pages/candidate-portal/PortalJobsBrowse.tsx', 'pages/candidate-portal/jobs-browse/PortalJobsBrowse.tsx'],
  ['pages/candidate-portal/PortalOnboarding.tsx', 'pages/candidate-portal/onboarding/PortalOnboarding.tsx'],
  ['pages/candidate-portal/PortalProfileSetup.tsx', 'pages/candidate-portal/profile-setup/PortalProfileSetup.tsx'],
  ['pages/candidates/CandidateProfile.tsx', 'pages/candidates/profile/CandidateProfile.tsx'],
  ['pages/candidates/CandidatesList.tsx', 'pages/candidates/list/CandidatesList.tsx'],
  ['pages/candidates/NewCandidate.tsx', 'pages/candidates/new/NewCandidate.tsx'],
  ['pages/features/CareersCandidates.tsx', 'pages/features/careers/CareersCandidates.tsx'],
  ['pages/features/EmployeeReferralCandidates.tsx', 'pages/features/employee-referral/EmployeeReferralCandidates.tsx'],
  ['pages/features/MisDashboard.tsx', 'pages/features/mis/MisDashboard.tsx'],
  ['pages/feedback/FeedbackForm.tsx', 'pages/feedback/form/FeedbackForm.tsx'],
  ['pages/interviews/InterviewCandidateResume.tsx', 'pages/interviews/resume/InterviewCandidateResume.tsx'],
  ['pages/interviews/Interviews.tsx', 'pages/interviews/list/Interviews.tsx'],
  ['pages/interviews/ScheduleInterview.tsx', 'pages/interviews/schedule/ScheduleInterview.tsx'],
  ['pages/notifications/Notifications.tsx', 'pages/notifications/list/Notifications.tsx'],
  ['pages/offers/NewOffer.tsx', 'pages/offers/new/NewOffer.tsx'],
  ['pages/offers/OfferDetail.tsx', 'pages/offers/detail/OfferDetail.tsx'],
  ['pages/offers/Offers.tsx', 'pages/offers/list/Offers.tsx'],
  ['pages/pipeline/Pipeline.tsx', 'pages/pipeline/board/Pipeline.tsx'],
  ['pages/referral-portal/ReferralDashboard.tsx', 'pages/referral-portal/dashboard/ReferralDashboard.tsx'],
  ['pages/referral-portal/ReferralDetail.tsx', 'pages/referral-portal/detail/ReferralDetail.tsx'],
  ['pages/referral-portal/ReferralJobDetail.tsx', 'pages/referral-portal/job-detail/ReferralJobDetail.tsx'],
  ['pages/referral-portal/ReferralJobs.tsx', 'pages/referral-portal/jobs/ReferralJobs.tsx'],
  ['pages/referral-portal/ReferralList.tsx', 'pages/referral-portal/list/ReferralList.tsx'],
  ['pages/referral-portal/ReferralLogin.tsx', 'pages/referral-portal/login/ReferralLogin.tsx'],
  ['pages/referral-portal/ReferralProgram.tsx', 'pages/referral-portal/program/ReferralProgram.tsx'],
  ['pages/requirements/EditRequirement.tsx', 'pages/requirements/edit/EditRequirement.tsx'],
  ['pages/requirements/NewRequirement.tsx', 'pages/requirements/new/NewRequirement.tsx'],
  ['pages/requirements/RequirementDetail.tsx', 'pages/requirements/detail/RequirementDetail.tsx'],
  ['pages/requirements/RequirementLinkedCandidates.tsx', 'pages/requirements/linked-candidates/RequirementLinkedCandidates.tsx'],
  ['pages/requirements/RequirementMatchingProfiles.tsx', 'pages/requirements/matching-profiles/RequirementMatchingProfiles.tsx'],
  ['pages/requirements/RequirementsList.tsx', 'pages/requirements/list/RequirementsList.tsx'],
  ['pages/settings/Settings.tsx', 'pages/settings/account/Settings.tsx'],
  ['pages/vendor-portal/VendorDashboard.tsx', 'pages/vendor-portal/dashboard/VendorDashboard.tsx'],
  ['pages/vendor-portal/VendorJobDetail.tsx', 'pages/vendor-portal/job-detail/VendorJobDetail.tsx'],
  ['pages/vendor-portal/VendorPositions.tsx', 'pages/vendor-portal/positions/VendorPositions.tsx'],
  ['pages/vendor-portal/VendorSubmissions.tsx', 'pages/vendor-portal/submissions/VendorSubmissions.tsx'],
  ['pages/vendors/NewVendor.tsx', 'pages/vendors/new/NewVendor.tsx'],
  ['pages/vendors/VendorDetail.tsx', 'pages/vendors/detail/VendorDetail.tsx'],
  ['pages/vendors/VendorsList.tsx', 'pages/vendors/list/VendorsList.tsx'],
]

const UTIL_MOVES = [
  ['lib/dashboardPage.ts', 'pages/dashboard/dashboard.utils.ts'],
  ['lib/candidatePage.ts', 'pages/candidates/_shared/candidate.utils.ts'],
  ['lib/candidateProfilePage.ts', 'pages/candidates/profile/profile.utils.ts'],
  ['lib/pipelinePage.ts', 'pages/pipeline/board/pipeline.utils.ts'],
  ['lib/requirementPage.ts', 'pages/requirements/_shared/requirement.utils.ts'],
  ['lib/interviewPage.ts', 'pages/interviews/_shared/interview.utils.ts'],
  ['lib/vendorPage.ts', 'pages/vendors/_shared/vendor.utils.ts'],
  ['lib/vendorProfilePage.ts', 'pages/vendors/detail/vendor-profile.utils.ts'],
  ['lib/adminOverviewPage.ts', 'pages/admin/overview/overview.utils.ts'],
  ['lib/misPage.ts', 'pages/features/mis/mis.utils.ts'],
]

const COMPONENT_MOVES = [
  ['components/candidates/profile', 'pages/candidates/profile/components'],
  ['components/vendors/profile', 'pages/vendors/detail/components'],
]

const IMPORT_REPLACEMENTS = [
  [/from ['"](\.\.\/)+lib\/dashboardPage['"]/g, "from '@/pages/dashboard/dashboard.utils'"],
  [/from ['"](\.\.\/)+lib\/candidatePage['"]/g, "from '@/pages/candidates/_shared/candidate.utils'"],
  [/from ['"](\.\.\/)+lib\/candidateProfilePage['"]/g, "from '@/pages/candidates/profile/profile.utils'"],
  [/from ['"](\.\.\/)+lib\/pipelinePage['"]/g, "from '@/pages/pipeline/board/pipeline.utils'"],
  [/from ['"](\.\.\/)+lib\/requirementPage['"]/g, "from '@/pages/requirements/_shared/requirement.utils'"],
  [/from ['"](\.\.\/)+lib\/interviewPage['"]/g, "from '@/pages/interviews/_shared/interview.utils'"],
  [/from ['"](\.\.\/)+lib\/vendorPage['"]/g, "from '@/pages/vendors/_shared/vendor.utils'"],
  [/from ['"](\.\.\/)+lib\/vendorProfilePage['"]/g, "from '@/pages/vendors/detail/vendor-profile.utils'"],
  [/from ['"](\.\.\/)+lib\/adminOverviewPage['"]/g, "from '@/pages/admin/overview/overview.utils'"],
  [/from ['"](\.\.\/)+lib\/misPage['"]/g, "from '@/pages/features/mis/mis.utils'"],
  [/from ['"](\.\.\/)+lib\/pageAccess['"]/g, "from '@/permissions'"],
  [/from ['"](\.\.\/)+lib\/candidatePermissions['"]/g, "from '@/permissions'"],
  [/from ['"](\.\.\/)+lib\/candidateProfilePermissions['"]/g, "from '@/permissions'"],
  [/from ['"](\.\.\/)+lib\/requirementPermissions['"]/g, "from '@/permissions'"],
  [/from ['"](\.\.\/)+lib\/interviewPermissions['"]/g, "from '@/permissions'"],
  [/from ['"](\.\.\/)+lib\/interviewPlanPermissions['"]/g, "from '@/permissions'"],
  [/from ['"](\.\.\/)+lib\/adminAccess['"]/g, "from '@/permissions'"],
  [/from ['"](\.\.\/)+lib\/orgAccess['"]/g, "from '@/permissions'"],
  [/from ['"](\.\.\/)+lib\/referralPortalRoles['"]/g, "from '@/permissions'"],
  [/from ['"](\.\.\/)+lib\/userTags['"]/g, "from '@/permissions'"],
  [
    /from ['"](\.\.\/)+components\/candidates\/profile\//g,
    "from '@/pages/candidates/profile/components/",
  ],
  [
    /from ['"](\.\.\/)+components\/vendors\/profile\//g,
    "from '@/pages/vendors/detail/components/",
  ],
]

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
}

function moveFile(fromRel, toRel) {
  const from = path.join(SRC, fromRel)
  const to = path.join(SRC, toRel)
  if (!fs.existsSync(from)) {
    console.warn(`Skip missing: ${fromRel}`)
    return
  }
  ensureDir(to)
  fs.renameSync(from, to)
  console.log(`Moved ${fromRel} -> ${toRel}`)
}

function moveDir(fromRel, toRel) {
  const from = path.join(SRC, fromRel)
  const to = path.join(SRC, toRel)
  if (!fs.existsSync(from)) {
    console.warn(`Skip missing dir: ${fromRel}`)
    return
  }
  fs.mkdirSync(to, { recursive: true })
  for (const entry of fs.readdirSync(from)) {
    const srcFile = path.join(from, entry)
    const destFile = path.join(to, entry)
    if (fs.existsSync(destFile)) {
      console.warn(`Skip existing: ${toRel}/${entry}`)
      continue
    }
    fs.renameSync(srcFile, destFile)
  }
  if (fs.readdirSync(from).length === 0) fs.rmdirSync(from)
  console.log(`Moved dir ${fromRel} -> ${toRel}`)
}

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, files)
    else if (/\.(tsx?|jsx?)$/.test(entry.name)) files.push(full)
  }
  return files
}

function patchFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8')
  let changed = false
  for (const [pattern, replacement] of IMPORT_REPLACEMENTS) {
    const next = content.replace(pattern, replacement)
    if (next !== content) {
      content = next
      changed = true
    }
  }
  if (changed) fs.writeFileSync(filePath, content)
}

function cssNameForPage(filePath) {
  const dir = path.basename(path.dirname(filePath))
  return `${dir}.css`
}

function addPageStyles(filePath) {
  if (!filePath.includes(`${path.sep}pages${path.sep}`) || !filePath.endsWith('.tsx')) return
  const cssName = cssNameForPage(filePath)
  const cssPath = path.join(path.dirname(filePath), cssName)
  if (!fs.existsSync(cssPath)) {
    const page = path.basename(filePath, '.tsx')
    fs.writeFileSync(
      cssPath,
      `/* Page styles: ${page} */\n.${page.toLowerCase()}-page {\n  /* Add page-specific overrides here */\n}\n`
    )
  }
  let content = fs.readFileSync(filePath, 'utf8')
  const importLine = `import './${cssName}'`
  if (!content.includes(importLine)) {
    const lines = content.split('\n')
    let insertAt = 0
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('import ')) insertAt = i + 1
      else if (insertAt > 0 && lines[i].trim() === '') break
    }
    lines.splice(insertAt, 0, importLine)
    fs.writeFileSync(filePath, lines.join('\n'))
  }
}

function fixUtilRelativeImports(filePath) {
  if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx')) return
  let content = fs.readFileSync(filePath, 'utf8')
  let changed = false
  const rel = path.relative(SRC, filePath).replace(/\\/g, '/')
  if (rel === 'pages/candidates/profile/profile.utils.ts') {
    const next = content.replace(
      "from './interviewPage'",
      "from '@/pages/interviews/_shared/interview.utils'"
    )
    if (next !== content) {
      content = next
      changed = true
    }
  }
  if (rel.startsWith('pages/') && rel.endsWith('.utils.ts')) {
    const next = content
      .replace(/from ['"]\.\.\/types['"]/g, "from '@/types'")
      .replace(/from ['"]\.\.\/\.\.\/types['"]/g, "from '@/types'")
    if (next !== content) {
      content = next
      changed = true
    }
  }
  if (changed) fs.writeFileSync(filePath, content)
}

// Keep thin re-exports in lib for any missed imports
const LIB_REEXPORTS = {
  'lib/pageAccess.ts': "export * from '@/permissions'\n",
  'lib/candidatePermissions.ts': "export * from '@/permissions'\n",
  'lib/requirementPermissions.ts': "export * from '@/permissions'\n",
  'lib/interviewPermissions.ts': "export * from '@/permissions'\n",
  'lib/interviewPlanPermissions.ts': "export * from '@/permissions'\n",
  'lib/adminAccess.ts': "export * from '@/permissions'\n",
  'lib/orgAccess.ts': "export * from '@/permissions'\n",
  'lib/referralPortalRoles.ts': "export * from '@/permissions'\n",
  'lib/userTags.ts': "export * from '@/permissions'\n",
  'lib/candidateProfilePermissions.ts': "export * from '@/permissions'\n",
}

// Run moves (pages before colocated components)
for (const [from, to] of UTIL_MOVES) moveFile(from, to)
for (const [from, to] of PAGE_MOVES) moveFile(from, to)
for (const [from, to] of COMPONENT_MOVES) moveDir(from, to)

// Patch all source files
const allFiles = walk(SRC)
for (const file of allFiles) {
  patchFile(file)
  fixUtilRelativeImports(file)
}

// Add page css + import
for (const [, to] of PAGE_MOVES) {
  addPageStyles(path.join(SRC, to))
}

// Lib re-exports
for (const [rel, content] of Object.entries(LIB_REEXPORTS)) {
  const full = path.join(SRC, rel)
  if (fs.existsSync(full) || rel.includes('candidateProfile')) {
    ensureDir(full)
    fs.writeFileSync(full, content)
  }
}

console.log('Restructure complete. Update routes.tsx and routePrefetch.ts manually if needed.')
