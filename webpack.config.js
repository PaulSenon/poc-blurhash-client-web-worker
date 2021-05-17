const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const process = require('process');

const isDev = process.env.NODE_ENV==='development';
console.log('Build mode:', isDev ? 'DEV' : 'PROD');

module.exports = {
  mode: isDev ? 'development' :'production',
  devtool: isDev ? 'inline-source-map' : undefined,
  entry: {
    index: './src/index.js',
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
    publicPath: '/',
  },
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  devServer: {
    contentBase: './dist',
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: 'src/index.html'
    })
  ],
};
