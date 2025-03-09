import path, { dirname } from 'path';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import TerserPlugin from 'terser-webpack-plugin';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default (env, argv) => {
  const isProduction = argv.mode === 'production';

  return {
    entry: './src/js/main.js',
    output: {
      filename: isProduction ? '[name].[contenthash].js' : '[name].js',
      path: path.resolve(__dirname, 'dist'),
      clean: true,
    },
    devServer: {
      static: './dist',
      hot: true,
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env'],
            },
          },
        },
        {
          test: /\.css$/,
          use: [
            isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
            'css-loader',
          ],
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './src/index.html',
        minify: isProduction ? {
          collapseWhitespace: true,
          removeComments: true,
        } : false,
      }),
      new MiniCssExtractPlugin({
        filename: isProduction ? '[name].[contenthash].css' : '[name].css',
      }),
    ],
    optimization: {
      minimize: isProduction,
      minimizer: [new TerserPlugin()],
    },
    mode: isProduction ? 'production' : 'development',
  };
};
