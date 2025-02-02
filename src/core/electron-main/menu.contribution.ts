/**
 * 🔧 文件功能说明：
 *  本文件主要用于管理 Electron 应用的菜单逻辑，具体包括：
 *   - AppMenuService：更新 macOS 系统中显示的“最近使用的工作区”（Recent Documents）
 *   - AppMenuContribution：注册 Electron 主进程 API，并在应用启动时为 macOS 设置 Dock 菜单
 */

import { app, Menu, MenuItem } from 'electron'
import { Autowired, Injectable } from '@opensumi/di'
import { Domain, isMacintosh, localize, FileUri } from '@opensumi/ide-core-common'
import {
  ElectronMainApiRegistry,
  ElectronMainApiProvider,
} from '@opensumi/ide-core-electron-main/lib/bootstrap/types';
import { IAppMenuService } from '../common'
import { ElectronMainContribution } from './types'
import { WindowsManager } from './window/windows-manager'

@Injectable()
export class AppMenuService extends ElectronMainApiProvider implements IAppMenuService {
  /**
   * 🚀 功能描述：
   *  渲染并更新最近使用的工作区列表，最多只显示7个工作区，确保在 macOS 平台下能正确展示系统最近文档。
   *
   * @param {string[]} recentWorkspaces - 最近使用的工作区路径数组（部分路径可能带有 "file://" 协议前缀）
   * @return {Promise<void>} - 异步操作，无返回值
   */
  async renderRecentWorkspaces(recentWorkspaces: string[]): Promise<void> {
    // 截取前7个工作区，避免列表过长导致界面混乱 🔧
    const workspaces = recentWorkspaces.slice(0, 7)
    // 判断当前操作系统是否为 macOS : 仅 macOS 需要更新系统的最近文档列表
    if (isMacintosh) {
      this.updateMacOSRecentDocuments(workspaces)
    }
  }

  /**
   * 🚀 功能描述：
   *  更新 macOS 系统中显示的最近打开文档列表。该方法会先清空当前列表，
   *  然后遍历传入的工作区路径，对格式进行校验和转换，最后添加到系统列表中。
   *
   * @param {string[]} workspaces - 待更新的工作区路径数组
   * @return {Promise<void>} - 异步操作，无返回值
   *
   * 🔍 核心算法步骤：
   * | 步骤         | 描述                                                             | 代码实现                              |
   * |--------------|------------------------------------------------------------------|---------------------------------------|
   * | 清除记录     | 清空 macOS 当前的最近文档列表，避免重复数据                         | app.clearRecentDocuments()             |
   * | 遍历路径     | 对每个工作区路径进行处理，确保路径格式正确                         | workspaces.forEach(workspace => { ... })|
   * | 格式转换     | 若路径以 "file://" 开头，则转换为本地文件系统路径                   | if (workspace.startsWith('file://')) { ... } |
   * | 添加文档     | 将处理后的路径添加到 macOS 最近文档列表中                           | app.addRecentDocument(workspacePath)      |
   *
   * ⏱ 时间复杂度：O(n)，其中 n 是工作区数量
   */
  private async updateMacOSRecentDocuments(workspaces: string[]): Promise<void> {
    // 清除所有已注册的最近文档，避免旧数据干扰
    app.clearRecentDocuments();
    workspaces.forEach(workspace => {
      // 默认直接使用原始路径
      let workspacePath = workspace;
      // 如果路径为 URL 格式，则转换为本地路径
      if (workspace.startsWith('file://')) {
        // 使用 FileUri.fsPath 进行转换，确保路径用于系统调用时格式正确 ⚠️
        workspacePath = FileUri.fsPath(workspace);
      }
      // 将格式化后的路径添加到 macOS 系统的最近文档列表中
      app.addRecentDocument(workspacePath)
    });
  }
}

@Domain(ElectronMainContribution)
export class AppMenuContribution implements ElectronMainContribution {
  // 自动注入 AppMenuService 实例，用于后续的菜单处理操作
  @Autowired(AppMenuService)
  menuService: AppMenuService;

  // 自动注入 WindowsManager，用于管理窗口创建操作，例如打开新窗口
  @Autowired(WindowsManager)
  windowsManager: WindowsManager

  // 私有标识，确保 macOS Dock 菜单仅被安装一次 🔧
  #appMenuInstalled = false;

  /**
   * 🔧 功能描述：
   *  注册 Electron 主进程 API，将 AppMenuService 与 IAppMenuService 接口绑定，
   *  供其他模块调用对应的菜单服务功能。
   *
   * @param {ElectronMainApiRegistry} registry - Electron 主进程 API 注册对象
   * @return {void} - 无返回值
   */
  registerMainApi(registry: ElectronMainApiRegistry) {
    registry.registerMainApi(IAppMenuService, this.menuService);
  }

  /**
   * 🚀 功能描述：
   *  应用启动时执行该方法，负责初始化并安装菜单配置，确保系统菜单及时加载。
   *
   * @return {void} - 无返回值
   *
   * 📝 历史背景：
   *  该方法在应用启动后被调用，以保证 macOS Dock 菜单能在用户操作前设置完毕，提升 UX 效果。
   */
  onStart(): void {
    this.installMenu()
  }
  
  /**
   * 🚀 功能描述：
   *  在 macOS 平台下安装 Dock 菜单，且保证只安装一次，避免重复配置。
   *
   * @return {void} - 无返回值
   *
   * ⚠️ 注意事项：
   *  - 只有在 macOS 平台下才生效
   *  - 使用 #appMenuInstalled 标识防止多次安装
   */
  installMenu() {
    if (isMacintosh && !this.#appMenuInstalled) {
      // 将安装标志设为 true，避免后续重复调用安装流程
      this.#appMenuInstalled = true;
  
      // 创建一个新的 Menu 对象用于设置 macOS 系统 Dock 菜单
      const dockMenu = new Menu();
      // 添加新窗口菜单项，点击后调用 WindowsManager 创建新 Code 窗口
      dockMenu.append(new MenuItem({ 
        label: localize('common.newWindow'), 
        click: () => this.windowsManager.createCodeWindow() 
      }));
      // 配置 Electron 应用的 dock 菜单为新建的 dockMenu
      app.dock.setMenu(dockMenu);
    }
  }
}
