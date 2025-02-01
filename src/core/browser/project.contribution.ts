/**
 * 🚀 ProjectSwitcherContribution 类：用于处理项目切换相关功能，包括菜单注册、文件打开等。
 *
 * 该类实现了 MenuContribution、BrowserEditorContribution、ClientAppContribution 接口，
 * 负责向 IDE 注册最近使用的项目菜单项目以及处理启动时文件打开逻辑。
 */

import {
  Domain,
  CommandContribution,
  CommandRegistry,
  URI,
  electronEnv,
  ClientAppContribution,
  StorageProvider,
  FILE_COMMANDS,
} from '@opensumi/ide-core-browser';
import { IMenuRegistry, MenuId, MenuContribution } from '@opensumi/ide-core-browser/lib/menu/next';
import { Autowired } from '@opensumi/di';
import { IWorkspaceService } from '@opensumi/ide-workspace/lib/common';
import { IWindowService, WORKSPACE_COMMANDS } from '@opensumi/ide-core-browser';
import { ITerminalController } from '@opensumi/ide-terminal-next';
import { IMainLayoutService } from '@opensumi/ide-main-layout';
import { BrowserEditorContribution, WorkbenchEditorService } from '@opensumi/ide-editor/lib/browser';
import { IThemeService } from '@opensumi/ide-theme';

@Domain(MenuContribution, BrowserEditorContribution, ClientAppContribution)
export class ProjectSwitcherContribution implements MenuContribution, BrowserEditorContribution, ClientAppContribution {

  // 🔧 自动注入 IWorkspaceService，用于管理工作区数据
  @Autowired(IWorkspaceService)
  workspaceService: IWorkspaceService;

  // 🔧 自动注入 IWindowService，用于窗口处理相关服务
  @Autowired(IWindowService)
  windowService: IWindowService;

  // 🔧 自动注入 ITerminalController，用于终端服务操作
  @Autowired(ITerminalController)
  terminalService: ITerminalController;

  // 🔧 自动注入 WorkbenchEditorService，用于编辑器相关操作
  @Autowired(WorkbenchEditorService)
  editorService: WorkbenchEditorService;

  // 🔧 自动注入 IMainLayoutService，管理主布局服务
  @Autowired(IMainLayoutService)
  private mainLayoutService: IMainLayoutService;

  // 🔧 自动注入 IThemeService，用于主题管理
  @Autowired(IThemeService)
  private themeService: IThemeService;

  // 🔧 自动注入 StorageProvider，用于存储服务
  @Autowired(StorageProvider)
  getStorage: StorageProvider;

  /**
   * 🚀 onStart 方法：应用启动时调用的钩子函数
   *
   * 功能描述：
   *   在应用启动阶段执行初始化操作，目前该方法为空。
   *
   * @async
   * @function onStart
   * @returns {Promise<void>} 无返回值
   */
  async onStart() {
    // 暂无启动时逻辑，预留扩展接口
  }

  /**
   * 🚀 registerMenus 方法：注册菜单项以显示最近使用的项目
   *
   * 功能描述：
   *   在 IDE 菜单中添加【最近项目】子菜单项，并动态添加最近使用的项目记录。
   *
   * @function registerMenus
   * @param {IMenuRegistry} registry - 菜单注册对象，用于注册新的菜单项
   * @returns {void} 无返回值
   */
  registerMenus(registry: IMenuRegistry) {
    // 注册主菜单中的【最近项目】子菜单项
    registry.registerMenuItem(MenuId.MenubarFileMenu, {
      submenu: 'recentProjects', // 指定子菜单标识
      label: '最近项目',        // 菜单显示名称
      group: '1_open',         // 菜单分组，控制显示顺序
    });

    // 异步获取最近使用的工作区，并将其转化为菜单项注册到“recentProjects”子菜单中
    this.workspaceService.getMostRecentlyUsedWorkspaces().then((workspaces) => {
      // 🔧 遍历每个工作区并注册对应的菜单项
      registry.registerMenuItems(
        'recentProjects',
        workspaces.map((workspace) => ({
          // 设置菜单项执行命令相关参数。此处命令使用 FILE_COMMANDS.VSCODE_OPEN_FOLDER 来打开工作区文件夹
          command: {
            id: FILE_COMMANDS.VSCODE_OPEN_FOLDER.id,
            label: new URI(workspace).codeUri.fsPath, // 通过 URI 对象获取文件路径
          },
          extraTailArgs: [workspace, false], // 额外参数：工作区标识及打开模式标识
        })),
      );
    });
  }

  /**
   * 🚀 onDidRestoreState 方法：在状态恢复后处理文件打开逻辑
   *
   * 功能描述：
   *   当应用恢复状态或收到打开文件事件时，通过编辑器服务打开相应文件。
   *
   * @function onDidRestoreState
   * @returns {void} 无返回值
   *
   * @note 历史背景：为了支持 Electron 桌面应用从命令行启动时直接打开指定文件的需求，
   *       以及运行时动态接收文件打开请求，均采用此处理逻辑。
   */
  onDidRestoreState() {
    // 判断 Electron 启动参数中是否包含要打开的文件，若有则立即通过编辑器打开该文件
    if (electronEnv.metadata.launchToOpenFile) {
      this.editorService.open(URI.file(electronEnv.metadata.launchToOpenFile));
    }
    // 监听 'openFile' 事件，处理后续接收到的文件打开请求
    electronEnv.ipcRenderer.on('openFile', (event, file) => {
      // 打开传递的文件路径，支持用户在运行时动态操作
      this.editorService.open(URI.file(file));
    });
  }
}
