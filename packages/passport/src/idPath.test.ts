import { isVerifiedIdPath } from './idPath'

const USER = '11111111-1111-4111-8111-111111111111'
const VERIFICATION = '22222222-2222-4222-8222-222222222222'

it('treats the ID front and back as verified ID paths, never the selfie', () => {
  expect(isVerifiedIdPath(`${USER}/${VERIFICATION}/id-front.jpg`)).toBe(true)
  expect(isVerifiedIdPath(`${USER}/${VERIFICATION}/id-back.jpg`)).toBe(true)
  expect(isVerifiedIdPath(`${USER}/${VERIFICATION}/selfie.jpg`)).toBe(false)
  expect(isVerifiedIdPath(`${USER}/passport/id-front.jpg`)).toBe(false)
  expect(isVerifiedIdPath(`${USER}/${VERIFICATION}/govId-1700000000.jpg`)).toBe(false)
})
