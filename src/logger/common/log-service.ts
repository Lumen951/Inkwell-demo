/**
 * @file log-service.ts
 * @brief 本文件实现了日志记录服务，包括基础抽象日志服务(AbstractLogService)
 *        和基于spdlog实现的具体日志器(SpdLogger)。支持按日志级别记录日志、异步初始化与滚动日志文件功能。
 */

import {
  BaseLogServiceOptions,
  LogLevel,
  format,
} from '@opensumi/ide-logs';  // 🔧 配置项：日志基础选项及格式化函数导入
import { uuid } from '@opensumi/ide-core-common';  // 🔧 配置项：UUID生成工具导入
import type * as spdlog from '@vscode/spdlog';  // 🔧 配置项：spdlog 日志库类型定义导入
import { ILogService } from './types';  // 🔧 配置项：日志服务接口导入

/**
 * @interface ILog
 * @brief 表示单条日志记录，包含日志级别和日志消息
 * 
 * @property {LogLevel} level - 日志级别，用于判别消息细节的重要程度
 * @property {string} message - 日志具体内容
 */
interface ILog {
  level: LogLevel;
  message: string;
}

/**
 * @interface ILogServiceOptions
 * @brief 定义日志服务的初始化选项
 * 
 * @property {string} logPath - 日志文件保存路径
 * @property {LogLevel} logLevel - 日志记录级别
 * @property {number} [pid] - 进程ID（可选）
 */
interface ILogServiceOptions {
  logPath: string;
  logLevel: LogLevel;
  pid?: number;
}

/**
 * @enum SpdLogLevel
 * @brief 映射spdlog日志级别，用于设置spdlog日志器的级别
 */
enum SpdLogLevel {
	Trace,     // 对应 LogLevel.Verbose
	Debug,     // 对应 LogLevel.Debug
	Info,      // 对应 LogLevel.Info
	Warning,   // 对应 LogLevel.Warning
	Error,     // 对应 LogLevel.Error
	Critical,  // 对应 LogLevel.Critical
	Off        // 日志关闭状态
}

/**
 * @class AbstractLogService
 * @abstract
 * @implements ILogService
 * @brief 抽象日志服务，提供基础日志记录功能的通用实现
 *
 * 🚀 性能优化: 在达到指定日志级别时才执行日志记录，降低性能开销
 * ⚠️ 注意事项: 子类必须重写 sendLog 方法以实现具体的日志输出
 */
export abstract class AbstractLogService implements ILogService {
  protected logger: SpdLogger | undefined;  // 当前使用的具体日志器实例
  protected logPath: string;                // 日志文件存放路径
  protected logLevel: LogLevel;             // 当前日志等级

  /**
   * @constructor
   * @brief 初始化 AbstractLogService 实例
   * 
   * @param {ILogServiceOptions} options - 初始化选项对象，包括日志路径和日志级别
   */
  constructor(options: ILogServiceOptions) {
    this.logPath = options.logPath;
    this.logLevel = options.logLevel || LogLevel.Info;  // 默认日志级别设置为 Info
  }

  /**
   * @abstract
   * @brief 抽象方法：发送日志记录
   *
   * @param {LogLevel} level - 日志级别
   * @param {string} message - 日志信息
   * @return {void}
   */
  abstract sendLog(level: LogLevel, message: string): void

  /**
   * @function shouldLog
   * @brief 判断是否应该记录指定级别的日志
   *
   * @param {LogLevel} level - 待记录的日志级别
   * @return {boolean} 当当前日志级别低于或等于传入级别时返回 true，否则返回 false
   */
  protected shouldLog(level: LogLevel): boolean {
		return this.getLevel() <= level;  // 🚀 仅当设置的日志级别满足要求时执行记录，避免无用计算
	}

  /**
   * @function verbose
   * @brief 记录详细日志（Verbose级别）
   *
   * @return {void}
   */
  verbose(): void {
    if (!this.shouldLog(LogLevel.Verbose)) return;
    this.sendLog(LogLevel.Verbose, format(arguments));
  }

  /**
   * @function debug
   * @brief 记录调试日志（Debug级别）
   *
   * @return {void}
   */
  debug(): void {
    if (!this.shouldLog(LogLevel.Debug)) return;
    this.sendLog(LogLevel.Debug, format(arguments));
  }

  /**
   * @function log
   * @brief 记录普通日志（Info级别）
   *
   * @return {void}
   */
  log(): void {
    if (!this.shouldLog(LogLevel.Info)) return;
    this.sendLog(LogLevel.Info, format(arguments));
  }

  /**
   * @function info
   * @brief 记录信息日志（Info级别）
   *
   * @return {void}
   */
  info(): void {
    if (!this.shouldLog(LogLevel.Info)) return;
    this.sendLog(LogLevel.Info, format(arguments));
  }

