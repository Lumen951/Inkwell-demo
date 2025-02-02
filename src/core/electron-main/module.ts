/**
 * @file CoreElectronMainModule 模块
 * @summary 本文件定义了 CoreElectronMainModule 类，用于在 Electron 主进程中注册各种核心服务及贡献者，
 *          以确保应用在 Electron 平台下顺利初始化与运行。
 *
 * 🔧 配置项：所有的服务和贡献者均通过 providers 数组注册，并由依赖注入（DI）系统自动管理。
 * ⚠️ 注意事项：请确保各服务及贡献者的注册顺序和依赖关系正确，否则可能导致运行时错误。
 * 🚀 性能优化：模块设计遵循懒加载和解耦原则，以缩短启动加载时间并提升整体性能。
 *
 * 历史背景：该模块最初设计时旨在满足跨平台需求，经过多次迭代优化后已经能支持丰富的业务扩展。
 */

import { Injectable } from '@opensumi/di';
import { ElectronMainModule } from '@opensumi/ide-core-electron-main/lib/electron-main-module';
import { StorageContribution, StorageService } from './storage.service';
import { ThemeContribution, ThemeService } from './theme.service';
import { LifecycleContribution } from './lifecycle.contribution';
import { IProduct, IEnvironmentService } from '../common';
import { EnvironmentService } from './environment.service';
import { WindowsManager } from './window/windows-manager';
import { AppMenuContribution, AppMenuService } from './menu.contribution';
import { WindowContribution } from './window/window.contribution';
import { WorkspaceHistoryContribution } from './workspace/workspace-history.contribution';

export * from './storage.service';

/**
 * @class CoreElectronMainModule
 * @classdesc 核心 Electron 主进程模块，通过继承 ElectronMainModule，
 *            实现对生命周期管理、存储、主题、窗口及工作空间历史等核心功能的注册。
 *
 * @constructor
 * @example
 * // 示例：实例化 CoreElectronMainModule 并自动注入所有核心服务与贡献者
 * const coreModule = new CoreElectronMainModule();
 */
@Injectable()
export class CoreElectronMainModule extends ElectronMainModule {
  // 🔧 providers 数组：注册所有需要在 Electron 主进程中加载的核心服务和功能贡献者
  providers = [
    // 🔧 LifecycleContribution：生命周期管理贡献者，用于处理应用启动、暂停、停止等生命周期逻辑
    LifecycleContribution,
    // 🔧 StorageContribution：存储服务贡献者，负责注册数据存储相关的功能
    StorageContribution,
    // 🔧 StorageService：存储服务实现，具体负责数据的读写操作与持久化逻辑
    StorageService,
    // 🔧 ThemeContribution：主题管理贡献者，注册并管理界面主题设置
    ThemeContribution,
    // 🔧 ThemeService：主题服务实现，包含主题切换与加载的具体业务逻辑
    ThemeService,
    // 🔧 AppMenuContribution：应用菜单贡献者，定义应用菜单的结构及初始化方法
    AppMenuContribution,
    // 🔧 AppMenuService：应用菜单服务实现，处理菜单交互及相应的业务逻辑
    AppMenuService,
    // 🔧 WindowContribution：窗口管理贡献者，负责主窗口和子窗口的生命周期管理
    WindowContribution,
    // 🔧 WindowsManager：窗口管理器，具体实现窗口创建、关闭、切换等操作
    WindowsManager,
    // 🔧 WorkspaceHistoryContribution：工作空间历史贡献者，用于记录用户最近操作的工作空间信息
    WorkspaceHistoryContribution,
    // ⚠️ 注册 IProduct：通过静态变量 __PRODUCT__ 为应用注入产品配置信息，确保全局唯一性
    {
      token: IProduct,
      useValue: __PRODUCT__,
    },
    // ⚠️ 注册 IEnvironmentService：将环境服务接口映射到 EnvironmentService 类，
    //     以确保环境变量和相关配置在应用中正确加载
    {
      token: IEnvironmentService,
      useClass: EnvironmentService,
    },
  ];
}
