import {
  buildVerificationInput,
  claimWebVerificationSession,
  extractSessionToken,
  submitSessionVerification,
  submitVerification,
  USER_VERIFICATION_BUCKET,
} from './verificationService'

const mockGetUser = jest.fn()
const mockFrom = jest.fn()
const mockRpc = jest.fn()
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
    rpc: (...args: unknown[]) => mockRpc(...args),
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
  CryptoDigestAlgorithm: { SHA256: 'SHA256' },
  CryptoEncoding: { HEX: 'HEX' },
  digestStringAsync: async () => 'hash-of-token',
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

const QR_TOKEN = 'a'.repeat(43)
const QR_URL = `https://apt.example.com/verify/mobile?token=${QR_TOKEN}`

describe('extractSessionToken', () => {
  it('extracts the token from a full verification URL', () => {
    expect(extractSessionToken(QR_URL)).toBe(QR_TOKEN)
  })

  it('accepts a bare token', () => {
    expect(extractSessionToken(QR_TOKEN)).toBe(QR_TOKEN)
  })

  it('rejects non-URL garbage and wrong shapes', () => {
    expect(extractSessionToken('not a code')).toBeNull()
    expect(extractSessionToken('https://apt.example.com/verify/mobile')).toBeNull()
    expect(
      extractSessionToken('https://apt.example.com/verify/mobile?token=short'),
    ).toBeNull()
    expect(extractSessionToken('')).toBeNull()
  })
})

describe('claimWebVerificationSession', () => {
  const liveSession = {
    verification_id: 'session-vid',
    status: 'active',
    expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  }

  function mockClaimTables(sessionRow: unknown) {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'users') {
        return createChain({
          data: { id: 'user-1', account_status: 'unverified' },
          error: null,
        })
      }
      if (table === 'verification_sessions') {
        return createChain({ data: sessionRow, error: null })
      }
      return createChain({ data: null, error: null })
    })
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: { id: 'auth-1' } }, error: null })
  })

  it('returns the session binding for a live code', async () => {
    mockClaimTables(liveSession)

    const session = await claimWebVerificationSession(QR_TOKEN)

    expect(session).toEqual({
      token: QR_TOKEN,
      userId: 'user-1',
      verificationId: 'session-vid',
      expiresAt: liveSession.expires_at,
    })
  })

  it('rejects a malformed token without touching the database', async () => {
    await expect(claimWebVerificationSession('short')).rejects.toThrow(
      'This verification code is invalid.',
    )
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('rejects codes belonging to another account or already used', async () => {
    mockClaimTables(null)
    await expect(claimWebVerificationSession(QR_TOKEN)).rejects.toThrow(
      'This code is invalid or belongs to another account.',
    )

    mockClaimTables({ ...liveSession, status: 'completed' })
    await expect(claimWebVerificationSession(QR_TOKEN)).rejects.toThrow(
      'This code has already been used. Please scan a new code.',
    )
  })

  it('rejects expired codes', async () => {
    mockClaimTables({
      ...liveSession,
      expires_at: new Date(Date.now() - 1000).toISOString(),
    })
    await expect(claimWebVerificationSession(QR_TOKEN)).rejects.toThrow(
      'This code has expired. Please scan a new code.',
    )
  })
})

describe('submitSessionVerification', () => {
  const liveSession = {
    verification_id: 'session-vid',
    status: 'active',
    expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  }
  const sessionRow = {
    id: 'session-vid',
    user_id: 'user-1',
    id_type: 'Driver’s License',
    id_front_path: 'user-1/session-vid/id-front.jpg',
    id_back_path: 'user-1/session-vid/id-back.jpg',
    selfie_path: 'user-1/session-vid/selfie.jpg',
    status: 'pending',
  }

  let verificationCalls = 0
  let insertChain: ReturnType<typeof createChain>

  beforeEach(() => {
    jest.clearAllMocks()
    verificationCalls = 0
    mockGetUser.mockResolvedValue({ data: { user: { id: 'auth-1' } }, error: null })
    insertChain = createChain({ data: sessionRow, error: null })
    mockFrom.mockImplementation((table: string) => {
      if (table === 'users') {
        return createChain({
          data: { id: 'user-1', account_status: 'unverified' },
          error: null,
        })
      }
      if (table === 'verification_sessions') {
        return createChain({ data: liveSession, error: null })
      }
      verificationCalls += 1
      // First user_verifications caller is the pending guard, the second is
      // the session insert, any later call is the post-consume confirm read.
      if (verificationCalls === 1) return createChain({ data: null, error: null })
      if (verificationCalls === 2) return insertChain
      return createChain({ data: sessionRow, error: null })
    })
    mockUpload.mockResolvedValue({ data: {}, error: null })
    mockRemove.mockResolvedValue({ data: {}, error: null })
    mockRpc.mockResolvedValue({ data: 'session-vid', error: null })
  })

  it('uploads into the session folder, inserts, then consumes exactly once', async () => {
    const row = await submitSessionVerification(QR_TOKEN, validInput)

    expect(row).toEqual(sessionRow)
    expect(mockUpload).toHaveBeenNthCalledWith(
      1,
      'user-1/session-vid/id-front.jpg',
      expect.anything(),
      { contentType: 'image/jpeg' },
    )
    expect(mockUpload).toHaveBeenNthCalledWith(
      3,
      'user-1/session-vid/selfie.jpg',
      expect.anything(),
      { contentType: 'image/jpeg' },
    )
    expect(insertChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'session-vid', user_id: 'user-1' }),
    )
    expect(mockRpc).toHaveBeenCalledWith('consume_verification_session', {
      p_token_hash: 'hash-of-token',
    })
    // Insert precedes consume: a spent session always has a recorded row.
    expect(insertChain.insert.mock.invocationCallOrder[0]).toBeLessThan(
      mockRpc.mock.invocationCallOrder[0],
    )
  })

  it('never consumes the session when the insert fails and rolls back uploads', async () => {
    insertChain.single = jest.fn(async () => ({
      data: null,
      error: new Error('insert boom'),
    }))

    await expect(
      submitSessionVerification(QR_TOKEN, validInput),
    ).rejects.toThrow('insert boom')
    expect(mockRpc).not.toHaveBeenCalled()
    expect(mockRemove).toHaveBeenCalledWith([
      'user-1/session-vid/id-front.jpg',
      'user-1/session-vid/id-back.jpg',
      'user-1/session-vid/selfie.jpg',
    ])
  })

  it('returns the recorded row when consume fails after a successful insert', async () => {
    mockRpc.mockResolvedValue({ data: null, error: new Error('consume boom') })

    const row = await submitSessionVerification(QR_TOKEN, validInput)

    expect(row).toEqual(sessionRow)
    expect(mockRemove).not.toHaveBeenCalled()
  })
})
