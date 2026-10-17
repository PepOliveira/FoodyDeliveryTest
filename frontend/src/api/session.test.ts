import { describe, expect, it } from 'vitest'
import { session } from './session'

const user = { id: 1, name: 'Ana', email: 'ana@test.com' }

describe('session', () => {
  it('has no user without a token', () => {
    expect(session.getToken()).toBeNull()
    expect(session.getUser()).toBeNull()
  })

  it('persists in localStorage when the user asks to stay signed in', () => {
    session.save('token-1', user, true)

    expect(localStorage.getItem('foody.token')).toBe('token-1')
    expect(sessionStorage.getItem('foody.token')).toBeNull()
    expect(session.getToken()).toBe('token-1')
    expect(session.getUser()).toEqual(user)
  })

  it('lives only in the tab when the user does not want to stay signed in', () => {
    session.save('token-2', user, false)

    expect(sessionStorage.getItem('foody.token')).toBe('token-2')
    expect(localStorage.getItem('foody.token')).toBeNull()
    expect(session.getToken()).toBe('token-2')
  })

  it('never keeps the token in both stores after a new login', () => {
    session.save('old', user, true)
    session.save('new', user, false)

    expect(localStorage.getItem('foody.token')).toBeNull()
    expect(session.getToken()).toBe('new')
  })

  it('clears everything on logout', () => {
    session.save('token-3', user, true)
    session.clear()

    expect(session.getToken()).toBeNull()
    expect(session.getUser()).toBeNull()
  })

  it('ignores a corrupted stored user', () => {
    localStorage.setItem('foody.token', 'token-4')
    localStorage.setItem('foody.user', '{not-json')

    expect(session.getUser()).toBeNull()
  })
})
