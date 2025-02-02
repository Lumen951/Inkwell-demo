/**
 * @file 主题管理服务模块
 * @summary 此模块负责管理 Electron 应用的主题设置，包括存储主题数据、更新系统主题、动态设置窗口的菜单栏颜色等功能。
 * @emoji 🔧 配置项 | ⚠️ 注意事项 | 🚀 性能优化
 */

import { nativeTheme } from 'electron';
import { Injectable, Autowired } from '@opensumi/di';
import { Domain, isWindows } from '@opensumi/ide-core-common';
import {
  ElectronMainApiRegistry,
  ElectronMainContribution,
  ElectronMainApiProvider,
} from '@opensumi/ide-core-electron-main/lib/bootstrap/types';
import { IElectronMainApp } from '@opensumi/ide-core-electron-main';
import { Color } from '@opensumi/ide-theme/lib/common/color';

import { StorageService } from './storage.service';
import { IThemeService, ThemeData, ThemeType } from '../common/types';
import { StorageKey } from '../common';

@Injectable()
export class ThemeService extends ElectronMainApiProvider implements IThemeService {
  @Autowired(StorageService)
  storageService: StorageService;

  @Autowired(IElectronMainApp)
  electronMainApp: IElectronMainApp;

  /**
   * @summary 设置指定窗口的主题
   * @param {number} windowId - 目标窗口的ID，便于查找和更新对应窗口
   * @param {ThemeData} themeData - 包含主题类型（themeType）、菜单栏背景色（menuBarBackground）等主题数据
   * @return {void} 无返回值
   * @emoji 🔧 配置项
   * @remarks
   * 该方法将主题数据存入 StorageService 中，并调用 updateSystemColorTheme 更新系统主题，
   * 若在 Windows 系统中且提供了菜单栏背景色，则针对目标窗口设置标题栏覆盖样式。
   * 
   * 步骤解析：
   * | 步骤描述                           | 实现代码                                                             |
   * | ---------------------------------- | -------------------------------------------------------------------- |
   * | 保存主题数据                       | this.storageService.setItem(StorageKey.THEME_BG_COLOR, themeData)      |
   * | 更新系统级主题                     | this.updateSystemColorTheme(themeData.themeType)                     |
   * | 若为 Windows 且有菜单栏背景，更新样式 | 检查 isWindows 后，通过 currentWindow.getBrowserWindow().setTitleBarOverlay(...) |
   */
  setTheme(windowId: number, themeData: ThemeData): void {
    // 🔧 将主题数据保存到本地存储，便于后续读取或恢复状态
    this.storageService.setItem(StorageKey.THEME_BG_COLOR, themeData);
    // 🔧 更新系统级主题配置，确保操作系统界面与应用风格一致
    this.updateSystemColorTheme(themeData.themeType);
    // ⚠️ 注意：仅在 Windows 系统中支持自定义标题栏覆盖样式
    if (themeData.menuBarBackground && isWindows) {
      // 查找当前窗口对象（历史背景：以前版本中使用了硬编码 ID 比较方式）
      const currentWindow = this.electronMainApp.getCodeWindows().find(
        codeWindow => codeWindow.getBrowserWindow().id === windowId
      );
      if (currentWindow) {
        // 🚀 为窗口设置标题栏覆盖样式，调用 getTitleBarOverlay 生成配置对象
        currentWindow.getBrowserWindow().setTitleBarOverlay(
          this.getTitleBarOverlay(themeData.menuBarBackground!)
        );
      }
    }
  }

  /**
   * @summary 根据传入颜色获取标题栏覆盖样式配置
   * @param {string} color - 十六进制格式的背景色字符串，例如 "#FFFFFF"
   * @return {object} 返回包含高度、背景颜色及其符号颜色的配置对象
   * @emoji 🚀 性能优化
   * @remarks
   * 该方法通过判断传入颜色是否较暗，从而选择合适的符号颜色以保证足够对比度。
   * 
   * 核心逻辑步骤说明：
   * | 步骤描述                                  | 实现代码                                      |
   * | ----------------------------------------- | --------------------------------------------- |
   * | 通过 Color.fromHex(color) 转换颜色字符串    | Color.fromHex(color)                          |
   * | 判断颜色是否较暗（isDarker 方法）           | Color.fromHex(color).isDarker()               |
   * | 根据颜色明暗选择符号颜色                     | ? '#FFFFFF' (若较暗) : '#000000'                |
   */
  getTitleBarOverlay(color: string) {
    return {
      height: 35,  // 固定标题栏高度为 35 像素
      color,       // 使用传入的背景色
      symbolColor: Color.fromHex(color).isDarker() ? '#FFFFFF' : '#000000', // 根据背景明暗选择对比度高的符号颜色
    };
  }

  /**
   * @summary 获取存储中的主题背景数据
   * @return {ThemeData} 返回存储中的主题数据对象，若无则返回默认空对象
   * @emoji 🔧 配置项
   * @remarks
   * 通过 StorageService 获取先前保存的主题数据，确保读取时提供默认值以避免潜在的 undefined 错误。
   */
  get themeBackgroundColor() {
    return this.storageService.getItem<ThemeData>(StorageKey.THEME_BG_COLOR, {});
  }

  /**
   * @summary 根据存储数据设置系统级主题
   * @return {void} 无返回值
   * @emoji ⚠️ 注意事项
   * @remarks
   * 优先从存储中读取主题数据，如果数据为空则默认设置为 'dark' 模式；
   * 之后调用 updateSystemColorTheme 更新 nativeTheme 的主题来源配置。
   */
  setSystemTheme() {
    const theme = this.storageService.getItem<ThemeData>(StorageKey.THEME_BG_COLOR);
    this.updateSystemColorTheme(theme?.themeType || 'dark');
  }

  /**
   * @summary 更新系统级颜色主题
   * @param {ThemeType} [themeType] - 可选的主题类型参数，可能值：'light'、'dark' 或未定义
   * @return {void} 无返回值
   * @emoji 🚀 性能优化
   * @remarks
   * 根据传入的 themeType 值，使用 Electron 的 nativeTheme 接口更新操作系统主题设置。
   * 若未传入或不匹配已知类型，则默认使用 'system' 模式，以匹配当前操作系统设置。
   */
  private updateSystemColorTheme(themeType?: ThemeType) {
    switch (themeType) {
      case 'light':
        nativeTheme.themeSource = 'light';
        break;
      case 'dark':
        nativeTheme.themeSource = 'dark';
        break;
      default:
        nativeTheme.themeSource = 'system';
    }
  }
}

@Domain(ElectronMainContribution)
export class ThemeContribution implements ElectronMainContribution {
  @Autowired(ThemeService)
  themeService: ThemeService;

  /**
   * @summary 注册 Electron 主进程 API
   * @param {ElectronMainApiRegistry} registry - 主进程 API 注册表对象，用于注册主题相关的 API
   * @return {void} 无返回值
   * @emoji 🔧 配置项
   * @remarks
   * 该方法将 ThemeService 实例注册到 Electron 主进程 API 系统中，使得其他模块能够调用相关接口。
   */
  registerMainApi(registry: ElectronMainApiRegistry) {
    registry.registerMainApi(IThemeService, this.themeService);
  }
}
