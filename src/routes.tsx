import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'

// Pages
import Dashboard from './pages/Dashboard'
import Login from './pages/auth/Login'
import Signup from './pages/auth/Signup'
import { RequireAuth } from './components/RequireAuth'
import NewCandidate from './pages/candidates/NewCandidate'
import CandidateDetail from './pages/candidates/CandidateProfile'
import CandidatesList from './pages/candidates/CandidatesList'
import Pipeline from './pages/pipeline/Pipeline'
import RequirementDetail from './pages/requirements/RequirementDetail'
import NewRequirement from './pages/requirements/NewRequirement'
import RequirementsList from './pages/requirements/RequirementsList'
import UserManagement from './pages/admin/UserManagement'
import CandidateDashboard from './pages/candidate-portal/CandidateDashboard'
import Interviews from './pages/interviews/Interviews'
import ScheduleInterview from './pages/interviews/ScheduleInterview'
import FeedbackForm from './pages/feedback/FeedbackForm'
import Offers from './pages/offers/Offers'
import NewOffer from './pages/offers/NewOffer'
import OfferDetail from './pages/offers/OfferDetail'
import Notifications from './pages/notifications/Notifications'

import Settings from './pages/settings/Settings'
import NotFound from './pages/NotFound'

const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Candidate Portal */}
            <Route path="/portal" element={<RequireAuth allowedRoles={['CANDIDATE']}><MainLayout /></RequireAuth>}>
                <Route path="dashboard" element={<CandidateDashboard />} />
                <Route index element={<Navigate to="dashboard" replace />} />
            </Route>

            {/* Admin Only */}
            <Route path="/admin" element={<RequireAuth allowedRoles={['ADMIN']}><MainLayout /></RequireAuth>}>
                <Route path="users" element={<UserManagement />} />
            </Route>

            {/* Internal Routes (Recruiters, Admin, etc.) */}
            <Route path="/" element={<RequireAuth allowedRoles={['ADMIN', 'HR_HEAD', 'HR_MANAGER', 'RECRUITER', 'TEAM_LEAD', 'HIRING_MANAGER', 'INTERVIEWER']}><MainLayout /></RequireAuth>}>
                <Route index element={<Dashboard />} />
                <Route path="dashboard" element={<Dashboard />} />
                {/* Admin Only Route moved to separate block */}

                {/* Requirements */}
                <Route path="requirements" element={<RequirementsList />} />
                <Route path="requirements/new" element={<NewRequirement />} />
                <Route path="requirements/:id" element={<RequirementDetail />} />


                {/* Candidates */}
                <Route path="candidates" element={<CandidatesList />} />
                <Route path="candidates/:id" element={<CandidateDetail />} />
                <Route path="candidates/new" element={<NewCandidate />} />

                <Route path="pipeline/:requirementId?" element={<Pipeline />} />

                {/* Interviews & Offers */}
                <Route path="interviews" element={<Interviews />} />
                <Route path="interviews/new" element={<ScheduleInterview />} />
                <Route path="interviews/:id/feedback" element={<FeedbackForm />} />
                <Route path="offers" element={<Offers />} />
                <Route path="offers/new" element={<NewOffer />} />
                <Route path="offers/:id" element={<OfferDetail />} />
            </Route>

            {/* Settings & Notifications (Shared) */}
            <Route element={<RequireAuth><MainLayout /></RequireAuth>}>
                <Route path="/settings" element={<Settings />} />
                <Route path="/notifications" element={<Notifications />} />
            </Route>
            {/* 404 - Catch all */}
            <Route path="*" element={<NotFound />} />
        </Routes>
    )
}

export default AppRoutes
