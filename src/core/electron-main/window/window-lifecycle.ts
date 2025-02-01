/**
 * @fileoverview 🔧 本文件定义了 WindowLifecycle 类，用于管理 Electron 主进程中窗口的生命周期，
 * 包括打开工作区、最小化、全屏、最大化、窗口恢复、关闭、重载以及设置扩展目录和扩展候选项。
 * 🚀 性能优化：部分操作采用异步执行以提升用户体验，例如在关闭窗口时先隐藏窗口，再异步清理子进程。
 */

import { BrowserWindow } from 'electron';
import { Injector } from '@opensumi/di';
import { IElectronMainApiProvider, ElectronMainApp, IWindowOpenOptions } from '@opensumi/ide-core-electron-main';
import { ExtensionCandidate, URI } from '@opensumi/ide-core-common';
import { WindowsManager } from './windows-manager';

/**
 * @class WindowLifecycle
 * @classdesc 🔧 管理 Electron 应用中各窗口的生命周期，包括窗口的状态改变及资源清理。
 */
export class WindowLifecycle implements IElectronMainApiProvider<void> {
  // 🔧 eventEmitter: 未来可能用于事件发布，目前未实现扩展功能
  eventEmitter: undefined;

  /**
   * @constructor
   * @param {ElectronMainApp} app - 应用的主系统对象，用于获取和管理 CodeWindow 的实例
   * @param {Injector} injector - 依赖注入器，用于获取 WindowsManager 实例等依赖服务
   * @example
   * const lifecycle = new WindowLifecycle(appInstance, injectorInstance);
   */
  constructor(private app: ElectronMainApp, private injector: Injector) {}

  /**
   * 🚀 打开工作区窗口
   * 功能描述：调用 WindowsManager 服务，根据给定的工作区 URI 和选项打开一个新的 CodeWindow。
   * @param {string} workspace - 表示工作区路径的字符串，后续通过 URI.parse 转换成 URI 对象
   * @param {IWindowOpenOptions} openOptions - 指定窗口打开时的相关选项（例如：是否全屏打开）
   * @return {void} 无返回值
   */
  openWorkspace(workspace: string, openOptions: IWindowOpenOptions): void {
    // 通过依赖注入获取 WindowsManager，并调用 openCodeWindow 进行窗口打开
    this.injector.get(WindowsManager).openCodeWindow(URI.parse(workspace), openOptions);
  }

  /**
   * ⚠️ 最小化窗口
   * 功能描述：找到指定 windowId 的 Electron 窗口，并将其最小化以缩减 UI 占用。
   * @param {number} windowId - Electron 窗口的唯一标识符
   * @return {void} 无返回值
   */
  minimizeWindow(windowId: number): void {
    const window = BrowserWindow.fromId(windowId);
    // 若窗口存在，则直接调用 minimize 方法
    if (window) {
      window.minimize();
    }
  }

  /**
   * ⚠️ 设置窗口进入全屏模式
   * 功能描述：获取对应的窗口，并将其设置为全屏显示，常用于展示全屏内容。
   * @param {number} windowId - Electron 窗口的唯一标识符
   * @return {void} 无返回值
   */
  fullscreenWindow(windowId: number): void {
    const window = BrowserWindow.fromId(windowId);
    // 判断窗口存在性后设置全屏
    if (window) {
      window.setFullScreen(true);
    }
  }

  /**
   * 🚀 最大化窗口
   * 功能描述：将指定窗口最大化展现，通常用于提升用户操作体验。
   * @param {number} windowId - Electron 窗口的唯一标识符
   * @return {void} 无返回值
   */
  maximizeWindow(windowId: number): void {
    const window = BrowserWindow.fromId(windowId);
    if (window) {
      window.maximize();
    }
  }

