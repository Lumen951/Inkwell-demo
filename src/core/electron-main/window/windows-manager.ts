/* 
 * 功能: 管理 Electron 应用中的 Code Window 窗口，包括打开、重载及新建窗口操作
 * 详细说明: 此模块通过检测现有工作区、指定窗口ID等策略，确保在避免重复打开的前提下打开或创建 Code Window。
 */

import { BrowserWindowConstructorOptions } from 'electron';
import { isWindows, URI } from '@opensumi/ide-core-common';
import { Injectable, INJECTOR_TOKEN, Autowired, Injector } from '@opensumi/di';
import { IWindowOpenOptions, ElectronAppConfig, IElectronMainApp, ElectronMainApp } from '@opensumi/ide-core-electron-main';
import { IEnvironmentService, StorageKey } from '../../common';
import { ThemeService } from '../theme.service';

@Injectable()
export class WindowsManager {
  /* 🔧 配置项: 通过依赖注入获取各项服务与配置信息 */
  @Autowired(INJECTOR_TOKEN)
  injector: Injector

  @Autowired(ElectronAppConfig)
  appConfig: ElectronAppConfig

  @Autowired(IElectronMainApp)
  mainApp: ElectronMainApp

  @Autowired(IEnvironmentService)
  environmentService: IEnvironmentService

  @Autowired(ThemeService)
  themeService: ThemeService;

  /**
   * 🚀 功能描述:
   *    根据传入的工作区 URI 或窗口选项，打开对应的 Code Window 窗口；若窗口已存在则激活，并在必要时重载，否则创建新窗口。
   *
   * @param {URI | undefined} workspaceUri - 工作区 URI，用于标识 Code Window 的工作区（可选）。
   * @param {IWindowOpenOptions | undefined} options - 打开窗口的选项配置，其中可能包含窗口的唯一标识（可选）。
   * @returns {void} 无返回值
   *
   * 核心算法步骤:
   * | 步骤编号 | 描述                                                       | 实现代码段                                       |
   * |----------|------------------------------------------------------------|-------------------------------------------------|
   * | 1        | 若传入 workspaceUri，遍历所有 CodeWindow 检查是否已存在相同工作区 | for (const codeWindow of this.mainApp.getCodeWindows()) { ... } |
   * | 2        | 若存在则激活该窗口，避免重复创建                           | codeWindow.getBrowserWindow().show()            |
   * | 3        | 若 options 中包含 windowId，查找对应窗口并更新工作区后重载    | this.mainApp.getCodeWindowByElectronBrowserWindowId(options.windowId)  |
   * | 4        | 否则调用 createCodeWindow 创建新 CodeWindow               | this.createCodeWindow(workspaceUri)             |
   *
   * ⚠️ 注意事项: 使用 toString() 方法统一工作区 URI 的比较，确保类型一致性；同时根据 options 配置决定窗口更新逻辑。
   */
  openCodeWindow(workspaceUri?: URI, options?: IWindowOpenOptions): void {
    // 如果传入了工作区 URI，则尝试查找已存在的对应 CodeWindow
    if (workspaceUri) {
      // 遍历所有已加载的 CodeWindow
      for (const codeWindow of this.mainApp.getCodeWindows()) {
        // 比较现有窗口的 workspace URI 与传入 URI，确保字符串的一致性
        if (codeWindow.workspace?.toString() === workspaceUri.toString()) {
          // 找到匹配的窗口后，激活该窗口，避免重复创建
          codeWindow.getBrowserWindow().show();
          return;
        }
      }
    }
    // 如果 options 中提供了 windowId，则尝试使用该标识查找对应的 CodeWindow
    if (options?.windowId) {
      const codeWindow = this.mainApp.getCodeWindowByElectronBrowserWindowId(options.windowId);
      if (codeWindow) {
        // 如果传入了 workspaceUri，则更新窗口的工作区信息
        if (workspaceUri) {
          codeWindow.setWorkspace(workspaceUri.toString());
        }
        // 重载窗口，确保内容刷新以反映最新的状态
        codeWindow.reload();
        return;
      }
    }
    // 没有找到合适的已存在窗口，则创建一个新的 CodeWindow
    this.createCodeWindow(workspaceUri);
  }

