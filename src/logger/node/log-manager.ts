/**
 * @file log-manager.ts
 * @description 🔧 日志管理服务实现。此文件包含 LogServiceManager 类，用于获取日志根目录以及窗口日志目录。
 */

// 导入 Node 内置模块及第三方依赖
import * as path from 'path';  // ⚠️ 注意：用于处理文件系统路径拼接
import { Injectable } from '@opensumi/di';  // 🔧 提供依赖注入支持
import { AbstractLogServiceManager } from '../common';  // 父类定义日志管理接口
import * as process from "node:process";  // 🚀 用于访问运行时环境变量

/**
 * @class LogServiceManager
 * @classdesc 🔧 日志管理服务实现类，继承自 AbstractLogServiceManager。在 Node 环境下，根据环境变量提供日志路径功能。
 */
@Injectable()
export class LogServiceManager extends AbstractLogServiceManager {

  /**
   * 获取日志根目录
   *
   * @description 🚀 返回由环境变量 IDE_LOG_ROOT 指定的日志根目录路径。
   * @returns {string} 日志根目录路径，预期该环境变量已经正确配置。
   *
   * @example
   * const rootFolder = logServiceManager.getRootLogFolder();
   */
  getRootLogFolder(): string {
    // 直接从 process.env 获取 IDE_LOG_ROOT，确保返回的字符串非空
    return process.env.IDE_LOG_ROOT!;
  }

  /**
   * 获取窗口日志目录
   *
   * @description 🚀 拼接生成窗口日志目录。具体实现逻辑：
   *   1. 使用环境变量 IDE_LOG_HOME 作为基础路径，若未定义则默认为空字符串。
   *   2. 从环境变量 CODE_WINDOW_CLIENT_ID 中去除固定前缀 "CODE_WINDOW_CLIENT_ID:"（如果存在），以便提取唯一窗口标识。
   * @returns {string} 拼接后的日志目录路径，其格式为：{IDE_LOG_HOME}/window{唯一窗口标识}。
   *
   * @example
   * const folder = logServiceManager.getLogFolder();
   *
   * @table 核心算法解析：
   * | 步骤描述                                                            | 实现代码                                                         |
   * |---------------------------------------------------------------------|------------------------------------------------------------------|
   * | 获取基础日志路径（IDE_LOG_HOME），如果未定义则使用空字符串              | process.env.IDE_LOG_HOME || ''                                    |
   * | 检查 CODE_WINDOW_CLIENT_ID 是否存在，并截取移除 "CODE_WINDOW_CLIENT_ID:" 前缀 | process.env.CODE_WINDOW_CLIENT_ID?.slice('CODE_WINDOW_CLIENT_ID:'?.length) |
   * | 使用 path.join 拼接生成最终窗口日志目录路径                           | path.join(基础路径, `window${截取后的唯一标识}`)                      |
   */
  getLogFolder(): string {
    // 使用 path.join 拼接日志目录路径，确保在 IDE_LOG_HOME 环境变量未定义时不会报错
    // 可选链操作符 (?.) 用于安全调用 slice 方法，防止 CODE_WINDOW_CLIENT_ID 为 undefined 时产生错误
    return path.join(
      process.env.IDE_LOG_HOME || '', 
      `window${process.env.CODE_WINDOW_CLIENT_ID?.slice('CODE_WINDOW_CLIENT_ID:'?.length)}`
    );
  }
}
