// Decides which changes count as "native" for the over-the-air runtime version
// (runtimeVersion policy "fingerprint"). Only google-services.json is treated
// specially: locally it is a file, on EAS it is a secret written to a temp file,
// and the two are never byte-identical, so its contents made the local and EAS
// fingerprints disagree and failed the build ("Runtime version mismatch").
// Changing it still needs a new APK; it just no longer changes the runtime version.
//
// The `scripts` block of package.json is skipped too (SourceSkips.PackageJsonScriptsAll,
// 1024): it never changes the native app, but Expo hashed it, so editing the `ota` script
// moved the runtime version and every later update missed the installed APK.
module.exports = {
  sourceSkips: 1024,
  fileHookTransform: (source, chunk) => {
    if (source.type === 'file' && /(^|[\\/])google-services\.json$/.test(source.filePath ?? '')) {
      return null;
    }
    return chunk;
  },
};
