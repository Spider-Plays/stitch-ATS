import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import { RequireAuth } from './components/RequireAuth'
import { RequireSuperAdmin } from './components/RequireSuperAdmin'
import { lazyPage } from './lib/lazyRoute'
import { REFERRAL_PORTAL_ROLES } from '@/permissions'

import CandidatePortalLayout from './layouts/CandidatePortalLayout'
import VendorPortalLayout from './layouts/VendorPortalLayout'
import ReferralPortalLayout from './layouts/ReferralPortalLayout'

const Dashboard = lazyPage(() => import('./pages/dashboard/Dashboard'))
const Login = lazyPage(() => import('./pages/auth/login/Login'))
const SetPassword = lazyPage(() => import('./pages/auth/set-password/SetPassword'))
const Signup = lazyPage(() => import('./pages/auth/signup/Signup'))
const NewCandidate = lazyPage(() => import('./pages/candidates/new/NewCandidate'))
const CandidateDetail = lazyPage(() => import('./pages/candidates/profile/CandidateProfile'))
const CandidatesList = lazyPage(() => import('./pages/candidates/list/CandidatesList'))
const Pipeline = lazyPage(() => import('./pages/pipeline/board/Pipeline'))
const RequirementDetail = lazyPage(() => import('./pages/requirements/detail/RequirementDetail'))
const EditRequirement = lazyPage(() => import('./pages/requirements/edit/EditRequirement'))
const RequirementMatchingProfiles = lazyPage(
  () => import('./pages/requirements/matching-profiles/RequirementMatchingProfiles')
)
const RequirementLinkedCandidates = lazyPage(
  () => import('./pages/requirements/linked-candidates/RequirementLinkedCandidates')
)
const NewRequirement = lazyPage(() => import('./pages/requirements/new/NewRequirement'))
const RequirementsList = lazyPage(() => import('./pages/requirements/list/RequirementsList'))
const UserManagement = lazyPage(() => import('./pages/admin/users/UserManagement'))
const UserDetail = lazyPage(() => import('./pages/admin/user-detail/UserDetail'))
const RoleAccessEditor = lazyPage(() => import('./pages/admin/role-access/RoleAccessEditor'))
const AdminOverview = lazyPage(() => import('./pages/admin/overview/AdminOverview'))
const AdminDepartments = lazyPage(() => import('./pages/admin/departments/AdminDepartments'))
const AdminClients = lazyPage(() => import('./pages/admin/clients/AdminClients'))
const AdminSkills = lazyPage(() => import('./pages/admin/skills/AdminSkills'))
const AdminInterviewPanels = lazyPage(() => import('./pages/admin/interview-panels/AdminInterviewPanels'))
const CandidateDashboard = lazyPage(() => import('./pages/candidate-portal/dashboard/CandidateDashboard'))
const PortalJobDetail = lazyPage(() => import('./pages/candidate-portal/job-detail/PortalJobDetail'))
const PortalOnboarding = lazyPage(() => import('./pages/candidate-portal/onboarding/PortalOnboarding'))
const PortalJobs = lazyPage(() => import('./pages/candidate-portal/jobs/PortalJobs'))
const PortalAppliedJobs = lazyPage(() => import('./pages/candidate-portal/applied-jobs/PortalAppliedJobs'))
const PortalApplicationUpdates = lazyPage(
  () => import('./pages/candidate-portal/application-updates/PortalApplicationUpdates')
)
const CandidateLogin = lazyPage(() => import('./pages/candidate-portal/login/CandidateLogin'))
const CandidateSignup = lazyPage(() => import('./pages/candidate-portal/signup/CandidateSignup'))
const PortalIndexRedirect = lazyPage(
  () => import('./pages/candidate-portal/index-redirect/PortalIndexRedirect').then((m) => ({
    default: m.PortalIndexRedirect,
  }))
)
const PortalProfileGate = lazyPage(() =>
  import('./components/portal/PortalProfileGate').then((m) => ({ default: m.PortalProfileGate }))
)
const Interviews = lazyPage(() => import('./pages/interviews/list/Interviews'))
const ScheduleInterview = lazyPage(() => import('./pages/interviews/schedule/ScheduleInterview'))
const InterviewCandidateResume = lazyPage(
  () => import('./pages/interviews/resume/InterviewCandidateResume')
)
const FeedbackForm = lazyPage(() => import('./pages/feedback/form/FeedbackForm'))
const Offers = lazyPage(() => import('./pages/offers/list/Offers'))
const NewOffer = lazyPage(() => import('./pages/offers/new/NewOffer'))
const OfferDetail = lazyPage(() => import('./pages/offers/detail/OfferDetail'))
const Notifications = lazyPage(() => import('./pages/notifications/list/Notifications'))
const Settings = lazyPage(() => import('./pages/settings/account/Settings'))
const NotFound = lazyPage(() => import('./pages/not-found/NotFound'))
const VendorDashboard = lazyPage(() => import('./pages/vendor-portal/dashboard/VendorDashboard'))
const VendorPositions = lazyPage(() => import('./pages/vendor-portal/positions/VendorPositions'))
const VendorJobDetail = lazyPage(() => import('./pages/vendor-portal/job-detail/VendorJobDetail'))
const VendorSubmissions = lazyPage(() => import('./pages/vendor-portal/submissions/VendorSubmissions'))
const VendorsList = lazyPage(() => import('./pages/vendors/list/VendorsList'))
const VendorDetail = lazyPage(() => import('./pages/vendors/detail/VendorDetail'))
const NewVendor = lazyPage(() => import('./pages/vendors/new/NewVendor'))
const CareersCandidates = lazyPage(() => import('./pages/features/careers/CareersCandidates'))
const EmployeeReferralCandidates = lazyPage(
  () => import('./pages/features/employee-referral/EmployeeReferralCandidates')
)
const MisDashboard = lazyPage(() => import('./pages/features/mis/MisDashboard'))
const ReferralLogin = lazyPage(() => import('./pages/referral-portal/login/ReferralLogin'))
const ReferralDashboard = lazyPage(() => import('./pages/referral-portal/dashboard/ReferralDashboard'))
const ReferralJobs = lazyPage(() => import('./pages/referral-portal/jobs/ReferralJobs'))
const ReferralJobDetail = lazyPage(() => import('./pages/referral-portal/job-detail/ReferralJobDetail'))
const ReferralList = lazyPage(() => import('./pages/referral-portal/list/ReferralList'))
const ReferralDetail = lazyPage(() => import('./pages/referral-portal/detail/ReferralDetail'))
const ReferralProgram = lazyPage(() => import('./pages/referral-portal/program/ReferralProgram'))

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/set-password" element={<SetPassword />} />
      <Route path="/signup" element={<Signup />} />

      <Route path="/referral-portal/login" element={<ReferralLogin />} />
      <Route
        path="/referral-portal"
        element={
          <RequireAuth allowedRoles={[...REFERRAL_PORTAL_ROLES]} skipPageCheck>
            <ReferralPortalLayout />
          </RequireAuth>
        }
      >
        <Route path="dashboard" element={<ReferralDashboard />} />
        <Route path="jobs" element={<ReferralJobs />} />
        <Route path="jobs/:id" element={<ReferralJobDetail />} />
        <Route path="referrals" element={<ReferralList />} />
        <Route path="referrals/:id" element={<ReferralDetail />} />
        <Route path="program" element={<ReferralProgram />} />
        <Route index element={<Navigate to="dashboard" replace />} />
      </Route>

      <Route
        path="/vendor-portal"
        element={
          <RequireAuth allowedRoles={['VENDOR']}>
            <VendorPortalLayout />
          </RequireAuth>
        }
      >
        <Route path="dashboard" element={<VendorDashboard />} />
        <Route path="positions" element={<VendorPositions />} />
        <Route path="positions/:id" element={<VendorJobDetail />} />
        <Route path="submissions" element={<VendorSubmissions />} />
        <Route index element={<Navigate to="dashboard" replace />} />
      </Route>

      <Route path="/portal/login" element={<CandidateLogin />} />
      <Route path="/portal/signup" element={<CandidateSignup />} />

      <Route
        path="/portal"
        element={
          <RequireAuth allowedRoles={['CANDIDATE']}>
            <CandidatePortalLayout />
          </RequireAuth>
        }
      >
        <Route index element={<PortalIndexRedirect />} />
        <Route path="onboarding" element={<PortalOnboarding />} />
        <Route path="profile" element={<Navigate to="/portal/onboarding" replace />} />
        <Route element={<PortalProfileGate />}>
          <Route path="dashboard" element={<CandidateDashboard />} />
          <Route path="jobs" element={<PortalJobs />} />
          <Route path="jobs/applied/:requirementId" element={<PortalApplicationUpdates />} />
          <Route path="jobs/:id" element={<PortalJobDetail />} />
          <Route path="applied/:requirementId" element={<PortalAppliedJobs />} />
          <Route path="applied" element={<PortalAppliedJobs />} />
        </Route>
      </Route>

      <Route
        path="/admin"
        element={
          <RequireAuth allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
            <MainLayout />
          </RequireAuth>
        }
      >
        <Route index element={<AdminOverview />} />
        <Route
          path="users"
          element={
            <RequireSuperAdmin>
              <UserManagement />
            </RequireSuperAdmin>
          }
        />
        <Route
          path="users/:id"
          element={
            <RequireSuperAdmin>
              <UserDetail />
            </RequireSuperAdmin>
          }
        />
        <Route path="departments" element={<AdminDepartments />} />
        <Route path="clients" element={<AdminClients />} />
        <Route path="skills" element={<AdminSkills />} />
        <Route
          path="role-access"
          element={
            <RequireSuperAdmin>
              <RoleAccessEditor />
            </RequireSuperAdmin>
          }
        />
        <Route path="interview-panels" element={<AdminInterviewPanels />} />
      </Route>

      <Route
        path="/vendors"
        element={
          <RequireAuth allowedRoles={['SUPER_ADMIN', 'ADMIN', 'HR_HEAD', 'HR_MANAGER', 'RECRUITER']}>
            <MainLayout />
          </RequireAuth>
        }
      >
        <Route index element={<VendorsList />} />
        <Route path="new" element={<NewVendor />} />
        <Route path=":id" element={<VendorDetail />} />
      </Route>

      <Route
        path="/"
        element={
          <RequireAuth
            allowedRoles={[
              'SUPER_ADMIN',
              'ADMIN',
              'HR_HEAD',
              'HR_MANAGER',
              'RECRUITER',
              'TEAM_LEAD',
              'HIRING_MANAGER',
              'INTERVIEWER',
            ]}
          >
            <MainLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="requirements" element={<RequirementsList />} />
        <Route path="requirements/new" element={<NewRequirement />} />
        <Route path="requirements/:id/matching-profiles" element={<RequirementMatchingProfiles />} />
        <Route path="requirements/:id/linked-candidates" element={<RequirementLinkedCandidates />} />
        <Route path="requirements/:id/edit" element={<EditRequirement />} />
        <Route path="requirements/:id" element={<RequirementDetail />} />
        <Route path="candidates" element={<CandidatesList />} />
        <Route path="candidates/:id" element={<CandidateDetail />} />
        <Route path="candidates/new" element={<NewCandidate />} />
        <Route path="pipeline/:requirementId?" element={<Pipeline />} />
        <Route path="interviews" element={<Interviews />} />
        <Route path="interviews/new" element={<ScheduleInterview />} />
        <Route path="interviews/:id/resume" element={<InterviewCandidateResume />} />
        <Route path="interviews/:id/edit" element={<ScheduleInterview />} />
        <Route path="interviews/:id/feedback" element={<FeedbackForm />} />
        <Route path="offers" element={<Offers />} />
        <Route path="offers/new" element={<NewOffer />} />
        <Route path="offers/:id" element={<OfferDetail />} />
        <Route path="features/careers" element={<CareersCandidates />} />
        <Route path="features/employee-referral" element={<EmployeeReferralCandidates />} />
        <Route path="features/mis" element={<MisDashboard />} />
      </Route>

      <Route element={<RequireAuth><MainLayout /></RequireAuth>}>
        <Route path="/settings" element={<Settings />} />
        <Route path="/notifications" element={<Notifications />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default AppRoutes
