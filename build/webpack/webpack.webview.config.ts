/**
 * @file webpack.webview.config.ts
 * @description 该文件用于配置 Electron Webview 的 Webpack 构建设置。
 * 包含入口、输出、目标环境及插件配置等。
 * 
 * @module webpack.webview.config
 */

import path from 'node:path'; // 🔧 导入 Node.js 的 path 模块，用于处理文件路径
import CopyPlugin from 'copy-webpack-plugin'; // 🔧 导入 CopyPlugin，用于复制文件
import { createConfig, webpackDir } from './webpack.base.config'; // 🔧 导入基础配置

const outDir = path.join(webpackDir, 'webview'); // 🔧 配置项：输出目录

/**
 * 创建 Webpack 配置
 * 
 * 功能描述：生成用于构建 Electron Webview 的 Webpack 配置对象。
 * 
 * @returns {Object} Webpack 配置对象
 */
export default createConfig(
  {
    entry: require.resolve('@opensumi/ide-webview/lib/electron-webview/host-preload.js'), // 🔧 配置项：入口文件
    output: {
      filename: 'host-preload.js', // 🔧 配置项：输出文件名
      path: outDir, // 🔧 配置项：输出路径
    },
    target: 'electron-preload', // 🔧 配置项：目标环境为 Electron 预加载
    plugins: [
      new CopyPlugin({
        patterns: [
          {
            from: require.resolve('@opensumi/ide-webview/lib/electron-webview/plain-preload.js'), // 🔧 配置项：源文件
            to: path.join(outDir, 'plain-preload.js'), // 🔧 配置项：目标文件
          },
        ],
      }),
    ],
  }
);
