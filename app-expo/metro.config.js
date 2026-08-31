const { getDefaultConfig } = require('expo/metro-config');
const c = getDefaultConfig(__dirname);
c.watchFolders = [__dirname];
c.resolver.blockList = [/app-dashboard\/.*/];
module.exports = c;
