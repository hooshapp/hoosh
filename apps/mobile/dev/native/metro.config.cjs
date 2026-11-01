/* global __dirname */
const path = require('node:path');
const { getDefaultConfig } = require('expo/metro-config');

// This nested QA project is deliberately not another installed npm workspace.
// Watch shared components and root dependencies so edits/new files refresh live.
const repositoryRoot = path.resolve(__dirname, '../../../..');
const config = getDefaultConfig(__dirname);
config.watchFolders = [repositoryRoot];
config.resolver.nodeModulesPaths = [path.join(repositoryRoot, 'node_modules')];
module.exports = config;
