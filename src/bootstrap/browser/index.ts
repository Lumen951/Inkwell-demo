/**
 * @fileoverview 该文件用于初始化CodeFuse IDE的浏览器环境，包括模块导入、布局配置和应用启动。
 * 
 * 该模块负责引入所需的样式和功能模块，并配置应用的布局和启动参数。
 * 
 * @module bootstrap/browser/index
 */

import '@opensumi/ide-i18n'; // 🔧 国际化模块
import '@/i18n'; // 🔧 本地化资源
import '@opensumi/ide-core-browser/lib/style/index.less'; // 🔧 核心样式
import '@opensumi/ide-core-browser/lib/style/icon.less'; // 🔧 图标样式
import './index.less'; // 🔧 自定义样式

import { DEFAULT_LAYOUT_VIEW_SIZE } from '@opensumi/ide-core-browser/lib/layout/constants'; // 🔧 默认布局视图大小
import { AINativeSettingSectionsId } from '@opensumi/ide-core-common'; // 🔧 AI本地设置ID
import { IElectronMainLifeCycleService } from '@opensumi/ide-core-common/lib/electron'; // 🔧 Electron主生命周期服务
import { IClientAppOpts, electronEnv, URI, ClientCommonModule, BrowserModule, ConstructorOf, LayoutConfig, SlotLocation } from '@opensumi/ide-core-browser'; // 🔧 核心浏览器模块
import { ClientApp } from '@opensumi/ide-core-browser/lib/bootstrap/app'; // 🔧 客户端应用
import { MainLayoutModule } from '@opensumi/ide-main-layout/lib/browser'; // 🔧 主布局模块
import { MenuBarModule } from '@opensumi/ide-menu-bar/lib/browser'; // 🔧 菜单栏模块
import { MonacoModule } from '@opensumi/ide-monaco/lib/browser'; // 🔧 Monaco编辑器模块
import { WorkspaceModule } from '@opensumi/ide-workspace/lib/browser'; // 🔧 工作区模块
import { StatusBarModule } from '@opensumi/ide-status-bar/lib/browser'; // 🔧 状态栏模块
import { EditorModule } from '@opensumi/ide-editor/lib/browser'; // 🔧 编辑器模块
import { ExplorerModule } from '@opensumi/ide-explorer/lib/browser'; // 🔧 资源管理器模块
import { FileTreeNextModule } from '@opensumi/ide-file-tree-next/lib/browser'; // 🔧 文件树模块
import { FileServiceClientModule } from '@opensumi/ide-file-service/lib/browser'; // 🔧 文件服务模块
import { SearchModule } from '@opensumi/ide-search/lib/browser'; // 🔧 搜索模块
import { FileSchemeModule } from '@opensumi/ide-file-scheme/lib/browser'; // 🔧 文件方案模块
import { OutputModule } from '@opensumi/ide-output/lib/browser'; // 🔧 输出模块
import { QuickOpenModule } from '@opensumi/ide-quick-open/lib/browser'; // 🔧 快速打开模块
import { ThemeModule } from '@opensumi/ide-theme/lib/browser'; // 🔧 主题模块
import { OpenedEditorModule } from '@opensumi/ide-opened-editor/lib/browser'; // 🔧 打开的编辑器模块
import { OutlineModule } from '@opensumi/ide-outline/lib/browser'; // 🔧 大纲模块
import { PreferencesModule } from '@opensumi/ide-preferences/lib/browser'; // 🔧 偏好设置模块
import { ToolbarModule } from '@opensumi/ide-toolbar/lib/browser'; // 🔧 工具栏模块
import { OverlayModule } from '@opensumi/ide-overlay/lib/browser'; // 🔧 悬浮层模块
import { ExtensionStorageModule } from '@opensumi/ide-extension-storage/lib/browser'; // 🔧 扩展存储模块
import { StorageModule } from '@opensumi/ide-storage/lib/browser'; // 🔧 存储模块
import { SCMModule } from '@opensumi/ide-scm/lib/browser'; // 🔧 源代码管理模块
import { MarkersModule } from '@opensumi/ide-markers/lib/browser'; // 🔧 标记模块
import { WebviewModule } from '@opensumi/ide-webview'; // 🔧 Web视图模块
import { MarkdownModule } from '@opensumi/ide-markdown'; // 🔧 Markdown模块
import { LogModule } from '@opensumi/ide-logs/lib/browser'; // 🔧 日志模块
import { WorkspaceEditModule } from '@opensumi/ide-workspace-edit/lib/browser'; // 🔧 工作区编辑模块
import { ExtensionModule } from '@opensumi/ide-extension/lib/browser'; // 🔧 扩展模块
import { DecorationModule } from '@opensumi/ide-decoration/lib/browser'; // 🔧 装饰模块
import { DebugModule } from '@opensumi/ide-debug/lib/browser'; // 🔧 调试模块
import { VariableModule } from '@opensumi/ide-variable/lib/browser'; // 🔧 变量模块
import { KeymapsModule } from '@opensumi/ide-keymaps/lib/browser'; // 🔧 快捷键模块
import { MonacoEnhanceModule } from '@opensumi/ide-monaco-enhance/lib/browser/module'; // 🔧 Monaco增强模块
import { TerminalNextModule } from '@opensumi/ide-terminal-next/lib/browser'; // 🔧 终端模块
import { terminalPreferenceSchema } from '@opensumi/ide-terminal-next/lib/common/preference'; // 🔧 终端偏好设置
import { CommentsModule } from '@opensumi/ide-comments/lib/browser'; // 🔧 评论模块
import { ClientAddonModule } from '@opensumi/ide-addons/lib/browser'; // 🔧 客户端附加模块
import { TaskModule } from '@opensumi/ide-task/lib/browser'; // 🔧 任务模块
import { OpenVsxExtensionManagerModule } from '@opensumi/ide-extension-manager/lib/browser'; // 🔧 扩展管理模块
import { DesignModule } from '@opensumi/ide-design/lib/browser'; // 🔧 设计模块
import { DESIGN_MENUBAR_CONTAINER_VIEW_ID } from '@opensumi/ide-design/lib/common/constants'; // 🔧 设计菜单栏容器视图ID
import { AILayout } from '@opensumi/ide-ai-native/lib/browser/layout/ai-layout'; // 🔧 AI布局
import { AINativeModule } from "@opensumi/ide-ai-native/lib/browser"; // 🔧 AI本地模块
import { DESIGN_MENU_BAR_LEFT } from '@opensumi/ide-design'; // 🔧 设计菜单栏左侧
import { CoreBrowserModule, ELECTRON_HEADER } from '@/core/browser'; // 🔧 核心浏览器模块和Electron头部
import { AIFeatureModule, AI_MENU_BAR_LEFT_ACTION } from '@/ai/browser'; // 🔧 AI功能模块和左侧菜单栏动作
import { AutoUpdaterModule } from '@/auto-updater/browser'; // 🔧 自动更新模块
import logo from '@/core/browser/assets/logo.svg'; // 🔧 应用Logo

