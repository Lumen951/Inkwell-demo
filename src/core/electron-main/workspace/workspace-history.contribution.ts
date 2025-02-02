/**
 * 🔧 文件功能说明：
 * 此文件用于在 Electron 主进程中管理 Windows 平台的 Jump List 更新，
 * 通过 onWillStart 生命周期钩子检测操作系统是否为 Windows，
 * 并在符合条件时更新系统 Jump List，添加快速启动新窗口的任务项。
 *
 * 历史背景：
 * Windows 从 Windows 7 开始引入 Jump List 功能，旨在提升用户通过任务栏快速访问常用操作的体验。
 */

import { Autowired } from '@opensumi/di' // 导入依赖注入工具
import { app, JumpListCategory } from 'electron' // 导入 Electron 应用程序及 Jump List 类型
import { Domain, isWindows, localize, MaybePromise } from '@opensumi/ide-core-common' // 导入平台判断、本地化及异步返回类型工具
import { ILogService } from '@/logger/common' // 导入日志服务接口
import { ElectronMainContribution } from '../types' // 导入 Electron 主进程贡献者类型

@Domain(ElectronMainContribution)
export class WorkspaceHistoryContribution implements ElectronMainContribution {

  @Autowired(ILogService)
  logger: ILogService

  /**
   * 🚀 功能描述：应用启动前的钩子方法，初始化 Windows Jump List 的处理流程。
   *
   * @returns {MaybePromise<void>} - 异步操作，无返回值
   */
  onWillStart(): MaybePromise<void> {
    // 调用处理 Windows Jump List 的方法，确保仅在启动时更新 Jump List
    this.handleWindowsJumpList()
  }

  /**
   * 🚀 功能描述：判断当前操作系统是否为 Windows，并在符合条件时触发 Jump List 更新。
   *
   * @returns {Promise<void>} - 异步返回 Promise，执行完毕后无返回值
   *
   * ⚠️ 注意事项：方法只在 Windows 平台上执行逻辑，非 Windows 系统直接返回。
   */
  private async handleWindowsJumpList(): Promise<void> {
    // 如果当前操作系统不是 Windows，则不进行 Jump List 更新
    if (!isWindows) {
      return;
    }
    // 异步调用更新 Windows Jump List 的方法
    await this.updateWindowsJumpList();
  }

  /**
   * 🚀 功能描述：更新 Windows 系统的 Jump List，添加“新窗口”快捷任务，提升用户操作效率。
   *
   * @returns {Promise<void>} - 异步返回 Promise，执行完毕后无返回值
   *
   * 历史背景：自 Windows 7 起，Jump List 功能被引入以优化任务栏交互体验。
   *
   * 详细流程说明：
   * | 步骤 | 描述                                                         | 实现代码段                                     |
   * | ---- | ------------------------------------------------------------ | ---------------------------------------------- |
   * | 1    | 初始化一个空的 Jump List 数组                               | const jumpList: JumpListCategory[] = [];       |
   * | 2    | 添加包含“新窗口”任务的 Jump List 分类项                      | jumpList.push({ type: 'tasks', items: [ ... ]}); |
   * | 3    | 调用 Electron API 更新系统的 Jump List                        | const res = app.setJumpList(jumpList);         |
   * | 4    | 检查返回结果并记录异常情况（若结果非预期或发生错误则警告）     | if (res && res !== 'ok'){ this.logger.warn(...)}|
   *
   * 🚀 性能优化：采用异步操作，确保更新过程不会阻塞主线程。
   */
  private async updateWindowsJumpList(): Promise<void> {
    // ── 初始化 Jump List 数组 ── //
    const jumpList: JumpListCategory[] = [];

    // ── 添加任务类别的 Jump List 项 ── //
    // 本任务用于快速启动新窗口功能，利用本地化 title 和 description，确保国际化支持
    jumpList.push({
      type: 'tasks', // 定义类别为任务型
      items: [
        {
          type: 'task', // 指定此项为任务类型
          title: localize('common.newWindow'), // 本地化标题：新窗口
          description: localize('common.newWindowDesc'), // 本地化描述信息
          program: process.execPath, // 使用当前进程的可执行文件路径作为程序入口
          iconPath: process.execPath, // 图标路径与程序路径一致，保证图标显示正常
          iconIndex: 0 // 指定图标索引，默认为 0
        }
      ]
    });

    try {
      // ── 调用 Electron API 更新系统 Jump List ── //
      const res = app.setJumpList(jumpList);
      // ⚠️ 注意事项：若返回结果非 'ok'，则记录警告，提示可能存在未预期的更新问题
      if (res && res !== 'ok') {
        this.logger.warn(`updateWindowsJumpList#setJumpList unexpected result: ${res}`);
      }
    } catch (error) {
      // 当更新过程中出现异常时，立即记录警告信息，利于后续排查问题
      this.logger.warn('updateWindowsJumpList#setJumpList', error);
    }
  }
}
