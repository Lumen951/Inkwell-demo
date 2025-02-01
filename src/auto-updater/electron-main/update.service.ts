/**
 * UpdateMainService 类负责管理应用程序的更新逻辑，包括手动和自动检查更新。
 * 
 * @class UpdateMainService
 * @extends ElectronMainApiProvider
 * @implements IUpdateMainService
 * 
 * 🔧 依赖注入：
 * - AutoUpdaterService: 处理更新的服务
 * - ILogService: 日志记录服务
 * - UpdateWindow: 更新窗口管理
 */
@Injectable()
export class UpdateMainService extends ElectronMainApiProvider implements IUpdateMainService {
  @Autowired(AutoUpdaterService)
  private updaterService: AutoUpdaterService // 更新服务实例

  @Autowired(ILogService)
  logger: ILogService // 日志服务实例

  @Autowired(UpdateWindow)
  updateWindow: UpdateWindow // 更新窗口实例

  #checkTimer: NodeJS.Timeout | null = null // 定时器，用于自动检查更新

  /**
   * 手动检查更新
   * 
   * @async
   * @returns {Promise<void>} 无返回值
   */
  async checkForUpdatesManual(): Promise<void> {
    this.checkForUpdates({ manual: true }) // 调用检查更新方法，标记为手动更新
  }

  /**
   * 自动检查更新
   * 
   * @async
   * @returns {Promise<void>} 无返回值
   * 
   * ⚠️ 逻辑说明：
   * - 如果定时器存在，清除定时器。
   * - 使用 setTimeout 定时调用检查更新方法，首次调用间隔为10秒，后续为3600秒。
   */
  async checkForUpdatesAuto(): Promise<void> {
    if (this.#checkTimer) {
      clearTimeout(this.#checkTimer) // 清除已有的定时器
    }
    const loopCheck = (first = true) => {
      this.#checkTimer = setTimeout(() => {
        this.checkForUpdates({ manual: false }) // 调用检查更新方法，标记为自动更新
          .then(() => {
            loopCheck(false) // 递归调用，继续检查
          })
      }, (first ? 10 : 3600) * 1000) // 设置定时器间隔
    }
    loopCheck() // 启动循环检查
  }

  /**
   * 检查更新状态并处理相应逻辑
   * 
   * @async
   * @param {Object} options - 检查更新的选项
   * @param {boolean} [options.manual=false] - 是否为手动更新
   * @returns {Promise<void>} 无返回值
   * 
   * ⚠️ 逻辑说明：
   * - 根据更新状态决定后续操作。
   * - 处理不同的更新状态，包括可用更新、无可用更新和检查错误。
   */
  async checkForUpdates({ manual = false }) {
    let { updateState } = this.updaterService // 获取当前更新状态
    this.logger.debug(`[auto-updater] checkForUpdates: ${manual ? '手动更新' : '自动更新'}, current updateState: ${updateState}`)

    // 如果没有可用更新或检查出错，执行更新检查
    if (
      updateState === UpdateState.NoAvailable ||
      updateState === UpdateState.CheckingError
    ) {
      await this.updaterService.checkForUpdates(); // 检查更新
      ({ updateState } = this.updaterService) // 更新状态
    }

    // 根据更新状态执行相应操作
    switch (updateState) {
      case UpdateState.Available:
        if (this.#checkTimer) {
          clearTimeout(this.#checkTimer) // 清除定时器
          this.#checkTimer = null; // 重置定时器
        }
        // 如果是手动更新或当前版本未被忽略，打开更新窗口
        if (manual || !this.updaterService.ignoreVersion.has(this.updaterService.updateInfo?.version!)) {
          this.updateWindow.openWindow()
        }
        break;
      case UpdateState.NoAvailable:
        // 如果是手动更新，显示无可用更新的提示
        if (manual) {
          await this.showCheckDialog({
            type: 'info',
            message: '当前没有可用的更新',
            buttons: ['确认']
          })
        }
        break;
      case UpdateState.CheckingError:
        // 如果是手动更新，显示检查更新出错的提示
        if (manual) {
          await this.showCheckDialog({
            type: 'info',
            message: '检查更新出错，请稍后重试',
            buttons: ['确认']
          })
        }
        break;
      default:
        // 默认情况下，如果是手动更新，打开更新窗口
        if (manual) {
          this.updateWindow.openWindow()
        }
        break;
    }
  }

  /**
   * 显示检查更新的对话框
   * 
   * @async
   * @param {MessageBoxOptions} options - 对话框选项
   * @returns {Promise<void>} 无返回值
   * 
   * 🔧 逻辑说明：
   * - 获取当前聚焦的窗口并显示对话框。
   */
  private async showCheckDialog(options: MessageBoxOptions) {
    const browserWindow = BrowserWindow.getFocusedWindow() // 获取当前聚焦的窗口
    if (browserWindow) {
      await dialog.showMessageBox(browserWindow, options) // 在聚焦窗口中显示对话框
    } else {
      await dialog.showMessageBox(options) // 在默认窗口中显示对话框
    }
  }
}
