/**
 * @file webpack.worker-host.config.ts
 * @description 该文件用于配置Webpack构建Web Worker的应用程序。
 * 包含入口文件、输出配置、目标环境设置、模块解析等。
 * 
 * @module webpack.worker-host.config
 */

import path from 'node:path'; // 🔧 导入Node.js的路径模块
import { ProvidePlugin } from 'webpack'; // 🔧 导入Webpack的ProvidePlugin，用于自动加载模块
import { webpackDir } from "./webpack.base.config"; // 🔧 导入基础配置中的Webpack目录
import { createConfig } from "../webpack/webpack.base.config"; // 🔧 导入创建Webpack配置的函数

// 🔧 定义输出目录
const outDir = path.join(webpackDir, 'ext-host'); // 输出目录为webpackDir下的ext-host

/**
 * 创建Webpack配置
 * 
 * @param {Object} _env - 环境变量（未使用）。
 * @param {Object} argv - 命令行参数。
 * @returns {Object} Webpack配置对象
 */
export default createConfig({
    entry: require.resolve('@opensumi/ide-extension/lib/hosted/worker.host-preload'), // 🔧 入口文件设置
    output: {
        filename: 'worker-host.js', // 🔧 输出文件名
        path: outDir, // 🔧 输出路径
    },
    target: 'webworker', // 🔧 目标环境设置为Web Worker
    node: {
        global: true, // 🔧 允许在Web Worker中使用全局变量
    },
    resolve: {
        fallback: {
            os: false, // 🔧 不使用os模块的回退
            util: false, // 🔧 不使用util模块的回退
            buffer: require.resolve('buffer/'), // 🔧 使用buffer模块的回退
        },
    },
    plugins: [
        new ProvidePlugin({
            Buffer: ['buffer', 'Buffer'], // 🔧 自动加载Buffer模块
            process: 'process/browser', // 🔧 自动加载process模块
        }),
    ],
})