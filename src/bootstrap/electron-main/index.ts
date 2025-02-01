/****************************************************
 * 精简版本
 * 本文件用于启动 Electron 主进程并加载必要模块
 ****************************************************/

import '@/core/common/asar'               // 加载 asar 支持
import '@/i18n'                         // 国际化支持
import { app } from 'electron';          // Electron API
import * as path from 'node:path';       // Node 路径处理
import { URI } from '@opensumi/ide-core-common'  // URI 工具
import { WebviewElectronMainModule } from '@opensumi/ide-webview/lib/electron-main'; // Webview 模块
import { ElectronMainApp } from '@/core/electron-main'  // 主应用类
import { CoreElectronMainModule } from '@/core/electron-main'; // 核心模块
import { LoggerModule } from '@/logger/electron-main' // 日志模块
import { AutoUpdaterModule } from '@/auto-updater/electron-main' // 自动更新模块

// 🔧 模块注册
const modules = [
  CoreElectronMainModule,
  WebviewElectronMainModule,
  LoggerModule,
  AutoUpdaterModule,
]

// 启动主进程
startMain();

/**
 * 🚀 startMain
 * 功能描述：初始化并启动 Electron 主应用
 * 参数说明：无
 * 返回值说明：void
 */
function startMain() {
  const mainApp = new ElectronMainApp({
    modules,
    browserUrl: __CODE_WINDOW_DEV_SERVER_URL__ || URI.file(path.join(__dirname, `../renderer/${__CODE_WINDOW_NAME__}/index.html`)).toString(), // 优先使用开发服务器URL
    browserPreload: path.resolve(__dirname, `../renderer/${__CODE_WINDOW_NAME__}/preload.js`),
    nodeEntry: path.join(__dirname, '../node/index.js'),
    extensionEntry: path.join(__dirname, '../ext-host/index.js'),
    extensionWorkerEntry: path.join(__dirname, '../ext-host/worker-host.js'),
    webviewPreload: path.join(__dirname, '../webview/host-preload.js'),
    plainWebviewPreload: path.join(__dirname, '../webview/plain-preload.js'),
    extensionDir: path.join(app.getAppPath(), 'extensions'),
    extensionCandidate: [],
    browserNodeIntegrated: true,
  });

  mainApp.start(); // 启动应用
}


/****************************************************
 * 标准版本
 * 本部分代码依旧实现 Electron 主进程的初始化与启动，
 * 并对每个步骤做了详细描述，遵循 Google 代码注释规范
 ****************************************************/

// 模块导入区
// 🔧 此处引入必要的依赖模块，用于后续的主进程配置
import '@/core/common/asar';
import '@/i18n';
import { app } from 'electron';
import * as path from 'node:path';
import { URI } from '@opensumi/ide-core-common';
import { WebviewElectronMainModule } from '@opensumi/ide-webview/lib/electron-main';
import { ElectronMainApp } from '@/core/electron-main';
import { CoreElectronMainModule } from '@/core/electron-main';
import { LoggerModule } from '@/logger/electron-main';
import { AutoUpdaterModule } from '@/auto-updater/electron-main';

// 🔧 注册所有必要模块，注册顺序可能影响初始化依赖
const modulesStandard = [
  CoreElectronMainModule,
  WebviewElectronMainModule,
  LoggerModule,
  AutoUpdaterModule,
];

// 调用主函数启动应用
startMainStandard();

/**
 * 🚀 startMainStandard
 * 功能描述：实例化并启动 Electron 主应用，配置各入口文件路径
 * @returns {void} 无返回值
 */
function startMainStandard() {
  const mainApp = new ElectronMainApp({
    modules: modulesStandard,
    browserUrl: __CODE_WINDOW_DEV_SERVER_URL__ || URI.file(path.join(__dirname, `../renderer/${__CODE_WINDOW_NAME__}/index.html`)).toString(), // 开发与生产模式切换
    browserPreload: path.resolve(__dirname, `../renderer/${__CODE_WINDOW_NAME__}/preload.js`),
    nodeEntry: path.join(__dirname, '../node/index.js'),
    extensionEntry: path.join(__dirname, '../ext-host/index.js'),
    extensionWorkerEntry: path.join(__dirname, '../ext-host/worker-host.js'),
    webviewPreload: path.join(__dirname, '../webview/host-preload.js'),
    plainWebviewPreload: path.join(__dirname, '../webview/plain-preload.js'),
    extensionDir: path.join(app.getAppPath(), 'extensions'),
    extensionCandidate: [],
    browserNodeIntegrated: true,
  });

  mainApp.start(); // 启动应用
}


