import type { User } from './auth'

const TOKEN_KEY = 'foody.token'
const USER_KEY = 'foody.user'

// "Keep me signed in" uses localStorage; otherwise the session lives only in this tab.
const stores = [localStorage, sessionStorage]

function read(key: string): string | null {
  for (const store of stores) {
    const value = store.getItem(key)
    if (value) return value
  }
  return null
}

export const session = {
  getToken: () => read(TOKEN_KEY),

  getUser(): User | null {
    if (!read(TOKEN_KEY)) return null
    try {
      return JSON.parse(read(USER_KEY) ?? 'null') as User | null
    } catch {
      return null
    }
  },

  save(token: string, user: User, remember: boolean) {
    session.clear()
    const store = remember ? localStorage : sessionStorage
    store.setItem(TOKEN_KEY, token)
    store.setItem(USER_KEY, JSON.stringify(user))
  },

  clear() {
    for (const store of stores) {
      store.removeItem(TOKEN_KEY)
      store.removeItem(USER_KEY)
    }
  },
}
