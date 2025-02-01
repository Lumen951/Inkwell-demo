/**
 * AIModelContribution类用于管理AI模型的配置和设置。
 * 
 * ⚙️ 功能描述：
 * - 该类实现了PreferenceContribution、SettingContribution和ClientAppContribution接口，负责定义和管理AI模型的偏好设置。
 * - 提供了对AI模型相关设置的注册、验证和更新功能。
 * 
 * 🔧 配置项：
 * - aiNativePreferenceSchema: 定义了AI模型的偏好设置结构，包括基本URL、API密钥、聊天模型名称等。
 * 
 * ⚠️ 注意事项：
 * - 确保在使用该类之前，已正确配置相关依赖服务。
 */

import { Autowired } from '@opensumi/di'; // 引入依赖注入装饰器
import { AI_NATIVE_SETTING_GROUP_ID, localize, MaybePromise, Delayer, CommandService } from '@opensumi/ide-core-common'; // 引入核心命令和本地化工具
import { Domain, PreferenceContribution, PreferenceSchema, ClientAppContribution, IClientApp, PreferenceService, COMMON_COMMANDS, IPreferenceSettingsService } from '@opensumi/ide-core-browser'; // 引入偏好设置相关的类型
import { ISettingRegistry, SettingContribution } from '@opensumi/ide-preferences'; // 引入设置注册相关的类型
import { AIModelServicePath, IAIModelServiceProxy, ModelSettingId } from '../common'; // 引入AI模型服务路径和相关类型
import { OutputChannel } from '@opensumi/ide-output/lib/browser/output.channel'; // 引入输出通道
import { OutputService } from '@opensumi/ide-output/lib/browser/output.service'; // 引入输出服务
import { MessageService } from '@opensumi/ide-overlay/lib/browser/message.service'; // 引入消息服务

// 获取模型设置ID的键
const ModelSettingIdKeys = Object.keys(ModelSettingId);

// 定义AI模型的偏好设置结构
const aiNativePreferenceSchema: PreferenceSchema = {
  properties: {
    [ModelSettingId.baseUrl]: {
      type: 'string',
      defaultValue: 'http://127.0.0.1:11434/v1', // 默认的基本URL
    },
    [ModelSettingId.apiKey]: {
      type: 'string', // API密钥
    },
    [ModelSettingId.chatModelName]: {
      type: 'string', // 聊天模型名称
    },
    [ModelSettingId.chatSystemPrompt]: {
      type: 'string', // 聊天系统提示
    },
    [ModelSettingId.chatMaxTokens]: {
      type: 'number',
      minimum: 0, // 最小值为0
      defaultValue: 1024, // 默认最大令牌数
      description: localize('preference.ai.model.maxTokens.description'), // 本地化描述
    },
    [ModelSettingId.chatTemperature]: {
      type: 'string',
      defaultValue: '0.20', // 默认温度
      description: localize('preference.ai.model.temperature.description'), // 本地化描述
    },
    [ModelSettingId.chatPresencePenalty]: {
      type: 'string',
      defaultValue: '1.0', // 默认存在惩罚
      description: localize('preference.ai.model.presencePenalty.description'), // 本地化描述
    },
    [ModelSettingId.chatFrequencyPenalty]: {
      type: 'string',
      defaultValue: '1.0', // 默认频率惩罚
      description: localize('preference.ai.model.frequencyPenalty.description'), // 本地化描述
    },
    [ModelSettingId.chatTopP]: {
      type: 'string',
      defaultValue: '1', // 默认Top P值
      description: localize('preference.ai.model.topP.description'), // 本地化描述
    },
    [ModelSettingId.codeModelName]: {
      type: 'string',
      description: localize('preference.ai.model.code.modelName.tooltip') // 代码模型名称提示
    },
    [ModelSettingId.codeSystemPrompt]: {
      type: 'string', // 代码系统提示
    },
    [ModelSettingId.codeMaxTokens]: {
      type: 'number',
      minimum: 0, // 最小值为0
      defaultValue: 64, // 默认最大令牌数
      description: localize('preference.ai.model.maxTokens.description'), // 本地化描述
    },
    [ModelSettingId.codeTemperature]: {
      type: 'string',
      defaultValue: '0.20', // 默认温度
      description: localize('preference.ai.model.temperature.description'), // 本地化描述
    },
    [ModelSettingId.codePresencePenalty]: {
      type: 'string',
      defaultValue: '1', // 默认存在惩罚
      description: localize('preference.ai.model.presencePenalty.description'), // 本地化描述
    },
    [ModelSettingId.codeFrequencyPenalty]: {
      type: 'string',
      defaultValue: '1', // 默认频率惩罚
      description: localize('preference.ai.model.frequencyPenalty.description'), // 本地化描述
    },
    [ModelSettingId.codeTopP]: {
      type: 'string',
      defaultValue: '1', // 默认Top P值
      description: localize('preference.ai.model.topP.description'), // 本地化描述
    },
    [ModelSettingId.codeFimTemplate]: {
      type: 'string',
      description: localize('preference.ai.model.code.fimTemplate.tooltip'), // 代码FIM模板提示
    },
  },
};

