/**
 * @file ElectronMainApp.ts
 * @summary 🚀 封装 Electron 主线程应用的核心类，用于管理应用启动、生命周期钩子、单实例控制、退出事件监听及 macOS 平台下应用目录移动操作。
 * 
 * 本模块扩展自 @opensumi/ide-core-electron-main，利用 Electron 提供的 API (app, dialog) 实现应用的启动、退出及多实例管理。
 * @历史背景: 随着 macOS 平台安全策略的不断变化和多进程需求的增加，本模块经历多次重构以保证应用在各平台下的稳定性与一致性。
 */

import { app, dialog } from 'electron'; // 🔧 导入 Electron 应用和对话框模块
import { Injector } from '@opensumi/di'; // 🔧 用于依赖注入
import { ElectronMainApp as BaseElectronMainApp, ElectronAppConfig } from '@opensumi/ide-core-electron-main'; // 🔧 基础 Electron 应用
import { ILogService } from '@/logger/common'; // 🔧 日志服务接口
import { ElectronMainContribution } from './types'; // 🔧 生命周期贡献者类型定义
import { isMacintosh } from '@opensumi/ide-core-common'; // 🔧 检查是否为 macOS 平台
import { WindowsManager } from './window/windows-manager'; // 🔧 窗口管理器

/**
 * @class ElectronMainApp
 * @summary 🚀 核心类：封装 Electron 主进程生命周期管理、平台适配及单实例控制。
 */
export class ElectronMainApp {
  // 🔧 依赖注入器实例，负责管理服务注册与获取
  private injector = new Injector;
  // 🔧 基础应用实例（基于 opensumi 内核）
  private baseApp: BaseElectronMainApp;
  // 🔧 日志服务实例，用于记录调试和出错信息
  private logger: ILogService;
  // 🚀 标记是否已进入退出流程，防止重复退出
  private pendingQuit = false;

  /**
   * @constructor
   * @summary 🚀 初始化 ElectronMainApp 实例，包括基础应用构造和生命周期贡献者的准备工作。
   * @param {ElectronAppConfig} config - 配置对象，包含应用启动的基本参数
   * @returns {void}
   * 
   * @说明:
   * - 创建 BaseElectronMainApp 实例时，将 DI 注入器传入以便后续服务管理。
   * - 遍历所有生命周期贡献者，依次调用其 onBeforeReady 钩子，执行提前初始化逻辑。
   * @注意: 依赖注入模式有助于提高代码的可测试性和可维护性。
   */
  constructor(config: ElectronAppConfig) {
    this.baseApp = new BaseElectronMainApp({
      ...config,
      injector: this.injector,
    });
    this.logger = this.injector.get(ILogService);
    // 初始化所有贡献者的 onBeforeReady 钩子
    for (const contribution of this.contributions) {
      if (contribution.onBeforeReady) {
        contribution.onBeforeReady();
      }
    }
  }

  /**
   * @function contributions
   * @summary 🔧 获取所有 ElectronMainContribution 贡献者集合
   * @returns {ElectronMainContribution[]} 返回数组，包含所有生命周期贡献者实例
   */
  get contributions() {
    return this.baseApp.contributions as ElectronMainContribution[];
  }

  /**
   * @function start
   * @summary 🚀 启动应用，执行各阶段生命周期钩子，确保应用正确初始化与平台适配。
   * @returns {Promise<void>} 返回一个 Promise，表示启动流程的异步完成
   * 
   * @详细步骤:
   * 1. 记录启动日志并等待 Electron 应用就绪 (app.whenReady)。
   * 2. 注册退出和窗口关闭事件监听器以管理应用退出流程 (registerListenerAfterReady)。
   * 3. 同步执行所有贡献者的 onWillStart 钩子，确保预启动逻辑完成。
   * 4. 检查单实例锁，防止多实例运行 (claimInstance)。
   * 5. 对 macOS 平台提示用户将应用移动到 Applications 文件夹 (moveToApplication)。
   * 6. 执行所有贡献者的 onStart 钩子，启动主业务逻辑。
   */
  async start() {
    this.logger.log('start'); // 🚀 开始启动流程
    await app.whenReady(); // 等待 Electron 完成初始化
    this.registerListenerAfterReady(); // 注册应用退出相关事件监听

    this.logger.log('trigger onWillStart'); // 记录生命周期阶段
    await Promise.all(this.contributions.map(contribution => contribution.onWillStart?.())); // 执行所有 onWillStart 钩子
    this.claimInstance(); // 处理单实例逻辑
    this.moveToApplication(); // 针对 macOS 执行应用目录移动操作

    this.logger.log('trigger onStart'); // 记录生命周期阶段
    await Promise.all(this.contributions.map(contribution => contribution.onStart?.())); // 执行所有 onStart 钩子
  }

