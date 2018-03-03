const path = require('path');

const webpack = require('webpack');

module.exports = {
  entry: {
      index: './src/index.js'
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
      publicPath: "/res/"
  },
    devtool: "source-map",
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /(node_modules|bower_components)/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['babel-preset-env']
            }
          }
        }
      ]
    },

    devServer: {
        contentBase: path.join(__dirname, ""),
        compress: true,
        port: 8081,
        // hot: true,
        // inline: true
    },
    plugins: [
        new webpack.HotModuleReplacementPlugin()
    ]
};