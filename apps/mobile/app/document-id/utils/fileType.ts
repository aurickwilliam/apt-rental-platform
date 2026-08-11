const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp', 'heic']
const DOCUMENT_EXTENSIONS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx']

export function getExtension(uri: string) {
  // Strip query params and fragments, then get the last segment's extension
  const cleanPath = uri.split('?')[0].split('#')[0]
  return cleanPath.split('.').pop()?.toLowerCase() ?? ''
}

export function isImageUri(uri: string): boolean {
  const ext = getExtension(uri)
  if (IMAGE_EXTENSIONS.includes(ext)) return true
  if (DOCUMENT_EXTENSIONS.includes(ext)) return false
  // Bundled assets (resolveAssetSource) may lose extensions — default to image
  return true
}
