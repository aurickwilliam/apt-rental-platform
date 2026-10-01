import {
  deletePassportDocument,
  fetchPassportDocuments,
  fetchPassportDocumentsWithVerification,
  fetchPassportVerifiedPaths,
  linkApprovedVerification,
  passportDocsForSlot,
  uploadPassportDocument,
  type PassportDocumentRow,
} from './passportService';

const mockUpload = jest.fn();
const mockRemove = jest.fn();
const mockFrom = jest.fn();
const mockBytes = jest.fn();

jest.mock('@repo/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
    storage: { from: () => ({ upload: mockUpload, remove: mockRemove }) },
  },
}));

jest.mock('expo-file-system', () => ({
  File: jest.fn().mockImplementation(() => ({ bytes: mockBytes })),
}));

function chainable(terminal: Record<string, jest.Mock>) {
  const chain: Record<string, unknown> = {};
  for (const key of ['select', 'eq', 'in', 'order', 'limit', 'is', 'insert', 'update', 'delete']) {
    chain[key] = jest.fn().mockReturnValue(chain);
  }
  Object.assign(chain, terminal);
  return chain;
}

const baseRow: PassportDocumentRow = {
  id: 'doc-1',
  user_id: 'user-1',
  doc_type: 'Payslip',
  storage_path: 'user-1/passport/payslip-123.jpg',
  storage_path_back: null,
  mime_type: 'image/jpeg',
  id_type: null,
  verification_id: null,
  is_verified: false,
  is_primary: false,
  expires_at: null,
  created_at: '2026-09-01T00:00:00.000Z',
  updated_at: null,
};

describe('fetchPassportDocuments', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns the user wallet newest first', async () => {
    mockFrom.mockReturnValue(
      chainable({ order: jest.fn().mockResolvedValue({ data: [baseRow], error: null }) })
    );

    const docs = await fetchPassportDocuments('user-1');

    expect(mockFrom).toHaveBeenCalledWith('passport_documents');
    expect(docs).toHaveLength(1);
    expect(docs[0]?.doc_type).toBe('Payslip');
  });

  it('throws when the fetch fails', async () => {
    mockFrom.mockReturnValue(
      chainable({ order: jest.fn().mockResolvedValue({ data: null, error: new Error('RLS blocked') }) })
    );

    await expect(fetchPassportDocuments('user-1')).rejects.toThrow('RLS blocked');
  });
});

describe('uploadPassportDocument', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockBytes.mockResolvedValue(new Uint8Array([1, 2, 3]));
    mockUpload.mockResolvedValue({ error: null });
    mockRemove.mockResolvedValue({ error: null });
  });

  it('uploads under the passport prefix and inserts a wallet row', async () => {
    mockFrom.mockReturnValue(
      chainable({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: baseRow, error: null }),
        }),
      })
    );

    const row = await uploadPassportDocument({
      userId: 'user-1',
      docType: 'Payslip',
      asset: { uri: 'file:///payslip.jpg', fileName: 'payslip.jpg', mimeType: 'image/jpeg' },
    });

    expect(mockUpload).toHaveBeenCalledTimes(1);
    const [path] = mockUpload.mock.calls[0] as [string, unknown, unknown];
    expect(path.startsWith('user-1/passport/payslip-')).toBe(true);
    expect(mockFrom).toHaveBeenCalledWith('passport_documents');
    expect(row.doc_type).toBe('Payslip');
  });

  it('cleans up storage when the insert fails', async () => {
    mockFrom.mockReturnValue(
      chainable({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: null, error: { message: 'db down' } }),
        }),
      })
    );

    await expect(
      uploadPassportDocument({
        userId: 'user-1',
        docType: 'Payslip',
        asset: { uri: 'file:///payslip.jpg', fileName: 'payslip.jpg', mimeType: 'image/jpeg' },
      })
    ).rejects.toThrow('db down');
    expect(mockRemove).toHaveBeenCalledTimes(1);
  });
});

describe('fetchPassportDocumentsWithVerification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('links the approved verification before reading the wallet', async () => {
    const verification = {
      id: 'verification-1',
      id_type: 'Passport',
      id_front_path: 'user-1/verification-1/id-front.jpg',
      id_back_path: 'user-1/verification-1/id-back.jpg',
    };
    const primary = {
      ...baseRow,
      doc_type: 'Passport',
      storage_path: verification.id_front_path,
      storage_path_back: verification.id_back_path,
      id_type: 'Passport',
      verification_id: 'verification-1',
      is_verified: true,
      is_primary: true,
    };
    const walletQuery = chainable({
      order: jest.fn().mockResolvedValue({ data: [primary], error: null }),
    });

    mockFrom
      .mockReturnValueOnce(
        chainable({ maybeSingle: jest.fn().mockResolvedValue({ data: verification, error: null }) })
      )
      .mockReturnValueOnce(
        chainable({ maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }) })
      )
      .mockReturnValueOnce(
        chainable({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: primary, error: null }),
          }),
        })
      )
      .mockReturnValueOnce(walletQuery);

    const docs = await fetchPassportDocumentsWithVerification('user-1');

    expect(mockFrom).toHaveBeenNthCalledWith(1, 'user_verifications');
    expect(mockFrom).toHaveBeenLastCalledWith('passport_documents');
    expect(docs).toHaveLength(1);
    expect(docs[0]?.is_primary).toBe(true);
  });
});

