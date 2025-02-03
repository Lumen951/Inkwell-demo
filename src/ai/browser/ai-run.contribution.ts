/**
 * @fileoverview
 * 此模块定义了 AIRunContribution 类，其主要功能是注册和管理 AI 生成的调试配置。
 * 该类实现 ClientAppContribution 接口，在应用启动时通过调用相关服务实现调试配置的注册，并为 Node.js 项目提供自动生成调试配置的功能。
 *
 * 核心功能：
 *  1. 利用 DebugConfigurationManager 注册 AI 内部调试配置提供者。
 *  2. 使用 IProgressService 显示调试配置生成过程的进度条。
 *  3. 通过 AiRunService 异步生成 Node.js 调试配置，并使用 MessageService
 *     提供生成结果的反馈提示。
 *  4. 注册 Node.js 项目的自动生成调试配置覆盖项。
 *
 * 注释方式：遵循 Google 代码注释规范及 Electron 官方注释规范（如 Javadoc 风格），
 * 包含函数功能描述、参数说明和返回值说明，同时使用 emoji 图标标识各注释类别。
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
  private readonly debugConfigurationManager: DebugConfigurationManager; // 🔧 调试配置管理器，用于注册和管理调试配置

  @Autowired(AiRunService)
  private readonly aiRunService: AiRunService; // 🔧 AI 运行服务，负责生成 Node.js 调试配置

  @Autowired(IProgressService)
  private readonly progressService: IProgressService; // 🔧 进度服务，用于展示配置生成的进度条

  @Autowired(MessageService)
  protected readonly messageService: MessageService; // 🔧 消息服务，用以反馈配置生成进度及结果

  /**
   * @function onDidStart
   * @description 应用启动时调用的入口方法，用于初始化并注册调试配置。
   *
   * 详细说明：
   *  - 该方法在应用启动过程中被调用，进而触发 AI 生成调试配置的注册流程。
   *  - 调用内部的 registerDebugConfiguration 方法执行实际的配置注册逻辑。
   *
   * @returns {MaybePromise<void>} 无返回值（可能为异步过程）。
   */
  onDidStart(): MaybePromise<void> {
    // 调用注册方法进行调试配置注册
    this.registerDebugConfiguration();
  }

  /**
   * @function registerDebugConfiguration
   * @description 注册 AI 生成的调试配置及 Node.js 项目自动生成配置。
   *
   * 详细说明：
   *  1. 利用 DebugConfigurationManager.registerInternalDebugConfigurationProvider 注册 AI 内部调试配置提供者 'ai-native'；
   *     在回调中通过 IProgressService.withProgress 展示进度条，并异步调用 AiRunService.getNodejsDebugConfigurations 获取配置。
   *  2. 根据获取的配置数组判断生成结果，通过 MessageService.info 提示用户生成成功或失败。
   *  3. 注册 Node.js 项目自动生成的调试配置覆盖项，通过 DebugConfigurationManager.registerInternalDebugConfigurationOverride 实现。
   *
   * ⚠️ 注意：本方法中涉及嵌套的异步调用，务必确保所有异步操作正确返回 Promise 对象。
   *
   * 时间复杂度：O(1) —— 主要为服务调用，未涉及复杂算法。
   * 空间复杂度：O(1) —— 不涉及大规模数据结构的分配。
   *
   * @returns {Promise<void>} 异步执行结果，无返回值。
   */
  async registerDebugConfiguration(): Promise<void> {
    // 🔧 注册 AI 内部调试配置提供者，标识为 'ai-native'
    this.debugConfigurationManager.registerInternalDebugConfigurationProvider('ai-native', {
      type: 'ai-native',     // 配置类型标记
      label: 'AI 生成配置',   // 前端显示的配置标签
      /**
       * @function provideDebugConfigurations
       * @description 提供调试配置（AI 生成）的具体实现方法，通过进度条显示配置生成过程，
       * 并调用 AiRunService.getNodejsDebugConfigurations 来异步获取 Node.js 调试配置。
       *
       * 详细说明：
       *    - 使用 IProgressService.withProgress 展示消息通知中的进度条，
       *      提示用户"AI 配置生成中"。
       *    - 异步执行 AiRunService.getNodejsDebugConfigurations，获取生成的配置数组。
       *    - 依照配置数组是否为空，通过 MessageService.info 返回成功或失败提示。
       *
       * @returns {Promise<Array<any>>} Promise对象，解析为调试配置数组；为空时返回空数组 []。
       */
      provideDebugConfigurations: async () => {
        // 🚀 使用进度服务展示生成进度，以便用户感知操作正在进行中
        const aiConfig = await this.progressService.withProgress(
          {
            location: ProgressLocation.Notification, // 指定在通知区域展示进度条
            title: 'AI 配置生成中',                  // 进度条标题，提示当前操作
          },
          async () => {
            // 历史说明：此处采用异步流程替换早期的同步生成逻辑，以优化用户体验
            return this.aiRunService.getNodejsDebugConfigurations(); // 异步获取 Node.js 调试配置
          },
        );

        // ⚠️ 根据配置生成结果反馈提示：无配置或空数组视为生成失败
        if (!aiConfig || aiConfig.length === 0) {
          this.messageService.info('AI 配置生成失败');
        } else {
          this.messageService.info('AI 配置生成成功');
        }

        return aiConfig || []; // 返回生成的配置数组或空数组
      },
    });

    // 🔧 注册 Node.js 项目自动生成调试配置覆盖项，标识为 'pwa-node'
    this.debugConfigurationManager.registerInternalDebugConfigurationOverride('pwa-node', {
      type: 'pwa-node', // 配置类型标记
      label: 'Node.js 项目自动生成', // 显示的配置标签
      popupHint: '通过 Node.js Debug 提供的服务自动分析项目，生成运行配置', // 提示用户的说明
    });
  }
}
