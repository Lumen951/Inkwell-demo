import { Autowired } from '@opensumi/di'
import { CommandContribution, CommandRegistry, Domain, MaybePromise } from '@opensumi/ide-core-common'
import { ClientAppContribution, electronEnv } from '@opensumi/ide-core-browser'
import { IMenuRegistry, MenuId, MenuContribution } from "@opensumi/ide-core-browser/lib/menu/next";
import { localize } from "@opensumi/ide-core-common/lib/localize";
import { IWorkspaceService } from '@opensumi/ide-workspace';
import { IAppMenuService } from '../common';
import { IElectronMainUIService } from '@opensumi/ide-core-common/lib/electron';

/**
 * 🔧 类功能概述：
 * 本类负责管理应用菜单的注册和渲染以及相关命令的配置，
 * 包括通过Electron接口展示日志目录和动态渲染最近使用的工作区菜单。
 *
 * @class LocalMenuContribution
 * @implements {MenuContribution, ClientAppContribution}
 */
const OPEN_LOGO_DIR_COMMAND_ID = {
  id: 'codefuse-ide.openLogDir',
  label: localize('codefuse-ide.openLogDir'),
}

/**
 * 🔧 应用菜单和命令的贡献者
 *
 * 方法说明：
 *   - initialize: 初始化预留入口，可用于在应用启动时执行菜单渲染
 *   - renderAppMenu: 异步获取最近使用的工作区，并调用菜单服务渲染最新菜单
 *   - registerCommands: 注册命令（例如打开日志目录），并绑定对应操作
 *   - registerMenus: 将菜单项注册到主菜单栏（包括偏好设置与帮助菜单项）
 *
 * @class LocalMenuContribution
 * @implements {MenuContribution, ClientAppContribution}
 */
@Domain(ClientAppContribution, MenuContribution, CommandContribution)
export class LocalMenuContribution implements MenuContribution, ClientAppContribution {
  /**
   * 🔧 注入工作区服务，用于获取用户最近使用的工作区信息
   *
   * @type {IWorkspaceService}
   */
  @Autowired(IWorkspaceService)
  workspaceService: IWorkspaceService;

  /**
   * 🔧 注入应用菜单服务，负责处理菜单项的渲染逻辑
   *
   * @type {IAppMenuService}
   */
  @Autowired(IAppMenuService)
  menuService: IAppMenuService;

  /**
   * 🔧 注入Electron主UI服务，提供与Electron主进程交互的方法，
   * 例如在Finder中展示指定目录。
   *
   * @type {IElectronMainUIService}
   */
  @Autowired(IElectronMainUIService)
  private electronMainUIService: IElectronMainUIService;

  /**
   * 🚀 初始化方法
   *
   * 功能描述：作为ClientAppContribution的一部分，本方法预留用于应用启动时的初始化任务，
   * 目前将renderAppMenu方法调用注释掉，保留未来需求。
   *
   * @return {MaybePromise<void>} 无返回值或Promise<void>
   */
  initialize(): MaybePromise<void> {
    // 🚀 历史背景：早期版本在此直接渲染菜单，但目前延迟渲染以便支持更多配置选项
    // this.renderAppMenu();
  }

  /**
   * 🚀 渲染应用菜单
   *
   * 功能描述：异步任务，获取最近使用的工作区列表，并通过menuService渲染相应的菜单项。
   *
   * @async
   * @function renderAppMenu
   * @return {Promise<void>} 返回一个Promise，表示渲染任务已完成
   */
  async renderAppMenu() {
    // ⚠️ 注意：此处调用异步方法获取工作区，可能因网络/IO延迟导致执行延后
    const workspaces = await this.workspaceService.getMostRecentlyUsedWorkspaces();
    // 🚀 性能优化：直接将获取的数据传递给菜单服务进行批量渲染，减少重复调用
    await this.menuService.renderRecentWorkspaces(workspaces);
  }

  /**
   * 🚀 注册命令
   *
   * 功能描述：向CommandRegistry注册一个命令，该命令在执行时调用Electron接口在Finder中显示日志目录。
   *
   * @function registerCommands
   * @param {CommandRegistry} registry - 命令注册中心，用于注册和管理命令
   * @return {void}
   */
  registerCommands(registry: CommandRegistry) {
    registry.registerCommand(OPEN_LOGO_DIR_COMMAND_ID, {
      /**
       * 🔧 执行命令：通过Electron主UI服务在Finder中展示日志目录
       *
       * @function execute
       * @return {void}
       */
      execute: () => {
        // ⚠️ 注意：使用electronEnv.metadata获取环境变量，确保日志目录路径正确
        this.electronMainUIService.revealInFinder(electronEnv.metadata.environment.logRoot);
      },
    });
  }

  /**
   * 🚀 注册菜单项
   *
   * 功能描述：向主菜单栏注册菜单项，包括偏好设置子菜单和帮助菜单中的日志目录命令，
   * 保证用户能够快速访问相关配置和资源。
   *
   * @function registerMenus
   * @param {IMenuRegistry} menuRegistry - 菜单注册中心，负责菜单项的管理与显示
   * @return {void}
   */
  registerMenus(menuRegistry: IMenuRegistry) {
    // 🚀 注册“偏好设置”子菜单到应用菜单栏中的设置菜单
    menuRegistry.registerMenuItem(MenuId.MenubarAppMenu, {
      submenu: MenuId.SettingsIconMenu,
      label: localize('common.preferences'),
      group: '2_preference',
    });

    // 🚀 在“帮助”菜单中注册打开日志目录的命令，便于用户调试和获取日志信息
    menuRegistry.registerMenuItem(MenuId.MenubarHelpMenu, {
      command: OPEN_LOGO_DIR_COMMAND_ID,
    });
  }
}
