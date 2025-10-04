const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');


const config = getDefaultConfig(__dirname);

// ✅ Fix: use `config` consistently (not defaultConfig)
config.resolver.sourceExts.push('cjs');

config.resolver.unstable_enablePackageExports = false;

// ✅ Add support for additional asset types
config.resolver.assetExts.push('db', 'mp3', 'ttf', 'obj', 'png', 'jpg');

// ✅ Export wrapped with NativeWind
module.exports = withNativeWind(config, { input: './global.css' });
