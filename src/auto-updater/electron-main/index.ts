/**
 * @module AutoUpdaterModule
 * @description 该模块负责自动更新功能的实现，继承自 ElectronMainModule。
 *              提供了多个服务和贡献者，以支持更新相关的操作。
 * 
 * @class AutoUpdaterModule
 * @extends ElectronMainModule
 * 
 * @provides {Provider[]} providers - 提供的服务和贡献者列表。
 * 服务者是一个提供特定功能或服务的组件或类。它通常负责创建和管理服务的实例，并将其提供给需要使用这些服务的其他组件。
 * 贡献者是一个提供特定功能或扩展的组件或类。它通常用于向系统或模块添加额外的功能或特性。
 * 
 * @example
 * const autoUpdater = new AutoUpdaterModule();
 * 
 * @returns {void} 无返回值。
 */
import { Injectable, Provider } from '@opensumi/di'; // 🔧 引入依赖注入相关的模块
import { ElectronMainModule } from '@opensumi/ide-core-electron-main/lib/electron-main-module'; // 🔧 引入Electron主模块
import { UpdateContribution } from './update.contribution'; // 🔧 引入更新贡献者
import { UpdateMainService } from './update.service'; // 🔧 引入更新主服务
import { UpdateWindow } from './update-window'; // 🔧 引入更新窗口
import { AutoUpdaterService } from './auto-updater.service'; // 🔧 引入自动更新服务

@Injectable() // ⚠️ 标记该类为可注入的服务
export class AutoUpdaterModule extends ElectronMainModule {
  /**
   * @property {Provider[]} providers - 提供的服务和贡献者列表。
   * 
   * @description 包含了所有与自动更新相关的服务和贡献者。
   *              这些服务将被注入到依赖注入容器中，以便在应用程序中使用。
   */
  providers: Provider[] = [
    UpdateContribution, // 更新贡献者
    UpdateMainService, // 更新主服务
    UpdateWindow, // 更新窗口
    AutoUpdaterService, // 自动更新服务
  ];
}
