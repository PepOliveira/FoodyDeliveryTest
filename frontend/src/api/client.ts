import axios, { AxiosError } from 'axios'

const TOKEN_KEY = 'foody.token'
export const AUTH_EXPIRED_EVENT = 'foody:auth-expired'

export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

export interface ApiError {
  status: number
  message: string
  fieldErrors?: Record<string, string> | null
}

export const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use((config) => {
  const token = tokenStorage.get()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const isAuthCall = error.config?.url?.startsWith('/auth/')
    if (error.response?.status === 401 && !isAuthCall) {
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT))
    }
    return Promise.reject(error)
  },
)

/** Extracts a human readable message from any error thrown by the API layer. */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError<ApiError>(error)) {
    if (!error.response) return 'Não foi possível conectar ao servidor.'
    const data = error.response.data
    if (data?.fieldErrors) return Object.values(data.fieldErrors).join(' · ')
    if (data?.message) return data.message
  }
  return 'Ocorreu um erro inesperado.'
}
