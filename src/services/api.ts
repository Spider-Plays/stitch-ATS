import { requirementService, candidateService, userService, interviewService, offerService, feedbackService, searchService, portalService, skillService, departmentService } from './http'
import { vendorService } from './http/vendors'
import { vendorPortalService } from './http/vendorPortal'
import { activityLogService } from './http/activityLogs'

export const api = {
    requirements: {
        list: requirementService.getAll,
        getPending: requirementService.getPending,
        getById: requirementService.getById,
        create: requirementService.create,
        update: requirementService.update,
        updateStatus: requirementService.updateStatus,
        assignRecruiter: requirementService.assignRecruiter,
        approve: requirementService.approve,
        reject: requirementService.reject,
        setVisibility: requirementService.setVisibility,
        delete: requirementService.delete,
        getMatchingProfiles: requirementService.getMatchingProfiles,
        linkCandidate: requirementService.linkCandidate,
    },
    candidates: {
        list: candidateService.getAll,
        checkEmail: candidateService.checkEmail,
        parseResume: candidateService.parseResume,
        getByRequirementId: candidateService.getByRequirementId,
        get: candidateService.getById,
        create: candidateService.create,
        update: candidateService.update,
        updateStatus: candidateService.updateStatus,
        uploadResume: candidateService.uploadResume,
        fetchResume: candidateService.fetchResume,
        deleteResume: candidateService.deleteResume,
        delete: candidateService.delete,
    },
    activityLogs: {
        log: activityLogService.logActivity,
        getByEntity: activityLogService.getByEntity,
        list: activityLogService.getAll
    },
    search: {
        query: searchService.query,
    },
    portal: {
        getMe: portalService.getMe,
        saveProfile: portalService.saveProfile,
        uploadResume: portalService.uploadResume,
        getOpenPositions: portalService.getOpenPositions,
        getPosition: portalService.getPosition,
        applyToPosition: portalService.applyToPosition,
    },
    vendors: {
        list: vendorService.list,
        get: vendorService.get,
        create: vendorService.create,
        update: vendorService.update,
        assignJobs: vendorService.assignJobs,
        unassignJob: vendorService.unassignJob,
        inviteUser: vendorService.inviteUser,
    },
    vendorPortal: {
        getMe: vendorPortalService.getMe,
        getPositions: vendorPortalService.getPositions,
        getPosition: vendorPortalService.getPosition,
        getSubmissions: vendorPortalService.getSubmissions,
        submitCandidate: vendorPortalService.submitCandidate,
    },
    skills: {
        list: skillService.list,
        create: skillService.create,
        remove: skillService.remove,
    },
    departments: {
        list: departmentService.list,
        create: departmentService.create,
        remove: departmentService.remove,
    },
    users: {
        list: userService.list,
        get: userService.getById,
        updateMe: userService.updateMe,
        update: userService.update,
        updateProfile: userService.updateProfile,
        resetPassword: userService.resetPassword,
        updateRole: userService.updateRole,
        toggleStatus: userService.toggleStatus,
        invite: userService.invite
    },
    interviews: {
        list: interviewService.getAll,
        get: interviewService.getById,
        getByCandidateId: interviewService.getByCandidateId,
        create: interviewService.create,
        update: interviewService.update,
        updateStatus: interviewService.updateStatus,
        numberOfInterviews: async () => (await interviewService.getAll()).length
    },
    feedback: {
        getByInterviewId: feedbackService.getByInterviewId,
        getByCandidateId: feedbackService.getByCandidateId,
        get: feedbackService.getById,
        create: feedbackService.create,
        downloadHtml: feedbackService.downloadHtml,
    },
    offers: {
        list: offerService.getAll,
        get: offerService.getById,
        getByCandidateId: offerService.getByCandidateId,
        create: offerService.create,
        update: offerService.update,
        updateStatus: offerService.updateStatus
    },
}