describe('linkApprovedVerification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns null when there is no approved verification', async () => {
    mockFrom.mockReturnValue(
      chainable({
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      })
    );

    await expect(linkApprovedVerification('user-1')).resolves.toBeNull();
  });

  it('returns the existing link without inserting a duplicate', async () => {
    const verification = {
      id: 'verification-1',
      id_type: 'Passport',
      id_front_path: 'user-1/verification-1/id-front.jpg',
      id_back_path: 'user-1/verification-1/id-back.jpg',
    };
    const existing = {
      ...baseRow,
      verification_id: 'verification-1',
      is_verified: true,
      is_primary: true,
      storage_path: 'user-1/verification-1/id-front.jpg',
      storage_path_back: 'user-1/verification-1/id-back.jpg',
    };
    mockFrom
      .mockReturnValueOnce(
        chainable({ maybeSingle: jest.fn().mockResolvedValue({ data: verification, error: null }) })
      )
      .mockReturnValueOnce(
        chainable({ maybeSingle: jest.fn().mockResolvedValue({ data: existing, error: null }) })
      );

    const linked = await linkApprovedVerification('user-1');

    expect(linked?.verification_id).toBe('verification-1');
    expect(mockFrom).toHaveBeenCalledTimes(2);
  });

  it('inserts the primary link with front and back captures', async () => {
    const verification = {
      id: 'verification-1',
      id_type: 'Passport',
      id_front_path: 'user-1/verification-1/id-front.jpg',
      id_back_path: 'user-1/verification-1/id-back.jpg',
    };
    const inserted = {
      ...baseRow,
      doc_type: 'Passport',
      storage_path: verification.id_front_path,
      storage_path_back: verification.id_back_path,
      id_type: 'Passport',
      verification_id: 'verification-1',
      is_verified: true,
      is_primary: true,
    };
    mockFrom
      .mockReturnValueOnce(
        chainable({ maybeSingle: jest.fn().mockResolvedValue({ data: verification, error: null }) })
      )
      .mockReturnValueOnce(
        chainable({ maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }) })
      )
      .mockReturnValueOnce(
        chainable({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: inserted, error: null }),
          }),
        })
      );

    const linked = await linkApprovedVerification('user-1');

    expect(linked?.is_primary).toBe(true);
    expect(linked?.storage_path_back).toBe('user-1/verification-1/id-back.jpg');
  });

  it('upgrades a legacy link with the primary flag and back capture', async () => {
    const verification = {
      id: 'verification-1',
      id_type: 'Passport',
      id_front_path: 'user-1/verification-1/id-front.jpg',
      id_back_path: 'user-1/verification-1/id-back.jpg',
    };
    const legacy = { ...baseRow, verification_id: 'verification-1', is_verified: true };
    const upgraded = {
      ...legacy,
      storage_path: verification.id_front_path,
      storage_path_back: verification.id_back_path,
      is_primary: true,
    };
    mockFrom
      .mockReturnValueOnce(
        chainable({ maybeSingle: jest.fn().mockResolvedValue({ data: verification, error: null }) })
      )
      .mockReturnValueOnce(
        chainable({ maybeSingle: jest.fn().mockResolvedValue({ data: legacy, error: null }) })
      )
      .mockReturnValueOnce(
        chainable({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: upgraded, error: null }),
            }),
          }),
        })
      );

    const linked = await linkApprovedVerification('user-1');

    expect(linked?.is_primary).toBe(true);
    expect(linked?.storage_path_back).toBe('user-1/verification-1/id-back.jpg');
  });
});

