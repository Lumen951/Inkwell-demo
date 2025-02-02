/**
 * @fileoverview
 * 该模块实现了Electron主进程中窗口生命周期的扩展与API注册，
 * 通过依赖注入获取ElectronApp和Injector实例，进而将窗口生命周期管理逻辑封装到WindowLifecycle中，
 * 并注册至Electron主进程API注册中心（ElectronMainApiRegistry）。
 * 
 * 历史背景：此设计理念源于对Electron窗口状态管理的不断演进，旨在解耦各模块逻辑，
 * 提高应用的可维护性和扩展性。 🔧 配置项
 */

import { Injector, Autowired, INJECTOR_TOKEN } from '@opensumi/di'; // 🔧 配置项：依赖注入工具模块，用于管理和注入服务实例
import { Domain } from '@opensumi/ide-core-common';              // 🔧 配置项：领域注解，用于标识组件所属领域
import {
  ElectronMainApiRegistry,  // Electron主进程API注册中心，用于管理各API服务
  ElectronMainContribution, // Electron主进程扩展点接口
  IElectronMainApp,         // Electron主应用接口，定义主应用对外暴露的方法
} from '@opensumi/ide-core-electron-main/lib/bootstrap/types';
import { ElectronMainApp } from '@opensumi/ide-core-electron-main'; // Electron主应用实现，提供基本的主进程操作
import { IElectronMainLifeCycleService } from '@opensumi/ide-core-common/lib/electron'; // Electron生命周期管理服务接口
import { WindowLifecycle } from './window-lifecycle';            // 窗口生命周期管理器，实现了具体的生命周期逻辑

/**
 * @class WindowContribution
 * @classdesc
 *  实现ElectronMainContribution接口，负责将窗口生命周期管理器WindowLifecycle注册到Electron主进程中，
 *  从而实现窗口状态（如打开、关闭、更新等）的统一管理。
 *
 * 🚀 性能优化：注册操作仅在启动期间执行，对运行时性能无明显影响。
 * ⚠️ 注意事项：依赖注入必须正确配置，否则会导致API注册失败，进而影响窗口管理逻辑。
 *
 * @history
 *  初始版本通过解耦生命周期管理逻辑，实现了更高的可维护性和灵活性。
 */
@Domain(ElectronMainContribution)
export class WindowContribution implements ElectronMainContribution {

  /**
   * @property {Injector} injector
   * @description
   *  依赖注入器，用于在应用中动态获取各种服务实例。
   *  该属性通过@opensumi/di中的INJECTOR_TOKEN自动注入。
   */
  @Autowired(INJECTOR_TOKEN)
  injector: Injector

  /**
   * @property {ElectronMainApp} electronApp
   * @description
   *  Electron主应用实例，用于调用和维护与主进程交互的各项功能。
   *  通过@Autowired装饰器自动注入，实现模块间低耦合设计。
   */
  @Autowired(IElectronMainApp)
  electronApp: ElectronMainApp;

  /**
   * @function registerMainApi
   * @summary
   *  注册窗口生命周期管理API，将WindowLifecycle实例绑定至Electron主进程API注册中心中。
   *
   * @param {ElectronMainApiRegistry} registry - 主进程API注册中心，负责管理应用各服务API。
   * @returns {void} 无返回值
   *
   * @algorithm 核心流程：
   * | 步骤编号 | 步骤描述                                                  | 实现代码                                                     |
   * | -------- | --------------------------------------------------------- | ------------------------------------------------------------ |
   * | 1        | 实例化WindowLifecycle，并注入ElectronApp与Injector实例    | new WindowLifecycle(this.electronApp, this.injector)         |
   * | 2        | 在registry中注册生命周期服务，将接口与实例相绑定            | registry.registerMainApi(IElectronMainLifeCycleService, instance) |
   *
   * @note 历史背景：
   *  为了使窗口生命周期管理与主进程API解耦，本方法首次在初期设计时引入，后续维护中进一步优化注册逻辑。
   */
  registerMainApi(registry: ElectronMainApiRegistry): void {
    // 调用API注册方法，将IElectronMainLifeCycleService接口与WindowLifecycle实例进行绑定
    registry.registerMainApi(IElectronMainLifeCycleService, new WindowLifecycle(this.electronApp, this.injector));
  }
}
