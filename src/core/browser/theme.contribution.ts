// 🔧 文件功能：该文件实现了一个本地主题贡献类 LocalThemeContribution，用于响应主题更改事件并向主题服务注册当前窗口的主题更新。
import { Autowired } from '@opensumi/di';
import { ClientAppContribution } from '@opensumi/ide-core-browser/lib/common';
import { Domain, OnEvent, WithEventBus } from '@opensumi/ide-core-common';
import { ThemeChangedEvent } from '@opensumi/ide-theme/lib/common';
import { IThemeService } from '../common';
import { electronEnv } from '@opensumi/ide-core-browser';

// ⚠️ 使用装饰器将该类归为 ClientAppContribution 的领域，方便框架内部的依赖注入管理
@Domain(ClientAppContribution)
export class LocalThemeContribution extends WithEventBus implements ClientAppContribution {
  // 🔧 自动注入 IThemeService 实例，用于主题设置操作
  @Autowired(IThemeService)
  private readonly themeService: IThemeService;

  /**
   * 🚀 初始化方法 
   * 
   * 功能描述:
   *   初始化本地主题贡献类，当前无额外初始化逻辑，可预留扩展接口。
   * 
   * 参数:
   *   无
   * 
   * 返回值:
   *   void - 无返回值
   */
  initialize() {}

  /**
   * 🚀 处理主题更改事件
   * 
   * 功能描述:
   *   监听并响应 ThemeChangedEvent 事件，当主题发生变化时，调用 IThemeService 的 setTheme 方法更新当前窗口的主题配置。
   * 
   * 参数:
   *   {ThemeChangedEvent} event - 包含更新主题信息的事件对象，其中 event.payload 内包含新的 theme 配置
   * 
   * 返回值:
   *   void - 无返回值
   * 
   * 详细逻辑描述：
   *   1. 从事件对象中解构获取 theme 实例。
   *   2. 调用 theme.getColor 方法取得各组件的背景颜色，自定义 menuBar、sideBar、editor、panel 以及 statusBar 的背景颜色。
   *   3. 利用 electronEnv 提供的 currentWindowId，确保更新的主题配置仅针对当前窗口。
   * 
   * 💡 历史背景：这一设计保证了在多窗口环境下，每个窗口可以独立应用各自的主题配置，更便于用户体验个性化设置。
   */
  @OnEvent(ThemeChangedEvent)
  onThemeChanged({ payload: { theme } }: ThemeChangedEvent) {
    // 调用 themeService 的 setTheme 方法来更新当前窗口的主题配置，确保各 UI 部分颜色一致性
    this.themeService.setTheme(electronEnv.currentWindowId, {
      themeType: theme.type, // 主题类型，例如 'dark' 或 'light'
      menuBarBackground: theme.getColor('kt.menubar.background')?.toString(), // 菜单栏背景色
      sideBarBackground: theme.getColor('sideBar.background')?.toString(), // 侧边栏背景色
      editorBackground: theme.getColor('editor.background')?.toString(), // 编辑器背景色
      panelBackground: theme.getColor('panel.background')?.toString(), // 面板背景色
      statusBarBackground: theme.getColor('statusBar.background')?.toString(), // 状态栏背景色
    });
  }
}
