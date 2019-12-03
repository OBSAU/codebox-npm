const nodeExternals = require('webpack-node-externals');
const path = require('path');
const slsw = require('serverless-webpack');

module.exports = {
  target: 'node',
  externals: [nodeExternals()],
  devtool: 'source-map',
  optimization: {
    minimize: false
  },
  performance: {
      hints: false,  // Turn off size warnings for entry points
  },
  entry: {
    authorizerGithub: ["@babel/polyfill", './src/authorizers/github.js'],
    put: ["@babel/polyfill", './src/put/index.js'],
    get: ["@babel/polyfill", './src/get/index.js'],
    distTagsGet: ["@babel/polyfill", './src/dist-tags/get.js'],
    distTagsPut: ["@babel/polyfill", './src/dist-tags/put.js'],
    distTagsDelete: ["@babel/polyfill", './src/dist-tags/delete.js'],
    userPut: ["@babel/polyfill", './src/user/put.js'],
    userDelete: ["@babel/polyfill", './src/user/delete.js'],
    whoamiGet: ["@babel/polyfill", './src/whoami/get.js'],
    tarGet: ["@babel/polyfill", './src/tar/get.js'],
  },
  output: {
    libraryTarget: 'corejs',
    path: path.join(__dirname, '.webpack'),
    filename: '[name].js',
  },
  module: {
    loaders: [{
      test: /\.js$/,
      loader: 'babel-loader',
      include: /src/,
      exclude: /node_modules/,
      presets: ['@babel/env']
    },
    {
      test: /\.json$/,
      loader: 'json-loader',
    }],
  },
};