  /**
   * 🚀 恢复窗口至未最大化状态
   * 功能描述：将之前最大化的窗口恢复到原始尺寸，便于用户进行非最大化操作。
   * @param {number} windowId - Electron 窗口的唯一标识符
   * @return {void} 无返回值
   */
  unmaximizeWindow(windowId: number): void {
    const window = BrowserWindow.fromId(windowId);
    if (window) {
      window.unmaximize();
    }
  }

  /**
   * 🔧 关闭窗口
   * 功能描述：根据传入的 windowId 关闭指定的窗口，并在关闭前处理相关清理工作，
   * 包括判断是否处于重载状态以及异步清理子进程资源，防止内存泄露。
   * @param {number} windowId - Electron 窗口的唯一标识符
   * @return {void} 无返回值
   *
   * 历史背景：为了避免在窗口关闭时因子进程未清理导致内存泄露，开发早期采用条件判断区分关闭逻辑。
   * 🚀 性能优化：在正常关闭流程中，先隐藏窗口以迅速响应用户操作，再异步清理资源后关闭。
   */
  closeWindow(windowId: number): void {
    const window = BrowserWindow.fromId(windowId);
    if (window) {
      const codeWindow = this.app.getCodeWindowByElectronBrowserWindowId(windowId);
      // 若不存在对应的 CodeWindow，则直接关闭窗口
      if (!codeWindow) {
        window.close();
        return;
      }

      // 如果当前窗口处于重载状态
      if (codeWindow.isReloading) {
        // 重载标记置为 false，防止重复重载
        codeWindow.isReloading = false;

        if (!codeWindow.isRemote) {
          // 🔧 历史背景：在 reload 状态下无需等待 startNode 完成，
          // 因此同时触发 startNode 与前端 reload 以提高响应速度
          codeWindow.startNode();
        }
        window.webContents.reload();
      } else {
        // 🚀 性能优化：先隐藏窗口减少用户操作等待感，后续异步清理子进程
        window.hide();
        codeWindow.clear().finally(() => {
          // 清理操作完成后关闭窗口
          window.close();
        });
      }
    }
  }

  /**
   * 🔧 重载窗口
   * 功能描述：获取对应的 CodeWindow 后，重新加载窗口内容，常用于刷新当前视图显示。
   * @param {number} windowId - Electron 窗口的唯一标识符
   * @return {void} 无返回值
   */
  reloadWindow(windowId: number): void {
    const codeWindow = this.app.getCodeWindowByElectronBrowserWindowId(windowId);
    if (codeWindow) {
      codeWindow.reload();
    }
  }

  /**
   * 🔧 设置扩展程序目录
   * 功能描述：为指定窗口关联的 CodeWindow 配置扩展程序所在的目录，
   * 便于后续加载与管理扩展。
   * @param {string} extensionDir - 表示扩展目录路径的字符串
   * @param {number} windowId - Electron 窗口的唯一标识符
   * @return {void} 无返回值
   */
  setExtensionDir(extensionDir: string, windowId: number): void {
    const window = BrowserWindow.fromId(windowId);
    if (window) {
      const codeWindow = this.app.getCodeWindowByElectronBrowserWindowId(windowId);
      if (codeWindow) {
        codeWindow.setExtensionDir(extensionDir);
      }
    }
  }

  /**
   * 🔧 设置扩展候选项列表
   * 功能描述：通过设置扩展候选项，为窗口关联的 CodeWindow 提供扩展更新或选择的候选数据。
   * @param {ExtensionCandidate[]} candidate - 包含扩展候选项的数组
   * @param {number} windowId - Electron 窗口的唯一标识符
   * @return {void} 无返回值
   */
  setExtensionCandidate(candidate: ExtensionCandidate[], windowId: number): void {
    const window = BrowserWindow.fromId(windowId);
    if (window) {
      const codeWindow = this.app.getCodeWindowByElectronBrowserWindowId(windowId);
      if (codeWindow) {
        codeWindow.setExtensionCandidate(candidate);
      }
    }
  }
}
