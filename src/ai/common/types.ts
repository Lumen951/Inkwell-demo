// 该模块定义了AI模型服务的相关常量、接口和配置项，主要用于配置和管理AI模型服务的参数。
// 也就是用户输入的那些配置变量

// 🔧 AI模型服务路径常量
export const AIModelServicePath = 'AIModelServicePath';

// 🔧 IAIModelServiceProxy符号，用于标识AI模型服务代理
export const IAIModelServiceProxy = Symbol('IAIModelServiceProxy')

// ⚙️ IAIModelServiceProxy接口定义
export interface IAIModelServiceProxy {
  /**
   * 设置配置项
   * @param values - 配置项的键值对，类型为Record<string, any>
   * @returns Promise<void> - 无返回值的Promise，表示配置设置完成
   */
  setConfig(values: Record<string, any>): Promise<void>
}

// 🔧 模型设置ID常量，包含AI模型的各种配置项
export const ModelSettingId = {
  baseUrl: 'ai.model.baseUrl', // 基础URL
  apiKey: 'ai.model.apiKey', // API密钥
  chatModelName: 'ai.model.chat.modelName', // 聊天模型名称
  chatSystemPrompt: 'ai.model.chat.systemPrompt', // 聊天系统提示
  chatTemperature: 'ai.model.chat.temperature', // 聊天温度
  chatMaxTokens: 'ai.model.chat.maxTokens', // 聊天最大token数
  chatPresencePenalty: 'ai.model.chat.presencePenalty', // 聊天存在惩罚
  chatFrequencyPenalty: 'ai.model.chat.frequencyPenalty', // 聊天频率惩罚
  chatTopP: 'ai.model.chat.topP', // 聊天Top P
  codeModelName: 'ai.model.code.modelName', // 代码模型名称
  codeSystemPrompt: 'ai.model.code.systemPrompt', // 代码系统提示
  codeFimTemplate: 'ai.model.code.fimTemplate', // 代码Fim模板
  codeTemperature: 'ai.model.code.temperature', // 代码温度
  codeMaxTokens: 'ai.model.code.maxTokens', // 代码最大token数
  codePresencePenalty: 'ai.model.code.presencePenalty', // 代码存在惩罚
  codeFrequencyPenalty: 'ai.model.code.frequencyPenalty', // 代码频率惩罚
  codeTopP: 'ai.model.code.topP', // 代码Top P
}

// 🔧 IModelConfig类型定义，表示模型配置的键值对
export type IModelConfig = Record<keyof typeof ModelSettingId, any>;
