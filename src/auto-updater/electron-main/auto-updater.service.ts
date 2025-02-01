// 该模块实现了自动更新服务，使用 electron-updater 库来管理应用程序的更新。
// 主要功能包括获取最新版本信息、下载更新、管理更新状态以及处理更新事件。
// 该服务类 AutoUpdaterService 通过依赖注入获取 StorageService、ILogService 和 IProduct 实例。
// 它还提供了检查更新、下载更新、更新忽略版本等功能。
import { autoUpdater, UpdateInfo, Provider, ResolvedUpdateFileInfo, AppUpdater, CancellationToken, ProgressInfo } from 'electron-updater'
import type { CustomPublishOptions as BaseCustomPublishOptions } from 'builder-util-runtime'
import yaml from 'js-yaml'
import { Autowired, Injectable } from '@opensumi/di'
import { Emitter } from '@opensumi/ide-core-common'
import { ILogService } from '@/logger/common'
import { StorageService } from '@/core/electron-main'
import { IProduct } from '@/core/common'
import { UpdateState, EventData } from '../common'

// 🔧 自定义发布选项接口，扩展了基本的发布选项
interface CustomPublishOptions extends BaseCustomPublishOptions {
  readonly configUrl: string // 配置文件的 URL
}

// 🔧 自动更新配置接口
interface AutoUpdateConfig {
  platform: string; // 平台信息
  channel: string; // 更新通道
  channelUrl: string; // 通道的 URL
  releaseNote: string; // 版本发布说明
  stagingPercentage: number; // 阶段性更新百分比
}

// 🚀 自定义提供者类，继承自 Provider，负责获取更新信息
export class CustomProvider extends Provider<UpdateInfo> {
  constructor(
    private readonly configuration: CustomPublishOptions, // 配置选项
    private readonly updater: AppUpdater, // 应用更新器实例
    runtimeOptions: any, // 运行时选项
  ) {
    super(runtimeOptions) // 调用父类构造函数
  }

  // 获取当前更新通道名称
  private get channel(): string {
    const result = this.updater.channel || this.configuration.channel
    return result == null ? this.getDefaultChannelName() : this.getCustomChannelName(result)
  }

  // 获取最新版本信息
  // 功能描述：请求并解析最新的更新版本信息
  // 返回值：Promise<UpdateInfo> - 最新的更新信息
  async getLatestVersion(): Promise<UpdateInfo> {
    const channelFile = `${this.channel}.yml` // 通道文件名
    for (let attemptNumber = 0; ; attemptNumber++) { // 尝试获取更新信息，最多重试3次
      try {
        const rawData = await this.httpRequest(new URL(this.configuration.configUrl)) // 请求更新配置
        if (!rawData) {
          throw new Error(`Cannot get update config (${this.configuration.configUrl}): rawData: null`)
        }
        let config: AutoUpdateConfig[]
        try {
          config = JSON.parse(rawData) // 解析配置文件
        } catch (err: any) {
          throw new Error(`Cannot parse update config (${this.configuration.configUrl}): ${err.stack || err.message}, rawData: ${rawData}`)
        }
        const channelConfig = config.find(item => item.channel === this.channel) // 查找当前通道配置
        if (!channelConfig) {
          throw new Error(`Cannot find chanel config (${this.configuration.configUrl}), rawData: ${rawData}`)
        }
        const { channelUrl, stagingPercentage, releaseNote } = channelConfig; // 解构通道配置
        const channelRawData = await this.httpRequest(new URL(channelUrl)) // 请求通道信息
        if (!channelRawData) {
          throw new Error(`Cannot get channel info (${channelUrl}): rawData: null`)
        }
        let updateInfo: UpdateInfo
        try {
          updateInfo = yaml.load(channelRawData) as UpdateInfo // 解析通道信息
          Object.assign(updateInfo, {
            stagingPercentage,
            releaseNotes: releaseNote,
          }) // 合并更新信息
        } catch (err) {
          throw new Error(`Cannot prase channel info (${channelUrl}): rawData: ${channelRawData}`)
        }
        return updateInfo // 返回更新信息
      } catch (e: any) {
        // 处理错误情况
        if ('statusCode' in e && e.statusCode === 404) {
          throw new Error(`Cannot request channel "${channelFile}" update info: ${e.stack || e.message}`)
        } else if (e.code === "ECONNREFUSED") {
          if (attemptNumber < 3) { // 如果连接被拒绝，最多重试3次
            await new Promise((resolve, reject) => {
              try {
                setTimeout(resolve, 1000 * attemptNumber) // 等待一段时间后重试
              } catch (e: any) {
                reject(e)
              }
            })
            continue
          }
        }
        throw e // 抛出其他错误
      }
    }
  }

  // 解析更新文件信息
  // 功能描述：将更新信息中的文件信息转换为可解析的格式
  // 参数：updateInfo - UpdateInfo - 更新信息
  // 返回值：Array<ResolvedUpdateFileInfo> - 解析后的文件信息数组
  resolveFiles(updateInfo: UpdateInfo): Array<ResolvedUpdateFileInfo> {
    return updateInfo.files.map(info => ({
      url: new URL(info.url), // 转换为 URL 对象
      info,
    }))
  }
}