// 定义AIModelContribution类，负责AI模型的偏好设置
@Domain(ClientAppContribution, PreferenceContribution, SettingContribution)
export class AIModelContribution implements PreferenceContribution, SettingContribution, ClientAppContribution {
  schema = aiNativePreferenceSchema; // 设置偏好结构

  @Autowired(PreferenceService)
  private readonly preferenceService: PreferenceService; // 注入偏好服务

  @Autowired(AIModelServicePath)
  modelService: IAIModelServiceProxy; // 注入AI模型服务代理

  @Autowired(MessageService)
  messageService: MessageService; // 注入消息服务

  @Autowired(OutputService)
  outputService: OutputService; // 注入输出服务

  @Autowired(CommandService)
  commandService: CommandService; // 注入命令服务

  @Autowired(IPreferenceSettingsService)
  preferenceSettingsService: IPreferenceSettingsService; // 注入偏好设置服务

  #output: OutputChannel; // 输出通道的私有属性

  // 获取输出通道
  get output() {
    if (!this.#output) {
      this.#output = this.outputService.getChannel('AI Native'); // 如果未初始化，则创建新的输出通道
    }
    return this.#output; // 返回输出通道
  }

  /**
   * 应用启动时的回调函数
   * 
   * 功能描述：初始化模型配置并监听偏好设置的变化
   * 
   * @param {IClientApp} app - 当前客户端应用实例
   * 
   * @returns {MaybePromise<void>} - 无返回值
   */
  onDidStart(app: IClientApp): MaybePromise<void> {
    const delayer = new Delayer(100); // 延迟器，用于防止频繁触发
    const values: Record<string, any> = {}; // 存储偏好设置的值
    ModelSettingIdKeys.forEach((idKey) => {
      values[idKey] = this.preferenceService.getValid(ModelSettingId[idKey]); // 获取有效的偏好设置值
      this.preferenceService.onSpecificPreferenceChange(ModelSettingId[idKey], (change) => {
        values[idKey] = change.newValue; // 更新偏好设置值
        delayer.trigger(() => this.setModeConfig(values)); // 触发配置更新
      });
    });
    this.checkModelConfig(values).then((valid) => {
      if (valid) {
        delayer.trigger(() => this.setModeConfig(values)); // 如果配置有效，更新模型配置
      }
    });
  }

  /**
   * 注册AI模型的设置
   * 
   * 功能描述：将AI模型的偏好设置注册到设置注册表中 用于管理应用程序的配置和用户偏好配置
   * 
   * @param {ISettingRegistry} registry - 设置注册表实例
   * 
   * @returns {void} - 无返回值
   */

