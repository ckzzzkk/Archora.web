# iOS Folder Generation — Expo Prebuild

**Goal:** Generate the full `ios/` folder structure required to build an iOS IPA for Asoria.

**Architecture:** Expo bare workflow — `npx expo prebuild --platform ios` auto-generates the Xcode project (`.xcodeproj`, `.xcworkspace`, `Podfile`, `AppDelegate`, `Info.plist`). The existing `ios/LocalPods/ARKitModule/` must be reintegrated as a local CocoaPod.

**Tech Stack:** Expo SDK 54, EAS Build, CocoaPods

---

## Pre-Work: Stash or Commit Current Changes

- [ ] **Step 1: Stash any uncommitted changes**

```bash
cd /home/chisanga/Asoria
git status
git stash push -m "ios folder generation worktree"
```

---

## Task 1: Generate iOS Folder with Expo Prebuild

**Files modified:**
- Create: `ios/` (full folder structure)
- Modify: `app.json` (no change needed — already has iOS config)

- [ ] **Step 1: Run expo prebuild for iOS**

```bash
cd /home/chisanga/Asoria
npx expo prebuild --platform ios --clean
```

Expected: Generates `ios/Asoria/` directory with:
```
ios/
├── Asoria/
│   ├── Info.plist
│   ├── AppDelegate.swift
│   ├── AppDelegate.mm
│   ├── main.m
│   ├── Asoria.xcodeproj/
│   └── Asoria.xcworkspace/
├── Podfile
├── Podfile.lock
└── .xcuserdata/
```

⚠️ **This command may prompt** for bundle identifier confirmation. Accept defaults (already set in `app.json`).

---

## Task 2: Reintegrate ARKitModule LocalPod

**Files modified:**
- Modify: `ios/Podfile`
- Verify: `ios/LocalPods/ARKitModule/` (already exists)

- [ ] **Step 1: Open ios/Podfile and add local ARKitModule pod**

After the auto-generated `pod` lines, add:

```ruby
# Local ARKit module for Vision Camera AR features
pod 'ARKitModule', :path => './LocalPods/ARKitModule'
```

The `:path =>` must point to the existing `ios/LocalPods/ARKitModule/` directory.

- [ ] **Step 2: Verify ARKitModule podspec is correct**

Check `ios/LocalPods/ARKitModule/ARKitModule.podspec` exists and has:

```ruby
Pod::Spec.new do |s|
  s.name         = 'ARKitModule'
  s.version      = '1.0.0'
  s.source       = { :path => '.' }
  s.platform     = :ios, '15.1'
  s.source_files = '**/*.{h,m,mm,swift}'
  s.swift_version = '5.0'
  s.frameworks   = 'ARKit', 'RealityKit', 'SceneKit'
end
```

- [ ] **Step 3: Run pod install**

```bash
cd /home/chisanga/Asoria/ios
pod install
```

Expected: Integrates ARKitModule into the Xcode workspace.

---

## Task 3: Add iOS Permissions to Info.plist

**Files modified:**
- Modify: `ios/Asoria/Info.plist` (or generated equivalent)

- [ ] **Step 1: Ensure Info.plist has required permissions**

The generated `Info.plist` should already include entries from `app.json` `ios.infoPlist`. Verify these keys exist in `ios/Asoria/Info.plist`:

```xml
<key>NSCameraUsageDescription</key>
<string>ASORIA uses your camera for AR room scanning</string>
<key>NSMicrophoneUsageDescription</key>
<string>ASORIA uses your microphone for voice prompts</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>ASORIA saves your designs and exports renders to your photo library</string>
```

If missing, add them manually inside the `<dict>` block.

---

## Task 4: Verify Xcode Workspace Opens

- [ ] **Step 1: Open Xcode workspace**

```bash
cd /home/chisanga/Asoria/ios
open Asoria.xcworkspace
```

Expected: Xcode opens with the Asoria project. Select an iOS Simulator (iPhone 15, etc.) and confirm the project loads without errors in the navigator.

---

## Task 5: Build iOS App Locally (Optional — for testing)

- [ ] **Step 1: Build with xcodebuild**

```bash
xcodebuild -workspace Asoria.xcworkspace \
  -scheme Asoria \
  -configuration Debug \
  -destination "platform=iOS Simulator,name=iPhone 15" \
  build
```

Expected: BUILD SUCCEEDED

> **Note:** Local iOS builds require a Mac with Xcode installed. If you're on WSL/Linux, this step won't work locally — use EAS Build for cloud builds instead.

---

## Task 6: Commit iOS Folder to Git

- [ ] **Step 1: Stage and commit ios folder**

```bash
cd /home/chisanga/Asoria
git add ios/
git status
```

Review what will be committed, then:

```bash
git commit -m "$(cat <<'EOF'
feat: add iOS bare workflow project (Expo prebuild)

Generates Xcode project via expo prebuild for iOS IPA builds.
Includes ARKitModule local pod for Vision Camera AR features.
Adds required camera/microphone/photo library permissions.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Summary of Files After Completion

```
ios/
├── Asoria/
│   ├── Info.plist          ← generated + permissions
│   ├── AppDelegate.swift    ← generated
│   ├── AppDelegate.mm      ← generated
│   ├── main.m              ← generated
│   └── Asoria.xcodeproj/   ← generated
├── LocalPods/
│   └── ARKitModule/        ← pre-existing, integrated via Podfile
├── Podfile                 ← generated + ARKitModule pod line
└── Podfile.lock            ← generated
```

---

## Building IPA with EAS (No Mac Required)

Once the `ios/` folder is committed, EAS Build can create the IPA:

```bash
eas build --platform ios --profile production
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `npx expo prebuild` asks for bundle ID | Press Enter to accept default from `app.json` |
| Pod install fails — ARKitModule not found | Confirm `ios/LocalPods/ARKitModule/ARKitModule.podspec` exists |
| Xcode build fails — simulator not found | Run `xcrun simctl list devices` and pick available simulator |
| Missing signing identity (for real device) | Set `CODE_SIGNING_IDENTITY` in eas.json or use EAS servers |
