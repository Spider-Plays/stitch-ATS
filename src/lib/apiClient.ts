const TOKEN_KEY = 'stitch_auth_token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`/api${path}`, { ...options, headers })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    if (res.status === 401) {
      clearToken()
      window.dispatchEvent(new Event('auth:session-expired'))
    }
    throw new ApiError(body.error || res.statusText, res.status)
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export async function uploadFormData<T>(path: string, formData: FormData): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`/api${path}`, { method: 'POST', body: formData, headers })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    if (res.status === 401) {
      clearToken()
      window.dispatchEvent(new Event('auth:session-expired'))
    }
    throw new ApiError(body.error || res.statusText, res.status)
  }

  return res.json() as Promise<T>
}

export async function fetchResumeBlob(candidateId: string): Promise<Blob | null> {
  const token = getToken()
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`/api/candidates/${candidateId}/resume`, { headers })

  if (res.status === 404) return null
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    if (res.status === 401) {
      clearToken()
      window.dispatchEvent(new Event('auth:session-expired'))
    }
    throw new ApiError(body.error || res.statusText, res.status)
  }

  return res.blob()
}
