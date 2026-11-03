/* global __dirname */
const path = require('node:path');
const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);
const repositoryRoot = path.resolve(__dirname, '../../../..');
config.watchFolders = [repositoryRoot];
config.resolver.nodeModulesPaths = [path.join(repositoryRoot, 'node_modules')];
module.exports = config;
