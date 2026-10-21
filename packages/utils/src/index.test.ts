import * as utils from './index';
import * as chatAttachments from './chatAttachments';
import * as landlordFinance from './landlordFinance';
import * as rentPeriod from './rentPeriod';
import * as tenancyBill from './tenancyBill';

describe('shared utility entry point', () => {
  const exported: Record<string, unknown> = utils;

  it.each([
    ['chat attachment', chatAttachments],
    ['landlord finance', landlordFinance],
    ['rent period', rentPeriod],
    ['tenancy bill', tenancyBill],
  ] as const)('retains every %s runtime export', (_name, module) => {
    for (const [name, value] of Object.entries(module)) {
      expect(exported[name]).toBe(value);
    }
  });
});
