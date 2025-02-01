// 该类负责处理更新相关的功能，包括自动检查更新和注册主API。
// 它实现了 ElectronMainContribution 接口，允许与 Electron 主进程进行交互。

import { Autowired } from '@opensumi/di' // 🔧 依赖注入装饰器，用于自动注入服务
import { Domain, MaybePromise } from '@opensumi/ide-core-common' // 🔧 领域和可能的Promise类型
import { ElectronMainApiRegistry } from '@opensumi/ide-core-electron-main' // 🔧 Electron主API注册器
import { ElectronMainContribution } from '@/core/electron-main' // 🔧 Electron主贡献接口
import { UpdateMainService } from './update.service' // 🔧 更新主服务
import { UpdateWindow } from './update-window' // 🔧 更新窗口
import { IUpdateMainService } from '../common' // 🔧 更新主服务接口

@Domain(ElectronMainContribution) // ⚠️ 声明该类为Electron主贡献
export class UpdateContribution implements ElectronMainContribution {
  @Autowired(UpdateMainService) // 🔧 自动注入更新主服务
  updateMainService: UpdateMainService

  @Autowired(UpdateWindow) // 🔧 自动注入更新窗口
  updateWindow: UpdateWindow

  /**
   * 功能描述：启动时自动检查更新。
   * 
   * @returns {MaybePromise<void>} 无返回值，可能是Promise。
   */
  onStart(): MaybePromise<void> {
    // 调用更新主服务的自动检查更新方法
    this.updateMainService.checkForUpdatesAuto() // 🚀 启动自动更新检查
  }

  /**
   * 功能描述：注册主API以供Electron主进程使用。
   * 
   * @param {ElectronMainApiRegistry} registry - API注册器，用于注册服务。
   * @returns {void} 无返回值。
   */
  registerMainApi(registry: ElectronMainApiRegistry): void {
    // 将更新主服务注册到API注册器中
    registry.registerMainApi(IUpdateMainService, this.updateMainService); // 🚀 注册更新服务API
  }
}
