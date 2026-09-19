const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

const ADMIN_API_KEY_STORAGE_KEY = 'ohbangit-admin-key'
const ADMIN_API_KEY_EVENT = 'ohbangit-admin-key-change'

export function getAdminApiKey(): string {
    return sessionStorage.getItem(ADMIN_API_KEY_STORAGE_KEY) ?? ''
}

export function setAdminApiKey(key: string): void {
    sessionStorage.setItem(ADMIN_API_KEY_STORAGE_KEY, key)
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event(ADMIN_API_KEY_EVENT))
    }
}

export function clearAdminApiKey(): void {
    sessionStorage.removeItem(ADMIN_API_KEY_STORAGE_KEY)
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event(ADMIN_API_KEY_EVENT))
    }
}

export function getAdminApiKeyEventName(): string {
    return ADMIN_API_KEY_EVENT
}

function buildAdminHeaders(): Record<string, string> {
    const key = getAdminApiKey()
    if (key.length === 0) return {}
    return { 'x-api-key': key }
}

export interface ApiErrorDetail {
    field: string
    reason: string
}

export class ApiError extends Error {
    readonly code: string
    readonly status: number
    readonly details?: ApiErrorDetail[]
    readonly currentVersion?: number

    constructor({
        code,
        message,
        status,
        details,
        currentVersion,
    }: {
        code: string
        message: string
        status: number
        details?: ApiErrorDetail[]
        currentVersion?: number
    }) {
        super(message)
        this.name = 'ApiError'
        this.code = code
        this.status = status
        this.details = details
        this.currentVersion = currentVersion
    }
}

async function handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        const body: unknown = await response.json().catch(() => null)
        let code = 'UNKNOWN_ERROR'
        let message = `HTTP ${response.status} 오류가 발생했습니다`
        let currentVersion: number | undefined
        let details: ApiErrorDetail[] | undefined

        if (typeof body === 'object' && body !== null && !Array.isArray(body)) {
            const envelope = body as { error?: unknown; message?: unknown }
            const errorValue = envelope.error
            if (typeof errorValue === 'string') {
                code = 'LEGACY_ERROR'
                message = errorValue
            } else if (typeof errorValue === 'object' && errorValue !== null && !Array.isArray(errorValue)) {
                const codedError = errorValue as {
                    code?: unknown
                    message?: unknown
                    currentVersion?: unknown
                    details?: unknown
                }
                if (typeof codedError.code === 'string') code = codedError.code
                if (typeof codedError.message === 'string') message = codedError.message
                if (
                    typeof codedError.currentVersion === 'number' &&
                    Number.isSafeInteger(codedError.currentVersion) &&
                    codedError.currentVersion >= 0
                ) {
                    currentVersion = codedError.currentVersion
                }
                if (Array.isArray(codedError.details)) {
                    const parsedDetails = codedError.details.flatMap((detail): ApiErrorDetail[] => {
                        if (typeof detail !== 'object' || detail === null || Array.isArray(detail)) return []
                        const candidate = detail as { field?: unknown; reason?: unknown }
                        if (typeof candidate.field !== 'string' || typeof candidate.reason !== 'string') return []
                        return [{ field: candidate.field, reason: candidate.reason }]
                    })
                    if (parsedDetails.length > 0) details = parsedDetails
                }
            } else if (typeof envelope.message === 'string') {
                code = 'LEGACY_ERROR'
                message = envelope.message
            }
        }

        throw new ApiError({ code, message, status: response.status, details, currentVersion })
    }
    if (response.status === 204) {
        return null as T
    }
    const rawBody = await response.text()
    if (rawBody.trim().length === 0) {
        return null as T
    }
    return JSON.parse(rawBody) as T
}

export async function adminApiGet<T>(path: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(`${BASE_URL}${path}`, window.location.origin)
    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            url.searchParams.set(key, value)
        })
    }
    const response = await fetch(url.toString(), {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', ...buildAdminHeaders() },
    })
    return handleResponse<T>(response)
}

export async function adminApiPost<T>(path: string, body: unknown): Promise<T> {
    const response = await fetch(`${BASE_URL}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...buildAdminHeaders() },
        body: JSON.stringify(body),
    })
    return handleResponse<T>(response)
}

export async function adminApiPatch<T>(path: string, body: unknown): Promise<T> {
    const response = await fetch(`${BASE_URL}${path}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...buildAdminHeaders() },
        body: JSON.stringify(body),
    })
    return handleResponse<T>(response)
}

export async function adminApiPut<T>(path: string, body: unknown): Promise<T> {
    const response = await fetch(`${BASE_URL}${path}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...buildAdminHeaders() },
        body: JSON.stringify(body),
    })
    return handleResponse<T>(response)
}

export async function adminApiDelete(path: string): Promise<void> {
    const response = await fetch(`${BASE_URL}${path}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', ...buildAdminHeaders() },
    })
    if (!response.ok && response.status !== 204) {
        await handleResponse<never>(response)
    }
}
