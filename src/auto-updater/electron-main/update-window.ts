/**
 * UpdateWindow 类负责管理更新窗口的创建和操作。
 * 
 * 该类使用 Electron 的 BrowserWindow 来显示更新信息，并与 AutoUpdaterService 进行交互。
 * 
 * @class UpdateWindow
 * @extends {Injectable}
 */
@Injectable()
export class UpdateWindow {
  // 🔧 私有属性，存储 BrowserWindow 实例
  #browserWindow: BrowserWindow | null = null;

  // 获取当前的浏览器窗口，如果不存在或已销毁，则创建一个新的窗口
  private get browserWindow() {
    let win = this.#browserWindow;
    // 如果窗口不存在或已被销毁，则创建新窗口
    if (!win || win.isDestroyed()) {
      win = this.createWindow();
      this.#browserWindow = win;
    }
    return win;
  }

  // 🔧 自动注入 AutoUpdaterService 实例
  @Autowired(AutoUpdaterService)
  autoUpdaterService: AutoUpdaterService;

  /**
   * 打开更新窗口
   * 
   * @function openWindow
   * @returns {void} 无返回值
   */
  openWindow() {
    const { browserWindow } = this;
    // 显示更新窗口
    browserWindow.show();
  }

  /**
   * 创建新的更新窗口
   * 
   * @function createWindow
   * @returns {BrowserWindow} 返回新创建的 BrowserWindow 实例
   */
  private createWindow() {
    const disposable = new Disposable();
    const win = new BrowserWindow({
      width: 620,
      height: 400,
      minWidth: 0,
      maxWidth: 0,
      resizable: false,
      fullscreenable: false,
      title: 'CodeFuse IDE Update',
      backgroundColor: '#ECECEC',
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        webSecurity: true,
      },
    });

    // 根据开发环境加载不同的 URL
    if (__UPDATE_WINDOW_DEV_SERVER_URL__) {
      win.loadURL(__UPDATE_WINDOW_DEV_SERVER_URL__);
    } else {
      win.loadFile(path.join(__dirname, `../renderer/${__UPDATE_WINDOW_NAME__}/index.html`));
    }

    // 监听窗口关闭事件，清理资源
    win.on('closed', () => {
      this.#browserWindow = null;
      disposable.dispose();
    });

    const { webContents } = win;
    const { ipc } = webContents;

    // ⚠️ 处理初始状态的 IPC 通道
    ipc.handle(IPC_CHANNEL.initialState, () => {
      return {
        updateState: this.autoUpdaterService.updateState,
        updateInfo: this.autoUpdaterService.updateInfo,
        progressInfo: this.autoUpdaterService.progressInfo,
      };
    });

    // ⚠️ 处理下载和安装的 IPC 通道
    ipc.handle(IPC_CHANNEL.downloadAndInstall, async () => {
      try {
        await this.autoUpdaterService.downloadUpdate();
      } catch {
        throw new Error('download error');
      }
    });

    // ⚠️ 处理忽略版本的 IPC 通道
    ipc.on(IPC_CHANNEL.ignoreVersion, () => {
      this.autoUpdaterService.updateIgnoreVersion();
      this.#browserWindow?.close();
      this.#browserWindow = null;
    });

    // 订阅更新事件并发送数据到前端
    disposable.addDispose(
      this.autoUpdaterService.updateEvent((data) => {
        webContents.send(IPC_CHANNEL.eventData, data);
      })
    );

    return win; // 返回新创建的窗口实例
  }
}
