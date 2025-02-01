/**
 * @file webpack.webview.config.ts
 * @description 该配置文件用于设置Webpack构建webview应用的相关参数和插件。
 * 
 * 主要功能包括：
 * - 定义入口文件和输出路径 入口文件为程序起点，输出路径为构建后的文件存放位置
 * - 配置模块解析和加载器 解析和加载tsx文件，允许开发者指定哪些文件扩展名可以被识别和加载
 * - 设置开发服务器选项 配置开发服务器选项，包括静态文件目录、端口、主机、是否自动打开浏览器、是否启用热模块替换等
 * 
 * @module webpack.webview.config
 */

import {webpackDir} from "./webpack.base.config"; // 🔧 引入基础配置中的webpackDir

const path = require('path'); // 🔧 引入path模块用于处理文件路径
const entry = require.resolve('@opensumi/ide-webview/lib/webview-host/web-preload.js'); // 🔧 定义入口文件
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin'); // 🔧 引入tsconfig路径插件
const HtmlWebpackPlugin = require('html-webpack-plugin'); // 🔧 引入HTML模板插件
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin'); // 🔧 引入Node多填充插件

const tsConfigPath = path.join(__dirname, '../../tsconfig.json'); // 🔧 获取tsconfig.json路径
const distDir = path.join(webpackDir, 'webview'); // 🔧 定义输出目录
const port = 8899; // 🔧 定义开发服务器端口

export default {
  entry, // 🔧 入口文件
  output: {
    filename: 'webview.js', // 🔧 输出文件名
    path: distDir, // 🔧 输出路径
    clean: true, // 🔧 在每次构建前清理输出目录
  },
  cache: {
    type: 'filesystem', // 🔧 使用文件系统缓存
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.json', '.less'], // 🔧 支持的文件扩展名
    plugins: [
      new TsconfigPathsPlugin({
        configFile: tsConfigPath, // 🔧 使用tsconfig路径插件
      }),
    ],
  },
  bail: true, // 🔧 遇到错误时停止构建
  mode: process.env.NODE_ENV || 'development', // 🔧 设置模式为开发或生产
  devtool: 'source-map', // 🔧 生成source map以便调试
  module: {
    exprContextCritical: false, // 🔧 关闭上下文表达式的警告
    rules: [
      {
        test: /\.tsx?$/, // 🔧 匹配.ts和.tsx文件
        loader: 'ts-loader', // 🔧 使用ts-loader进行加载
        options: {
          happyPackMode: true, // 🔧 启用HappyPack模式以提高构建速度
          transpileOnly: true, // 🔧 仅进行转译，不进行类型检查
          configFile: tsConfigPath, // 🔧 指定tsconfig文件
        },
      },
    ],
  },
  resolveLoader: {
    modules: [
      path.join(__dirname, '../../../node_modules'), // 🔧 指定加载器模块路径
      path.join(__dirname, '../../node_modules'),
      path.resolve('node_modules'),
    ],
    extensions: ['.ts', '.tsx', '.js', '.json', '.less'], // 🔧 支持的加载器文件扩展名
    mainFields: ['loader', 'main'], // 🔧 加载器的主要字段
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.dirname(entry) + '/webview.html', // 🔧 使用HTML模板生成输出文件
    }),
    new NodePolyfillPlugin({
      includeAliases: ['process', 'Buffer'], // 🔧 包含Node.js的process和Buffer
    }),
  ],
  devServer: {
    static: {
      directory: path.join(__dirname , webpackDir) // 🔧 静态文件目录
    },
    allowedHosts: 'all', // 🔧 允许所有主机
    port, // 🔧 开发服务器端口
    host: "0.0.0.0", // 🔧 监听所有IP地址
    open: false, // 🔧 不自动打开浏览器
    hot: true, // 🔧 启用热模块替换
    client: {
      overlay: {
        errors: true, // 🔧 显示错误覆盖层 程序发生错误时，在浏览器窗口显示错误信息和堆栈跟踪
        warnings: false, // 🔧 不显示警告覆盖层 程序发生警告时，在浏览器窗口显示警告信息
        runtimeErrors: false, // 🔧 不显示运行时错误覆盖层 程序运行时发生错误时，在浏览器窗口显示错误信息和堆栈跟踪
      },
    },
  },
};