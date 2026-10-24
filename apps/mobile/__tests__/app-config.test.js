const config = require("../app.config.js");

function pluginEntry(name) {
  return config.expo.plugins.find(
    (plugin) => Array.isArray(plugin) && plugin[0] === name,
  );
}

describe("app config", () => {
  // Save as photo only adds to the library, so iOS needs the add-only usage
  // string. Without it expo-media-library throws ERR_MISSING_PLIST_KEY when the
  // landlord taps Save, and the generated Info.plist is not tracked, so the
  // plugin option is the only place a regression can be caught in CI.
  it("declares the add-only photo library permission", () => {
    const mediaLibrary = pluginEntry("expo-media-library");
    expect(mediaLibrary).toBeDefined();
    const options = mediaLibrary[1];
    expect(typeof options.savePhotosPermission).toBe("string");
    expect(options.savePhotosPermission.trim().length).toBeGreaterThan(0);
  });

  // Saving goes through MediaStore with write access only; read permissions
  // would ask for access the app never uses.
  it("does not declare Android photo read permissions", () => {
    const mediaLibrary = pluginEntry("expo-media-library");
    expect(mediaLibrary[1].granularPermissions).toEqual([]);
  });
});