  registerSetting(registry: ISettingRegistry): void {
    registry.registerSettingSection(AI_NATIVE_SETTING_GROUP_ID, {
      title: localize('preference.ai.model.title'), // 设置标题
      preferences: [
        {
          id: ModelSettingId.baseUrl,
          localized: 'preference.ai.model.baseUrl', // 本地化的基本URL
        },
        {
          id: ModelSettingId.apiKey,
          localized: 'preference.ai.model.apiKey', // 本地化的API密钥
        },
        {
          id: ModelSettingId.chatModelName,
          localized: 'preference.ai.model.chat.modelName', // 本地化的聊天模型名称
        },
        {
          id: ModelSettingId.chatSystemPrompt,
          localized: 'preference.ai.model.chat.systemPrompt', // 本地化的聊天系统提示
        },
        {
          id: ModelSettingId.chatMaxTokens,
          localized: 'preference.ai.model.chat.maxTokens', // 本地化的最大令牌数
        },
        {
          id: ModelSettingId.chatTemperature,
          localized: 'preference.ai.model.chat.temperature', // 本地化的温度
        },
        {
          id: ModelSettingId.chatPresencePenalty,
          localized: 'preference.ai.model.chat.presencePenalty', // 本地化的存在惩罚
        },
        {
          id: ModelSettingId.chatFrequencyPenalty,
          localized: 'preference.ai.model.chat.frequencyPenalty', // 本地化的频率惩罚
        },
        {
          id: ModelSettingId.chatTopP,
          localized: 'preference.ai.model.chat.topP', // 本地化的Top P值
        },
        {
          id: ModelSettingId.codeModelName,
          localized: 'preference.ai.model.code.modelName', // 本地化的代码模型名称
        },
        {
          id: ModelSettingId.codeSystemPrompt,
          localized: 'preference.ai.model.code.systemPrompt', // 本地化的代码系统提示
        },
        {
          id: ModelSettingId.codeMaxTokens,
          localized: 'preference.ai.model.code.maxTokens', // 本地化的代码最大令牌数
        },
        {
          id: ModelSettingId.codeTemperature,
          localized: 'preference.ai.model.code.temperature', // 本地化的代码温度
        },
        {
          id: ModelSettingId.codePresencePenalty,
          localized: 'preference.ai.model.code.presencePenalty', // 本地化的代码存在惩罚
        },
        {
          id: ModelSettingId.codeFrequencyPenalty,
          localized: 'preference.ai.model.code.frequencyPenalty', // 本地化的代码频率惩罚
        },
        {
          id: ModelSettingId.codeTopP,
          localized: 'preference.ai.model.code.topP', // 本地化的代码Top P值
        },
        {
          id: ModelSettingId.codeFimTemplate,
          localized: 'preference.ai.model.code.fimTemplate', // 本地化的代码FIM模板
        },
      ],
    });
  }

  /**
   * 检查模型配置的有效性
   * 
   * 功能描述：验证模型配置是否完整，并在缺失时提示用户
   * 
   * @param {Record<string, any>} values - 当前的模型配置值
   * 
   * @returns {Promise<boolean>} - 返回配置是否有效的Promise
   */
  private async checkModelConfig(values: Record<string, any>): Promise<boolean> {
    if (values.baseUrl && values.chatModelName) {
      return true; // 如果基本URL和聊天模型名称都存在，则配置有效
    }
    const res = await this.messageService.info(localize('ai.model.noConfig'), [
      localize('ai.model.go') // 提示用户配置缺失
    ]);
    if (res === localize('ai.model.go')) {
      await this.commandService.executeCommand(COMMON_COMMANDS.OPEN_PREFERENCES.id); // 打开偏好设置
      this.preferenceSettingsService.scrollToPreference(ModelSettingId.baseUrl); // 滚动到基本URL设置
    }
    return false; // 返回配置无效
  }

  /**
   * 设置模型配置
   * 
   * 功能描述：将模型配置应用到模型服务中
   * 
   * @param {Record<string, any>} values - 要设置的模型配置值
   * 
   * @returns {void} - 无返回值
   */
  private setModeConfig(values: Record<string, any>): void {
    this.modelService.setConfig(values); // 设置模型配置
    this.output.appendLine(`model config: ${JSON.stringify(values, null, 2)}`); // 输出当前模型配置
  }
}
