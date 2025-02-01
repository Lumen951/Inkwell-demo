/**
 * 该模块用于配置Webpack以构建Electron主进程的代码。
 * 
 * 功能描述：
 * - 定义入口文件、输出路径、目标环境及外部依赖。
 * - 使用DefinePlugin注入环境变量和配置项。
 * 1. 入口文件：指定Webpack从哪个文件开始构建应用程序的依赖图。它是应用程序的起点，Webpack会从这个文件开始分析所有的依赖关系。
 * 2. 输出路径：定义Webpack构建后生成的文件存放的位置。通过设置输出路径，可以确保构建的文件能够被正确找到和使用。
 * 3. 目标环境：指定Webpack构建的目标环境（如浏览器、Node.js、Electron等）。这会影响到Webpack如何处理代码和依赖，以确保生成的代码能够在指定环境中正常运行。
 * 4. 外部依赖：通过配置外部依赖，可以避免将某些库打包到输出文件中，从而减小文件体积并提高性能。这对于一些大型库（如asar依赖）尤其重要，因为它们可能已经在运行环境中存在。
 * 
 * 为什么要在主进程配置环境?
 * 角色说明:主进程是Electron应用的核心，负责管理应用的生命周期、创建和管理窗口、处理系统事件等。它是应用程序的入口点。
 * 环境：主进程运行在Electron的上下文中，能够访问Electron的API（如BrowserWindow、app等），这些API是专门为Electron设计的，提供了与操作系统和用户界面交互的能力。
 * 
 * 参数说明：
 * - _：未使用的参数，通常用于接收环境变量。
 * - argv：包含命令行参数的对象，主要用于获取Webpack的运行模式。
 * 
 * 返回值说明：
 * - 返回一个Webpack配置对象，包含入口、输出、目标、外部依赖和插件配置。
 */

import path from 'node:path'; // 导入Node.js的path模块，用于处理文件路径
import { DefinePlugin } from 'webpack'; // 导入Webpack的DefinePlugin，用于定义全局常量
import product from '../../product.json'; // 导入产品信息
import { createConfig, webpackDir, devServerPort, codeWindowName, updateWindowName } from './webpack.base.config'; // 导入基础配置
import { asarDeps } from '../deps'; // 导入asar依赖

const srcDir = path.resolve('src/bootstrap/electron-main'); // 🔧 配置项：主进程源代码目录
const outDir = path.resolve(webpackDir, 'main'); // 🔧 配置项：主进程输出目录

export default createConfig((_, argv) => ({
  entry: srcDir, // 🔧 配置项：Webpack的入口文件
  output: {
    filename: 'index.js', // 🔧 配置项：输出文件名
    path: outDir, // 🔧 配置项：输出路径
  },
  target: 'electron-main', // 🔧 配置项：目标环境为Electron主进程
  externals: [
    // ⚠️ 注意事项：处理外部依赖，避免将asar依赖打包到输出文件中
    ({ request }, callback) => {
      if (asarDeps.includes(request!)) {
        return callback(null, 'commonjs ' + request); // 将asar依赖标记为commonjs模块
      }
      callback(); // 继续处理其他请求
    },
  ],
  plugins: [
    new DefinePlugin({
      __PRODUCT__: JSON.stringify(product), // 🚀 性能优化：将产品信息注入到代码中
      __CODE_WINDOW_NAME__: `'${codeWindowName}'`, // 🚀 性能优化：注入代码窗口名称
      __UPDATE_WINDOW_NAME__: `'${updateWindowName}'`, // 🚀 性能优化：注入更新窗口名称
      __CODE_WINDOW_DEV_SERVER_URL__: argv.mode === 'development' ? `'http://localhost:${devServerPort}/${codeWindowName}'` : "''", // 🚀 性能优化：根据模式注入开发服务器URL
      __UPDATE_WINDOW_DEV_SERVER_URL__: argv.mode === 'development' ? `'http://localhost:${devServerPort}/${updateWindowName}'` : "''", // 🚀 性能优化：根据模式注入更新窗口开发服务器URL
    }),
  ]
}));
