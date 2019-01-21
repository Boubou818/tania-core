const mix = require('laravel-mix');
const webpack = require('webpack');
const path = require('path');
const glob = require('glob-all');
const fs = require('fs');
const confJSON = require('./conf.json');

const HtmlWebpackPlugin = require('html-webpack-plugin');
const PurifyCSSPlugin = require('purifycss-webpack');
const SWPrecacheWebpackPlugin = require('sw-precache-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

mix.setPublicPath('public/')

mix.webpackConfig({
  output: {
    filename: '[name].[chunkhash].js',
    chunkFilename: './js/[name].[chunkhash].js',
  },
  module: {
    rules: [
      {
        test: /\.hbs$/,
        use: {
          loader: 'handlebars-loader'
        }
      },
      {
        test: /\.pug$/,
        oneOf: [
          // this applies to `<template lang="pug">` in Vue components
          {
            resourceQuery: /^\?vue/,
            use: ['pug-plain-loader']
          },
          // this applies to pug imports inside JavaScript
          {
            use: ['raw-loader', 'pug-plain-loader']
          }
        ]
      },
      {
        test: /\.(png|jpg|gif|svg)$/,
        loader: 'file-loader',
        options: {
          name: '[name].[ext]?[hash]'
        }
      }
    ]
  },
  plugins: [
    new webpack.ContextReplacementPlugin(/moment[\/\\]locale$/, /de|en|id/),
    new PurifyCSSPlugin({
      paths: glob.sync([
        path.join(__dirname, 'resources/js/**/*.pug'),
        path.join(__dirname, 'resources/js/**/**/*.vue')
      ]),
    }),
    new SWPrecacheWebpackPlugin({
      cacheId: 'tanibox',
      filename: 'service-worker.js',
      staticFileGlobs: ['public/**/*.{js,html,css}'],
      minify: true,
      stripPrefix: 'public/'
    }),
    new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      reportFilename: 'report.html',
      defaultSizes: 'parsed',
      openAnalyzer: false,
      generateStatsFile: false,
      statsFilename: 'stats.json',
      statsOptions: null,
      logLevel: 'info'
    }),
    new HtmlWebpackPlugin({
      filename: './index.html',
      template: './resources/index.hbs',
      inject: true,
      chunkSortMode: 'dependency',
      serviceWorkerLoader: `<script>${fs.readFileSync(path.join(__dirname, mix.inProduction() ? './resources/js/service-worker-prod.js' : './resources/js/service-worker-dev.js'), 'utf-8')}</script>`
    }),
    new webpack.DefinePlugin({
      'process.env': {
        CLIENT_ID: JSON.stringify(confJSON.client_id)
      },
    }),
    new CleanWebpackPlugin('public/')
  ],
  resolve: {
    extensions: [
      ".vue"
    ]
  }
})

mix.js('resources/js/app.js', './js/app.js');
mix.sass('resources/sass/app.scss', './css/app.css', {
  implementation: require('node-sass'),
});

mix.sourceMaps();

if (mix.inProduction()) {
  mix.version();
  mix.disableNotifications();
}
