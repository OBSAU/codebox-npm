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
  entry: slsw.lib.entries,
  mode: slsw.lib.webpack.isLocal ? 'development' : 'production',
  output: {
    libraryTarget: 'commonjs',
    path: path.join(__dirname, '.webpack'),
    filename: '[name].js',
  },
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [ '@babel/preset-env'],
            plugins: [ '@babel/plugin-transform-runtime' ]
          }
        }
      }
    ]
  },
};
