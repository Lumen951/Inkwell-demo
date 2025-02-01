/**
 * =============================================================================
 * 以下代码功能概述：
 * 该段代码导出一个名为 CommonBrowserModules 的数组，数组中包含了项目在浏览器端启动时所需加载的所有模块，
 * 涵盖了主布局、编辑器、搜索、终端、扩展、AI 及自动更新等各项功能。模块化设计确保了功能拆分明确，
 * 同时便于按需加载以优化启动性能。
 * =============================================================================
 */

/** 
 * 【精简版本】 🔧
 * 功能描述：
 *   声明并导出 CommonBrowserModules 数组，该数组整合了浏览器端启动所需的所有功能模块。
 *
 * 参数说明：
 *   无
 *
 * 返回值说明：
 *   {ConstructorOf<BrowserModule>[]} 返回包含所有 BrowserModule 模块构造函数的数组。
 */
 
/** 
 * 【标准版本】 🔧
 * 功能描述：
 *   该代码片段声明一个 CommonBrowserModules 数组，数组内整合了 IDE 浏览器环境中需要加载的多个
 *   模块，例如主布局、菜单栏、编辑器、终端、扩展管理、AI 能力模块等。数组用于统一配置和初始化浏览器端应用。
 *
 * 参数说明：
 *   无
 *
 * 返回值说明：
 *   {ConstructorOf<BrowserModule>[]} 一个包含各模块构造函数的数组，用于后续实例化各功能模块。
 */

/** 
 * 【详细版本】 🚀
 * 功能描述：
 *   本段代码导出一个 CommonBrowserModules 数组，用于在浏览器端初始化和加载各项功能模块，支持 IDE 的
 *   多项核心功能，包括但不限于 UI 渲染、文件管理、搜索、调试、终端、扩展加载及 AI 功能。各模块按需加载，
 *   有助于优化启动性能并降低初始内存占用。
 *
 * 参数说明：
 *   无
 *
 * 返回值说明：
 *   {ConstructorOf<BrowserModule>[]} 返回一个数组，数组中包含下列模块的构造函数：
 *     - MainLayoutModule: 主布局模块，用于构建整体UI框架。
 *     - MenuBarModule: 菜单栏模块，提供全局导航及菜单功能。
 *     - MonacoModule: 集成 Monaco 编辑器，支持强大的代码编辑体验。
 *     - WorkspaceModule: 工作区管理模块，整合项目文件和配置。
 *     - StatusBarModule: 状态栏模块，展示状态和通知信息。
 *     - EditorModule: 编辑器模块，支持代码显示与编辑。
 *     - ExplorerModule: 文件探索器模块，便于文件和目录导航。
 *     - FileTreeNextModule: 文件树模块，优化文件目录的展示及操作。
 *     - FileServiceClientModule: 文件服务模块，提供文件操作接口。
 *     - SearchModule: 搜索模块，实现全局关键字搜索。
 *     - FileSchemeModule: 文件协议处理模块，便于资源定位管理。
 *     - OutputModule: 输出模块，用于日志打印和调试信息展示。
 *     - QuickOpenModule: 快速打开模块，帮助用户迅速访问文件。
 *     - MarkersModule: 代码标记模块，用于错误和警告提示。
 *     - ThemeModule: 主题模块，支持皮肤及配色方案切换。
 *     - ExtensionStorageModule: 扩展存储模块，管理扩展数据持久化。
 *     - StorageModule: 存储模块，提供数据缓存功能。
 *     - OpenedEditorModule: 已打开编辑器管理模块，保持界面标签同步。
 *     - OutlineModule: 代码大纲模块，辅助代码结构导航。
 *     - PreferencesModule: 用户偏好设置模块，允许个性化配置。
 *     - ToolbarModule: 工具栏模块，加速常用操作调用。
 *     - WebviewModule: Webview 展示模块，用于嵌入第三方内容。
 *     - MarkdownModule: Markdown 渲染模块，专注文档预览。
 *     - WorkspaceEditModule: 工作区编辑模块，支持协同编辑（复杂度：O(n)）。
 *     - SCMModule: 源代码管理模块，与 Git 等工具集成。
 *     - DecorationModule: 装饰器模块，增强编辑器交互视觉效果。
 *     - DebugModule: 调试模块，支持断点和实时变量观察。
 *     - VariableModule: 变量监控模块，辅助调试环境监测变量状态。
 *     - KeymapsModule: 快捷键配置模块，允许自定义快捷操作。
 *     - TerminalNextModule: 新一代终端模块，提供命令行支持及延迟加载以优化启动性能。
 *     - ExtensionModule: 扩展模块，实现插件机制。
 *     - OpenVsxExtensionManagerModule: Open VSX 扩展管理模块，支持在线插件市场管理。
 *     - MonacoEnhanceModule: Monaco 增强模块，扩展编辑器功能（历史背景：由社区贡献）。
 *     - ClientAddonModule: 客户端插件扩展模块，便于功能扩展的开发和测试。
 *     - CommentsModule: 评论模块，促进团队协作与讨论。
 *     - TaskModule: 任务调度模块，管理异步任务的执行。
 *     - CoreBrowserModule: 核心浏览器支持模块，整合常用服务与工具。
 *     - TestingModule: 测试模块，支持自动化和单元测试框架。
 *     - RemoteOpenerModule: 远程资源打开模块，便于远程文件的访问。
 *     - DesignModule: UI 设计模块，提升界面美感与交互体验。
 *     - AINativeModule: AI 原生模块，提供底层 AI 能力支持。
 *     - AIFeatureModule: AI 特性扩展模块，丰富智能相关功能。
 *     - AutoUpdaterModule: 自动更新模块，确保应用及时升级（⚠️ 注意：需要稳定网络环境）。
 *
 * 说明：
 *   - 模块化设计有助于按需加载，实现精细化性能优化，降低初始加载时间及内存占用。
 *   - 历史背景：该方案源自大规模单体应用难以维护的问题，分离各功能模块后采用按需加载策略。
 *   - 时间/空间复杂度：数组初始化复杂度为 O(n)，其中 n 为模块数量。
 */

