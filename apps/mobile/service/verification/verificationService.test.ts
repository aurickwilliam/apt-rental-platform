import {
  buildVerificationInput,
  submitVerification,
  USER_VERIFICATION_BUCKET,
} from './verificationService'

const mockGetUser = jest.fn()
const mockFrom = jest.fn()
const mockUpload = jest.fn()
const mockRemove = jest.fn()
const mockStorageFrom = jest.fn((_bucket: string) => ({
  upload: mockUpload,
  remove: mockRemove,
}))

jest.mock('@repo/supabase', () => ({
  supabase: {
    auth: { getUser: (...args: unknown[]) => mockGetUser(...args) },
    from: (...args: unknown[]) => mockFrom(...args),
    storage: { from: (bucket: string) => mockStorageFrom(bucket) },
  },
}))

jest.mock('expo-file-system', () => ({
  File: jest.fn().mockImplementation(() => ({
    bytes: async () => new Uint8Array([1, 2, 3]),
  })),
}))

jest.mock('expo-crypto', () => ({
  randomUUID: () => 'verification-1',
}))

jest.mock('@/utils/compressImage', () => ({
  compressImage: jest.fn(
    async (uri: string, width: number, height: number) => ({
      uri: `${uri}-compressed`,
      width,
      height,
    }),
  ),
}))

type ChainResult = { data: unknown; error: unknown }

function createChain(result: ChainResult) {
  const chain: Record<string, jest.Mock> = {}
  chain.select = jest.fn(() => chain)
  chain.eq = jest.fn(() => chain)
  chain.order = jest.fn(() => chain)
  chain.limit = jest.fn(() => chain)
  chain.insert = jest.fn(() => chain)
  chain.single = jest.fn(async () => result)
  chain.maybeSingle = jest.fn(async () => result)
  return chain
}

const image = (uri: string) => ({ uri, width: 1200, height: 800 })

const validInput = {
  idType: 'Driver’s License',
  idFront: image('file:///front.jpg'),
  idBack: image('file:///back.jpg'),
  selfie: image('file:///selfie.jpg'),
}

const createdRow = {
  id: 'verification-1',
  user_id: 'user-1',
  id_type: 'Driver’s License',
  id_front_path: 'user-1/verification-1/id-front.jpg',
  id_back_path: 'user-1/verification-1/id-back.jpg',
  selfie_path: 'user-1/verification-1/selfie.jpg',
  status: 'pending',
}

describe('buildVerificationInput', () => {
  it('throws when the ID front photo is missing', () => {
    expect(() =>
      buildVerificationInput('Driver’s License', {
        back: image('file:///back.jpg'),
        selfie: image('file:///selfie.jpg'),
      }),
    ).toThrow('ID front photo is required.')
  })

  it('throws when the ID back photo is missing for a card ID', () => {
    expect(() =>
      buildVerificationInput('Driver’s License', {
        front: image('file:///front.jpg'),
        selfie: image('file:///selfie.jpg'),
      }),
    ).toThrow('ID back photo is required.')
  })

  it('throws when the selfie is missing', () => {
    expect(() =>
      buildVerificationInput('Driver’s License', {
        front: image('file:///front.jpg'),
        back: image('file:///back.jpg'),
      }),
    ).toThrow('A selfie holding your ID is required.')
  })

  it('accepts a single-page ID without a back photo', () => {
    const input = buildVerificationInput('Passport', {
      'identity-page': image('file:///passport.jpg'),
      selfie: image('file:///selfie.jpg'),
    })

    expect(input.idType).toBe('Passport')
    expect(input.idBack).toBeNull()
  })
})

