import { apiRequest } from '../../lib/apiClient'
import { ActivityLog } from '../../types'

export const activityLogService = {
  logActivity: async (_data: Omit<ActivityLog, 'id' | 'timestamp'>): Promise<void> => {
    // Activity is logged server-side on mutations
  },

  getByEntity: (entityId: string, limitCount = 50) =>
    apiRequest<ActivityLog[]>(`/activity-logs/entity/${entityId}?limit=${limitCount}`),

  getAll: (limitCount = 100) =>
    apiRequest<ActivityLog[]>(`/activity-logs?limit=${limitCount}`),
}
