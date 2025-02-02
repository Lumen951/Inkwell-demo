/**
 * 🔥 文件功能总结：
 * 本文件实现了 Electron 主进程的生命周期管理。主要功能包括：
 * 1. 启动前的环境变量设置与必要目录创建，以及存储服务的初始化（在 onWillStart 方法中实现）。
 * 2. 启动后的主窗口创建与应用激活事件处理，确保在无窗口状态下自动重建窗口（在 onStart 方法中实现）。
 *
 * 历史背景：为适应 macOS 等平台中 Electron 应用的特殊行为，本模块采用依赖注入模式和异步并行处理方式，
 * 使各个子模块（如环境配置、存储、窗口管理与日志服务）之间解耦，提高了代码的可维护性与可扩展性。
 */

import { app } from 'electron'
import * as fs from 'node:fs/promises'
import { Autowired } from '@opensumi/di'
import { Domain } from '@opensumi/ide-core-common'
import { ILogService } from '@/logger/common'
import { ElectronMainContribution } from './types'
import { IEnvironmentService } from '../common'
import { StorageService } from './storage.service'
import { WindowsManager } from './window/windows-manager'

@Domain(ElectronMainContribution)
export class LifecycleContribution implements ElectronMainContribution {

  // 🔧 注入环境配置服务，提供应用相关文件夹及路径配置
  @Autowired(IEnvironmentService)
  environmentService: IEnvironmentService

  // 🔧 注入存储服务，用于初始化与管理应用数据
  @Autowired(StorageService)
  storageService: StorageService;

  // 🔧 注入窗口管理服务，负责管理和创建应用窗口
  @Autowired(WindowsManager)
  windowsManager: WindowsManager

  // 🔧 注入日志服务，记录关键生命周期事件及调试信息
  @Autowired(ILogService)
  logger: ILogService

  /**
   * 🚀 onWillStart 方法
   *
   * 功能描述：在 Electron 应用启动前执行必要的准备操作，包括环境变量的设置、必要目录的创建以及存储服务初始化。
   *
   * @async
   * @function onWillStart
   * @param {void} 无输入参数
   * @returns {Promise<void>} 返回一个 Promise，表示异步操作的完成
   *
   * @注意：采用 Promise.all 实现并行执行，提升启动时的性能（时间复杂度与并行任务数线性相关）。
   *
   * 核心算法步骤说明：
   * | 步骤描述                     | 实现代码片段                                                                         |
   * | ---------------------------- | ------------------------------------------------------------------------------------ |
   * | 1. 设置全局环境变量          | this.setProcessEnv()                                                                 |
   * | 2. 条件创建 logHome 与 extensionsPath 目录 | Promise.all([...].map(filepath => filepath ? fs.mkdir(filepath, { recursive: true }) : null)) |
   * | 3. 初始化存储服务            | this.storageService.init()                                                           |
   */
  async onWillStart() {
    // 设置全局进程环境变量，确保子模块能读取到相关配置信息
    this.setProcessEnv();

    // 🔧 并行执行目录创建与存储服务初始化，提升启动效率
    await Promise.all([
      // 对 environmentService 提供的 logHome 与 extensionsPath 目录进行条件性创建
      Promise.all([
        this.environmentService.logHome,
        this.environmentService.extensionsPath,
      ].map(filepath => 
        // 如果路径存在则递归创建目录，否则跳过【⚠️ 注意：此处 null 表示无需操作】
        filepath ? fs.mkdir(filepath, { recursive: true }) : null
      )),
      // 初始化存储服务，准备数据存储环境
      this.storageService.init(),
    ])
  }

  /**
   * 🚀 onStart 方法
   *
   * 功能描述：在 Electron 应用启动后执行操作，主要包括创建初始窗口以及注册“activate”事件监听器，
   * 以便在应用被激活时（特别是在 macOS 下）检测并确保至少有一个窗口处于激活状态。
   *
   * @function onStart
   * @param {void} 无输入参数
   * @returns {void} 无返回值
   *
   * @注意：在 macOS 等平台中，当用户点击应用图标且无窗口显示时，“activate”事件会触发，此时需重新创建窗口。
   */
  onStart() {
    // 🔧 启动时创建主代码窗口，确保应用界面初始展示
    this.windowsManager.createCodeWindow()

    // 监听 Electron 的 'activate' 事件，主要用于 macOS 平台
    app.on('activate', (_e, hasVisibleWindows) => {
      // 记录激活事件，便于后续调试【🚀 性能优化：日志输出可帮助追踪事件触发频率】
      this.logger.debug('lifecycle#activate')
      // 如果当前没有任何可见窗口，则重新创建一个代码窗口
      if (!hasVisibleWindows) {
        this.windowsManager.createCodeWindow()
      }
    })
  }

  /**
   * 🔧 setProcessEnv 方法
   *
   * 功能描述：根据环境配置服务提供的信息设置 Node.js 进程的全局环境变量，
   * 使得其他模块可以统一获取 IDE 相关的配置信息，例如版本号、数据目录及扩展路径等。
   *
   * @function setProcessEnv
   * @param {void} 无输入参数
   * @returns {void} 无返回值
   *
   * @说明：利用 electron 的 app.getVersion() 方法获取当前应用版本，并结合 environmentService 中的配置值统一设置环境变量。
   */
  private setProcessEnv() {
    // 从注入的环境配置服务中解构出相关的配置信息
    const { dataFolderName, logRoot, logHome, extensionsPath } = this.environmentService;
    
    // 设置 IDE 版本信息，便于模块间版本兼容性检查
    process.env.IDE_VERSION = app.getVersion();
    // 🔧 配置数据文件夹名称，便于存储位置管理
    process.env.IDE_DATA_FOLDER_NAME = dataFolderName;
    // 🔧 设置日志根目录，统一管理应用日志文件
    process.env.IDE_LOG_ROOT = logRoot;
    // 🔧 配置日志文件存放路径，便于日志归档与查看
    process.env.IDE_LOG_HOME = logHome;
    // 🔧 设置扩展插件存放路径，便于后续插件的加载与管理
    process.env.IDE_EXTENSIONS_PATH = extensionsPath;
  }
}