describe('submitVerification', () => {
  let userChain: ReturnType<typeof createChain>
  let pendingChain: ReturnType<typeof createChain>
  let insertChain: ReturnType<typeof createChain>

  beforeEach(() => {
    jest.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: { id: 'auth-1' } }, error: null })
    userChain = createChain({
      data: { id: 'user-1', account_status: 'unverified' },
      error: null,
    })
    pendingChain = createChain({ data: null, error: null })
    insertChain = createChain({ data: createdRow, error: null })
    mockFrom.mockImplementation((table: string) => {
      if (table === 'users') return userChain
      // First user_verifications caller is the pending guard (maybeSingle),
      // the second is the insert (single). Route by call order.
      return mockFrom.mock.calls.filter(([t]) => t === 'user_verifications')
        .length <= 1
        ? pendingChain
        : insertChain
    })
    mockUpload.mockResolvedValue({ data: {}, error: null })
    mockRemove.mockResolvedValue({ data: {}, error: null })
  })

  it('uploads three files to the expected private paths and inserts the row', async () => {
    const row = await submitVerification(validInput)

    expect(row).toEqual(createdRow)
    expect(mockStorageFrom).toHaveBeenCalledWith(USER_VERIFICATION_BUCKET)
    expect(mockUpload).toHaveBeenNthCalledWith(
      1,
      'user-1/verification-1/id-front.jpg',
      expect.anything(),
      { contentType: 'image/jpeg' },
    )
    expect(mockUpload).toHaveBeenNthCalledWith(
      2,
      'user-1/verification-1/id-back.jpg',
      expect.anything(),
      { contentType: 'image/jpeg' },
    )
    expect(mockUpload).toHaveBeenNthCalledWith(
      3,
      'user-1/verification-1/selfie.jpg',
      expect.anything(),
      { contentType: 'image/jpeg' },
    )
    expect(insertChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'verification-1',
        user_id: 'user-1',
        id_type: 'Driver’s License',
        id_front_path: 'user-1/verification-1/id-front.jpg',
        id_back_path: 'user-1/verification-1/id-back.jpg',
        selfie_path: 'user-1/verification-1/selfie.jpg',
        status: 'pending',
      }),
    )
  })

  it('blocks a duplicate submission while one is pending without uploading', async () => {
    pendingChain.maybeSingle = jest.fn(async () => ({
      data: { id: 'older-pending' },
      error: null,
    }))

    await expect(submitVerification(validInput)).rejects.toThrow(
      'You already have a verification under review.',
    )
    expect(mockUpload).not.toHaveBeenCalled()
    expect(mockRemove).not.toHaveBeenCalled()
  })

  it('blocks resubmission while already verified without uploading', async () => {
    userChain.single = jest.fn(async () => ({
      data: { id: 'user-1', account_status: 'verified' },
      error: null,
    }))

    await expect(submitVerification(validInput)).rejects.toThrow(
      'Your account is already verified.',
    )
    expect(mockUpload).not.toHaveBeenCalled()
  })

  it('requires a signed-in user', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null })

    await expect(submitVerification(validInput)).rejects.toThrow(
      'You must be signed in to submit verification.',
    )
    expect(mockUpload).not.toHaveBeenCalled()
  })

  it('deletes the front upload when the back upload fails and skips the insert', async () => {
    mockUpload
      .mockResolvedValueOnce({ data: {}, error: null })
      .mockResolvedValueOnce({ data: null, error: new Error('network down') })

    await expect(submitVerification(validInput)).rejects.toThrow(
      'Failed to upload id-back.jpg',
    )
    expect(mockRemove).toHaveBeenCalledWith([
      'user-1/verification-1/id-front.jpg',
    ])
    expect(insertChain.insert).not.toHaveBeenCalled()
  })

  it('deletes all three uploads when the database insert fails', async () => {
    insertChain.single = jest.fn(async () => ({
      data: null,
      error: new Error('insert boom'),
    }))

    await expect(submitVerification(validInput)).rejects.toThrow('insert boom')
    expect(mockRemove).toHaveBeenCalledWith([
      'user-1/verification-1/id-front.jpg',
      'user-1/verification-1/id-back.jpg',
      'user-1/verification-1/selfie.jpg',
    ])
  })
})
