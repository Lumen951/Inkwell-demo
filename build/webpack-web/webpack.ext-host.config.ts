/**
 * @file webpack.ext-host.config.ts
 * @description 该文件用于配置Webpack构建扩展主机的应用程序。
 * 包含入口文件、输出配置、外部依赖处理等。
 * 
 * 模块化管理扩展主机的Webpack配置，便于构建和维护。
 * 压缩代码，优化构建性能。
 * 
 * @module webpack.ext-host.config
 */

import path from 'node:path'; // 🔧 导入Node.js的路径模块
import { createConfig, webpackDir } from './webpack.base.config'; // 🔧 导入基础配置
import { asarDeps } from '../deps'; // 🔧 导入asar依赖列表

// 🔧 定义源代码目录和输出目录
const srcDir = path.resolve('src/bootstrap-web/ext-host'); // 源代码目录
const outDir = path.join(webpackDir, 'ext-host'); // 输出目录

/**
 * 创建Webpack配置
 * 
 * @param {unknown} _env - 环境变量（未使用）。
 * @param {Record<string, any>} argv - 命令行参数。
 * @returns {Object} Webpack配置对象
 */
export default createConfig((_, argv) => ({
  entry: srcDir, // 🔧 入口文件设置
  output: {
    filename: 'index.js', // 🔧 输出文件名
    path: outDir, // 🔧 输出路径
  },
  externals: [
    // ⚠️ 处理外部依赖
    ({ request }, callback) => {
      // 检查请求的模块是否在asarDeps中
      if (asarDeps.includes(request!)) {
        // 如果是asar依赖，返回commonjs模块
        return callback(null, 'commonjs ' + request);
      }
      callback(); // 否则继续处理
    },
  ],
  target: 'node', // 🔧 目标环境设置为Node.js
}))