  /**
   * @function warn
   * @brief 记录警告日志（Warning级别）
   *
   * @return {void}
   */
  warn(): void {
    if (!this.shouldLog(LogLevel.Warning)) return;
    this.sendLog(LogLevel.Warning, format(arguments));
  }

  /**
   * @function error
   * @brief 记录错误日志（Error级别），支持传入Error对象以记录堆栈信息
   *
   * @return {void}
   */
  error(): void {
    if (!this.shouldLog(LogLevel.Error)) return;
    const arg = arguments[0];
    let message: string;

    // ⚠️ 注意事项: 当传入Error实例时，提取其堆栈信息进行记录
    if (arg instanceof Error) {
      const array = Array.prototype.slice.call(arguments) as any[];
      array[0] = arg.stack;
      message = format(array);
      this.sendLog(LogLevel.Error, message);
    } else {
      message = format(arguments);
      this.sendLog(LogLevel.Error, message);
    }
  }

  /**
   * @function critical
   * @brief 记录严重错误日志（Critical级别）
   *
   * @return {void}
   */
  critical(): void {
    if (!this.shouldLog(LogLevel.Critical)) return;
    this.sendLog(LogLevel.Critical, format(arguments));
  }

  /**
   * @function setOptions
   * @brief 配置或更新日志服务选项
   *
   * @param {BaseLogServiceOptions} options - 配置选项对象，其中可能包含日志级别配置
   * @return {void}
   */
  setOptions(options: BaseLogServiceOptions) {
    if (options.logLevel) {
      this.logLevel = options.logLevel;
    }
  }

  /**
   * @function getLevel
   * @brief 获取当前设置的日志级别
   *
   * @return {LogLevel} 当前日志记录级别
   */
  getLevel(): LogLevel {
    return this.logLevel;
  }

  /**
   * @function setLevel
   * @brief 设置日志记录级别
   *
   * @param {LogLevel} level - 新的日志级别
   * @return {void}
   */
  setLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  /**
   * @function drop
   * @brief 异步释放日志资源（空实现，由子类重写）
   *
   * @return {Promise<void>}
   */
  async drop() {}

  /**
   * @function flush
   * @brief 异步刷新日志缓冲区（空实现，由子类重写）
   *
   * @return {Promise<void>}
   */
  async flush() {}

  /**
   * @function dispose
   * @brief 释放日志服务相关资源（空实现，由子类重写）
   *
   * @return {void}
   */
  dispose() {}
}

/**
 * @class SpdLogger
 * @extends AbstractLogService
 * @brief 基于spdlog库实现的日志器，支持异步初始化与日志滚动，确保初始化期间日志不会丢失。
 *
 * 🚀 性能优化: 通过异步初始化避免阻塞主线程
 * ⚠️ 注意事项: 初始化完成前，日志将暂存于缓存中，待日志器创建后再逐条输出
 */
export class SpdLogger extends AbstractLogService {
  #buffer: ILog[] = [];  // 🔧 日志缓冲数组，用于存储初始化前的日志记录
	#spdLoggerCreatePromise: Promise<void>;  // 🔧 异步创建spdlog日志器的Promise对象
	#logger: spdlog.Logger | undefined;  // 实际的spdlog日志器实例

  /**
   * @constructor
   * @brief 初始化 SpdLogger 实例并启动异步创建spdlog日志器
   *
   * @param {ILogServiceOptions} options - 初始化选项，包括日志路径与日志级别等
   */
	constructor(options: ILogServiceOptions) {
		super(options);
		// 异步初始化spdlog日志器，同时缓存期间产生的日志
		this.#spdLoggerCreatePromise = this.#createSpdLogLogger();
	}