// ⚠️ 临时修复 bash 打开 -l 参数不支持导致报错的问题
terminalPreferenceSchema.properties['terminal.integrated.shellArgs.osx'].default = [];

// 定义模块数组，包含所有需要加载的模块
const modules: ConstructorOf<BrowserModule>[] = [
  MainLayoutModule,
  OverlayModule,
  LogModule,
  ClientCommonModule,
  MenuBarModule,
  MonacoModule,
  StatusBarModule,
  EditorModule,
  ExplorerModule,
  FileTreeNextModule,
  FileServiceClientModule,
  SearchModule,
  FileSchemeModule,
  OutputModule,
  QuickOpenModule,
  MarkersModule,
  ThemeModule,
  WorkspaceModule,
  ExtensionStorageModule,
  StorageModule,
  OpenedEditorModule,
  OutlineModule,
  PreferencesModule,
  ToolbarModule,
  WebviewModule,
  MarkdownModule,
  WorkspaceEditModule,
  SCMModule,
  DecorationModule,
  DebugModule,
  VariableModule,
  KeymapsModule,
  TerminalNextModule,
  ExtensionModule,
  OpenVsxExtensionManagerModule,
  MonacoEnhanceModule,
  ClientAddonModule,
  CommentsModule,
  TaskModule,
  CoreBrowserModule,
  // ai
  DesignModule,
  AINativeModule,
  AIFeatureModule,
  AutoUpdaterModule,
];

