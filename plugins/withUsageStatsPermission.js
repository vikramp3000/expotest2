const { withAndroidManifest } = require("expo/config-plugins");

function withUsageStatsPermission(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;

    if (!manifest.$) manifest.$ = {};
    if (!manifest.$["xmlns:tools"]) {
      manifest.$["xmlns:tools"] = "http://schemas.android.com/tools";
    }

    if (!manifest["uses-permission"]) {
      manifest["uses-permission"] = [];
    }

    const already = manifest["uses-permission"].some(
      (p) => p.$?.["android:name"] === "android.permission.PACKAGE_USAGE_STATS",
    );

    if (!already) {
      manifest["uses-permission"].push({
        $: {
          "android:name": "android.permission.PACKAGE_USAGE_STATS",
          "tools:ignore": "ProtectedPermissions",
        },
      });
    }

    return config;
  });
}

module.exports = withUsageStatsPermission;
