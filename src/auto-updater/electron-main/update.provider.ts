// 该模块实现了一个自定义的更新提供者，负责从配置文件中获取更新信息，并解析最新版本的信息。

import { Provider, ResolvedUpdateFileInfo, UpdateInfo, AppUpdater } from 'electron-updater'
import yaml from 'js-yaml'
import type { CustomPublishOptions as BaseCustomPublishOptions } from 'builder-util-runtime'

// 🔧 自定义发布选项接口，扩展了基本的发布选项
export interface CustomPublishOptions extends BaseCustomPublishOptions {
  readonly configUrl: string // 配置文件的URL
}

// 🔧 自动更新配置接口，定义了更新所需的基本信息
interface AutoUpdateConfig {
  platform: string; // 平台信息
  channel: string; // 更新通道
  channelUrl: string; // 通道的URL
  releaseNote: string; // 发布说明
  stagingPercentage: number; // 阶段性发布百分比
}

// ⚠️ 创建新的错误对象，附加错误代码
const newError = (message: string, code: string) => {
  const error = new Error(message)
  ;(error as NodeJS.ErrnoException).code = code; // 将错误代码附加到错误对象
  return error
}

// 🚀 自定义提供者类，继承自Provider，处理更新信息的获取和解析
export class CustomProvider extends Provider<UpdateInfo> {
  constructor(
    private readonly configuration: CustomPublishOptions, // 配置选项
    private readonly updater: AppUpdater, // 应用更新器
    runtimeOptions: any, // 运行时选项
  ) {
    super(runtimeOptions) // 调用父类构造函数
  }

  // 🔧 获取当前更新通道
  private get channel(): string {
    const result = this.updater.channel || this.configuration.channel // 优先使用updater中的通道
    return result == null ? this.getDefaultChannelName() : this.getCustomChannelName(result) // 返回默认或自定义通道名称
  }

  // 🚀 获取最新版本信息
  async getLatestVersion(): Promise<UpdateInfo> {
    const channelFile = `${this.channel}.yml` // 根据通道生成配置文件名
    for (let attemptNumber = 0; ; attemptNumber++) { // 无限循环，直到成功获取数据
      try {
        const rawData = await this.httpRequest(new URL(this.configuration.configUrl)) // 请求配置数据
        if (!rawData) {
          throw newError(`Cannot get config data in the latest release config (${this.configuration.configUrl}): rawData: null`, 'ERR_UPDATER_INVALID_UPDATE_INFO')
        }
        let config: AutoUpdateConfig[]
        try {
          config = JSON.parse(rawData) // 解析配置数据
        } catch (err: any) {
          throw newError(
            `Cannot parse update info in the latest release config (${this.configuration.configUrl}): ${err.stack || err.message}, rawData: ${rawData}`,
            'ERR_UPDATER_INVALID_UPDATE_INFO'
          )
        }
        const channelConfig = config.find(item => item.channel === this.channel) // 查找当前通道的配置
        if (!channelConfig) {
          throw newError(
            `Cannot find channel update info in the latest release config (${this.configuration.configUrl}), rawData: ${rawData}`,
            'ERR_UPDATER_INVALID_UPDATE_INFO'
          )
        }
        const { channelUrl, stagingPercentage, releaseNote } = channelConfig; // 解构通道配置
        const channelRawData = await this.httpRequest(new URL(channelUrl)) // 请求通道数据
        if (!channelRawData) {
          throw newError(`Cannot get channel data in latest release channel (${channelUrl}): rawData: null`, 'ERR_UPDATER_INVALID_UPDATE_INFO')
        }
        let updateInfo: UpdateInfo
        try {
          updateInfo = yaml.load(channelRawData) as UpdateInfo // 解析通道数据
          Object.assign(updateInfo, {
            stagingPercentage, // 添加阶段性发布百分比
            releaseNotes: releaseNote, // 添加发布说明
          })
        } catch (err) {
          throw newError(`Cannot parse update info in latest release channel (${channelUrl}): rawData: ${channelRawData}`, 'ERR_UPDATER_INVALID_UPDATE_INFO')
        }
        return updateInfo // 返回更新信息
      } catch (e: any) {
        if ('statusCode' in e && e.statusCode === 404) { // 处理404错误
          throw newError(`Cannot find channel "${channelFile}" update info: ${e.stack || e.message}`, "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND")
        } else if (e.code === "ECONNREFUSED") { // 处理连接拒绝错误
          if (attemptNumber < 3) { // 最多重试3次
            await new Promise((resolve, reject) => {
              try {
                setTimeout(resolve, 1000 * attemptNumber) // 根据尝试次数延迟重试
              } catch (e: any) {
                reject(e)
              }
            })
            continue // 继续重试
          }
        }
        throw e // 抛出其他错误
      }
    }
  }

  // 🚀 解析更新文件信息
  resolveFiles(updateInfo: UpdateInfo): Array<ResolvedUpdateFileInfo> {
    return updateInfo.files.map(info => ({
      url: new URL(info.url), // 将文件URL转换为URL对象
      info, // 返回文件信息
    }))
  }
}
