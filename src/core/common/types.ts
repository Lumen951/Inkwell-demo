/**
 * @fileoverview 🚀 文件概要：定义了UI主题、存储服务、主题服务、应用菜单以及环境相关的接口与数据类型。
 * 各接口采用依赖注入标识符，以便在应用中进行松耦合调用。
 * 技术术语保留英文，遵循Google代码注释规范及Electron CSS React JavaScript HTML官方注释规范。
 */

// 📦 引入 ThemeType 类型，仅用于类型检查 ⚠️ 注意：确保模块路径正确
import type { ThemeType } from '@opensumi/ide-theme';

// 🚀 导出 ThemeType 类型
export { ThemeType };

// -------------------------------------------------------------------------------------------------
/**
 * 🚀 功能描述：定义基础的主题数据结构，用于描述界面各种区域的背景颜色。
 *
 * @interface ThemeData
 * @property {string} [menuBarBackground] - 🔧 菜单栏背景色（可选）
 * @property {string} [sideBarBackground] - 🔧 侧边栏背景色（可选）
 * @property {string} [editorBackground] - 🔧 编辑器背景色（可选）
 * @property {string} [panelBackground] - 🔧 面板背景色（可选）
 * @property {string} [statusBarBackground] - 🔧 状态栏背景色（可选）
 */
export interface ThemeData {
  menuBarBackground?: string;
  sideBarBackground?: string;
  editorBackground?: string;
  panelBackground?: string;
  statusBarBackground?: string;
}

// -------------------------------------------------------------------------------------------------
/**
 * 🔧 配置项：存储服务的标识符，用于依赖注入及服务定位。
 *
 * @constant {string} IStorageService
 */
export const IStorageService = 'IStorageService';

/**
 * 🚀 功能描述：定义存储数据支持的数据类型，包含对象及基本数据类型。
 *
 * @typedef {object | string | number | boolean | undefined | null} IStorageData
 */
export type IStorageData = object | string | number | boolean | undefined | null;

/**
 * 🚀 功能描述：存储服务接口，提供获取、设置、批量设置、移除数据以及关闭存储服务的操作。
 * 
 * @interface IStorageService
 */
export interface IStorageService {
  /**
   * 🚀 功能描述：从存储中获取指定键的值，如果不存在则返回默认值。
   *
   * @template T
   * @param {string} key - 🔧 存储键名
   * @param {T} defaultValue - 🔧 默认值，当键不存在时返回此值
   * @returns {T} - 🚀 返回存储的值（确保类型安全）
   */
  getItem<T>(key: string, defaultValue: T): T;

  /**
   * 🚀 功能描述：尝试从存储中获取指定键的值；当数据不存在时返回undefined或默认值。
   *
   * @template T
   * @param {string} key - 🔧 存储键名
   * @param {T} [defaultValue] - 🔧 默认值（可选）
   * @returns {(T | undefined)} - 🚀 返回存储的值或undefined
   */
	getItem<T>(key: string, defaultValue?: T): T | undefined;

  /**
   * 🚀 功能描述：向存储中设置单个数据项。
   *
   * @param {string} key - 🔧 存储键名
   * @param {IStorageData} [data] - 🔧 存储的数据（可选）
   * @returns {void}
   */
  setItem(key: string, data?: IStorageData): void;

  /**
   * 🚀 功能描述：批量设置多个数据项，提升数据设置效率。
   *
   * @param {readonly { key: string; data?: IStorageData }[]} items - 🔧 数据项数组，每个项包含键名及可选数据
   * @returns {void}
   */
  setItems(items: readonly { key: string; data?: IStorageData }[]): void;

  /**
   * 🚀 功能描述：从存储中移除指定的键对应的数据。
   *
   * @param {string} key - 🔧 存储键名
   * @returns {void}
   */
  removeItem(key: string): void;

  /**
   * 🚀 功能描述：关闭存储服务，释放可能占用的系统资源。
   *
   * @returns {Promise<void>} - 🚀 异步执行返回Promise，执行成功后无返回值
   */
  close(): Promise<void>;
}

// -------------------------------------------------------------------------------------------------
/**
 * 🔧 配置项：主题服务的标识符，用于依赖注入与服务查找。
 *
 * @constant {string} IThemeService
 */
export const IThemeService = 'IThemeService';

