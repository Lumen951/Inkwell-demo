/**
 * @file 环境服务模块
 * @description 🔧 EnvironmentService 类用于提供 Electron 应用的运行环境信息，
 * 包括判断开发环境、构造用户数据目录、日志目录、扩展目录的路径以及获取应用根目录和用户主目录。
 * 本模块采用 memoize 装饰器缓存计算结果，提高多次访问时的性能（🚀）。
 */

import { app } from 'electron'
import * as os from 'node:os'
import * as path from 'node:path'
import { Injectable, Autowired } from '@opensumi/di'
import { memoize } from '@opensumi/ide-core-common'
import { IEnvironmentService, IProduct } from '../common'

@Injectable()
export class EnvironmentService implements IEnvironmentService {
  /**
   * @member {IProduct} product
   * @description 🔧 通过依赖注入（Autowired）获取产品配置信息，包含数据目录名称等关键配置项。
   */
  @Autowired(IProduct)
  product: IProduct

  /**
   * 判断当前环境是否为开发模式。
   *
   * 功能描述：检测 process.env.NODE_ENV 是否被设置为 'development'，
   * 用以判断应用是否处于开发调试阶段，从而可启用开发者特有功能。🚀
   *
   * 参数：无输入参数。⚠️
   *
   * 返回：{boolean} 如果为开发模式则返回 true，否则返回 false。
   */
  @memoize
  get isDev() {
    return process.env.NODE_ENV === 'development'
  }

  /**
   * 获取产品配置中定义的数据文件夹名称。
   *
   * 功能描述：通过注入的 product 对象返回数据文件夹名称，
   * 该名称用于拼接生成后续的目录路径，从而实现配置统一管理。🔧
   *
   * 参数：无输入参数。⚠️
   *
   * 返回：{string} 数据文件夹名称。
   */
  @memoize
  get dataFolderName() {
    return this.product.dataFolderName
  }

  /**
   * 获取应用根目录的绝对路径。
   *
   * 功能描述：调用 Electron 的 app.getAppPath() 方法获得当前应用安装路径，
   * 该路径常用于定位应用资源和模块。🚀
   *
   * 参数：无输入参数。⚠️
   *
   * 返回：{string} 应用根目录的绝对路径。
   */
  @memoize
	get appRoot(): string {
    return app.getAppPath()
  }

  /**
   * 获取当前用户的主目录路径。
   *
   * 功能描述：利用 Node.js 的 os.homedir() 方法获取当前操作系统中用户的主目录，
   * 通常用于存储用户级别的配置和数据。🔧
   *
   * 参数：无输入参数。⚠️
   *
   * 返回：{string} 用户主目录的绝对路径。
   */
  @memoize
  get userHome() {
    return os.homedir()
  }

  /**
   * 获取 Electron 应用专用的用户数据目录路径。
   *
   * 功能描述：调用 app.getPath('userData') 方法获取一个用于持久化存储用户设置和应用状态的数据目录，
   * 方便管理用户数据。🚀
   *
   * 参数：无输入参数。⚠️
   *
   * 返回：{string} 用户数据目录的绝对路径。
   */
  @memoize
	get userDataPath(): string {
    return app.getPath('userData')
  }

  /**
   * 构造用户设置目录路径。
   *
   * 功能描述：将用户数据目录与固定子目录 'user' 进行路径拼接，
   * 生成存放用户设置信息的目录路径，有助于文件结构的模块分离。🔧
   *
   * 参数：无输入参数。⚠️
   *
   * 返回：{string} 用户设置目录的绝对路径。
   */
  @memoize
	get userSettingPath(): string {
    return path.join(this.userDataPath, 'user')
  }

  /**
   * 构造存储配置文件的路径。
   *
   * 功能描述：将用户设置目录和文件名 'storage.json' 拼接，
   * 确定用于保存应用配置信息的存储文件位置。🚀
   *
   * 参数：无输入参数。⚠️
   *
   * 返回：{string} 存储文件（storage.json）的绝对路径。
   */
  @memoize
	get storagePath(): string {
    return path.join(this.userSettingPath, 'storage.json')
  }

  /**
   * 构造扩展模块存储目录路径。
   *
   * 功能描述：把用户主目录、产品数据文件夹名称以及 'extensions' 子目录组合，
   * 形成一个用于存放扩展模块的独立目录。🔧
   *
   * 参数：无输入参数。⚠️
   *
   * 返回：{string} 扩展目录的绝对路径。
   */
  @memoize
  get extensionsPath() {
    return path.join(this.userHome, this.product.dataFolderName, 'extensions')
  }

  /**
   * 构造日志根目录路径。
   *
   * 功能描述：将用户数据目录与 'logs' 子目录拼接，生成应用日志的存储根目录，
   * 便于集中管理和归档所有日志文件。🚀
   *
   * 参数：无输入参数。⚠️
   *
   * 返回：{string} 日志根目录的绝对路径。
   */
  @memoize
  get logRoot() {
    return path.join(this.userDataPath, 'logs')
  }

  /**
   * 构造当前日期对应的日志目录路径。
   *
   * 功能描述：根据当前日期生成格式化字符串（例如：20230405），
   * 再与日志根目录进行拼接，确保每日日志存放于独立目录中，方便管理与查询。🔧
   *
   * 参数：无输入参数。⚠️
   *
   * 返回：{string} 当前日期日志目录的绝对路径。
   *
   * 历史背景：此设计思路来源于按天归档日志的需求，便于后期日志的分割、查询与维护。
   *
   * 复杂性说明：时间复杂度 O(1)，空间复杂度 O(1)；仅涉及日期格式化和字符串拼接操作。
   */
  @memoize
  get logHome() {
    // 获取当前日期对象
    const date = new Date();
    // 格式化日期为 YYYYMMDD 格式：padStart 用于确保月份和日期为两位数。
    const logName = `${date.getFullYear()}${String((date.getMonth() + 1)).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    return path.join(this.logRoot, logName)
  }
}
