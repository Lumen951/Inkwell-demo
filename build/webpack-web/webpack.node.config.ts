/**
 * 配置Webpack以构建Node.js应用程序的配置文件。
 * 
 * @module webpack.node.config.ts
 * 
 * 该配置文件定义了Webpack的入口、输出、插件和外部依赖项。
 * 
 * @param {Object} _ - Webpack的上下文参数，未使用。
 * @param {Object} argv - Webpack的命令行参数。
 * @returns {Object} Webpack配置对象。
 */

import path from 'node:path'; // 🔧 导入Node.js的path模块，用于处理文件路径
import { createConfig, webpackDir } from './webpack.base.config'; // 🔧 导入基础配置函数和Webpack目录
import { asarDeps } from '../deps'; // 🔧 导入asar依赖项
import CopyPlugin from "copy-webpack-plugin"; // 🔧 导入用于复制文件的Webpack插件

// 定义源目录和输出目录
const srcDir = path.resolve('src/bootstrap-web/node'); // 🔧 源代码目录
const outDir = path.resolve(webpackDir, 'node'); // 🔧 输出文件目录

// 获取项目根目录
const projectRoot = path.resolve(__dirname, '../../'); // 🔧 项目根目录

export default createConfig((_, argv) => ({
  entry: srcDir, // 🔧 入口文件
  output: {
    filename: 'index.js', // 🔧 输出文件名
    path: outDir, // 🔧 输出路径
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        {
          from: path.resolve(projectRoot, 'product.json'), // 🔧 从项目根目录复制product.json
          to: path.join(outDir, 'product.json'), // 🔧 复制到输出目录
        }
      ],
    }),
  ],
  target: 'node', // 🔧 目标环境为Node.js
  // ws 相关配置
  externals: [
    {
      bufferutil: 'commonjs bufferutil', // 🔧 将bufferutil标记为外部依赖
      'utf-8-validate': 'commonjs utf-8-validate', // 🔧 将utf-8-validate标记为外部依赖
    },
    // 🔧 自定义外部依赖处理
    ({ request }, callback) => {
      if (asarDeps.includes(request!)) { // 🔧 检查请求的模块是否在asar依赖中
        return callback(null, 'commonjs ' + request); // 🔧 返回commonjs模块
      }
      callback(); // 🔧 继续处理其他模块
    },
  ],
}));
