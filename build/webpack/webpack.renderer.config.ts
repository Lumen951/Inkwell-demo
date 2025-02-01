/**
 * @file webpack.renderer.config.ts
 * @description 该文件用于配置 Electron 渲染进程的 Webpack 构建设置。
 * 包含入口、输出、模块规则、插件配置等。
 * 
 * @module webpack.renderer.config
 */

import path from 'node:path'; // 🔧 导入 Node.js 的 path 模块，用于处理文件路径
import MiniCssExtractPlugin from 'mini-css-extract-plugin'; // 🔧 导入 MiniCssExtractPlugin，用于提取 CSS
import CopyPlugin from 'copy-webpack-plugin'; // 🔧 导入 CopyPlugin，用于复制文件
import HtmlWebpackPlugin from 'html-webpack-plugin'; // 🔧 导入 HtmlWebpackPlugin，用于生成 HTML 文件
import { createConfig, webpackDir, devServerPort, codeWindowName, updateWindowName } from './webpack.base.config'; // 🔧 导入基础配置

// 🔧 定义源代码和输出目录
const srcDir = path.resolve('src/bootstrap/browser'); // 源代码目录
const outDir = path.resolve(webpackDir, 'renderer'); // 输出目录
const updateSrcDir = path.resolve('src/auto-updater/update-window'); // 更新窗口源代码目录

/**
 * @function createWebpackConfig
 * @description 创建 Webpack 配置
 * @param {Object} _env - 环境变量
 * @param {Object} argv - 命令行参数
 * @returns {Object} Webpack 配置对象
 */
export default createConfig((_env, argv) => {
  // 根据模式选择样式加载器
  const styleLoader = argv.mode === 'production' ? MiniCssExtractPlugin.loader : 'style-loader'; // 🔧 生产模式使用 MiniCssExtractPlugin.loader

  return {
    entry: {
      [codeWindowName]: path.resolve(srcDir, 'index.ts'), // 入口文件
      [updateWindowName]: path.resolve(updateSrcDir, 'index.tsx'), // 更新窗口入口文件
    },
    output: {
      filename: '[name]/index.js', // 输出文件名
      path: outDir, // 输出路径
      assetModuleFilename: 'assets/[name].[hash][ext]', // 资源文件名
    },
    devtool: argv.mode === 'production' ? false as const : 'eval-source-map', // 🔧 开发工具配置
    target: 'electron-renderer', // 🔧 目标环境为 Electron 渲染进程
    externalsPresets: {
      node: true, // 🔧 外部预设为 Node.js
    },
    module: {
      rules: [
        {
          test: /\.css$/, // 匹配 CSS 文件
          use: [styleLoader, 'css-loader'], // 使用样式加载器和 CSS 加载器
        },
        {
          test: /\.module.less$/, // 匹配 LESS 模块文件
          use: [
            {
              loader: styleLoader,
              options: {
                esModule: false, // 🔧 关闭 ES 模块
              }
            },
            {
              loader: 'css-loader',
              options: {
                importLoaders: 0, // 🔧 不使用 importLoaders
                sourceMap: true, // 🔧 启用源映射
                esModule: false, // 🔧 关闭 ES 模块
                modules: {
                  localIdentName: '[local]___[hash:base64:5]', // 🔧 CSS 模块命名
                },
              },
            },
            {
              loader: 'less-loader',
              options: {
                lessOptions: {
                  javascriptEnabled: true, // 🔧 启用 JavaScript
                },
              },
            },
          ],
        },
        {
          test: /^((?!\.module).)*less$/, // 匹配非模块 LESS 文件
          use: [
            {
              loader: styleLoader,
              options: {
                esModule: false, // 🔧 关闭 ES 模块
              }
            },
            {
              loader: 'css-loader',
              options: {
                importLoaders: 0, // 🔧 不使用 importLoaders
                esModule: false, // 🔧 关闭 ES 模块
              },
            },
            {
              loader: 'less-loader',
              options: {
                lessOptions: {
                  javascriptEnabled: true, // 🔧 启用 JavaScript
                },
              },
            },
          ],
        },
        {
          test: /\.(woff(2)?|ttf|eot|svg|png)(\?v=\d+\.\d+\.\d+)?$/, // 匹配字体和图片文件
          type: 'asset', // 🔧 资源类型
          parser: {
            dataUrlCondition: {
              maxSize: 8 * 1024, // 🔧 小于 8KB 的文件转为 Data URL
            }
          }
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: path.join(srcDir, 'index.html'), // 🔧 HTML 模板
        filename: `${codeWindowName}/index.html`, // 输出 HTML 文件名
        chunks: [codeWindowName] // 关联的代码块
      }),
      new HtmlWebpackPlugin({
        template: path.join(updateSrcDir, 'index.html'), // 🔧 更新窗口 HTML 模板
        filename: `${updateWindowName}/index.html`, // 输出更新窗口 HTML 文件名
        chunks: [updateWindowName] // 关联的代码块
      }),
      ...(argv.mode === 'production' ? [
        new MiniCssExtractPlugin({
          filename: '[name]/index.css', // 🔧 输出 CSS 文件名
          chunkFilename: '[id].css', // 🔧 输出 CSS 片段文件名
        })
      ] : []),
      new CopyPlugin({
        patterns: [
          {
            from: path.resolve(srcDir, 'preload.js'), // 🔧 复制 preload.js
            to: path.join(outDir, codeWindowName, 'preload.js'), // 目标路径
          },
          {
            from: require.resolve('@opensumi/ide-monaco/worker/editor.worker.bundle.js'), // 🔧 复制 editor.worker.bundle.js
            to: path.join(outDir, codeWindowName, 'editor.worker.bundle.js'), // 目标路径
          },
          {
            from: require.resolve('tiktoken/tiktoken_bg.wasm'), // 🔧 复制 tiktoken_bg.wasm
            to: path.join(outDir, codeWindowName, 'tiktoken_bg.wasm'), // 目标路径
          },
        ],
      }),
    ],
    optimization: {
      splitChunks: {
        cacheGroups: {
          vendor: {
            name: 'vendor', // 🔧 供应商代码分组
            chunks: 'all', // 🔧 所有代码块
            minChunks: 2, // 🔧 至少被两个代码块引用
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
        writeToDisk: true, // 🔧 将构建结果写入磁盘
      },
      client: {
        overlay: {
          runtimeErrors: false, // 🔧 不显示运行时错误
          warnings: false, // 🔧 不显示警告
        }
      },
      historyApiFallback: true, // 🔧 启用历史 API 回退
      port: devServerPort, // 🔧 开发服务器端口
      setupExitSignals: true, // 🔧 设置退出信号
      static: outDir, // 🔧 静态文件目录
      headers: {
        'Content-Security-Policy': "default-src 'self' 'unsafe-inline' data: file:; script-src 'self' 'unsafe-eval' 'unsafe-inline' data: file:; connect-src 'self' file:; worker-src 'self' data: blob:; img-src 'self' data: file:", // 🔧 内容安全策略
      },
    }
  }
});
