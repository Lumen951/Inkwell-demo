/**
 * @fileoverview 🔧 本文件为全局声明文件，主要包含以下功能：
 *  1. 声明特定文件类型模块（如 .less、.png、.svg），使 TypeScript 能够识别这些非 TS 文件。
 *  2. 声明全局常量（如 __PRODUCT__、__CODE_WINDOW_DEV_SERVER_URL__ 等），用于在项目中共享配置信息或环境变量。
 * 
 * @注意事项: 所有声明仅用于类型检查，实际赋值由项目构建工具或运行时环境提供。
 * 
 * -----------------------------------------------------------------------------
 * 以下代码采用 Google 代码注释规范及 Electron、CSS、React、JavaScript、HTML 官方注释规范，
 * 并结合 emoji 图标标识不同的注释类别。
 */

// 声明 *.less 文件模块 🛠️
/**
 * 功能描述: 声明 .less 模块，允许项目中直接导入 Less 样式文件。
 * @param {string} pattern - 文件匹配模式，此处为 '*.less'。
 * @return {void} 仅用于类型声明，无返回值。
 */
declare module '*.less';

// 声明 *.png 文件模块 🚀
/**
 * 功能描述: 声明 .png 模块，允许项目中直接导入 PNG 格式图片。
 * @param {string} pattern - 文件匹配模式，此处为 '*.png'。
 * @return {void} 仅用于类型声明，无返回值。
 */
declare module '*.png';

// 声明 *.svg 文件模块 🎨
/**
 * 功能描述: 声明 .svg 模块，允许项目中直接导入 SVG 矢量图形文件，常用于图标和图形展示。
 * @param {string} pattern - 文件匹配模式，此处为 '*.svg'。
 * @return {void} 仅用于类型声明，无返回值。
 */
declare module '*.svg';

// 声明全局常量 __PRODUCT__ ⚙️
/**
 * 功能描述: 声明全局常量 __PRODUCT__，用于标识或存储当前产品相关的配置信息。
 * @param {any} - 配置数据类型为 any，灵活接受任意类型数据。
 * @return {void} 仅用于类型声明，无直接返回值。
 */
declare const __PRODUCT__: any;

// 声明全局常量 __CODE_WINDOW_DEV_SERVER_URL__ 🔧
/**
 * 功能描述: 声明全局常量 __CODE_WINDOW_DEV_SERVER_URL__，用于存储代码窗口在开发模式下的开发服务器 URL。
 * @param {string} - URL 的数据类型为 string，代表服务器地址。
 * @return {void} 仅用于类型声明，无返回值。
 */
declare const __CODE_WINDOW_DEV_SERVER_URL__: string;

// 声明全局常量 __CODE_WINDOW_NAME__ 🔧
/**
 * 功能描述: 声明全局常量 __CODE_WINDOW_NAME__，用于存储代码窗口的名称，便于多窗口环境下的识别和管理。
 * @param {string} - 窗口名称为字符串类型。
 * @return {void} 仅用于类型声明，无返回值。
 */
declare const __CODE_WINDOW_NAME__: string;

// 声明全局常量 __UPDATE_WINDOW_NAME__ 🔧
/**
 * 功能描述: 声明全局常量 __UPDATE_WINDOW_NAME__，用于定义更新窗口的名称，确保在多窗口管理场景中唯一标识。
 * @param {string} - 窗口名称为字符串类型。
 * @return {void} 仅用于类型声明，无返回值。
 */
declare const __UPDATE_WINDOW_NAME__: string;

// 声明全局常量 __UPDATE_WINDOW_DEV_SERVER_URL__ 🔧
/**
 * 功能描述: 声明全局常量 __UPDATE_WINDOW_DEV_SERVER_URL__，用于存储更新窗口在开发模式下所使用的开发服务器 URL。
 * @param {string} - URL 的数据类型为 string，指向服务器地址。
 * @return {void} 仅用于类型声明，无返回值。
 */
declare const __UPDATE_WINDOW_DEV_SERVER_URL__: string;