  /**
   * 🚀 功能描述:
   *    创建新的 Code Window 窗口，并根据当前环境及主题配置初始化窗口样式和相关属性。
   *
   * @param {URI | undefined} workspaceUri - 工作区 URI，用于指定窗口工作区（可选）。
   * @param {any} metadata - 附加的元数据信息，用于传递其他环境或业务逻辑配置（可选）。
   * @param {BrowserWindowConstructorOptions | undefined} browserWindowOptions - Electron BrowserWindow 的构造选项，自定义窗口属性（可选）。
   * @returns {void} 无返回值
   *
   * ⚠️ 注意事项: 
   *    - 根据操作系统判断是否需要 titleBarOverlay 设置； 
   *    - webPreferences 配置中根据环境决定 webSecurity 开关，保证开发调试与生产安全的平衡。
   *
   * 历史背景: 早期版本默认全屏显示窗口，后续计划通过窗口状态缓存实现更灵活的窗口管理。
   */
  createCodeWindow(
    workspaceUri?: URI,
    metadata?: any,
    browserWindowOptions?: BrowserWindowConstructorOptions,
  ): void {
    // 调用主题服务设置系统当前主题配色，确保窗口风格符合系统设置
    this.themeService.setSystemTheme();

    // 获取编辑器背景色，若未设置则使用默认颜色 '#1e1e1e'
    const editorBackground = this.themeService.themeBackgroundColor.editorBackground || '#1e1e1e';
    // 获取菜单栏背景色，若未配置则以编辑器背景色作为默认
    const menuBarBackground = this.themeService.themeBackgroundColor.menuBarBackground || editorBackground;
    
    // 调用 mainApp.loadWorkspace 方法加载或创建新的 CodeWindow，传递工作区、元数据及窗口配置
    const codeWindow = this.mainApp.loadWorkspace(
      workspaceUri ? workspaceUri.toString() : undefined,
      {
        // 展开 metadata 以支持传递更多自定义配置信息
        ...metadata,
        environment: {
          // ⚠️ 注意事项: 注入环境配置确保开发和生产环境下的差异设置正确
          dataFolderName: this.environmentService.dataFolderName,
          isDev: this.environmentService.isDev,
          logRoot: this.environmentService.logRoot,
        },
      },
      {
        // 🔧 配置项: 设置窗口内“traffic light”控件的位置（常用于 macOS 风格布局）
        trafficLightPosition: {
          x: 10,
          y: 10,
        },
        // 针对 Windows 系统配置 titleBarOverlay, 使窗口标题栏更符合现代 UI 样式
        ...(isWindows ? {
          titleBarOverlay: this.themeService.getTitleBarOverlay(menuBarBackground)
        } : null),
        // 初始时不立即显示窗口，由后续操作决定显示时机
        show: false,
        backgroundColor: editorBackground,
        // 合并外部传入的 browserWindowOptions，允许调用者自定义部分窗口属性
        ...browserWindowOptions,
        webPreferences: {
          // 预加载脚本配置，用以在主进程与渲染器间建立安全通信桥梁
          preload: this.appConfig.browserPreload,
          // 设置 Node 集成，允许在渲染进程中使用 Node.js API（需注意安全风险）
          nodeIntegration: this.appConfig.browserNodeIntegrated,
          webviewTag: true,
          // 关闭 contextIsolation 以支持某些第三方库（注意安全性考量）
          contextIsolation: false,
          // 根据当前环境控制 webSecurity 开关，开发环境放宽安全策略以便调试
          webSecurity: !this.environmentService.isDev,
        },
      }
    );

    const browserWindow = codeWindow.getBrowserWindow();

    // 历史背景: 默认窗口采用全屏模式，可让用户直接体验完整编辑环境
    // 🚀 性能优化: 后续版本计划引入窗口状态缓存，使窗口重启时能恢复上次状态
    browserWindow.maximize(); // 最大化窗口，全屏展示
    browserWindow.show();     // 显示窗口
  }
}
