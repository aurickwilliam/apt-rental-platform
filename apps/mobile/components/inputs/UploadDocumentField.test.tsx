import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

import UploadDocumentField, { type UploadedDocument } from './UploadDocumentField';
import { compressImage } from '@/utils/compressImage';

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));

jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn(),
}));

jest.mock('@/utils/compressImage', () => ({
  compressImage: jest.fn(),
}));

jest.mock('@/hooks/useTheme', () => ({
  useColors: () => ({
    colors: {
      gray200: '#e5e5e5',
      textPrimary: '#000000',
      primary: '#376BF5',
    },
    isDark: false,
  }),
}));

// heroui-native's BottomSheet relies on react-native-reanimated's native
// worklets runtime, which has no implementation in the Jest environment.
// Stub it with a plain conditional View so its content is always
// queryable/tappable in tests, matching this test file's interaction style.
jest.mock('heroui-native', () => {
  const { View } = require('react-native');

  const BottomSheetRoot = ({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) =>
    isOpen ? <View>{children}</View> : null;
  const Passthrough = ({ children }: { children: React.ReactNode }) => <View>{children}</View>;

  return {
    BottomSheet: Object.assign(BottomSheetRoot, {
      Portal: Passthrough,
      Overlay: () => null,
      Content: Passthrough,
    }),
    Separator: () => null,
  };
});

const openAddDocumentSheet = async () => {
  fireEvent.press(screen.getByText('Add document'));
  await waitFor(() => screen.getByText('Choose photo'));
};

describe('UploadDocumentField', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderField = (props: Partial<React.ComponentProps<typeof UploadDocumentField>> = {}) =>
    render(
      <UploadDocumentField
        label="Document"
        value={null}
        onChange={mockOnChange}
        {...props}
      />,
    );

  describe('default behavior (acceptedFileMimeTypes omitted)', () => {
    it('accepts a PDF file and calls onChange', async () => {
      (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [{ uri: 'file://doc.pdf', name: 'doc.pdf', mimeType: 'application/pdf', size: 1000 }],
      });

      renderField();
      await openAddDocumentSheet();
      fireEvent.press(screen.getByText('Choose file'));

      await waitFor(() => expect(mockOnChange).toHaveBeenCalledWith({
        kind: 'file',
        asset: { uri: 'file://doc.pdf', name: 'doc.pdf', mimeType: 'application/pdf', size: 1000 },
      }));
    });

    it('accepts a Word document and calls onChange', async () => {
      (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [{ uri: 'file://doc.docx', name: 'doc.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', size: 1000 }],
      });

      renderField();
      await openAddDocumentSheet();
      fireEvent.press(screen.getByText('Choose file'));

      await waitFor(() => expect(mockOnChange).toHaveBeenCalled());
    });
  });

  describe('acceptedFileMimeTypes={["application/pdf"]}', () => {
    it('accepts a PDF and calls onChange (Req 4.1)', async () => {
      (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [{ uri: 'file://doc.pdf', name: 'doc.pdf', mimeType: 'application/pdf', size: 1000 }],
      });

      renderField({ acceptedFileMimeTypes: ['application/pdf'] });
      await openAddDocumentSheet();
      fireEvent.press(screen.getByText('Choose file'));

      await waitFor(() => expect(mockOnChange).toHaveBeenCalledWith({
        kind: 'file',
        asset: { uri: 'file://doc.pdf', name: 'doc.pdf', mimeType: 'application/pdf', size: 1000 },
      }));
    });

    it('rejects a DOCX file without calling onChange and shows an unsupported-type error (Req 4.2)', async () => {
      (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [{
          uri: 'file://doc.docx',
          name: 'doc.docx',
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          size: 1000,
        }],
      });

      renderField({ acceptedFileMimeTypes: ['application/pdf'] });
      await openAddDocumentSheet();
      fireEvent.press(screen.getByText('Choose file'));

      await waitFor(() => screen.getByText('This file type is unsupported.'));
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('does not affect pickImage(): a JPG/PNG pick still calls onChange', async () => {
      (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({ granted: true });
      (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [{ uri: 'file://photo.jpg', width: 100, height: 100 }],
      });
      (compressImage as jest.Mock).mockResolvedValue({ uri: 'file://compressed.jpg', width: 80, height: 80 });

      renderField({ acceptedFileMimeTypes: ['application/pdf'] });
      await openAddDocumentSheet();
      fireEvent.press(screen.getByText('Choose photo'));

      await waitFor(() => expect(mockOnChange).toHaveBeenCalledWith({
        kind: 'image',
        asset: { uri: 'file://compressed.jpg', width: 80, height: 80 },
      }));
    });
  });

  describe('file size boundaries (Req 4.3, regression)', () => {
    it('accepts a file exactly at maxFileSizeMB', async () => {
      const exactSize = 5 * 1024 * 1024;
      (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [{ uri: 'file://doc.pdf', name: 'doc.pdf', mimeType: 'application/pdf', size: exactSize }],
      });

      renderField();
      await openAddDocumentSheet();
      fireEvent.press(screen.getByText('Choose file'));

      await waitFor(() => expect(mockOnChange).toHaveBeenCalled());
    });

    it('rejects a file one byte over maxFileSizeMB', async () => {
      const overSize = 5 * 1024 * 1024 + 1;
      (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [{ uri: 'file://doc.pdf', name: 'doc.pdf', mimeType: 'application/pdf', size: overSize }],
      });

      renderField();
      await openAddDocumentSheet();
      fireEvent.press(screen.getByText('Choose file'));

      await waitFor(() => screen.getByText('File must be 5MB or smaller.'));
      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe('cancellation (Req 4.5, regression)', () => {
    it('makes no onChange call and shows no error when the document picker is cancelled', async () => {
      (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue({ canceled: true });

      renderField();
      await openAddDocumentSheet();
      fireEvent.press(screen.getByText('Choose file'));

      await act(async () => {});
      expect(mockOnChange).not.toHaveBeenCalled();
      expect(screen.queryByText(/unsupported/i)).toBeNull();
      expect(screen.queryByText(/5MB/i)).toBeNull();
    });

    it('makes no onChange call and shows no error when the image picker is cancelled', async () => {
      (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({ granted: true });
      (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({ canceled: true });

      renderField();
      await openAddDocumentSheet();
      fireEvent.press(screen.getByText('Choose photo'));

      await act(async () => {});
      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });
});
