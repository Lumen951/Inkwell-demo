/**
 * @module AIServiceModule
 * @description 
 * 该模块负责提供AI相关服务的依赖注入配置。它通过NodeModule类扩展，定义了多个服务的提供者。
 * 
 * @class AIServiceModule
 * @extends NodeModule
 * 
 * @provides 
 * - AIBackService: 处理AI后端服务的逻辑
 * - ShellIntegrationService: 处理终端的Shell集成
 * - AIModelService: 提供AI模型服务
 * - AIModelServiceProxy: 提供AI模型服务的代理
 * 
 * @example
 * const aiServiceModule = new AIServiceModule();
 * 
 * @returns {void}
 */
import { NodeModule } from '@opensumi/ide-core-node'; // 引入NodeModule类
import { Injectable, Provider } from '@opensumi/di'; // 引入依赖注入相关的装饰器和类型
import { AIBackSerivceToken } from '@opensumi/ide-core-common/lib/types/ai-native'; // 引入AI后端服务的Token
import { IShellIntegrationService } from '@opensumi/ide-terminal-next/lib/node/shell-integration.service'; // 引入Shell集成服务接口

import { ShellIntegrationService } from './shell-integration'; // 引入Shell集成服务实现
import { AIBackService } from './ai-back.service'; // 引入AI后端服务实现
import { AIModelServiceProxy, AIModelService } from './model.service'; // 引入AI模型服务及其代理
import { AIModelServicePath, IAIModelServiceProxy } from '../common'; // 引入AI模型服务路径和代理接口

@Injectable() // 将该类标记为可注入的服务
export class AIServiceModule extends NodeModule {
  /**
   * @property {Provider[]} providers
   * @description 
   * 提供者数组，定义了模块中所有服务的依赖注入配置。
   * 
   * @returns {Provider[]} 提供者数组
   */
  providers: Provider[] = [
    {
      token: AIBackSerivceToken, // AI后端服务的Token
      useClass: AIBackService, // 使用AIBackService类
      override: true, // 允许覆盖已有的提供者
    },
    {
      token: IShellIntegrationService, // Shell集成服务的Token
      useClass: ShellIntegrationService, // 使用ShellIntegrationService类
      override: true, // 允许覆盖已有的提供者
    },
    {
      token: AIModelService, // AI模型服务的Token
      useClass: AIModelService, // 使用AIModelService类
    },
    {
      token: IAIModelServiceProxy, // AI模型服务代理的Token
      useClass: AIModelServiceProxy, // 使用AIModelServiceProxy类
    }
  ];

  /**
   * @property {Object[]} backServices
   * @description 
   * 后端服务配置数组，定义了后端服务的路径和Token。
   * 
   * @returns {Object[]} 后端服务配置数组
   */
  backServices = [
    {
      servicePath: AIModelServicePath, // AI模型服务的路径
      token: IAIModelServiceProxy, // AI模型服务代理的Token
    }
  ];
}