  /**
   * @function registerListenerAfterReady
   * @summary ⚠️ 注册 Electron 应用的退出及窗口关闭事件监听器，确保退出流程的安全性与顺序
   * @returns {void}
   * 
   * @详细说明:
   * - 注册 'before-quit' 事件：设置退出标记，确保退出操作仅触发一次。
   * - 注册 'window-all-closed' 事件：根据平台判断是否退出，非 macOS 平台直接退出。
   * - 注册 'will-quit' 事件：阻止默认退出行为，等待所有贡献者的 onWillQuit 钩子
   *   完成后，清除事件监听器并安全退出应用。
   * 
   * 核心算法步骤如下：
   * | 步骤 | 描述 | 实现代码片段 |
   * | ---- | ---- | ------------- |
   * | 1 | 注册退出前事件，设置退出标记 | this.pendingQuit = true; |
   * | 2 | 注册窗口关闭事件，根据平台判断是否退出 | if (this.pendingQuit || !isMacintosh) { app.quit(); } |
   * | 3 | 注册 'will-quit' 事件，等待所有 onWillQuit 钩子完成后清理并退出 | Promise.allSettled(...).finally(...); |
   * 
   * @复杂度: 时间复杂度 O(n)，n 为贡献者数量
   */
  private registerListenerAfterReady() {
    // 定义 before-quit 事件处理器，确保退出流程只进行一次
    const handleBeforeQuit = () => {
      if (this.pendingQuit) return; // 🚀 防止重复执行退出流程
      this.logger.debug('lifecycle#before-quit');
      this.pendingQuit = true;
    };
    app.on('before-quit', handleBeforeQuit); // 监听退出前事件

    // 定义窗口全部关闭事件处理器，根据平台条件判断是否退出应用
    const handleWindowAllClose = () => {
      this.logger.debug('lifecycle#window-all-closed');
      // ⚠️ 对于非 macOS 平台，或已进入退出流程时，直接退出应用
      if (this.pendingQuit || !isMacintosh) {
        app.quit();
      }
    };
    app.on('window-all-closed', handleWindowAllClose); // 注册窗口关闭事件监听

    // 监听 'will-quit' 事件以延迟退出，确保所有异步任务完成后退出
    app.once('will-quit', (e) => {
      e.preventDefault(); // ⚠️ 阻止 Electron 默认退出行为
      // 执行所有贡献者的 onWillQuit 钩子，并等待所有异步操作结束
      Promise.allSettled(this.contributions.map(contribution => contribution.onWillQuit?.()))
        .finally(() => {
          // 清理事件监听器，防止内存泄漏
          app.removeListener('before-quit', handleBeforeQuit);
          app.removeListener('window-all-closed', handleWindowAllClose);
          this.logger.debug('lifecycle#will-quit');
          // 使用 setTimeout 确保退出动作延后，给事件循环完成必要的清理
          setTimeout(() => {
            app.quit();
          });
        });
    });
  }

  /**
   * @function claimInstance
   * @summary 🚀 处理应用单实例逻辑，确保同一时间只运行一个实例，并管理第二实例事件
   * @returns {void}
   * 
   * @详细说明:
   * - 请求单实例锁，传递当前进程 ID 以确保唯一性
   * - 如果锁申请失败，则退出当前应用，以防多个实例同时运行
   * - 如果申请成功，则注册 'second-instance' 事件监听器：
   *   当检测到第二个实例启动时，激活现有实例的窗口，并通过 WindowsManager 创建新代码窗口
   * @注意: 该方法依赖 Node.js 的 process 对象，请确保已安装 @types/node 类型定义。
   * @复杂度: 时间复杂度 O(1)
   */
  private claimInstance() {
    // 请求单实例锁，防止多实例运行
    const gotTheLock = app.requestSingleInstanceLock({ pid: process.pid });
    this.logger.log('gotTheLock:', gotTheLock, process.pid);
    if (!gotTheLock) {
      app.exit(); // ⚠️ 未获得锁则直接退出应用
    } else {
      // 注册当第二个实例启动时的处理逻辑
      app.on('second-instance', (_event, argv, workingDirectory, additionalData) => {
        this.logger.log('second-instance', argv, workingDirectory, additionalData);
        // ⚠️ 仅在 macOS 平台调用 focus 确保当前实例获得焦点
        if (isMacintosh) {
          app.focus({ steal: true });
        }
        // 通过依赖注入获取 WindowsManager 实例，并创建新的代码窗口
        this.injector.get(WindowsManager).createCodeWindow();
      });
    }
  }

  /**
   * @function moveToApplication
   * @summary 🚀 针对 macOS 平台，提示并将应用移动到 Applications 文件夹以提升安全性和管理便捷性
   * @returns {void}
   * 
   * @详细说明:
   * - 首先检测当前平台是否为 'darwin'，以及应用是否为打包状态且尚未移动到 Applications 文件夹
   * - 弹出对话框征询用户是否进行移动操作
   * - 用户选择「移动」后，调用 app.moveToApplicationsFolder，并在冲突情况下通过对话框通知用户
   * - 如果发生异常，则通过日志记录错误信息
   * @复杂度: 时间复杂度 O(1)
   */
  private moveToApplication() {
    // 🌐 平台检查：仅对 macOS 且未移动的已打包应用执行移动操作
    if (process.platform !== 'darwin' || !app.isPackaged || app.isInApplicationsFolder()) return;
    const chosen = dialog.showMessageBoxSync({
      type: 'question',
      buttons: ['移动', '不移动'],
      message: '是否移动到 Applications 目录',
      defaultId: 0,
      cancelId: 1,
    });

    if (chosen !== 0) return; // 用户选择不移动时退出操作

    try {
      app.moveToApplicationsFolder({
        // 冲突处理函数，用于解决应用移动过程中的冲突情况
        conflictHandler: (conflictType) => {
          if (conflictType === 'existsAndRunning') {
            // ⚠️ 当检测到 Applications 目录中已有正在运行的相同应用时，提示用户关闭其他版本后重试
            dialog.showMessageBoxSync({
              type: 'info',
              message: '无法移动到 Applications 目录',
              detail:
                'Applications 目录已运行另一个版本的 CodeFuse IDE，请先关闭后重试。',
            });
          }
          return true; // 返回 true 表示冲突已处理，可以继续移动操作
        },
      });
    } catch (err: any) {
      // 记录错误日志，帮助快速定位移动过程中出现的问题
      this.logger.error(`Failed to move to applications folder: ${err?.message}}`);
    }
  }
}
