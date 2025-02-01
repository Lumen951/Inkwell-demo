// 该模块定义了AIModelService和AIModelServiceProxy类，用于管理AI模型的配置和日志记录。

import { Injectable, Autowired } from '@opensumi/di';
import { INodeLogger } from '@opensumi/ide-core-node'
import { IAIModelServiceProxy, IModelConfig } from '../common'
import { ILogServiceManager } from '@opensumi/ide-logs';

/**
 * 🔧 AIModelService类用于管理AI模型的配置和日志记录。
 */
@Injectable()
export class AIModelService {
  private logger: INodeLogger; // 日志记录器

  @Autowired(ILogServiceManager)
  private readonly loggerManager: ILogServiceManager; // 日志服务管理器

  #config: IModelConfig | undefined; // 存储模型配置

  /**
   * 🚀 构造函数，初始化日志记录器。
   */
  constructor() {
    this.logger = this.loggerManager.getLogger('ai' as any); // 获取名为'ai'的日志记录器
  }

  /**
   * 获取当前模型配置。
   * 
   * 功能描述：返回当前的模型配置，经过数值强制转换处理。
   * 
   * 返回值说明：
   * - 类型：IModelConfig | undefined
   * - 含义：返回当前的模型配置对象，如果未定义则返回undefined。
   */
  get config(): IModelConfig | undefined {
    const config = this.#config; // 获取当前配置
    if (!config) return; // 如果配置未定义，返回undefined
    return {
      ...config,
      chatTemperature: this.coerceNumber(config.chatTemperature, 0, 1, 0.2), // 强制转换聊天温度
      chatPresencePenalty: this.coerceNumber(config.chatPresencePenalty, -2, 2, 1), // 强制转换聊天存在惩罚
      chatFrequencyPenalty: this.coerceNumber(config.chatFrequencyPenalty, -2, 2, 1), // 强制转换聊天频率惩罚
      chatTopP: this.coerceNumber(config.chatTopP, 0, 1, 0.95), // 强制转换聊天Top P
      codeTemperature: this.coerceNumber(config.codeTemperature, 0, 1, 0.2), // 强制转换代码温度
      codePresencePenalty: this.coerceNumber(config.codePresencePenalty, -2, 2, 1), // 强制转换代码存在惩罚
      codeFrequencyPenalty: this.coerceNumber(config.codeFrequencyPenalty, -2, 2, 1), // 强制转换代码频率惩罚
      codeTopP: this.coerceNumber(config.codeTopP, 0, 1, 0.95), // 强制转换代码Top P
    };
  }

  /**
   * 设置模型配置。
   * 
   * 功能描述：更新模型的配置并记录日志。
   * 
   * 参数说明：
   * - config: IModelConfig - 新的模型配置对象
   * 
   * 返回值说明：
   * - 类型：Promise<void>
   * - 含义：无返回值，异步操作。
   */
  async setConfig(config: IModelConfig): Promise<void> {
    this.#config = config; // 更新配置
    this.logger.log('[model config]', JSON.stringify(config)); // 记录配置日志
  }

  /**
   * 强制转换数值到指定范围。
   * 
   * 功能描述：将输入值转换为指定范围内的数值，如果不在范围内则返回默认值。
   * 
   * 参数说明：
   * - value: string | number - 输入值
   * - min: number - 最小值
   * - max: number - 最大值
   * - defaultValue: number - 默认值
   * 
   * 返回值说明：
   * - 类型：number
   * - 含义：返回转换后的数值或默认值。
   */
  private coerceNumber(value: string | number, min: number, max: number, defaultValue: number) {
    const num = Number(value); // 转换为数字
    if (isNaN(num)) return defaultValue; // 如果不是数字，返回默认值
    if (num < min || num > max) return defaultValue; // 如果超出范围，返回默认值
    return num; // 返回有效数值
  }
}

/**
 * 🔧 AIModelServiceProxy类用于代理AIModelService的配置设置。
 */
@Injectable()
export class AIModelServiceProxy implements IAIModelServiceProxy {
  @Autowired(AIModelService)
  private readonly modelService: AIModelService; // 代理的模型服务

  /**
   * 设置模型配置。
   * 
   * 功能描述：通过代理设置模型的配置。
   * 
   * 参数说明：
   * - config: IModelConfig - 新的模型配置对象
   * 
   * 返回值说明：
   * - 类型：Promise<void>
   * - 含义：无返回值，异步操作。
   */
  async setConfig(config: IModelConfig): Promise<void> {
    this.modelService.setConfig(config); // 调用模型服务的设置配置方法
  }
}
