#!/bin/bash
# test-ios-ar.sh — Build and verify iOS ARKit module integration
# Usage: ./scripts/test-ios-ar.sh
#
# Prerequisites:
#   1. macOS with Xcode 15+ installed
#   2. Apple Developer account (for code signing)
#   3. iOS device with A12+ chip (ARKit requirement) or iPhone 6s+
#
set -e

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "============================================"
echo "ASORIA iOS ARKit Module — Build Test"
echo "============================================"

# ── Step 1: Verify native module files exist ──────────────────────────────────
echo ""
echo "[1/6] Verifying ARKitModule files..."
ARKIT_DIR="$PROJECT_ROOT/ios/LocalPods/ARKitModule"
for f in ARKitModule.podspec ARKitModule.swift ARKitModule.m; do
  if [ -f "$ARKIT_DIR/$f" ]; then
    echo "  ✓ $f"
  else
    echo "  ✗ MISSING: $f"
    exit 1
  fi
done

# ── Step 2: Verify Expo plugin exists ──────────────────────────────────────
echo ""
echo "[2/6] Verifying Expo config plugin..."
if [ -f "$PROJECT_ROOT/plugin/withARKitModule.js" ]; then
  echo "  ✓ plugin/withARKitModule.js"
else
  echo "  ✗ MISSING: plugin/withARKitModule.js"
  exit 1
fi

# ── Step 3: Verify app.json has plugin registered ────────────────────────────
echo ""
echo "[3/6] Checking app.json plugin registration..."
if grep -q 'withARKitModule' "$PROJECT_ROOT/app.json"; then
  echo "  ✓ app.json includes withARKitModule plugin"
else
  echo "  ✗ Plugin not found in app.json"
  exit 1
fi

# ── Step 4: Run TypeScript check ─────────────────────────────────────────────
echo ""
echo "[4/6] Running TypeScript type check..."
if npx tsc --noEmit 2>&1 | grep -q "error TS"; then
  echo "  ✗ TypeScript errors found:"
  npx tsc --noEmit 2>&1 | grep "error TS" | head -10
  exit 1
else
  echo "  ✓ TypeScript: ALL CLEAR"
fi

# ── Step 5: expo prebuild ───────────────────────────────────────────────────
echo ""
echo "[5/6] Running expo prebuild (generates ios/ folder with local pod)..."
if [ -d "$PROJECT_ROOT/ios" ]; then
  echo "  ℹ ios/ already exists — skipping prebuild (remove ios/ to regenerate)"
else
  npx expo prebuild --platform ios --clean 2>&1 | tail -5
  echo "  ✓ ios/ folder generated"
fi

# ── Step 6: Verify Podfile includes ARKitModule ──────────────────────────────
echo ""
echo "[6/6] Verifying Podfile includes ARKitModule..."
PODFILE="$PROJECT_ROOT/ios/Podfile"
if grep -q "ARKitModule" "$PODFILE"; then
  echo "  ✓ Podfile includes ARKitModule"
else
  echo "  ✗ ARKitModule not found in Podfile — manually add:"
  echo "    pod 'ARKitModule', :path => './LocalPods/ARKitModule'"
  exit 1
fi

echo ""
echo "============================================"
echo "All checks passed ✓"
echo ""
echo "To build and run on iOS device/simulator:"
echo ""
echo "  cd ios"
echo "  xcodebuild -workspace ASORIA.xcworkspace \"
echo "    -scheme ASORIA \"
echo "    -configuration Debug \"
echo "    -destination 'platform=iOS Simulator,name=iPhone 15 Pro' \"
echo "    build"
echo ""
echo "  # Then run from Xcode or:"
echo "  npx expo run:ios --configuration Debug"
echo ""
echo "To install on a physical iOS device:"
echo "  1. Open ios/ASORIA.xcworkspace in Xcode"
echo "  2. Set your development team in Signing & Capabilities"
echo "  3. Select your iOS device and click Run"
echo "============================================"
