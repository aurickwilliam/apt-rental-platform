import * as Clipboard from 'expo-clipboard';
import { File } from 'expo-file-system';

import {
  canCopyImageMessage,
  copyChatImageToClipboard,
  pastedImageMimeType,
} from './clipboardImage';

const mockFile = {
  uri: 'file:///cache/chat-clipboard.img',
  base64: jest.fn(),
  delete: jest.fn(),
};

jest.mock('expo-clipboard', () => ({
  setImageAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('expo-file-system', () => ({
  Paths: { cache: 'file:///cache/' },
  File: Object.assign(
    jest.fn(() => mockFile),
    { downloadFileAsync: jest.fn(() => Promise.resolve(mockFile)) }
  ),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockFile.base64.mockResolvedValue('QUJD');
});

describe('canCopyImageMessage', () => {
  it('accepts photos that have a URL', () => {
    expect(canCopyImageMessage({ messageType: 'image', attachmentUrl: 'https://x/a.jpg' })).toBe(true);
  });

  it('rejects other types and unresolved URLs', () => {
    expect(canCopyImageMessage({ messageType: 'gif', attachmentUrl: 'https://x/a.gif' })).toBe(false);
    expect(canCopyImageMessage({ messageType: 'video', attachmentUrl: 'https://x/a.mp4' })).toBe(false);
    expect(canCopyImageMessage({ messageType: 'text', attachmentUrl: null })).toBe(false);
    expect(canCopyImageMessage({ messageType: 'image', attachmentUrl: null })).toBe(false);
  });
});

describe('copyChatImageToClipboard', () => {
  it('puts the downloaded image on the clipboard and removes the temp file', async () => {
    await copyChatImageToClipboard('https://x/a.jpg');

    expect(File.downloadFileAsync).toHaveBeenCalledWith('https://x/a.jpg', mockFile, { idempotent: true });
    expect(Clipboard.setImageAsync).toHaveBeenCalledWith('QUJD');
    expect(mockFile.delete).toHaveBeenCalled();
  });

  it('still removes the temp file when the clipboard write fails', async () => {
    (Clipboard.setImageAsync as jest.Mock).mockRejectedValueOnce(new Error('denied'));

    await expect(copyChatImageToClipboard('https://x/a.jpg')).rejects.toThrow('denied');
    expect(mockFile.delete).toHaveBeenCalled();
  });
});

describe('pastedImageMimeType', () => {
  it('maps known extensions, ignoring case and query strings', () => {
    expect(pastedImageMimeType('file:///cache/a.PNG')).toBe('image/png');
    expect(pastedImageMimeType('file:///cache/a.gif?x=1')).toBe('image/gif');
    expect(pastedImageMimeType('file:///cache/a.webp')).toBe('image/webp');
  });

  it('falls back to JPEG for anything else', () => {
    expect(pastedImageMimeType('file:///cache/a.heic')).toBe('image/jpeg');
    expect(pastedImageMimeType('file:///cache/no-extension')).toBe('image/jpeg');
  });
});
