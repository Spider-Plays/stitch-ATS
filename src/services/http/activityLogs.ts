import { apiRequest } from '../../lib/apiClient'
import { ActivityLog } from '../../types'

export const activityLogService = {
  logActivity: (data: {
    entityType: ActivityLog['entityType']
    entityId: string
    action: string
    details?: unknown
  }) =>
    apiRequest<{ ok: boolean }>('/activity-logs', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getByEntity: (entityId: string, limitCount = 50) =>
    apiRequest<ActivityLog[]>(`/activity-logs/entity/${entityId}?limit=${limitCount}`),

  getAll: (limitCount = 100) =>
    apiRequest<ActivityLog[]>(`/activity-logs?limit=${limitCount}`),
}
