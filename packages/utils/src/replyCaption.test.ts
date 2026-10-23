import { getReplyCaption } from './replyCaption';

describe('getReplyCaption', () => {
  it('words each reply direction like Instagram', () => {
    expect(getReplyCaption({ replierIsMe: true, quotedIsMine: true, otherName: 'Case' })).toBe('You replied to yourself');
    expect(getReplyCaption({ replierIsMe: true, quotedIsMine: false, otherName: 'Case' })).toBe('You replied to Case');
    expect(getReplyCaption({ replierIsMe: false, quotedIsMine: true, otherName: 'Case' })).toBe('Case replied to you');
    expect(getReplyCaption({ replierIsMe: false, quotedIsMine: false, otherName: 'Case' })).toBe('Case replied to themself');
  });

  it('falls back to a plain caption when the original is gone or the name is missing', () => {
    expect(getReplyCaption({ replierIsMe: true, quotedIsMine: null })).toBe('You replied');
    expect(getReplyCaption({ replierIsMe: false, quotedIsMine: null, otherName: 'Case' })).toBe('Case replied');
    expect(getReplyCaption({ replierIsMe: false, quotedIsMine: true, otherName: '  ' })).toBe('Someone replied to you');
  });
});