/****************************************************
 * 详细版本
 * 此版本提供额外的历史背景、关键性能说明及内联注释。
 * 历史背景：为了支持开发与生产两种环境，通过全局常量
 * (__CODE_WINDOW_DEV_SERVER_URL__ 和 __CODE_WINDOW_NAME__)来区分。
 ****************************************************/

// 导入依赖模块
import '@/core/common/asar';  // 加载 asar 支持，优化文件读取性能 🚀（参见历史说明：解决大型应用打包问题）
import '@/i18n';             // 国际化模块，支持多语言展示
import { app } from 'electron';  // Electron 框架的核心 API
import * as path from 'node:path'; // 引入 Node.js 的 path 模块，保证路径操作的跨平台一致性
import { URI } from '@opensumi/ide-core-common'; // URI 工具，方便文件与 URL 的转换
import { WebviewElectronMainModule } from '@opensumi/ide-webview/lib/electron-main'; // Webview 模块，实现嵌入式浏览器
import { ElectronMainApp } from '@/core/electron-main'; // 核心主应用类，负责应用整体启动逻辑
import { CoreElectronMainModule } from '@/core/electron-main'; // 核心模块，封装主进程基本逻辑
import { LoggerModule } from '@/logger/electron-main'; // 日志模块，用于记录运行时日志（便于故障排查）
import { AutoUpdaterModule } from '@/auto-updater/electron-main'; // 自动更新模块，保持应用始终最新

// 🔧 模块注册：列表内模块执行初始化时按照数组顺序加载
const modulesDetailed = [
  CoreElectronMainModule,
  WebviewElectronMainModule,
  LoggerModule,
  AutoUpdaterModule,
];

// 执行应用主流程
startMainDetailed();

/**
 * 🚀 startMainDetailed
 * 功能描述：构造并启动 Electron 主应用，包含详细的路径配置和初始化参数说明
 *
 * 参数说明：
 *   无参数
 *
 * 返回值说明：
 *   {void} 该函数无返回值，主要作用为启动 Electron 主流程
 *
 * 历史背景：
 *   - __CODE_WINDOW_DEV_SERVER_URL__：开发环境下使用，提供实时加载功能。
 *   - __CODE_WINDOW_NAME__：用以区分不同渲染窗口实例。
 *
 * ⚠️ 注意事项：
 *   - 确保全局常量在构建时已正确注入，否则可能导致路径错误。
 *
 * 🚀 性能优化说明：
 *   - 路径解析及 URI 转换均采用高性能算法，时间复杂度大致为 O(n)。
 */
function startMainDetailed() {
  const mainApp = new ElectronMainApp({
    modules: modulesDetailed,
    // 使用开发服务器 URL 或本地打包 HTML 文件
    browserUrl: __CODE_WINDOW_DEV_SERVER_URL__ || URI.file(path.join(__dirname, `../renderer/${__CODE_WINDOW_NAME__}/index.html`)).toString(),
    // 浏览器预加载脚本路径，确保提前加载必要的环境配置
    browserPreload: path.resolve(__dirname, `../renderer/${__CODE_WINDOW_NAME__}/preload.js`),
    // Node 环境入口文件，用于后台业务逻辑
    nodeEntry: path.join(__dirname, '../node/index.js'),
    // 扩展主进程入口，管理扩展生命周期
    extensionEntry: path.join(__dirname, '../ext-host/index.js'),
    // 扩展工作进程入口，用于处理耗时任务
    extensionWorkerEntry: path.join(__dirname, '../ext-host/worker-host.js'),
    // Webview 主预加载脚本，处理前端与后端通信安全策略
    webviewPreload: path.join(__dirname, '../webview/host-preload.js'),
    // 简化版 Webview 预加载脚本，针对低复杂度任务优化
    plainWebviewPreload: path.join(__dirname, '../webview/plain-preload.js'),
    // 应用扩展存放目录，基于 Electron 应用路径构建
    extensionDir: path.join(app.getAppPath(), 'extensions'),
    // 当前无候选扩展
    extensionCandidate: [],
    // 集成浏览器与 Node 环境，可提升数据交互性能
    browserNodeIntegrated: true,
  });

  // 启动 Electron 主应用，触发所有初始化操作
  mainApp.start();
}