  /**
   * @function #createSpdLogLogger
   * @brief 异步创建spdlog日志器，并配置日志滚动策略和输出格式
   *
   * @details
   * + 步骤1：定义日志文件个数和单文件大小（例如：5MB）  
   * + 步骤2：异步导入spdlog库，并设置最低刷新级别为Trace  
   * + 步骤3：调用spdlog的createAsyncRotatingLogger创建滚动日志器  
   * + 步骤4：设置日志输出格式及日志级别映射  
   * + 步骤5：遍历发送初始化期间缓存的日志  
   * + 步骤6：清空日志缓冲区
   *
   * @return {Promise<void>} 异步操作完成的Promise
   *
   * | 步骤描述           | 实现代码片段                                            |
   * |--------------------|---------------------------------------------------------|
   * | 定义文件大小与数目 | const fileCount = 6; const fileSize = 5 * 1024 * 1024;   |
   * | 异步导入spdlog     | const _spdlog = await import('@vscode/spdlog');          |
   * | 创建日志器         | const logger = await _spdlog.createAsyncRotatingLogger(...); |
   * | 配置日志器         | logger.setPattern(...); logger.setLevel(...);             |
   * | 发送缓存日志       | for (const { level, message } of this.#buffer) { ... }     |
   */
	async #createSpdLogLogger(): Promise<void> {
		const fileCount = 6;            // 🔧 固定日志文件数，便于管理历史日志
		const fileSize = 5 * 1024 * 1024; // 🔧 单个日志文件最大大小设置为5MB，防止文件过大
    try {
      const _spdlog = await import('@vscode/spdlog');  // 异步加载spdlog库
      _spdlog.setFlushOn(SpdLogLevel.Trace);  // 设置日志刷新条件为最低级别，确保所有日志及时输出
      const logger = await _spdlog.createAsyncRotatingLogger(uuid(), this.logPath, fileSize, fileCount);
      this.#logger = logger;
      // 设置日志输出格式：日期、时间、毫秒、日志级别、日志消息
      logger.setPattern('%Y-%m-%d %H:%M:%S.%e [%l] %v');
      // 设置spdlog日志器级别与当前服务配置的日志级别映射
      logger.setLevel(this.getSpdLogLevel(this.getLevel()));
      // 🚀 处理初始化期间缓存的日志记录，确保日志不丢失
      for (const { level, message } of this.#buffer) {
        this.sendLog(level, message);
      }
      this.#buffer = [];  // 清空日志缓冲区
    } catch (e) {
      console.error(e);  // ⚠️ 初始化失败时打印错误信息
    }
	}

  /**
   * @function sendLog
   * @brief 根据传入日志级别发送日志记录，若日志器未初始化则缓存日志
   *
   * @param {LogLevel} level - 日志记录级别
   * @param {string} message - 具体日志消息
   * @return {void}
   */
	sendLog(level: LogLevel, message: string): void {
		if (this.#logger) {
      // 根据日志级别调用spdlog相应的记录方法
      switch (level) {
        case LogLevel.Verbose:
          return this.#logger.trace(message);
        case LogLevel.Debug:
          return this.#logger.debug(message);
        case LogLevel.Info:
          return this.#logger.info(message);
        case LogLevel.Warning:
          return this.#logger.warn(message);
        case LogLevel.Error:
          return this.#logger.error(message);
        case LogLevel.Critical:
          return this.#logger.critical(message);
        default:
          throw new Error('Invalid log level');  // ⚠️ 未知日志级别则抛出错误
      }
		} else if (this.getLevel() <= level) {
			// 若日志器尚未初始化且当前级别符合要求，则缓存日志以便后续发送
			this.#buffer.push({ level, message });
		}
	}

  /**
   * @function flush
   * @override
   * @brief 异步刷新日志，确保所有缓冲日志写入到文件中
   *
   * @return {Promise<void>} 刷新操作完成的Promise
   */
	override async flush() {
		if (this.#logger) {
			this.#logger.flush();  // 立即刷新spdlog内部缓冲
		} else {
			// 若日志器未初始化则等待创建完成后执行刷新操作
			this.#spdLoggerCreatePromise.then(() => this.flush());
		}
	}

  /**
   * @function drop
   * @override
   * @brief 异步释放日志器资源，关闭日志输出
   *
   * @return {Promise<void>} 资源释放完成的Promise
   */
  override async drop() {
    if (this.#logger) {
      this.#logger.drop();  // 释放spdlog日志器资源
    } else {
      // 若日志器未初始化则等待完成后再释放
      return this.#spdLoggerCreatePromise.then(() => this.drop());
    }
  }

  /**
   * @function dispose
   * @brief 释放日志服务资源，调用 drop 方法关闭日志器
   *
   * @return {void}
   */
	override dispose(): void {
		this.drop();
	}

  /**
   * @function getSpdLogLevel
   * @brief 将通用的 LogLevel 转换为spdlog对应的日志级别
   *
   * @param {LogLevel} level - 传入的日志级别
   * @return {SpdLogLevel} 对应的spdlog日志级别
   */
  private getSpdLogLevel(level: LogLevel): SpdLogLevel {
    switch (level) {
      case LogLevel.Verbose: return SpdLogLevel.Trace;
      case LogLevel.Debug: return SpdLogLevel.Debug;
      case LogLevel.Info: return SpdLogLevel.Info;
      case LogLevel.Warning: return SpdLogLevel.Warning;
      case LogLevel.Error: return SpdLogLevel.Error;
      case LogLevel.Critical: return SpdLogLevel.Critical;
      default: return SpdLogLevel.Off;
    }
  }
}