// 模块导入部分
import { MainLayoutModule } from '@opensumi/ide-main-layout/lib/browser';
import { MenuBarModule } from '@opensumi/ide-menu-bar/lib/browser';
import { MonacoModule } from '@opensumi/ide-monaco/lib/browser';
import { WorkspaceModule } from '@opensumi/ide-workspace/lib/browser';
import { StatusBarModule } from '@opensumi/ide-status-bar/lib/browser';
import { EditorModule } from '@opensumi/ide-editor/lib/browser';
import { ExplorerModule } from '@opensumi/ide-explorer/lib/browser';
import { FileTreeNextModule } from '@opensumi/ide-file-tree-next/lib/browser';
import { FileServiceClientModule } from '@opensumi/ide-file-service/lib/browser';
import { SearchModule } from '@opensumi/ide-search/lib/browser';
import { FileSchemeModule } from '@opensumi/ide-file-scheme/lib/browser';
import { OutputModule } from '@opensumi/ide-output/lib/browser';
import { QuickOpenModule } from '@opensumi/ide-quick-open/lib/browser';
import { BrowserModule, ClientCommonModule, ConstructorOf } from '@opensumi/ide-core-browser';
import { ThemeModule } from '@opensumi/ide-theme/lib/browser';
import { OpenedEditorModule } from '@opensumi/ide-opened-editor/lib/browser';
import { RemoteOpenerModule } from '@opensumi/ide-remote-opener/lib/browser';
import { OutlineModule } from '@opensumi/ide-outline/lib/browser';
import { PreferencesModule } from '@opensumi/ide-preferences/lib/browser';
import { ToolbarModule } from '@opensumi/ide-toolbar/lib/browser';
import { OverlayModule } from '@opensumi/ide-overlay/lib/browser';
import { ExtensionStorageModule } from '@opensumi/ide-extension-storage/lib/browser';
import { StorageModule } from '@opensumi/ide-storage/lib/browser';
import { SCMModule } from '@opensumi/ide-scm/lib/browser';
import { MarkersModule } from '@opensumi/ide-markers/lib/browser';
import { WebviewModule } from '@opensumi/ide-webview';
import { MarkdownModule } from '@opensumi/ide-markdown';
import { LogModule } from '@opensumi/ide-logs/lib/browser';
import { WorkspaceEditModule } from '@opensumi/ide-workspace-edit/lib/browser';
import { ExtensionModule } from '@opensumi/ide-extension/lib/browser';
import { DecorationModule } from '@opensumi/ide-decoration/lib/browser';
import { DebugModule } from '@opensumi/ide-debug/lib/browser';
import { VariableModule } from '@opensumi/ide-variable/lib/browser';
import { KeymapsModule } from '@opensumi/ide-keymaps/lib/browser';
import { MonacoEnhanceModule } from '@opensumi/ide-monaco-enhance/lib/browser/module';
import { OpenVsxExtensionManagerModule } from '@opensumi/ide-extension-manager/lib/browser';
import { TerminalNextModule } from '@opensumi/ide-terminal-next/lib/browser';
import { CommentsModule } from '@opensumi/ide-comments/lib/browser';
import { ClientAddonModule } from '@opensumi/ide-addons/lib/browser';
import { TaskModule } from '@opensumi/ide-task/lib/browser';
import { TestingModule } from '@opensumi/ide-testing/lib/browser';
import {CoreBrowserModule} from "@/core/browser";
import {DesignModule} from "@opensumi/ide-design/lib/browser";
import {AINativeModule} from "@opensumi/ide-ai-native/lib/browser";
import {AIFeatureModule} from "@/ai/browser";
import {AutoUpdaterModule} from "@/auto-updater/browser";