// 🚀 自动更新服务类，负责管理更新流程
@Injectable()
export class AutoUpdaterService {
  @Autowired(StorageService)
  storageService: StorageService // 存储服务

  @Autowired(ILogService)
  logger: ILogService // 日志服务

  @Autowired(IProduct)
  product: IProduct // 产品信息

  #initialized = false; // 初始化标志

  #updateState = UpdateState.NoAvailable // 更新状态
  get updateState() { return this.#updateState } // 获取更新状态

  #updateInfo: UpdateInfo | null = null; // 更新信息
  get updateInfo() { return this.#updateInfo } // 获取更新信息

  #cancellationToken: CancellationToken | null // 取消令牌

  #progressInfo: ProgressInfo | null = null; // 下载进度信息
  get progressInfo() { return this.#progressInfo } // 获取下载进度信息

  #updateEmitter = new Emitter<EventData>() // 更新事件发射器
  get updateEvent() { return this.#updateEmitter.event } // 获取更新事件

  #ignoreVersions = new Set<string>() // 忽略的版本集合
  get ignoreVersion() { return this.#ignoreVersions } // 获取忽略的版本

  // 初始化自动更新服务
  init() {
    if (this.#initialized) return // 如果已初始化则返回
    this.#initialized = true
    autoUpdater.autoDownload = false // 禁用自动下载
    autoUpdater.disableDifferentialDownload = true // 禁用差异下载
    autoUpdater.logger = this.logger; // 设置日志服务
    autoUpdater.setFeedURL({
      provider: 'custom', // 自定义提供者
      updateProvider: CustomProvider, // 更新提供者
      configUrl: this.storageService.getItem('autoUpdaterConfigUrl') || this.product.autoUpdaterConfigUrl, // 配置 URL
    } as CustomPublishOptions)
    this.logger.info('[auto-updater] init') // 记录初始化日志
    this.registerAutoUpdaterListener() // 注册更新监听器
    let ignoreVersions = this.storageService.getItem('ignoreUpdateVersions') // 获取忽略版本
    if (Array.isArray(ignoreVersions)) {
      this.#ignoreVersions = new Set(ignoreVersions) // 初始化忽略版本集合
    }
  }

  // 注册自动更新监听器
  private registerAutoUpdaterListener() {
    autoUpdater
      .on('checking-for-update', () => {
        this.logger.debug('[auto-updater] checking-for-update') // 记录检查更新日志
        this.#updateState = UpdateState.Checking // 更新状态为检查中
      })
      .on('update-not-available', (info: UpdateInfo) => {
        this.logger.debug('[auto-updater] update-not-available', info) // 记录更新不可用日志
        this.#updateState = UpdateState.NoAvailable // 更新状态为无可用更新
      })
      .on('update-available', (info: UpdateInfo) => {
        this.logger.debug('[auto-updater] update-available', info) // 记录更新可用日志
        this.#updateState = UpdateState.Available // 更新状态为可用
        this.#updateInfo = info; // 保存更新信息
      })
      .on('download-progress', (info: ProgressInfo) => {
        this.#updateState = UpdateState.Downloading // 更新状态为下载中
        this.#progressInfo = info; // 保存下载进度信息
        this.#updateEmitter.fire({
          event: 'download-progress', // 触发下载进度事件
          data: info,
        })
      })
      .on('update-downloaded', () => {
        this.#updateState = UpdateState.Downloaded // 更新状态为已下载
        autoUpdater.quitAndInstall() // 退出并安装更新
      })
      .on('error', (err) => {
        this.#updateState = UpdateState.UpdateError // 更新状态为更新错误
        this.#updateEmitter.fire({
          event: 'error', // 触发错误事件
          data: err?.message,
        })
      })
  }

  // 检查更新
  // 功能描述：初始化并检查更新
  // 返回值：Promise<void> - 无返回值
  async checkForUpdates() {
    this.init(); // 初始化服务
    try {
      await autoUpdater.checkForUpdates() // 检查更新
    } catch (err) {
      this.#updateState = UpdateState.CheckingError // 更新状态为检查错误
      this.logger.error(`[auto-updater] checkForUpdates error: ${err}`) // 记录错误日志
      return null // 返回 null
    }
  }

  // 下载更新
  // 功能描述：下载可用的更新
  // 返回值：Promise<void> - 无返回值
  async downloadUpdate() {
    this.#cancellationToken?.dispose() // 处理取消令牌
    this.#cancellationToken = new CancellationToken() // 创建新的取消令牌
    try {
      await autoUpdater.downloadUpdate(this.#cancellationToken) // 下载更新
    } catch (err) {
      this.#updateState = UpdateState.DownloadError // 更新状态为下载错误
      console.error('[autoUpdater] downloadUpdate error') // 记录下载错误日志
      throw err // 抛出错误
    }
  }

  // 更新忽略版本
  // 功能描述：将当前更新版本添加到忽略列表
  // 返回值：void - 无返回值
  updateIgnoreVersion() {
    if (this.#updateInfo) {
      this.#ignoreVersions.add(this.#updateInfo.version) // 添加到忽略版本集合
      this.storageService.setItem('ignoreUpdateVersions', [...this.#ignoreVersions]) // 更新存储中的忽略版本
    }
  }
}
