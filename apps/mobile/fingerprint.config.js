// Decides which changes count as "native" for the over-the-air runtime version
// (runtimeVersion policy "fingerprint").
//
// google-services.json is ignored as a path, not just hashed as empty content:
// locally it is a gitignored file that may be absent, while on EAS it is a
// secret written to /tmp. Hashing its contents already avoided the byte
// difference, but a missing local file removed the fingerprint source entirely,
// so local and EAS disagreed whenever the secret was not on the machine
// ("Runtime version calculated on local machine not equal to ... during build").
// Changing the file still needs a new APK; it just never moves the runtime version.
//
// The `scripts` block of package.json is skipped too (SourceSkips.PackageJsonScriptsAll,
// 1024): it never changes the native app, but Expo hashed it, so editing the `ota` script
// moved the runtime version and every later update missed the installed APK.
module.exports = {
  sourceSkips: 1024,
  ignorePaths: ['**/google-services.json'],
};
