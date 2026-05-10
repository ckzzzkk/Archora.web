/**
 * Expo Config Plugin — withARKitModule
 *
 * Auto-injects the ARKitModule local CocoaPod into the iOS Podfile
 * after `npx expo prebuild --platform ios`.
 *
 * Usage in app.json:
 *   plugins: ["./plugin/withARKitModule"]
 *
 * Note: NSCameraUsageDescription is set in ios/ASORIAAIArchitectureDesign/Info.plist
 * and/or app.json ios.infoPlist — not needed here.
 */

const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const POD_MARKER = '# ── Local pods ───────────────────────────────────────────────────';
const POD_LINE = "  pod 'ARKitModule', :path => './LocalPods/ARKitModule'";

function modifyPodfile(podfile) {
  if (podfile.includes('ARKitModule')) {
    return podfile;
  }

  if (podfile.includes(POD_MARKER)) {
    return podfile.replace(POD_MARKER, `${POD_MARKER}\n${POD_LINE}`);
  }

  if (/\npost_install\s+do\s+\|installer\|/.test(podfile)) {
    return podfile.replace(
      /(\n)(post_install do \|installer\|)/,
      `\n${POD_MARKER}\n${POD_LINE}\n\n$2`,
    );
  }

  return podfile + `\n${POD_MARKER}\n${POD_LINE}\n`;
}

module.exports = function withARKitModule(config) {
  config = withDangerousMod(config, ['ios', async (config) => {
    const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
    if (!fs.existsSync(podfilePath)) {
      console.warn('[withARKitModule] Podfile not found — run `npx expo prebuild --platform ios` first');
      return config;
    }
    let podfile = fs.readFileSync(podfilePath, 'utf8');
    podfile = modifyPodfile(podfile);
    fs.writeFileSync(podfilePath, podfile);
    console.log('[withARKitModule] Added ARKitModule pod to Podfile ✓');
    return config;
  }]);

  return config;
};
