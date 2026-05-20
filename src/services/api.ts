import { requirementService, candidateService, userService, interviewService, offerService, feedbackService } from './http'
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
        reject: requirementService.reject
    },
    candidates: {
        list: candidateService.getAll,
        getByRequirementId: candidateService.getByRequirementId,
        get: candidateService.getById,
        create: candidateService.create,
        update: candidateService.update,
        updateStatus: candidateService.updateStatus
    },
    activityLogs: {
        log: activityLogService.logActivity,
        getByEntity: activityLogService.getByEntity,
        list: activityLogService.getAll
    },
    users: {
        list: userService.list,
        get: userService.getById,
        create: userService.create,
        update: userService.update,
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
        create: feedbackService.create
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
