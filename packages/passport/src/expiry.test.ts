import { isExpiredDate, toExpiryDateString, validateExpiryDate } from './expiry'

const today = new Date(2026, 9, 3, 23, 59)

describe('Passport expiry calendar dates', () => {
  it('formats a local date for the database', () => {
    expect(toExpiryDateString(new Date(2026, 0, 9, 18))).toBe('2026-01-09')
  })

  it('only treats days before today as expired', () => {
    expect(isExpiredDate('2026-10-02', today)).toBe(true)
    expect(isExpiredDate('2026-10-03', today)).toBe(false)
    expect(isExpiredDate('2026-10-04', today)).toBe(false)
    expect(isExpiredDate(null, today)).toBe(false)
    expect(isExpiredDate('invalid', today)).toBe(false)
    expect(isExpiredDate('2026-02-30', today)).toBe(false)
  })

  it('blocks a past selection but accepts today, future, and no expiry', () => {
    expect(validateExpiryDate(new Date(2026, 9, 2), today)).toBe('Expiry date cannot be in the past.')
    expect(validateExpiryDate(new Date(2026, 9, 3), today)).toBeNull()
    expect(validateExpiryDate(new Date(2026, 9, 4), today)).toBeNull()
    expect(validateExpiryDate(null, today)).toBeNull()
    expect(validateExpiryDate(new Date(NaN), today)).toBe('Select a valid expiry date.')
  })
})