// 导出包含所有浏览器模块的数组
export const CommonBrowserModules: ConstructorOf<BrowserModule>[] = [
  MainLayoutModule,             // 主布局模块：构建核心UI框架
  OverlayModule,                // 悬浮层模块：为特定 UI 组件提供浮动显示支持
  LogModule,                    // 日志模块：记录运行时事件和状态
  ClientCommonModule,           // 客户端公用模块：封装共享逻辑
  MenuBarModule,                // 菜单栏模块：实现全局导航菜单
  MonacoModule,                 // Monaco 编辑器模块：提供代码编辑功能
  StatusBarModule,              // 状态栏模块：展示状态信息及提示
  EditorModule,                 // 编辑器模块：支持代码显示与编辑
  ExplorerModule,               // 探索器模块：便于快速浏览项目结构
  FileTreeNextModule,           // 文件树模块：优化文件及目录的可视化展现
  FileServiceClientModule,      // 文件服务客户端：处理文件操作请求
  SearchModule,                 // 搜索模块：执行全局搜索功能
  FileSchemeModule,             // 文件协议处理模块：支持统一资源定位
  OutputModule,                 // 输出模块：展示日志与调试信息
  QuickOpenModule,              // 快速打开模块：加速文件和资源访问
  MarkersModule,                // 标记模块：管理代码中的警告和错误提示
  ThemeModule,                  // 主题模块：支持自定义皮肤和颜色风格
  WorkspaceModule,              // 工作区模块：用于管理项目资源和配置
  ExtensionStorageModule,       // 扩展存储模块：持久化扩展数据
  StorageModule,                // 存储模块：提供数据缓存和本地存储功能
  OpenedEditorModule,           // 已打开编辑器模块：管理当前打开文件标签
  OutlineModule,                // 代码大纲模块：辅助快速定位代码结构
  PreferencesModule,            // 用户偏好模块：处理个性化设置
  ToolbarModule,                // 工具栏模块：构建快捷操作入口
  WebviewModule,                // Webview模块：支持嵌入网页内容显示
  MarkdownModule,               // Markdown模块：渲染和预览文档
  WorkspaceEditModule,          // 工作区编辑模块（复杂度：O(n)）：支持协同编辑操作
  SCMModule,                    // 源代码管理模块：集成版本控制功能
  DecorationModule,             // 装饰器模块：为编辑器添加视觉提示
  DebugModule,                  // 调试模块：提供断点调试及实时监控
  VariableModule,               // 变量监控模块：辅助查看调试变量状态
  KeymapsModule,                // 快捷键模块：支持用户自定义快捷键
  TerminalNextModule,           // 新一代终端模块：优化命令行操作表现及响应速度
  ExtensionModule,              // 扩展模块：实现插件化功能扩展
  OpenVsxExtensionManagerModule,// Open VSX 扩展管理模块：管理在线扩展市场插件
  MonacoEnhanceModule,          // Monaco 增强模块：扩展编辑器额外功能（历史背景：后续社区更新）
  ClientAddonModule,            // 客户端插件模块：支持额外功能的集成与扩展
  CommentsModule,               // 评论模块：促进代码讨论与协作
  TaskModule,                   // 任务模块：用于异步任务的调度与管理
  CoreBrowserModule,            // 核心浏览器模块：整合关键基础服务
  TestingModule, RemoteOpenerModule, // 测试与远程打开模块，支持单元测试及远程资源访问
  // ai 模块
  DesignModule,                 // UI设计模块：优化界面交互和视觉效果
  AINativeModule,               // AI原生模块：提供底层 AI 功能支持
  AIFeatureModule,              // AI扩展模块：丰富智能功能实现
  AutoUpdaterModule,            // 自动更新模块：实时检测并应用软件更新（⚠️ 注意：依赖稳定网络）
];
