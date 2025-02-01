/**
 * @fileoverview 该模块定义了更新状态、更新服务接口、IPC通道以及相关数据结构。
 * 
 * 主要功能包括：
 * - 定义更新状态的枚举类型
 * - 定义更新主服务接口
 * - 定义IPC通道的枚举类型
 * - 定义初始状态和事件数据的接口
 * 
 * @module auto-updater/common
 */

import type { UpdateInfo, ProgressInfo } from 'electron-updater' // 🔧 引入electron-updater模块中的类型

export { UpdateInfo, ProgressInfo } // 🔧 导出UpdateInfo和ProgressInfo类型

/**
 * 更新状态枚举
 * 
 * @enum {string}
 * @readonly
 */
export const enum UpdateState {
  NoAvailable = 'NoAvailable', // 无可用更新
  Checking = 'Checking', // 正在检查更新
  CheckingError = 'CheckingError', // 检查更新时出错
  Available = 'Available', // 有可用更新
  Downloading = 'Downloading', // 正在下载更新
  DownloadError = 'DownloadError', // 下载更新时出错
  Downloaded = 'Downloaded', // 更新已下载
  UpdateError = 'UpdateError' // 更新时出错
}

/**
 * 更新主服务接口
 * 
 * @interface IUpdateMainService
 */
export const IUpdateMainService = 'IUpdateMainService' // 🔧 定义更新主服务的标识符

export interface IUpdateMainService {
  /**
   * 手动检查更新
   * 
   * @returns {Promise<void>} 返回一个Promise，表示检查更新的异步操作
   */
  checkForUpdatesManual(): Promise<void> // 🚀 该方法用于手动触发更新检查
}

/**
 * IPC通道枚举
 * 
 * @enum {string}
 * @readonly
 */
export enum IPC_CHANNEL {
  initialState = 'initialState', // 初始状态通道
  downloadAndInstall = 'downloadAndInstall', // 下载并安装通道
  eventData = 'eventData', // 事件数据通道
  ignoreVersion = 'ignoreVersion' // 忽略版本通道
}

/**
 * 初始状态接口
 * 
 * @interface InitialState
 * @property {UpdateState} updateState - 当前更新状态
 * @property {UpdateInfo | null} updateInfo - 更新信息，可能为null
 * @property {ProgressInfo | null} progressInfo - 下载进度信息，可能为null
 */
export interface InitialState {
  updateState: UpdateState, // 🔧 当前更新状态
  updateInfo: UpdateInfo | null, // 🔧 更新信息
  progressInfo: ProgressInfo | null, // 🔧 下载进度信息
}

/**
 * 事件数据接口
 * 
 * @interface EventData
 * @property {string} event - 事件名称
 * @property {any} [data] - 事件数据，可选
 */
export interface EventData {
  event: string; // 🔧 事件名称
  data?: any; // 🔧 事件数据，可能为undefined
}