describe('deletePassportDocument', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRemove.mockResolvedValue({ error: null });
  });

  it('blocks deletion of the primary verification ID', async () => {
    mockFrom.mockReturnValue(
      chainable({
        maybeSingle: jest.fn().mockResolvedValue({
          data: { is_primary: true, verification_id: 'verification-1' },
          error: null,
        }),
      })
    );

    await expect(
      deletePassportDocument({ id: 'doc-1', userId: 'user-1', storagePath: 'user-1/passport/passport-1.jpg' })
    ).rejects.toThrow('managed automatically');
    expect(mockFrom).toHaveBeenCalledTimes(1);
    expect(mockRemove).not.toHaveBeenCalled();
  });

  it('blocks deletion while an active application references the path', async () => {
    mockFrom
      .mockReturnValueOnce(
        chainable({
          maybeSingle: jest.fn().mockResolvedValue({
            data: { is_primary: false, verification_id: null },
            error: null,
          }),
        })
      )
      .mockReturnValueOnce(
        chainable({
          in: jest.fn().mockResolvedValue({
            data: [{ gov_id_url: 'user-1/passport/national-id-1.jpg', proof_of_income_url: null, proof_of_billing_url: null, nbi_clearance_url: null }],
            error: null,
          }),
        })
      );

    await expect(
      deletePassportDocument({ id: 'doc-1', userId: 'user-1', storagePath: 'user-1/passport/national-id-1.jpg' })
    ).rejects.toThrow('active application');
    expect(mockRemove).not.toHaveBeenCalled();
  });

  it('removes storage and the row when unreferenced', async () => {
    const nestedEq = jest.fn().mockResolvedValue({ error: null });
    const deleteEq = jest.fn().mockReturnValue({ eq: nestedEq });
    mockFrom
      .mockReturnValueOnce(
        chainable({
          maybeSingle: jest.fn().mockResolvedValue({
            data: { is_primary: false, verification_id: null },
            error: null,
          }),
        })
      )
      .mockReturnValueOnce(
        chainable({
          in: jest.fn().mockResolvedValue({ data: [], error: null }),
        })
      )
      .mockReturnValueOnce(
        chainable({ eq: deleteEq })
      );

    await deletePassportDocument({ id: 'doc-1', userId: 'user-1', storagePath: 'user-1/passport/old.jpg' });

    expect(mockRemove).toHaveBeenCalledWith(['user-1/passport/old.jpg']);
    expect(mockFrom).toHaveBeenCalledWith('passport_documents');
  });
});

describe('fetchPassportVerifiedPaths', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns only verified storage paths', async () => {
    mockFrom.mockReturnValue(
      chainable({
        eq: jest.fn().mockReturnValue(
          chainable({
            eq: jest.fn().mockResolvedValue({
              data: [{ storage_path: 'user-1/passport/national-id-1.jpg' }],
              error: null,
            }),
          })
        ),
      })
    );

    const verified = await fetchPassportVerifiedPaths('user-1', [
      'user-1/passport/national-id-1.jpg',
      'user-1/passport/other.jpg',
    ]);

    expect(verified.has('user-1/passport/national-id-1.jpg')).toBe(true);
    expect(verified.has('user-1/passport/other.jpg')).toBe(false);
  });

  it('returns an empty set without querying when there is nothing to check', async () => {
    await expect(fetchPassportVerifiedPaths('user-1', [])).resolves.toEqual(new Set());
    expect(mockFrom).not.toHaveBeenCalled();
  });
});

describe('passportDocsForSlot', () => {
  const verifiedId: PassportDocumentRow = {
    ...baseRow,
    id: 'doc-id',
    doc_type: 'Passport',
    storage_path: 'user-1/passport/passport-1.jpg',
    id_type: 'Passport',
    is_verified: true,
    is_primary: true,
  };
  const otherVerifiedId: PassportDocumentRow = {
    ...baseRow,
    id: 'doc-id-2',
    doc_type: 'National ID',
    storage_path: 'user-1/passport/national-id-1.jpg',
    id_type: 'National ID (PhilSys/PhilID)',
    is_verified: true,
    created_at: '2026-09-02T00:00:00.000Z',
  };
  const payslip: PassportDocumentRow = { ...baseRow, id: 'doc-pay' };
  const birth: PassportDocumentRow = {
    ...baseRow,
    id: 'doc-birth',
    doc_type: 'Birth Certificate',
    storage_path: 'user-1/passport/birth-1.jpg',
  };

  it('matches any ID doc to the govId slot with the primary ID first', () => {
    const matches = passportDocsForSlot([otherVerifiedId, payslip, birth, verifiedId], 'govId');
    expect(matches.map((d) => d.id)).toEqual(['doc-id', 'doc-id-2']);
  });

  it('matches income-adjacent types to the proofOfIncome slot', () => {
    const matches = passportDocsForSlot([birth, payslip, verifiedId], 'proofOfIncome');
    expect(matches.map((d) => d.id)).toEqual(['doc-pay']);
  });

  it('matches nothing outside the slot taxonomy', () => {
    expect(passportDocsForSlot([birth], 'nbiClearance')).toEqual([]);
  });
});
