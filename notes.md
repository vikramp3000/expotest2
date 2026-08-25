# Lockin2 App Usage Stats Prototype

This is an Expo Android prototype that checks whether an app can read phone app-usage stats using Android's `UsageStatsManager`.

The current goal is simple: show package names and foreground usage time for apps used today.

This is Android-only. It does not work in Expo Go because app usage stats require native Android permissions and a custom development build.

## What Was Built

Project path:

```powershell
d:\code\expotest\lockin2
```

Main screen:

- `src/app/index.tsx`
- Links to `/app-stats`

Usage stats screen:

- `src/app/app-stats/index.tsx`
- Checks whether usage access is granted
- Opens Android Usage Access settings
- Loads today's usage stats
- Displays package names and foreground time

Native usage stats library:

```json
"expo-android-usagestats": "^1.2.0"
```

Development build support:

```json
"expo-dev-client": "~57.0.15"
```

Android package name:

```json
"android": {
  "package": "com.yourname.lockin2"
}
```

Important: before Play Store release, change `com.yourname.lockin2` to a real final package name. Once published, Android package names are basically permanent.

## Native Permission Setup

Android requires this permission:

```xml
android.permission.PACKAGE_USAGE_STATS
```

This is a special permission. It cannot be requested with a normal popup.

A custom Expo config plugin was added:

```text
plugins/withUsageStatsPermission.js
```

It injects `PACKAGE_USAGE_STATS` into the Android manifest during EAS/prebuild.

`app.json` includes the plugin:

```json
"plugins": [
  "expo-router",
  [
    "expo-splash-screen",
    {
      "backgroundColor": "#208AEF",
      "image": "./assets/images/splash-icon.png",
      "imageWidth": 76
    }
  ],
  "./plugins/withUsageStatsPermission"
]
```

## EAS Setup

Expo/EAS project is linked in `app.json`:

```json
"owner": "vikpalak1",
"extra": {
  "eas": {
    "projectId": "5082ae89-62f6-4d8d-9bb1-4bc72c7baf35"
  }
}
```

`eas.json` has a development build profile:

```json
"development": {
  "developmentClient": true,
  "distribution": "internal"
}
```

This creates an installable Android APK with dev-client support.

## How To Run Again

From PowerShell:

```powershell
cd d:\code\expotest\lockin2
npm install
eas whoami
```

If `eas whoami` fails:

```powershell
eas login
```

If the custom development app is already installed on the Pixel:

```powershell
npx expo start --dev-client
```

If the phone cannot connect:

```powershell
npx expo start --dev-client --tunnel
```

Open the `lockin2` app on the phone. Do not open Expo Go.

## If You Need A New Android Build

You need a new EAS build when you change:

- Native modules
- Android permissions
- `app.json` native config
- Package name
- Config plugins

Run:

```powershell
cd d:\code\expotest\lockin2
eas build --platform android --profile development
```

When the build finishes, install the APK from the Expo build page on the Pixel.

You do not need a new EAS build for normal JS/TS UI changes to `src/app/app-stats/index.tsx`. For those, just restart Metro if needed.

## Pixel Usage Access Steps

On the Pixel 6a:

1. Open Settings.
2. Go to Apps -> Special app access -> Usage access.
3. Select lockin2.
4. Enable Permit access to app usage data.

If the toggle is greyed out with Restricted Setting:

1. Go to Settings -> Apps -> See all apps -> lockin2.
2. Tap the three-dot menu.
3. Tap Allow restricted settings.
4. Confirm with PIN/fingerprint.
5. Return to Usage access and toggle it on.

This happens because the EAS APK is sideloaded. It should be less annoying when installed through Google Play later.

## How To Test Success

In the app:

1. Go to App Stats.
2. Tap Grant usage access if needed.
3. Tap Load stats.

Expected result:

```text
2h 15m com.android.chrome
48m com.google.android.youtube
12m com.google.android.apps.messaging
...
```

System apps, launcher, keyboard, and Pixel services may appear. That is normal.

Empty results after granting permission means something is wrong.

## Play Store Notes

In theory this can be published to Google Play, but `PACKAGE_USAGE_STATS` is sensitive.

For a real release, the app needs:

- A clear core feature around screen time, focus, or digital wellbeing
- A privacy policy
- Correct Data Safety disclosures
- Honest onboarding explaining why usage access is needed
- No uploading usage data unless absolutely necessary
- A strong justification if Play Console asks about the permission

For now, this is a working prototype proving that Android usage stats can be accessed from an Expo app using a custom development build.
