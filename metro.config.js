const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const projectRoot = path.resolve(__dirname);

// Pass config as a function so Metro resolves it after process.cwd() is set to projectRoot.
// This prevents react-native-css-interop's expoColorSchemeWarning() from using the wrong directory.
module.exports = withNativeWind(async () => {
  const config = await getDefaultConfig(projectRoot);

  // SVG transformer — Terser disabled for web compat
  config.transformer = {
    ...config.transformer,
    babelTransformerPath: require.resolve('react-native-svg-transformer'),
    inlineRequires: true,
  };

  config.resolver = {
    ...config.resolver,
    assetExts: config.resolver.assetExts.filter((ext) => ext !== 'svg'),
    sourceExts: [...config.resolver.sourceExts, 'svg'],
  };

  return config;
}, {
  input: path.join(projectRoot, 'src/styles/global.css'),
  configPath: path.join(projectRoot, 'tailwind.config.js'),
});
