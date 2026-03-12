const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Support 3D asset formats
config.resolver.assetExts.push('glb', 'gltf', 'obj', 'mtl', 'bin');
config.resolver.sourceExts.push('mjs');

module.exports = withNativeWind(config, { input: './src/styles/global.css' });