// 定义布局配置，指定各个位置的模块
const layoutConfig: LayoutConfig = {
  [SlotLocation.top]: {
    modules: [ELECTRON_HEADER, DESIGN_MENUBAR_CONTAINER_VIEW_ID], // 🔧 顶部模块
  },
  [SlotLocation.left]: {
    modules: [
      '@opensumi/ide-explorer', // 🔧 左侧资源管理器
      '@opensumi/ide-search', // 🔧 左侧搜索
      '@opensumi/ide-scm', // 🔧 左侧源代码管理
      '@opensumi/ide-extension-manager', // 🔧 左侧扩展管理
      '@opensumi/ide-debug', // 🔧 左侧调试
    ],
  },
  [SlotLocation.right]: {
    modules: [], // 🔧 右侧模块为空
  },
  [SlotLocation.main]: {
    modules: ['@opensumi/ide-editor'], // 🔧 主区域编辑器
  },
  [SlotLocation.bottom]: {
    modules: [
      '@opensumi/ide-terminal-next', // 🔧 底部终端
      '@opensumi/ide-output', // 🔧 底部输出
      'debug-console', // 🔧 调试控制台
      '@opensumi/ide-markers', // 🔧 底部标记
      '@opensumi/ide-refactor-preview', // 🔧 底部重构预览
    ],
  },
  [SlotLocation.statusBar]: {
    modules: ['@opensumi/ide-status-bar'], // 🔧 状态栏模块
  },
  [SlotLocation.action]: {
    modules: ['@opensumi/ide-toolbar-action'], // 🔧 动作工具栏
  },
  [SlotLocation.extra]: {
    modules: ['breadcrumb-menu'], // 🔧 额外的面包屑菜单
  },
  [DESIGN_MENU_BAR_LEFT]: {
    modules: [AI_MENU_BAR_LEFT_ACTION] // 🔧 AI菜单栏左侧动作
  }
};

/**
 * 启动应用程序
 * 
 * @async
 * @function renderApp
 * @returns {Promise<void>} 无返回值
 */
renderApp();

/**
 * 渲染应用程序
 * 
 * @async
 * @function renderApp
 * @returns {Promise<void>} 无返回值
 */
async function renderApp() {
  const opts: IClientAppOpts = {
    appName: 'CodeFuse IDE', // 🔧 应用名称
    modules, // 🔧 加载的模块
    layoutConfig, // 🔧 布局配置
    layoutComponent: AILayout, // 🔧 布局组件
    layoutViewSize: {
      bigSurTitleBarHeight: DEFAULT_LAYOUT_VIEW_SIZE.menubarHeight, // 🔧 macOS Big Sur标题栏高度
    },
    workspaceDir: electronEnv.env.WORKSPACE_DIR, // 🔧 工作区目录
    extensionDir: electronEnv.metadata.extensionDir, // 🔧 扩展目录
    preferenceDirName: electronEnv.metadata.environment.dataFolderName, // 🔧 偏好设置目录名称
    storageDirName: electronEnv.metadata.environment.dataFolderName, // 🔧 存储目录名称
    extensionStorageDirName: electronEnv.metadata.environment.dataFolderName, // 🔧 扩展存储目录名称
    extWorkerHost: electronEnv.metadata.workerHostEntry ? URI.file(electronEnv.metadata.workerHostEntry).toString() : undefined, // 🔧 扩展工作者主机
    defaultPreferences: {
      'settings.userBeforeWorkspace': true, // 🔧 用户设置优先于工作区
      'general.icon': 'vs-seti', // 🔧 默认图标
      [AINativeSettingSectionsId.IntelligentCompletionsPromptEngineeringEnabled]: false, // 🔧 智能提示工程启用
      [AINativeSettingSectionsId.IntelligentCompletionsAlwaysVisible]: true, // 🔧 始终显示智能提示
      [AINativeSettingSectionsId.CodeEditsLintErrors]: true, // 🔧 开启代码编辑Lint错误
      [AINativeSettingSectionsId.CodeEditsLineChange]: true, // 🔧 开启代码编辑行变更
    },
    onigWasmUri: URI.file(electronEnv.onigWasmPath).toString(true), // 🔧 onig.wasm路径
    treeSitterWasmDirectoryUri: URI.file(electronEnv.treeSitterWasmDirectoryPath).toString(true), // 🔧 tree-sitter.wasm目录路径
    AINativeConfig: {
      layout: {
        menubarLogo: logo, // 🔧 菜单栏Logo
      }
    },
  }

  const app = new ClientApp(opts); // 🔧 创建客户端应用实例

  app.fireOnReload = () => {
    app.injector.get(IElectronMainLifeCycleService).reloadWindow(electronEnv.currentWindowId); // 🔧 重新加载窗口
  };

  app.start(document.getElementById('main')!, 'electron'); // 🔧 启动应用
}
