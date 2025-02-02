/**
 * @file AbstractLogServiceManager
 * @description 🚀 本文件定义了抽象类 AbstractLogServiceManager，该类实现了 ILogServiceManager 接口，
 * 用于管理日志记录器实例（ILogService）的创建、存储、配置和释放工作。
 * 主要特性：
 *   - 根据命名空间获取或创建日志记录器（默认使用 SpdLogger 实现，历史背景：spdlog 在早期版本中被广泛采用）
 *   - 统一管理全局日志级别及其变更事件 🔧
 *   - 提供日志文件的归档和清理（目前为占位实现，可根据需求进一步扩展）
 *
 * @note 算法复杂度：查找及更新日志记录器均为 O(1) 操作，适用于大多数常规日志管理场景。
 */

import * as path from 'node:path';
import { Emitter } from '@opensumi/ide-core-common';
import { ILogServiceManager, LogLevel, SupportLogNamespace, ILogService, BaseLogServiceOptions, Archive } from '@opensumi/ide-logs';
import { SpdLogger } from './log-service';

export abstract class AbstractLogServiceManager implements ILogServiceManager {
  // 🔧 全局日志级别：开发环境下使用 Debug 级别，其它环境使用 Info 级别
  #logLevel = process.env.NODE_ENV === 'development' ? LogLevel.Debug : LogLevel.Info;
  // 🔧 内部存储：使用 Map 存储命名空间与对应日志记录器实例，便于快速查找和管理
  #logMap = new Map<SupportLogNamespace | string, ILogService>();
  // 🔧 日志级别变化事件：当全局日志级别发生变化时可通知订阅者
  #logLevelChangeEmitter = new Emitter<LogLevel>();

  /**
   * 🚀 功能描述：获取特定命名空间对应的日志记录器实例。如果该实例已存在，则更新配置（如提供）后返回；否则新建一个日志记录器实例并保存。
   *
   * @param {SupportLogNamespace | string} namespace - 日志记录器的命名空间，用于标识唯一的日志记录器
   * @param {BaseLogServiceOptions} [loggerOptions] - 日志记录器的可选配置项（如日志目录等设置）
   * @returns {ILogService} 返回对应命名空间的日志记录器实例
   *
   * @history 2021-06-XX 曾使用其他日志实现方式，后改用 SpdLogger 以提高性能及兼容性
   */
  getLogger(namespace: SupportLogNamespace | string, loggerOptions?: BaseLogServiceOptions): ILogService {
    // 尝试从内部 Map 中查找现有日志记录器
    let logger = this.#logMap.get(namespace);
    if (logger) {
      // ⚠️ 如果传入了新的配置选项，更新现有日志记录器的配置（维护灵活性）
      if (loggerOptions) {
        logger.setOptions(loggerOptions);
      }
      return logger;
    }
    // 🚀 默认创建一个新的 SpdLogger 实例，采用扩展配置（日志目录、全局日志级别等）
    const options = {
      namespace,
      logLevel: this.getGlobalLogLevel(),
      logServiceManager: this,
      ...loggerOptions,
    };
    logger = new SpdLogger({
      logLevel: options.logLevel,
      // ⚠️ 如果未指定日志目录，则默认使用 getLogFolder 方法构造日志文件的完整路径
      logPath: options.logDir || path.join(this.getLogFolder(), `${namespace}.log`),
    });
    // 将新创建的日志记录器存入内部 Map，便于后续查找与管理
    this.#logMap.set(namespace, logger);
    return logger;
  }

  /**
   * 🚀 功能描述：移除特定命名空间对应的日志记录器实例。
   *
   * @param {SupportLogNamespace} namespace - 需要移除的日志记录器的命名空间
   * @returns {void}
   */
  removeLogger(namespace: SupportLogNamespace): void {
    // ⚠️ 从 Map 中删除指定命名空间的日志记录器（确保资源的及时释放）
    this.#logMap.delete(namespace);
  }

  /**
   * 🚀 功能描述：获取当前全局日志级别。
   *
   * @returns {LogLevel} 返回当前配置的全局日志级别
   */
  getGlobalLogLevel(): LogLevel {
    return this.#logLevel;
  }

