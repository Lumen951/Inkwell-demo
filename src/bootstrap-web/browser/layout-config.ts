/**
 * @fileoverview 🔧 布局配置文件
 * 
 * 功能描述：
 *   定义并导出浏览器端应用程序的布局配置对象 layoutConfig，
 *   基于 defaultConfig 进行扩展，设置顶栏(bottom)、底栏(bottom)与设计侧边栏的模块布局。
 * 
 * 参数说明：
 *   无
 * 
 * 返回值说明：
 *   {Object} layoutConfig - 配置各区域（top、bottom及左侧菜单栏）加载的模块列表
 *
 * 历史背景：
 *   初始版本采用静态配置，后续为适应不同业务场景引入了动态扩展机制。
 */

import { SlotLocation } from '@opensumi/ide-core-browser/lib/react-providers/slot'; // 🔧 导入用于标识各布局位置的枚举值，便于区分不同的插槽位置
import { defaultConfig } from '@opensumi/ide-main-layout/lib/browser/default-config'; // 🔧 导入默认的主布局配置，作为扩展基础
import { DESIGN_MENUBAR_CONTAINER_VIEW_ID } from '@opensumi/ide-design/lib/common/constants'; // 🔧 导入设计相关的菜单栏容器视图 ID，确保平台风格统一
import { DESIGN_MENU_BAR_LEFT } from "@opensumi/ide-design"; // 🔧 导入设计中左侧菜单栏的标识符
import { AI_MENU_BAR_LEFT_ACTION } from "@/ai/browser"; // 🔧 导入 AI 模块相关的左侧菜单栏动作，用于智能交互扩展

export const layoutConfig = {
  ...defaultConfig,  // 🚀 使用扩展运算符合并 defaultConfig 配置，确保基础布局不被破坏

  /**
   * @section 顶部区域配置
   * 功能描述：配置顶栏区域的模块加载
   * 参数说明：
   *   {SlotLocation} top - 表示页面顶部插槽位置
   * 返回值说明：
   *   {Array<string|any>} 包含需要在顶栏加载的模块标识符
   */
  [SlotLocation.top]: {
    modules: [
      DESIGN_MENUBAR_CONTAINER_VIEW_ID, // 🔧 加载设计主题下的菜单栏容器视图，保持一致的 UI 风格
    ],
  },

  /**
   * @section 底部区域配置
   * 功能描述：配置底部区域的模块加载，包含终端、输出等调试工具
   * 参数说明：
   *   {SlotLocation} bottom - 表示页面底部插槽位置
   * 返回值说明：
   *   {Array<string>} 包含需要在底部加载的模块标识符列表
   *
   * ⚠️ 注意：
   *   模块加载顺序会影响用户体验，采用先终端后输出的顺序
   */
  [SlotLocation.bottom]: {
    modules: [
      '@opensumi/ide-terminal-next', // 🚀 支持命令行终端功能，优化终端性能及响应速度
      '@opensumi/ide-output',         // 🚀 提供输出和日志显示功能，便于调试追踪
      'debug-console',                // 🚀 调试控制台，用于实时显示调试信息
      '@opensumi/ide-markers',        // 🚀 错误与警告标记模块，提升代码提示信息
      '@opensumi/ide-refactor-preview'// 🚀 重构预览模块，辅助代码改动预览
    ],
  },

  /**
   * @section 左侧菜单栏配置（设计模式）
   * 功能描述：配置设计风格下左侧菜单栏的模块加载
   * 参数说明：
   *   {string} DESIGN_MENU_BAR_LEFT - 表示设计风格左侧菜单栏的唯一标识符
   * 返回值说明：
   *   {Array<string|any>} 包含需要在左侧菜单加载的 AI 动作模块标识符
   *
   * ⚠️ 注意：
   *   此配置用于快速接入 AI 功能，确保智能菜单在左侧展示
   */
  [DESIGN_MENU_BAR_LEFT]: {
    modules: [
      AI_MENU_BAR_LEFT_ACTION, // 🔧 加载左侧菜单中与 AI 交互相关的动作模块，支持智能功能扩展
    ]
  }
};
