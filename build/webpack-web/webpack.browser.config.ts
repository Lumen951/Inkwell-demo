/**
 * @file webpack.browser.config.ts
 * @description 该文件用于配置Webpack构建浏览器端的应用程序。
 * 包含了入口文件、输出配置、模块规则、插件配置等。
 * 
 * @module webpack.browser.config
 */

import path from 'node:path'; // 🔧 导入路径模块
import MiniCssExtractPlugin from 'mini-css-extract-plugin'; // 🔧 用于提取CSS到单独文件的插件
import CopyPlugin from 'copy-webpack-plugin'; // 🔧 用于复制文件的插件
import HtmlWebpackPlugin from 'html-webpack-plugin'; // 🔧 用于生成HTML文件的插件
import NodePolyfillPlugin from "node-polyfill-webpack-plugin"; // 🔧 用于在浏览器中提供Node.js的polyfill
import { DefinePlugin } from 'webpack'; // 🔧 Webpack的定义插件
import fs from 'fs'; // 🔧 文件系统模块
import { createConfig, webpackDir, devServerPort } from './webpack.base.config'; // 🔧 导入基础配置
import { config } from 'dotenv'; // 🔧 用于加载环境变量的模块

// ⚠️ 加载环境变量配置
config({
  path: path.join(__dirname, '../../.env.sample') // 指定.env文件路径
});

// 🔧 定义源代码目录、输出目录和公共目录
const srcDir = path.resolve('src/bootstrap-web/browser'); // 源代码目录
const outDir = path.resolve(webpackDir); // 输出目录
const publicDir = path.join(__dirname, '../../public'); // 公共目录

// 🔧 判断当前环境是否为开发环境
const isDevelopment = process.env.NODE_ENV === 'development'; // 环境变量判断
// 🔧 读取IDE包信息
const idePkg = JSON.parse(fs.readFileSync(path.resolve(path.join(__dirname, '../../package.json'))).toString());

/**
 * @function createWebpackConfig
 * @description 创建Webpack配置
 * @param {Object} _env - 环境变量
 * @param {Object} argv - 命令行参数
 * @returns {Object} Webpack配置对象
 */
