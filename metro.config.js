const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// 1. Stabilize file watching and performance on Windows
config.maxWorkers = 2; // Prevent race conditions on high-core Windows machines
config.watchFolders = [__dirname];

// 2. Modern resolution features
// Enable support for the 'exports' field in package.json (essential for modern Firebase/Semver)
config.resolver.unstable_enablePackageExports = true;
// Enable support for symlinks (important for some monorepo/library setups)
config.resolver.unstable_enableSymlinks = true;
// Ensure .mjs files are resolved correctly
if (!config.resolver.sourceExts.includes("mjs")) {
  config.resolver.sourceExts.push("mjs");
}

// 3. Clean blockList
// Only block system-internal directories. Avoid blocking nested node_modules 
// as it breaks libraries that require specific pinned dependency versions.
config.resolver.blockList = [
  /\.expo\/.*/,
  /\.git\/.*/,
];

// 4. Ensure deterministic resolution
config.resolver.disableHierarchicalLookup = false;

module.exports = withNativeWind(config, { input: "./global.css" });

