/**
 * @file index.ts
 * @brief 核心浏览器模块配置文件
 *
 * 🚀 主要功能：
 * 此文件定义了 CoreBrowserModule 类，该模块继承自 BrowserModule，通过依赖注入方式注册和管理 Electron 环境下的各种服务及功能贡献者，
 * 如原生对话框服务、头部服务、主题管理等。同时整合了来自不同子模块的业务扩展和配置项，以实现 Electron 应用的高扩展性和易维护性。
 *
 * ⚠️ 注意事项：
 * - 部分服务使用 createElectronMainApi 进行包装，确保在 Electron 主进程中正确调用。
 * - 通过 patchProviders 附加额外的服务配置，支持历史版本兼容及后续扩展。
 * - 技术术语保留英文，详细注释遵循 Google 和 Electron 官方文档规范。
 */

import { BrowserModule, createElectronMainApi, IElectronNativeDialogService } from '@opensumi/ide-core-browser';  // 🔧 配置项：核心浏览器模块及接口
import { Injectable } from '@opensumi/di';  // 🔧 配置项：依赖注入装饰器

// 🔧 配置项：引入 Electron 平台相关的基础贡献者和服务实现
import { ElectronBasicContribution } from '@opensumi/ide-electron-basic/lib/browser';
import { ElectronNativeDialogService } from '@opensumi/ide-electron-basic/lib/browser/dialog';
import { ElectronHeaderService } from '@opensumi/ide-electron-basic/lib/browser/header/header.service';
import { ElectronPreferenceContribution } from '@opensumi/ide-electron-basic/lib/browser/electron-preference.contribution';
import { IElectronHeaderService } from '@opensumi/ide-electron-basic/lib/common/header';

// 🔧 配置项：引入本地模块中的业务贡献者和配置
import { ProjectSwitcherContribution } from './project.contribution';
import { LocalMenuContribution } from './menu.contribution';
import { LocalThemeContribution } from './theme.contribution';
import { patchProviders } from './patch';
import { IStorageService, IAppMenuService, IThemeService } from '../common';
import { HeaderContribution, ELECTRON_HEADER } from './header/header.contribution';
import { WelcomeContribution } from './welcome/welcome.contribution';

// 🚀 导出 ELECTRON_HEADER 常量
export { ELECTRON_HEADER };

/**
 * @class CoreBrowserModule
 * @brief 核心浏览器模块配置类，用于在 Electron 环境下注册及管理各类服务。
 *
 * 🔧 功能描述：
 * 该类继承自 BrowserModule，通过 providers 数组注册多种服务和业务贡献者，
 * 包括原生对话框、头部服务、主题存储、菜单服务等，确保 Electron 应用功能完整、模块化。
 *
 * ⚙️ 参数说明：
 * 无参数构造函数
 *
 * 📦 返回值说明：
 * {CoreBrowserModule} 当前模块实例
 *
 * ⚠️ 注意事项：
 * - 使用 createElectronMainApi 方法包裹部分服务，确保其在 Electron 主进程中正确运行。
 * - patchProviders 用于扩展注入的服务列表，支持多样化配置与后续扩展。
 *
 * 历史背景：
 * 基于 Electron 应用的快速发展，采用模块化和依赖注入设计模式，提高了代码的可维护性和扩展性。
 */
@Injectable()
export class CoreBrowserModule extends BrowserModule {
  providers = [
    {
      token: IElectronNativeDialogService,
      // 使用 ElectronNativeDialogService 实现原生对话框服务接口
      useClass: ElectronNativeDialogService,
    },
    {
      token: IElectronHeaderService,
      // 使用 ElectronHeaderService 实现 Electron 头部服务接口
      useClass: ElectronHeaderService,
    },
    // 注册 Electron 平台的基础功能贡献者
    ElectronBasicContribution,
    // 注册 Electron 偏好设置功能贡献者
    ElectronPreferenceContribution,
    // 注册欢迎页贡献者，初始化应用欢迎页面
    WelcomeContribution,
    // 注册头部信息贡献者，管理应用顶部导航栏
    HeaderContribution,
    // 注册项目切换器贡献者，支持项目间快速切换
    ProjectSwitcherContribution,
    // 注册本地菜单贡献者，配置本地应用菜单
    LocalMenuContribution,
    // 注册本地主题贡献者，用于支持主题更换功能
    LocalThemeContribution,
    {
      token: IStorageService,
      // 使用 createElectronMainApi 封装 IStorageService，确保数据持久化操作在 Electron 主进程中执行
      useValue: createElectronMainApi(IStorageService),
    },
    {
      token: IThemeService,
      // 使用 createElectronMainApi 封装 IThemeService，管理应用主题设置与更新
      useValue: createElectronMainApi(IThemeService),
    },
    {
      token: IAppMenuService,
      // 使用 createElectronMainApi 封装 IAppMenuService，负责应用菜单的管理和交互
      useValue: createElectronMainApi(IAppMenuService),
    },
    // 展开 patchProviders 数组，将扩展配置项注入至 providers 中
    ...patchProviders,
  ];
}
