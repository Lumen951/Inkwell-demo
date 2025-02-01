/**
 * @file webpack.config.ts
 * @description 该文件用于汇总不同的Webpack配置，便于在构建过程中使用。
 * 包含了浏览器、Web视图、扩展主机、工作主机和Node.js的配置。
 * 
 * @module webpack.config
 */

// 🔧 导入不同的Webpack配置
import browser from './webpack.browser.config'; // 浏览器端配置
import webview from './webpack.webview.config'; // Web视图配置
import extHost from './webpack.ext-host.config'; // 扩展主机配置
import workerHost from './webpack.worker-host.config'; // 工作主机配置
import node from './webpack.node.config'; // Node.js配置

/**
 * @function default
 * @description 导出一个包含所有Webpack配置的数组，便于构建时使用。
 * 
 * @returns {Array} 包含多个Webpack配置对象的数组
 */
export default [browser, webview, extHost, workerHost, node]; // 汇总所有配置