  /**
   * 🚀 功能描述：设置全局日志级别，并可通过事件通知相关订阅者。
   *
   * @param {LogLevel} level - 新的全局日志级别
   * @returns {void}
   */
  setGlobalLogLevel(level: LogLevel): void {
    // 更新全局日志级别，后续可在 emit 事件中添加通知逻辑（目前仅进行赋值操作）
    this.#logLevel = level;
  }

  /**
   * 🚀 功能描述：提供全局日志级别变化事件，使其他模块可订阅日志级别变化。
   *
   * @returns {import('@opensumi/ide-core-common').Event<LogLevel>} 返回全局日志级别变化事件接口
   */
  get onDidChangeLogLevel() {
    return this.#logLevelChangeEmitter.event;
  }

  /**
   * 🚀 功能描述：获取日志存放的文件夹路径（抽象方法，需要子类实现）。
   *
   * @abstract
   * @returns {string} 返回日志存放文件夹的路径
   */
  abstract getLogFolder(): string;

  /**
   * 🚀 功能描述：获取日志根目录路径（抽象方法，需要子类实现）。
   *
   * @abstract
   * @returns {string} 返回日志根目录的路径
   */
  abstract getRootLogFolder(): string;

  /**
   * 🚀 功能描述：异步清理旧日志文件（占位方法，待扩展实现）。
   *
   * @returns {Promise<void>} 返回一个 Promise 表示清理操作的异步执行
   */
  async cleanOldLogs(): Promise<void> {
    // 占位实现：具体清理逻辑由子类或后续扩展实现
  }

  /**
   * 🚀 功能描述：异步清除所有日志文件（占位方法，待扩展实现）。
   *
   * @returns {Promise<void>} 返回一个 Promise 表示清除操作的异步执行
   */
  async cleanAllLogs(): Promise<void> {
    // 占位实现：具体清除逻辑由子类或后续扩展实现
  }

  /**
   * 🚀 功能描述：异步清理指定天数之前过期的日志文件（占位方法，待扩展实现）。
   *
   * @param {number} _day - 指定保留的天数，早于该天数的日志将被清理
   * @returns {Promise<void>} 返回一个 Promise 表示清理操作的异步执行
   */
  async cleanExpiredLogs(_day: number): Promise<void> {
    // 占位实现：具体逻辑由应用场景决定，目前不做处理
  }

  /**
   * 🚀 功能描述：按照天数获取日志文件的归档（占位方法，待扩展实现）。
   *
   * @param {number} _day - 指定天数，用于归档该天的日志文件
   * @returns {Promise<Archive>} 返回一个 Promise，解析后为 Archive 对象，该对象包含管道方法用于数据传输
   */
  async getLogZipArchiveByDay(_day: number): Promise<Archive> {
    // 占位实现：返回一个空实现的 Archive 对象
    return { pipe: () => null };
  }

  /**
   * 🚀 功能描述：按照文件夹路径获取日志文件的归档（占位方法，待扩展实现）。
   *
   * @param {string} _foldPath - 日志文件夹的路径，用于创建该文件夹下日志文件的归档
   * @returns {Promise<Archive>} 返回一个 Promise，解析后为 Archive 对象，该对象包含管道方法用于数据传输
   */
  async getLogZipArchiveByFolder(_foldPath: string): Promise<Archive> {
    // 占位实现：返回一个空实现的 Archive 对象
    return { pipe: () => null };
  }

  /**
   * 🚀 功能描述：释放资源，销毁内部的事件监听器及所有日志记录器实例。
   *
   * @returns {void}
   *
   * @performance 注意：资源释放操作采用遍历 Map 方式，适用于日志记录器数量较少的场景
   */
  dispose(): void {
    // 释放日志级别变更事件资源
    this.#logLevelChangeEmitter.dispose();
    // 遍历所有日志记录器，调用各自的 dispose 方法释放其占用资源
    this.#logMap.forEach((logger) => {
      logger.dispose();
    });
  }
}