/**
 * 🚀 功能描述：扩展的主题数据接口，在基础主题数据上增加了 themeType 字段，用以指明主题种类。
 * 历史背景：增加themeType字段可以更精确地描述主题风格，满足多种主题需求。
 *
 * @interface ThemeData
 * @property {string} [menuBarBackground] - 🔧 菜单栏背景色（可选）
 * @property {string} [sideBarBackground] - 🔧 侧边栏背景色（可选）
 * @property {string} [editorBackground] - 🔧 编辑器背景色（可选）
 * @property {string} [panelBackground] - 🔧 面板背景色（可选）
 * @property {string} [statusBarBackground] - 🔧 状态栏背景色（可选）
 * @property {ThemeType} [themeType] - 🔧 主题类型（可选）
 */
export interface ThemeData {
  menuBarBackground?: string;
  sideBarBackground?: string;
  editorBackground?: string;
  panelBackground?: string;
  statusBarBackground?: string;
  themeType?: ThemeType;
}

/**
 * 🚀 功能描述：主题服务接口，负责在指定窗口应用相应的主题配置。
 *
 * @interface IThemeService
 */
export interface IThemeService {
  /**
   * 🚀 功能描述：为特定窗口设置主题，支持动态更换主题配置。
   *
   * @param {number} windowId - 🔧 窗口的唯一标识符
   * @param {ThemeData} themeData - 🔧 包含主题设置信息的数据对象
   * @returns {void}
   */
  setTheme(windowId: number, themeData: ThemeData): void;
}

// -------------------------------------------------------------------------------------------------
/**
 * 🔧 配置项：应用菜单服务的标识符，用于依赖注入。
 *
 * @constant {string} IAppMenuService
 */
export const IAppMenuService = 'IAppMenuService';

/**
 * 🚀 功能描述：应用菜单服务接口，主要用于处理并渲染最近使用的工作空间列表。
 *
 * @interface IAppMenuService
 */
export interface IAppMenuService {
  /**
   * 🚀 功能描述：异步渲染最近访问的工作空间列表，以提升用户体验。
   *
   * @param {string[]} workspaces - 🔧 最近访问的工作空间路径集合
   * @returns {Promise<void>} - 🚀 异步操作返回Promise，操作完成后无返回值
   */
  renderRecentWorkspaces(workspaces: string[]): Promise<void>;
}

// -------------------------------------------------------------------------------------------------
/**
 * 🔧 配置项：产品信息标识符，使用Symbol确保唯一性，便于依赖注入。
 *
 * @constant {Symbol} IProduct
 */
export const IProduct = Symbol('IProduct');

/**
 * 🚀 功能描述：定义产品信息的数据结构，包含产品及应用的关键信息。
 *
 * @interface IProduct
 * @property {string} productName - 🔧 产品名称
 * @property {string} applicationName - 🔧 应用程序名称
 * @property {string} autoUpdaterConfigUrl - 🔧 自动更新配置的URL地址
 * @property {string} dataFolderName - 🔧 数据存储文件夹名称
 * @property {string} commit - 🔧 Git提交版本标识
 * @property {string} date - 🔧 构建或发布日期
 */
export interface IProduct {
  productName: string;
  applicationName: string;
  autoUpdaterConfigUrl: string;
  dataFolderName: string;
  commit: string;
  date: string;
}

// -------------------------------------------------------------------------------------------------
/**
 * 🔧 配置项：环境服务标识符，使用Symbol确保唯一性，实现环境配置的依赖注入。
 *
 * @constant {Symbol} IEnvironmentService
 */
export const IEnvironmentService = Symbol('IEnvironmentService');

/**
 * 🚀 功能描述：定义环境服务接口，提供应用环境相关的配置信息与路径设置。
 * 包括开发模式标识、各种目录路径等重要配置。
 *
 * @interface IEnvironmentService
 * @property {boolean} isDev - 🔧 是否处于开发模式（true：开发，false：生产）
 * @property {string} dataFolderName - 🔧 数据存储文件夹名称
 * @property {string} appRoot - 🔧 应用根目录路径
 * @property {string} userHome - 🔧 用户主目录路径
 * @property {string} userDataPath - 🔧 用户数据存储路径
 * @property {string} userSettingPath - 🔧 用户配置文件夹路径
 * @property {string} storagePath - 🔧 系统存储路径
 * @property {string} extensionsPath - 🔧 插件/extensions存放目录
 * @property {string} logRoot - 🔧 日志根目录
 * @property {string} logHome - 🔧 日志存储目录
 */
export interface IEnvironmentService {
  isDev: boolean;
  dataFolderName: string;
  appRoot: string;
  userHome: string;
  userDataPath: string;
  userSettingPath: string;
  storagePath: string;
  extensionsPath: string;
  logRoot: string;
  logHome: string;
}
