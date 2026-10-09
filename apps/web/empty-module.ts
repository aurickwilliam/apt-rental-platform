// Web stand-in for React Native modules pulled in by shared packages
// (aliased in next.config.ts). Only `Platform.OS` is ever read.
const reactNativeShim = { Platform: { OS: "web" as const } };

export const Platform = reactNativeShim.Platform;
export default reactNativeShim;
(module as unknown as { exports: typeof reactNativeShim }).exports = reactNativeShim;
