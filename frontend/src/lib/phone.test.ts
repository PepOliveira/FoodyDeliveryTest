import { describe, expect, it } from 'vitest'
import { formatPhone, whatsappUrl } from './phone'

describe('formatPhone', () => {
  it('formats mobile numbers with nine digits', () => {
    expect(formatPhone('11999887766')).toBe('(11) 99988-7766')
  })

  it('formats landline numbers with eight digits', () => {
    expect(formatPhone('1133334444')).toBe('(11) 3333-4444')
  })

  it('formats progressively while typing', () => {
    expect(formatPhone('')).toBe('')
    expect(formatPhone('1')).toBe('1')
    expect(formatPhone('119')).toBe('(11) 9')
    expect(formatPhone('119998')).toBe('(11) 9998')
    expect(formatPhone('11999887')).toBe('(11) 9998-87')
  })

  it('ignores non-digits and extra digits', () => {
    expect(formatPhone('(11) 99988-7766 ramal 12')).toBe('(11) 99988-7766')
    expect(formatPhone('abc')).toBe('')
  })
})

describe('whatsappUrl', () => {
  it('adds the Brazilian country code to local numbers', () => {
    expect(whatsappUrl('(11) 99988-7766')).toBe('https://wa.me/5511999887766')
    expect(whatsappUrl('(21) 3456-7890')).toBe('https://wa.me/552134567890')
  })

  it('keeps numbers that already carry a country code', () => {
    expect(whatsappUrl('+55 11 99988-7766')).toBe('https://wa.me/5511999887766')
  })
})
