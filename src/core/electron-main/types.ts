/**
 * 🔧 文件功能: 本模块定义了 Electron 主进程贡献接口及其生命周期钩子，
 * 用于在应用启动、运行及退出的关键时刻执行自定义逻辑。该接口继承自基础的
 * ElectronMainContribution，并对部分方法进行了扩展，以便在不同阶段注入业务逻辑。
 */
import { MaybePromise } from '@opensumi/ide-core-common';  // 🔧 引入 MaybePromise 类型，支持返回同步或异步结果
import { ElectronMainContribution as BaseElectronMainContribution } from '@opensumi/ide-core-electron-main';  // 🔧 引入基础 Electron 主进程贡献接口

/**
 * 🔧 常量导出: 重新导出基础的 ElectronMainContribution，统一管理贡献接口。
 *
 * @const {typeof BaseElectronMainContribution}
 */
export const ElectronMainContribution = BaseElectronMainContribution;

/**
 * 🔧 接口说明: ElectronMainContribution 接口扩展了基础贡献接口，
 * 增加了生命周期钩子方法，允许在 Electron 应用不同阶段执行预定的逻辑操作。
 *
 * @interface ElectronMainContribution
 */
export interface ElectronMainContribution extends BaseElectronMainContribution {

  /**
   * 🔧 功能描述: 在 Electron 应用程序的 app.isReady 事件触发前调用，
   * 用于执行预初始化操作。
   *
   * @function onBeforeReady
   * @description
   * - 参数说明: 无参数
   * - 返回值说明: {void} 不返回任何值
   *
   * ⚠️ 注意事项: 此方法仅用于同步预处理，确保在环境完全就绪前完成必要配置。
   */
  onBeforeReady?(): void;

  /**
   * 🔧 功能描述: 在 app.isReady 触发后、组件启动前调用，用于处理最终启动前的预备工作。
   *
   * @function onWillStart
   * @description
   * - 参数说明: 无参数
   * - 返回值说明: {MaybePromise<void>} 支持返回 void 或 Promise<void>，以兼顾同步与异步处理
   *
   * 🚀 性能优化: 若预启动操作较耗时，建议采用异步处理，避免阻塞主线程。
   */
  onWillStart?(): MaybePromise<void>;

  /**
   * 🔧 功能描述: 在所有 onWillStart 方法执行完毕后调用，负责执行主进程的最终启动逻辑。
   *
   * @function onStart
   * @description
   * - 参数说明: 无参数
   * - 返回值说明: {MaybePromise<void>} 支持同步或异步返回 void，完成启动初始化任务
   */
  onStart?(): MaybePromise<void>;

  /**
   * 🔧 功能描述: 当 Electron 应用触发 will-quit 事件时调用，用于执行退出前的清理操作。
   *
   * @function onWillQuit
   * @description
   * - 参数说明: 无参数
   * - 返回值说明: {MaybePromise<void>} 返回 void 或 Promise<void>，负责保证退出前清理操作完成
   *
   * ⚠️ 注意事项: 在退出流程中，建议捕获所有异步操作中的异常，防止资源泄露。
   */
  onWillQuit?(): MaybePromise<void>;
}