export default createConfig((_env, argv) => {
  // 🔧 根据模式选择样式加载器
  const styleLoader = argv.mode === 'production' ? MiniCssExtractPlugin.loader : 'style-loader';

  return {
    entry: path.resolve(srcDir, 'index.ts'), // 🔧 入口文件
    output: {
      filename: '[name]/index.js', // 🔧 输出文件名
      path: outDir, // 🔧 输出路径
      assetModuleFilename: 'assets/[name].[hash][ext]', // 🔧 资源模块文件名
    },
    devtool: argv.mode === 'production' ? false as const : 'eval-source-map', // 🔧 开发工具配置
    target: 'web', // 🔧 目标环境
    externalsPresets: {
      node: false, // 🔧 不使用Node.js的外部预设
    },
    module: {
      rules: [
        {
          test: /\.css$/, // 🔧 匹配CSS文件
          use: [styleLoader, 'css-loader'], // 🔧 使用的加载器
        },
        {
          test: /\.module.less$/, // 🔧 匹配LESS模块文件
          use: [
            {
              loader: styleLoader,
              options: {
                esModule: false, // 🔧 关闭ES模块
              }
            },
            {
              loader: 'css-loader',
              options: {
                importLoaders: 0, // 🔧 不使用importLoaders
                sourceMap: true, // 🔧 启用source map
                esModule: false, // 🔧 关闭ES模块
                modules: {
                  localIdentName: '[local]___[hash:base64:5]', // 🔧 CSS模块命名
                },
              },
            },
            {
              loader: 'less-loader',
              options: {
                lessOptions: {
                  javascriptEnabled: true, // 🔧 启用JavaScript
                },
              },
            },
          ],
        },
        {
          test: /^((?!\.module).)*less$/, // 🔧 匹配非模块LESS文件
          use: [
            {
              loader: styleLoader,
              options: {
                esModule: false, // 🔧 关闭ES模块
              }
            },
            {
              loader: 'css-loader',
              options: {
                importLoaders: 0, // 🔧 不使用importLoaders
                esModule: false, // 🔧 关闭ES模块
              },
            },
            {
              loader: 'less-loader',
              options: {
                lessOptions: {
                  javascriptEnabled: true, // 🔧 启用JavaScript
                },
              },
            },
          ],
        },
        {
          test: /\.(woff(2)?|ttf|eot|svg|png)(\?v=\d+\.\d+\.\d+)?$/, // 🔧 匹配字体和图片文件
          type: 'asset', // 🔧 资源类型
          parser: {
            dataUrlCondition: {
              maxSize: 8 * 1024, // 🔧 小于8KB的文件转为Data URL
            }
          }
        },
      ],
    },
    experiments: {
      syncWebAssembly: true, // 🔧 启用WebAssembly同步
      asyncWebAssembly: true // 🔧 启用WebAssembly异步
    },
    plugins: [
      new DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV), // 🔧 定义环境变量
        'process.platform': JSON.stringify('browser'), // 🔧 定义平台为浏览器
        'process.env.WORKSPACE_DIR': JSON.stringify(
          isDevelopment ? path.join(__dirname, '../..', 'workspace') : process.env['WORKSPACE_DIR'], // 🔧 工作空间目录
        ),
        'process.env.EXTENSION_DIR': JSON.stringify(
          isDevelopment ? path.join(__dirname, '../..', 'extensions') : process.env['EXTENSION_DIR'], // 🔧 扩展目录
        ),
        'process.env.REVERSION': JSON.stringify(idePkg.version || 'alpha'), // 🔧 版本信息
        'process.env.DEVELOPMENT': JSON.stringify(!!isDevelopment), // 🔧 开发环境标识
        'process.env.TEMPLATE_TYPE': JSON.stringify(
          isDevelopment ? process.env.TEMPLATE_TYPE : 'standard', // 🔧 模板类型
        ),
        'process.env.IDE_SERVER_PORT': JSON.stringify(process.env.IDE_SERVER_PORT), // 🔧 IDE服务器端口
        'process.env.WS_PATH': JSON.stringify(process.env.WS_PATH), // 🔧 WebSocket路径
        'process.env.STATIC_SERVER_PATH': JSON.stringify(process.env.STATIC_SERVER_PATH), // 🔧 静态服务器路径
        'process.env.EXTENSION_WORKER_HOST': JSON.stringify(process.env.EXTENSION_WORKER_HOST), // 🔧 扩展工作者主机
        'process.env.WEBVIEW_HOST': JSON.stringify(process.env.WEBVIEW_HOST), // 🔧 WebView主机
      }),
      new HtmlWebpackPlugin({
        template: path.join(publicDir, 'index.html'), // 🔧 HTML模板
      }),
      ...(argv.mode === 'production' ? [
        new MiniCssExtractPlugin({
          filename: '[name]/index.css', // 🔧 输出CSS文件名
          chunkFilename: '[id].css', // 🔧 输出CSS块文件名
        })
      ] : []),
      new CopyPlugin({
        patterns: [
          {
            from: require.resolve('@opensumi/ide-monaco/worker/editor.worker.bundle.js'), // 🔧 复制编辑器工作者文件
            to: path.join(outDir, 'editor.worker.bundle.js'), // 🔧 目标路径
          },
        ],
      }),
      new NodePolyfillPlugin({
        // excludeAliases: ['path', 'Buffer', 'process'], // 🔧 可选的polyfill排除
      }),
    ],
    optimization: {
      splitChunks: {
        cacheGroups: {
          vendor: {
            name: 'vendor', // 🔧 供应商代码分组
            chunks: 'all', // 🔧 所有块
            minChunks: 2, // 🔧 最小块数
          },
        },
      }
    },
    infrastructureLogging: {
      level: 'none' // 🔧 基础设施日志级别
    },
    stats: 'none', // 🔧 不输出统计信息
    devServer: {
      hot: true, // 🔧 启用热更新
      devMiddleware: {
        writeToDisk: true, // 🔧 将构建写入磁盘
      },
      client: {
        overlay: {
          runtimeErrors: false, // 🔧 不显示运行时错误
          warnings: false, // 🔧 不显示警告
        }
      },
      historyApiFallback: true, // 🔧 启用历史API回退
      port: devServerPort, // 🔧 开发服务器端口
      proxy: [
        {
          context: ['/service'], // 🔧 代理服务请求
          target: 'ws://localhost:8000', // 🔧 目标地址
          ws: true // 🔧 启用WebSocket代理
        },
      ],
      setupExitSignals: true, // 🔧 设置退出信号
      static: outDir, // 🔧 静态文件目录
      headers: {
        'Content-Security-Policy': "default-src 'self' 'unsafe-inline' data: file:; script-src 'self' 'unsafe-eval' 'unsafe-inline' data: file:; connect-src 'self' file:; worker-src 'self' data: blob:; img-src 'self' data: file:", // 🔧 内容安全策略
      },
    }
  }
});
