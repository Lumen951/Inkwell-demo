/**
 * @fileoverview AIRunContribution类用于管理AI生成的调试配置。
 * 该类实现了ClientAppContribution接口，负责在应用启动时注册调试配置。
 */

import { Autowired } from '@opensumi/di';
import { ClientAppContribution, Domain, MaybePromise, ProgressLocation } from '@opensumi/ide-core-browser';
import { DebugConfigurationManager } from '@opensumi/ide-debug/lib/browser/debug-configuration-manager';
import { IProgressService } from '@opensumi/ide-core-browser/lib/progress';
import { MessageService } from '@opensumi/ide-overlay/lib/browser/message.service';
import { AiRunService } from './ai-run.service';

@Domain(ClientAppContribution)
export class AIRunContribution implements ClientAppContribution {

  @Autowired(DebugConfigurationManager)
  private readonly debugConfigurationManager: DebugConfigurationManager; // 🔧 调试配置管理器

  @Autowired(AiRunService)
  private readonly aiRunService: AiRunService; // 🔧 AI运行服务

  @Autowired(IProgressService)
  private readonly progressService: IProgressService; // 🔧 进度服务

  @Autowired(MessageService)
  protected readonly messageService: MessageService; // 🔧 消息服务
  
  /**
   * @method onDidStart
   * @description 应用启动时调用，注册调试配置。
   * @returns {MaybePromise<void>} 无返回值。
   */
  onDidStart(): MaybePromise<void> {
    this.registerDebugConfiguration(); // 注册调试配置
  }

  /**
   * @method registerDebugConfiguration
   * @description 注册AI生成的调试配置。
   * 该方法使用进度服务显示配置生成的进度，并在生成完成后提供反馈。
   * @returns {Promise<void>} 无返回值。
   */
  async registerDebugConfiguration() {
    // 注册内部调试配置提供者
    this.debugConfigurationManager.registerInternalDebugConfigurationProvider('ai-native', {
      type: 'ai-native', // 配置类型
      label: 'AI 生成配置', // 配置标签
      provideDebugConfigurations: async () => {
        // 显示进度条并获取Node.js调试配置
        const aiConfig = await this.progressService.withProgress(
          {
            location: ProgressLocation.Notification, // 进度位置
            title: 'AI 配置生成中', // 进度标题
          },
          async () => {
            return this.aiRunService.getNodejsDebugConfigurations(); // 获取Node.js调试配置
          },
        );

        // 根据生成结果提供反馈
        if (!aiConfig || aiConfig.length === 0) { 
          this.messageService.info('AI 配置生成失败'); // ⚠️ 生成失败提示
        } else {
          this.messageService.info('AI 配置生成成功'); // ⚠️ 生成成功提示
        }

        return aiConfig || []; // 返回生成的配置
      },
    });

    // 注册Node.js项目的自动生成配置
    this.debugConfigurationManager.registerInternalDebugConfigurationOverride('pwa-node', {
      type: 'pwa-node', // 配置类型
      label: 'Node.js 项目自动生成', // 配置标签
      popupHint: '通过 Node.js Debug 提供的服务自动分析项目，生成运行配置', // 提示信息
    });
  }
}
