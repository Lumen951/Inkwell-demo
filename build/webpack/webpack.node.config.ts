/**
 * 该模块用于配置Webpack以构建Electron Node进程的代码。
 * 
 * 功能描述：
 * - 定义入口文件、输出路径、目标环境及外部依赖。
 * - 使用createConfig函数生成Webpack配置对象。
 * 
 * 为什么要在Node进程配置环境?
 * 角色说明:Node进程是Electron应用的子进程，负责处理与主进程的通信、执行后台任务、处理系统事件等。它是应用程序的子进程。
 * 环境：Node进程运行在Node.js的上下文中，能够访问Node.js的API（如fs、child_process等），这些API是专门为Node.js设计的，提供了与操作系统交互的能力。
 * 
 * 参数说明：
 * - _：未使用的参数，通常用于接收环境变量。
 * - argv：包含命令行参数的对象，主要用于获取Webpack的运行模式。
 * 
 * 返回值说明：
 * - 返回一个Webpack配置对象，包含入口、输出、目标及外部依赖配置。
 */

import path from 'node:path'; // 导入Node.js的path模块，用于处理文件路径
import { createConfig, webpackDir } from './webpack.base.config'; // 导入基础配置
import { asarDeps } from '../deps'; // 导入asar依赖

const srcDir = path.resolve('src/bootstrap/node'); // 🔧 配置项：Node进程源代码目录
const outDir = path.resolve(webpackDir, 'node'); // 🔧 配置项：Node进程输出目录

export default createConfig((_, argv) => ({
  entry: srcDir, // 🔧 配置项：Webpack的入口文件
  output: {
    filename: 'index.js', // 🔧 配置项：输出文件名
    path: outDir, // 🔧 配置项：输出路径
  },
  target: 'node', // 🔧 配置项：目标环境为Node
  // ws 弱依赖
  externals: [
    {
      bufferutil: 'commonjs bufferutil', // ⚠️ 注意事项：将bufferutil标记为commonjs模块
      'utf-8-validate': 'commonjs utf-8-validate', // ⚠️ 注意事项：将utf-8-validate标记为commonjs模块
    },
    // ⚠️ 注意事项：处理asar依赖，避免将其打包到输出文件中
    ({ request }, callback) => {
      if (asarDeps.includes(request!)) {
        return callback(null, 'commonjs ' + request); // 将asar依赖标记为commonjs模块
      }
      callback(); // 继续处理其他请求
    },
  ],
}));
