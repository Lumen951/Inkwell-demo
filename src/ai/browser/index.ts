/**
 * AIFeatureModule 类是一个用于 AI 功能的模块，继承自 BrowserModule。
 * 该模块提供了一系列服务和后端服务路径，以支持 AI 相关的功能。
 * 
 * @class AIFeatureModule
 * @extends BrowserModule
 * 
 * @providers
 * - AINativeContribution: 提供原生 AI 功能的贡献
 * - AIRunContribution: 提供 AI 运行时的贡献
 * - AICommandPromptManager: 管理 AI 命令提示的服务
 * - AICommandService: 提供 AI 命令的服务
 * - InlineChatOperationModel: 处理内联聊天操作的模型
 * - AIModelContribution: 提供 AI 模型的贡献
 * 
 * @backServices
 * - servicePath: AIModelServicePath: 后端服务路径，用于与 AI 模型交互
 * 
 * @returns {void} 无返回值
 */
import { BrowserModule } from '@opensumi/ide-core-browser'; // 导入 BrowserModule
import { Injectable } from '@opensumi/di'; // 导入 Injectable 装饰器

import { AINativeContribution } from './ai-native.contribution'; // 导入原生 AI 功能贡献
import { AIRunContribution } from './ai-run.contribution'; // 导入 AI 运行时贡献
import { AICommandPromptManager } from './command/command-prompt-manager'; // 导入命令提示管理器
import { AICommandService } from './command/command.service'; // 导入命令服务
import { InlineChatOperationModel } from './inline-chat-operation'; // 导入内联聊天操作模型
import { AIModelContribution } from './ai-model.contribution'; // 导入 AI 模型贡献
import { AIModelServicePath } from '../common'; // 导入 AI 模型服务路径

export * from './constants'; // 导出常量

@Injectable() // 将 AIFeatureModule 标记为可注入的服务
export class AIFeatureModule extends BrowserModule {
  // 提供的服务列表
  providers = [
    AINativeContribution, // 原生 AI 功能
    AIRunContribution, // AI 运行时
    AICommandPromptManager, // 命令提示管理
    AICommandService, // 命令服务
    InlineChatOperationModel, // 内联聊天操作
    AIModelContribution, // AI 模型
  ];

  // 后端服务配置
  backServices = [
    {
      servicePath: AIModelServicePath, // 后端服务路径
    }
  ];
}
